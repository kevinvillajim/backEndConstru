// src/infrastructure/webserver/controllers/TemplateRatingController.ts
import {RateTemplateUseCase} from "../../../application/calculation/RateTemplateUseCase";
import { RequestWithUser } from "../middlewares/authMiddleware";
import { handleError } from "../utils/errorHandler";
import { Response } from "express";

export class TemplateRatingController {
    constructor(private rateTemplateUseCase: RateTemplateUseCase) {}

    async rateTemplate(req: RequestWithUser, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const {templateId} = req.params;
            const {rating, comment} = req.body;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
                return;
            }

            // Validación básica
            if (!rating || rating < 1 || rating > 5) {
                res.status(400).json({
                    success: false,
                    message: "La calificación debe estar entre 1 y 5",
                });
                return;
            }

            const result = await this.rateTemplateUseCase.execute({
                userId,
                templateId,
                rating: parseInt(rating),
                comment,
            });

            res.status(200).json({
                success: true,
                data: result,
                message: "Calificación guardada exitosamente",
            });
        } catch (error: any) {
            const typedError = handleError(error);
            console.error("Error al calificar plantilla:", typedError);

            res.status(400).json({
                success: false,
                message: typedError.message || "Error al guardar calificación",
            });
        }
    }
}