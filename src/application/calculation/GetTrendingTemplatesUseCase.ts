// src/application/calculation/GetTrendingTemplatesUseCase.ts
import {TemplateRankingRepository} from "../../domain/repositories/TemplateRankingRepository";
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {TrendingTemplate} from "../../domain/models/tracking/TemplateRanking";
import {UserCalculationTemplate} from "../../domain/models/calculation/UserCalculationTemplate";
import {CalculationTemplate} from "../../domain/models/calculation/CalculationTemplate";

export interface TrendingTemplateWithDetails extends TrendingTemplate {
	templateDetails: UserCalculationTemplate | CalculationTemplate;
	isPersonal: boolean;
}

export class GetTrendingTemplatesUseCase {
	constructor(
		private templateRankingRepository: TemplateRankingRepository,
		private userTemplateRepository: UserCalculationTemplateRepository,
		private calculationTemplateRepository: CalculationTemplateRepository
	) {}

	/**
	 * Obtiene plantillas trending con detalles completos
	 */
	async execute(
		period: "daily" | "weekly" | "monthly" | "yearly" = "weekly",
		templateType?: "personal" | "verified",
		limit: number = 10
	): Promise<TrendingTemplateWithDetails[]> {
		// 1. Obtener plantillas trending básicas
		const trendingTemplates =
			await this.templateRankingRepository.getTrendingTemplates(
				period,
				templateType,
				limit
			);

		// 2. Enriquecer con detalles de las plantillas
		const templatesWithDetails: TrendingTemplateWithDetails[] = [];

		for (const trending of trendingTemplates) {
			try {
				let templateDetails;
				let isPersonal = false;

				if (trending.templateType === "personal") {
					templateDetails = await this.userTemplateRepository.findById(
						trending.templateId
					);
					isPersonal = true;
				} else {
					templateDetails = await this.calculationTemplateRepository.findById(
						trending.templateId
					);
				}

				if (templateDetails) {
					templatesWithDetails.push({
						...trending,
						templateDetails,
						isPersonal,
					});
				}
			} catch (error) {
				console.error(
					`Error obteniendo detalles de plantilla ${trending.templateId}:`,
					error
				);
			}
		}

		return templatesWithDetails;
	}

	/**
	 * Obtiene plantillas trending por categoría
	 */
	async getTrendingByCategory(
		category: string,
		period: "daily" | "weekly" | "monthly" | "yearly" = "weekly",
		limit: number = 5
	): Promise<TrendingTemplateWithDetails[]> {
		// Obtener todas las trending y filtrar por categoría
		const allTrending = await this.execute(period, undefined, limit * 3);

		return allTrending
			.filter((template) => {
				if (template.isPersonal) {
					return (
						(template.templateDetails as UserCalculationTemplate).category ===
						category
					);
				} else {
					return (
						(template.templateDetails as CalculationTemplate).type === category
					);
				}
			})
			.slice(0, limit);
	}

	/**
	 * Obtiene plantillas trending por profesión
	 */
	async getTrendingByProfession(
		profession: string,
		period: "daily" | "weekly" | "monthly" | "yearly" = "weekly",
		limit: number = 5
	): Promise<TrendingTemplateWithDetails[]> {
		// Obtener todas las trending y filtrar por profesión
		const allTrending = await this.execute(period, undefined, limit * 3);

		return allTrending
			.filter((template) => {
				if (template.isPersonal) {
					return (
						template.templateDetails as UserCalculationTemplate
					).targetProfessions.includes(profession);
				} else {
					return (
						(template.templateDetails as CalculationTemplate)
							.targetProfession === profession
					);
				}
			})
			.slice(0, limit);
	}

	/**
	 * Obtiene resumen de tendencias por período
	 */
	async getTrendingSummary(): Promise<{
		daily: TrendingTemplateWithDetails[];
		weekly: TrendingTemplateWithDetails[];
		monthly: TrendingTemplateWithDetails[];
		hottest: TrendingTemplateWithDetails[];
	}> {
		const [daily, weekly, monthly] = await Promise.all([
			this.execute("daily", undefined, 5),
			this.execute("weekly", undefined, 5),
			this.execute("monthly", undefined, 5),
		]);

		// Plantillas más calientes son las que aparecen en múltiples períodos
		const allTrending = [...daily, ...weekly, ...monthly];
		const templateCounts = new Map<string, number>();
		const templateData = new Map<string, TrendingTemplateWithDetails>();

		allTrending.forEach((template) => {
			const count = templateCounts.get(template.templateId) || 0;
			templateCounts.set(template.templateId, count + 1);

			if (!templateData.has(template.templateId)) {
				templateData.set(template.templateId, template);
			}
		});

		const hottest = Array.from(templateCounts.entries())
			.filter(([_, count]) => count > 1)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([templateId]) => templateData.get(templateId)!)
			.filter(Boolean);

		return {
			daily,
			weekly,
			monthly,
			hottest,
		};
	}
}
