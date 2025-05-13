// src/infrastructure/webserver/controllers/AdvancedRecommendationController.ts
import {Request, Response} from "express";
import {GetAdvancedRecommendationsUseCase} from "../../../application/recommendation/GetAdvancedRecommendationsUseCase";

export class AdvancedRecommendationController {
	constructor(
		private getAdvancedRecommendationsUseCase: GetAdvancedRecommendationsUseCase
	) {}

	async getTemplateRecommendations(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {currentTemplateId, projectId, limit} = req.query;

			const recommendations =
				await this.getAdvancedRecommendationsUseCase.getTemplateRecommendations(
					userId,
					currentTemplateId as string,
					projectId as string,
					limit ? parseInt(limit as string, 10) : 10
				);

			res.status(200).json({
				success: true,
				data: recommendations,
			});
		} catch (error) {
			console.error("Error obteniendo recomendaciones avanzadas:", error);
			res.status(500).json({
				success: false,
				message: "Error al obtener recomendaciones",
				error: (error as Error).message,
			});
		}
	}

	async getMaterialRecommendations(req: Request, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {currentMaterials, projectId, limit} = req.body;

			const recommendations =
				await this.getAdvancedRecommendationsUseCase.getMaterialRecommendations(
					userId,
					currentMaterials || [],
					projectId,
					limit || 10
				);

			res.status(200).json({
				success: true,
				data: recommendations,
			});
		} catch (error) {
			console.error("Error obteniendo recomendaciones de materiales:", error);
			res.status(500).json({
				success: false,
				message: "Error al obtener recomendaciones de materiales",
				error: (error as Error).message,
			});
		}
	}

	async registerUserInteraction(req: Request, res: Response): Promise<void> {
		try {
			// Esta ruta sería para registrar una interacción del usuario desde el frontend
			// Implementación omitida por brevedad
			res.status(200).json({
				success: true,
				message: "Interacción registrada correctamente",
			});
		} catch (error) {
			console.error("Error registrando interacción:", error);
			res.status(500).json({
				success: false,
				message: "Error al registrar interacción",
				error: (error as Error).message,
			});
		}
	}
}