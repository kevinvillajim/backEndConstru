// src/infrastructure/webserver/controllers/ProjectPredictionController.ts
import {Request, Response} from "express";
import {PredictProjectDelaysUseCase} from "../../../application/project/PredictProjectDelaysUseCase";
import {handleError} from "../utils/errorHandler";
import {RequestWithUser} from "../middlewares/authMiddleware";

export class ProjectPredictionController {
	constructor(
		private predictProjectDelaysUseCase: PredictProjectDelaysUseCase
	) {}

	/**
	 * Predice posibles retrasos en el proyecto basado en datos actuales
	 */
	async predictDelays(req: RequestWithUser, res: Response): Promise<void> {
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
			const predictions = await this.predictProjectDelaysUseCase.execute(
				projectId,
				userId
			);

			res.status(200).json({
				success: true,
				data: predictions,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al predecir retrasos del proyecto:", typedError);

			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al predecir retrasos del proyecto",
			});
		}
	}

	/**
	 * Obtiene un historial de predicciones para mostrar tendencias
	 * (Esta es una versión simplificada, en un sistema real guardaríamos las predicciones en base de datos)
	 */
	async getPredictionHistory(
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

			// En un sistema real, buscaríamos las predicciones almacenadas en la base de datos
			// Aquí simplemente obtenemos la predicción actual
			const currentPrediction = await this.predictProjectDelaysUseCase.execute(
				projectId,
				req.user.id
			);

			// Simulamos un historial de predicciones basado en la tendencia actual
			const predictionHistory = [];

			// Usar los datos de tendencia que ya están en el resultado
			const historyData = currentPrediction.trendData.map((item) => ({
				date: item.date,
				predictedDelay: item.predictedDelay,
				predictedEndDate: item.predictedEndDate,
				riskLevel: this.getRiskLevelForDelay(
					item.predictedDelay,
					currentPrediction
				),
			}));

			res.status(200).json({
				success: true,
				data: {
					currentPrediction,
					history: historyData,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al obtener historial de predicciones",
			});
		}
	}

	/**
	 * Determina el nivel de riesgo basado en el retraso predicho
	 */
	private getRiskLevelForDelay(
		delay: number,
		prediction: any
	): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
		// Proporción del retraso en comparación con el retraso actual
		const currentDelay = prediction.predictedDelay;

		if (delay <= 0) return "LOW";
		if (delay <= currentDelay * 0.3) return "LOW";
		if (delay <= currentDelay * 0.7) return "MEDIUM";
		if (delay <= currentDelay * 0.9) return "HIGH";
		return "CRITICAL";
	}
}
