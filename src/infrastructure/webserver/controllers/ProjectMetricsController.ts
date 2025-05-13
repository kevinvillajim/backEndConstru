// src/infrastructure/webserver/controllers/ProjectMetricsController.ts
import {Request, Response} from "express";
import {GetProjectMetricsUseCase} from "../../../application/project/GetProjectMetricsUseCase";
import {handleError} from "../utils/errorHandler";
import {RequestWithUser} from "../middlewares/authMiddleware";

export class ProjectMetricsController {
	constructor(private getProjectMetricsUseCase: GetProjectMetricsUseCase) {}

	/**
	 * Obtiene métricas avanzadas de rendimiento del proyecto
	 */
	async getProjectMetrics(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {projectId} = req.params;

			// Verificar que el usuario está autenticado
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const userId = req.user.id;

			// Ejecutar caso de uso
			const metrics = await this.getProjectMetricsUseCase.execute(
				projectId,
				userId
			);

			res.status(200).json({
				success: true,
				data: metrics,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al obtener métricas del proyecto:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener métricas del proyecto",
			});
		}
	}
}
