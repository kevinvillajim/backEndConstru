// src/infrastructure/webserver/controllers/CalculationController.ts
import {Request, Response} from "express";
import {ExecuteCalculationUseCase} from "../../../application/calculation/ExecuteCalculationUseCase";
import {GetTemplateRecommendationsUseCase} from "../../../application/calculation/GetTemplateRecommendationsUseCase";
import {SaveCalculationResultUseCase} from "../../../application/calculation/SaveCalculationResultUseCase";
import {CalculationRequest} from "../../../domain/models/calculation/CalculationResult";
import {handleError} from "../utils/errorHandler";
import {User} from "../../../domain/models/user/User";

// Interfaz extendida para Request con usuario
interface RequestWithUser extends Request {
	user?: User;
}

export class CalculationController {
	constructor(
		private executeCalculationUseCase: ExecuteCalculationUseCase,
		private getTemplateRecommendationsUseCase: GetTemplateRecommendationsUseCase,
		private saveCalculationResultUseCase: SaveCalculationResultUseCase
	) {}

	/**
	 * Ejecuta un cálculo con los parámetros proporcionados
	 */
	async executeCalculation(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {templateId, projectId, parameters} = req.body;

			// Verificar que el usuario está autenticado
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const userId = req.user.id;

			const calculationRequest: CalculationRequest = {
				templateId,
				projectId,
				parameters,
			};

			const result = await this.executeCalculationUseCase.execute(
				calculationRequest,
				userId
			);

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al ejecutar cálculo:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al ejecutar el cálculo",
				errors: typedError.errors || [],
			});
		}
	}

	/**
	 * Guarda un resultado de cálculo con un nombre específico
	 */
	async saveCalculationResult(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {id, name, notes, usedInProject, projectId} = req.body;

			// Verificar que el usuario está autenticado
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const userId = req.user.id;

			const savedResult = await this.saveCalculationResultUseCase.execute(
				{
					id,
					name,
					notes,
					usedInProject,
					projectId,
				},
				userId
			);

			res.status(200).json({
				success: true,
				data: savedResult,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al guardar resultado:", typedError);

			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al guardar el resultado del cálculo",
			});
		}
	}

	/**
	 * Obtiene recomendaciones de plantillas basadas en el contexto actual
	 */
	async getRecommendations(req: RequestWithUser, res: Response): Promise<void> {
		try {
			// Verificar que el usuario está autenticado
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const userId = req.user.id;
			const {templateId, projectId, limit} = req.query;

			const recommendations =
				await this.getTemplateRecommendationsUseCase.execute(
					userId,
					templateId as string,
					projectId as string,
					limit ? parseInt(limit as string, 10) : undefined
				);

			res.status(200).json({
				success: true,
				data: recommendations,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al obtener recomendaciones:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener recomendaciones",
			});
		}
	}
}
