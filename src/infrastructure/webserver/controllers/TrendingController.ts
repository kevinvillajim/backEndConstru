// src/infrastructure/webserver/controllers/TrendingController.ts
import { GetTrendingTemplatesUseCase } from "../../../application/calculation/GetTrendingTemplatesUseCase";
import {Request, Response} from "express";
import { handleError } from "../utils/errorHandler";

export class TrendingController {
	constructor(
		private getTrendingTemplatesUseCase: GetTrendingTemplatesUseCase
	) {}

	async getTrendingTemplates(req: Request, res: Response): Promise<void> {
		try {
			const {period = "weekly", limit = 10} = req.query;

			// Validar period
			const validPeriods = ["daily", "weekly", "monthly"];
			if (!validPeriods.includes(period as string)) {
				res.status(400).json({
					success: false,
					message: "Período inválido. Use: daily, weekly, monthly",
				});
				return;
			}

			// Validar limit
			const limitNum = parseInt(limit as string);
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
				res.status(400).json({
					success: false,
					message: "Límite debe ser un número entre 1 y 50",
				});
				return;
			}

			const trendingTemplates = await this.getTrendingTemplatesUseCase.execute(
				period as string,
				limitNum
			);

			res.status(200).json({
				success: true,
				data: trendingTemplates,
			});
		} catch (error: any) {
			const typedError = handleError(error);
			console.error("Error al obtener plantillas trending:", typedError);

			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al obtener plantillas en tendencia",
			});
		}
	}
}
