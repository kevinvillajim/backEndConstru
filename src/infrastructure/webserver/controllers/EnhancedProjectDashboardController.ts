// src/infrastructure/webserver/controllers/EnhancedProjectDashboardController.ts
import {Request, Response} from "express";
import {EnhancedProjectDashboardUseCase} from "../../../application/project/EnhancedProjectDashboardUseCase";
import {User} from "../../../domain/models/user/User";
import {handleError} from "../utils/errorHandler";

interface RequestWithUser extends Request {
	user?: User;
}

export class EnhancedProjectDashboardController {
	constructor(
		private enhancedProjectDashboardUseCase: EnhancedProjectDashboardUseCase
	) {}

	/**
	 * Obtiene datos enriquecidos para el dashboard visual del proyecto
	 */
	async getEnhancedDashboard(
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

			// Ejecutar caso de uso
			const dashboardData = await this.enhancedProjectDashboardUseCase.execute(
				projectId,
				userId
			);

			res.status(200).json({
				success: true,
				data: dashboardData,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error(
				"Error al obtener datos del dashboard mejorado:",
				typedError
			);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener datos del dashboard",
			});
		}
	}

	/**
	 * Obtiene datos específicos para un widget del dashboard (para carga optimizada)
	 */
	async getDashboardWidget(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {projectId, widgetType} = req.params;

			// Verificar que el usuario está autenticado
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar tipo de widget válido
			const validWidgets = [
				"progress",
				"tasks",
				"phases",
				"budget",
				"criticalTasks",
				"resources",
				"kpis",
				"milestones",
				"risks",
			];

			if (!validWidgets.includes(widgetType)) {
				res.status(400).json({
					success: false,
					message: `Tipo de widget inválido. Los tipos válidos son: ${validWidgets.join(", ")}`,
				});
				return;
			}

			// Obtener datos completos y filtrar según el widget solicitado
			const dashboardData = await this.enhancedProjectDashboardUseCase.execute(
				projectId,
				req.user.id
			);

			// Extraer solo los datos necesarios para el widget solicitado
			let widgetData;

			switch (widgetType) {
				case "progress":
					widgetData = {
						projectName: dashboardData.projectName,
						completionPercentage: dashboardData.completionPercentage,
						progressData: dashboardData.progressData,
					};
					break;
				case "tasks":
					widgetData = {
						taskStatusCounts: dashboardData.taskStatusCounts,
					};
					break;
				case "phases":
					widgetData = {
						phaseProgress: dashboardData.phaseProgress,
					};
					break;
				case "budget":
					widgetData = {
						budgetData: dashboardData.budgetData,
					};
					break;
				case "criticalTasks":
					widgetData = {
						criticalTasks: dashboardData.criticalTasks,
					};
					break;
				case "resources":
					widgetData = {
						resourceAllocation: dashboardData.resourceAllocation,
					};
					break;
				case "kpis":
					widgetData = {
						keyPerformanceIndicators: dashboardData.keyPerformanceIndicators,
					};
					break;
				case "milestones":
					widgetData = {
						milestones: dashboardData.milestones,
					};
					break;
				case "risks":
					widgetData = {
						activeRisks: dashboardData.activeRisks,
					};
					break;
			}

			res.status(200).json({
				success: true,
				data: widgetData,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener datos del widget",
			});
		}
	}
}
