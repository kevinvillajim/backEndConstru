import { GetMaterialAnalyticsUseCase } from "../../../application/calculation/material/GetMaterialAnalyticsUseCase";
import { GetMaterialTrendingTemplatesUseCase } from "../../../application/calculation/material/GetMaterialTrendingTemplatesUseCase";
import { MaterialCalculationType } from "../../../domain/models/calculation/MaterialCalculationTemplate";
import { handleError } from "../utils/errorHandler";
import {Request, Response} from "express";

// src/infrastructure/webserver/controllers/MaterialTrendingController.ts
export class MaterialTrendingController {
	constructor(
		private getTrendingTemplatesUseCase: GetMaterialTrendingTemplatesUseCase,
		private getMaterialAnalyticsUseCase: GetMaterialAnalyticsUseCase
	) {}

	/**
	 * GET /api/material-calculations/trending
	 * Obtener templates de materiales en tendencia
	 */
	async getTrending(req: Request, res: Response): Promise<void> {
		try {
			const {period = "weekly", materialType, limit = 20} = req.query;

			if (
				!["daily", "weekly", "monthly", "yearly"].includes(period as string)
			) {
				res.status(400).json({
					success: false,
					message: "Período inválido. Debe ser: daily, weekly, monthly, yearly",
				});
				return;
			}

			const result = await this.getTrendingTemplatesUseCase.execute({
				period: period as "daily" | "weekly" | "monthly" | "yearly",
				materialType: materialType as MaterialCalculationType,
				limit: parseInt(limit as string),
			});

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al obtener templates en tendencia",
			});
		}
	}

	/**
	 * GET /api/material-calculations/analytics/overview
	 * Analytics general de cálculos de materiales
	 */
	async getAnalyticsOverview(req: Request, res: Response): Promise<void> {
		try {
			const {period = "monthly"} = req.query;

			const analytics = await this.getMaterialAnalyticsUseCase.execute({
				period: period as string,
				includeComparisons: true,
			});

			res.status(200).json({
				success: true,
				data: analytics,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener analytics",
			});
		}
	}

	/**
	 * GET /api/material-calculations/analytics/by-type
	 * Analytics por tipo de material
	 */
	async getAnalyticsByType(req: Request, res: Response): Promise<void> {
		try {
			const analytics = await this.getMaterialAnalyticsUseCase.execute({
				period: "monthly",
				groupBy: "materialType",
				includeGrowthRates: true,
			});

			res.status(200).json({
				success: true,
				data: analytics,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener analytics por tipo",
			});
		}
	}
}
