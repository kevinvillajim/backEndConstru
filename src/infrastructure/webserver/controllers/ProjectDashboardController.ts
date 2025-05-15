// src/infrastructure/webserver/controllers/ProjectDashboardController.ts
import {Request, Response} from "express";
import {GetProjectDashboardDataUseCase} from "../../../application/project/GetProjectDashboardDataUseCase";
import {handleError} from "../utils/errorHandler";
import {RequestWithUser} from "../middlewares/authMiddleware";

export class ProjectDashboardController {
	projectRepository: any;
	constructor(
		private getProjectDashboardDataUseCase: GetProjectDashboardDataUseCase
	) {}

	/**
	 * Obtiene los datos para mostrar en el dashboard visual de seguimiento del proyecto
	 */
	async getProjectDashboard(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
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

			const hasProjectAccess = await this.projectRepository.checkUserAccess(
				projectId,
				userId
			);
			if (!hasProjectAccess) {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para acceder a este proyecto",
				});
				return;
			}

			// Ejecutar caso de uso
			const dashboardData = await this.getProjectDashboardDataUseCase.execute(
				projectId,
				userId
			);

			res.status(200).json({
				success: true,
				data: dashboardData,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al obtener datos del dashboard:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener datos del dashboard",
			});
		}
	}
}
