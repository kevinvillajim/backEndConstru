// src/infrastructure/webserver/controllers/TrendingController.ts
import {GetTrendingTemplatesUseCase} from "../../../application/calculation/GetTrendingTemplatesUseCase";
import {Request, Response} from "express";
import {handleError} from "../utils/errorHandler";

export class TrendingController {
	constructor(
		private getTrendingTemplatesUseCase: GetTrendingTemplatesUseCase
	) {}

	async getTrendingTemplates(req: Request, res: Response): Promise<void> {
		try {
			const {period = "weekly", limit = 10} = req.query;

			// Validar period con type guard
			const validPeriods = ["daily", "weekly", "monthly", "yearly"] as const;
			type ValidPeriod = (typeof validPeriods)[number];

			if (!validPeriods.includes(period as ValidPeriod)) {
				res.status(400).json({
					success: false,
					message: "Período inválido. Use: daily, weekly, monthly, yearly",
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

			// Ahora period está validado y puede ser usado con el tipo correcto
			const trendingTemplates = await this.getTrendingTemplatesUseCase.execute(
				period as ValidPeriod,
				undefined,
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
