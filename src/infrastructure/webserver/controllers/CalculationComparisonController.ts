// src/infrastructure/webserver/controllers/CalculationComparisonController.ts
import {CompareCalculationsUseCase} from "../../../application/calculation/CompareCalculationsUseCase";
import {GetSavedComparisonsUseCase} from "../../../application/calculation/GetSavedComparisonsUseCase";
import {CalculationComparisonRepository} from "../../../domain/repositories/CalculationComparisonRepository";
import { RequestWithUser } from "../middlewares/authMiddleware";
import { handleError } from "../utils/errorHandler";
import {Response} from "express";

export class CalculationComparisonController {
    constructor(
        private compareCalculationsUseCase: CompareCalculationsUseCase,
        private getSavedComparisonsUseCase: GetSavedComparisonsUseCase,
        private calculationComparisonRepository: CalculationComparisonRepository
    ) {}

    async compareCalculations(
        req: RequestWithUser,
        res: Response
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            const {calculationIds, saveName} = req.body;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
                return;
            }

            // Validaciones
            if (!calculationIds || !Array.isArray(calculationIds)) {
                res.status(400).json({
                    success: false,
                    message: "Se requiere un array de IDs de cálculos",
                });
                return;
            }

            if (calculationIds.length < 2 || calculationIds.length > 4) {
                res.status(400).json({
                    success: false,
                    message: "Debe seleccionar entre 2 y 4 cálculos",
                });
                return;
            }

            const comparison = await this.compareCalculationsUseCase.execute(
                calculationIds,
                userId,
                saveName
            );

            res.status(200).json({
                success: true,
                data: comparison,
            });
        } catch (error: any) {
            const typedError = handleError(error);
            console.error("Error al comparar cálculos:", typedError);

            res.status(400).json({
                success: false,
                message: typedError.message || "Error al comparar cálculos",
            });
        }
    }

    async getSavedComparisons(
        req: RequestWithUser,
        res: Response
    ): Promise<void> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
                return;
            }

            const comparisons = await this.getSavedComparisonsUseCase.execute(userId);

            res.status(200).json({
                success: true,
                data: comparisons,
            });
        } catch (error: any) {
            const typedError = handleError(error);
            console.error("Error al obtener comparaciones:", typedError);

            res.status(500).json({
                success: false,
                message: typedError.message || "Error al obtener comparaciones",
            });
        }
    }

    async deleteComparison(req: RequestWithUser, res: Response): Promise<void> {
        try {
            const {comparisonId} = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Usuario no autenticado",
                });
                return;
            }

            // Verificar que la comparación pertenece al usuario
            const comparison =
                await this.calculationComparisonRepository.findById(comparisonId);
            if (!comparison) {
                res.status(404).json({
                    success: false,
                    message: "Comparación no encontrada",
                });
                return;
            }

            if (comparison.userId !== userId) {
                res.status(403).json({
                    success: false,
                    message: "No tienes permiso para eliminar esta comparación",
                });
                return;
            }

            const deleted =
                await this.calculationComparisonRepository.delete(comparisonId);

            if (!deleted) {
                res.status(500).json({
                    success: false,
                    message: "Error al eliminar comparación",
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: "Comparación eliminada exitosamente",
            });
        } catch (error: any) {
            const typedError = handleError(error);
            console.error("Error al eliminar comparación:", typedError);

            res.status(500).json({
                success: false,
                message: typedError.message || "Error al eliminar comparación",
            });
        }
    }
}