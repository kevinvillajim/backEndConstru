// src/infrastructure/webserver/controllers/TemplateAnalyticsController.ts
import {Request, Response} from "express";
import {RequestWithUser} from "../middlewares/authMiddleware";
import {handleError} from "../utils/errorHandler";
import {GetTemplateAnalyticsUseCase} from "../../../application/calculation/GetTemplateAnalyticsUseCase";
import {GetTrendingTemplatesUseCase} from "../../../application/calculation/GetTrendingTemplatesUseCase";

export class TemplateAnalyticsController {
	constructor(
		private getTemplateAnalyticsUseCase: GetTemplateAnalyticsUseCase,
		private getTrendingTemplatesUseCase: GetTrendingTemplatesUseCase
	) {}

	/**
	 * GET /api/analytics/templates/:id
	 * Obtiene analytics de una plantilla específica
	 */
	async getTemplateAnalytics(req: Request, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const {templateType = "personal", period = "month"} = req.query;

			if (!["personal", "verified"].includes(templateType as string)) {
				res.status(400).json({
					success: false,
					message: "templateType debe ser 'personal' o 'verified'",
				});
				return;
			}

			if (!["day", "week", "month", "year"].includes(period as string)) {
				res.status(400).json({
					success: false,
					message: "period debe ser 'day', 'week', 'month' o 'year'",
				});
				return;
			}

			const analytics = await this.getTemplateAnalyticsUseCase.execute(
				id,
				templateType as "personal" | "verified",
				period as "day" | "week" | "month" | "year"
			);

			res.status(200).json({
				success: true,
				data: analytics,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo analytics de plantilla:", typedError);

			if (typedError.message.includes("no encontrada")) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(500).json({
					success: false,
					message: typedError.message || "Error obteniendo analytics",
				});
			}
		}
	}

	/**
	 * GET /api/analytics/trending
	 * Obtiene plantillas en tendencia
	 */
	async getTrendingTemplates(req: Request, res: Response): Promise<void> {
		try {
			const {
				period = "weekly",
				templateType,
				limit = "10",
			} = req.query;

			if (!["daily", "weekly", "monthly", "yearly"].includes(period as string)) {
				res.status(400).json({
					success: false,
					message: "period debe ser 'daily', 'weekly', 'monthly' o 'yearly'",
				});
				return;
			}

			if (templateType && !["personal", "verified"].includes(templateType as string)) {
				res.status(400).json({
					success: false,
					message: "templateType debe ser 'personal' o 'verified'",
				});
				return;
			}

			const limitNum = parseInt(limit as string);
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
				res.status(400).json({
					success: false,
					message: "limit debe ser un número entre 1 y 50",
				});
				return;
			}

			const trendingTemplates = await this.getTrendingTemplatesUseCase.execute(
				period as "daily" | "weekly" | "monthly" | "yearly",
				templateType as "personal" | "verified" | undefined,
				limitNum
			);

			res.status(200).json({
				success: true,
				data: {
					period,
					templates: trendingTemplates,
					total: trendingTemplates.length,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo plantillas trending:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error obteniendo plantillas trending",
			});
		}
	}

	/**
	 * GET /api/analytics/trending/summary
	 * Obtiene resumen de tendencias por períodos
	 */
	async getTrendingSummary(req: Request, res: Response): Promise<void> {
		try {
			const summary = await this.getTrendingTemplatesUseCase.getTrendingSummary();

			res.status(200).json({
				success: true,
				data: summary,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo resumen trending:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error obteniendo resumen trending",
			});
		}
	}

	/**
	 * GET /api/analytics/trending/category/:category
	 * Obtiene plantillas trending por categoría
	 */
	async getTrendingByCategory(req: Request, res: Response): Promise<void> {
		try {
			const {category} = req.params;
			const {period = "weekly", limit = "5"} = req.query;

			if (!["daily", "weekly", "monthly", "yearly"].includes(period as string)) {
				res.status(400).json({
					success: false,
					message: "period debe ser 'daily', 'weekly', 'monthly' o 'yearly'",
				});
				return;
			}

			const limitNum = parseInt(limit as string);
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
				res.status(400).json({
					success: false,
					message: "limit debe ser un número entre 1 y 20",
				});
				return;
			}

			const trendingTemplates = await this.getTrendingTemplatesUseCase.getTrendingByCategory(
				category,
				period as "daily" | "weekly" | "monthly" | "yearly",
				limitNum
			);

			res.status(200).json({
				success: true,
				data: {
					category,
					period,
					templates: trendingTemplates,
					total: trendingTemplates.length,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo trending por categoría:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error obteniendo trending por categoría",
			});
		}
	}

	/**
	 * GET /api/analytics/trending/profession/:profession
	 * Obtiene plantillas trending por profesión
	 */
	async getTrendingByProfession(req: Request, res: Response): Promise<void> {
		try {
			const {profession} = req.params;
			const {period = "weekly", limit = "5"} = req.query;

			if (!["daily", "weekly", "monthly", "yearly"].includes(period as string)) {
				res.status(400).json({
					success: false,
					message: "period debe ser 'daily', 'weekly', 'monthly' o 'yearly'",
				});
				return;
			}

			const limitNum = parseInt(limit as string);
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
				res.status(400).json({
					success: false,
					message: "limit debe ser un número entre 1 y 20",
				});
				return;
			}

			const trendingTemplates = await this.getTrendingTemplatesUseCase.getTrendingByProfession(
				profession,
				period as "daily" | "weekly" | "monthly" | "yearly",
				limitNum
			);

			res.status(200).json({
				success: true,
				data: {
					profession,
					period,
					templates: trendingTemplates,
					total: trendingTemplates.length,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo trending por profesión:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error obteniendo trending por profesión",
			});
		}
	}
}