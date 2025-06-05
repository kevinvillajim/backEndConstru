import { MaterialCalculationTemplate, MaterialCalculationType } from "../../../domain/models/calculation/MaterialCalculationTemplate";
import { UserMaterialCalculationTemplate } from "../../../domain/models/calculation/UserMaterialCalculationTemplate";
import { MaterialCalculationTemplateRepository } from "../../../domain/repositories/MaterialCalculationTemplateRepository";
import { UserMaterialCalculationTemplateRepository } from "../../../domain/repositories/UserMaterialCalculationTemplateRepository";

// src/application/calculation/material/GetMaterialTrendingTemplatesUseCase.ts
export class GetMaterialTrendingTemplatesUseCase {
	constructor(
		private rankingRepository: MaterialTemplateRankingRepository,
		private materialTemplateRepository: MaterialCalculationTemplateRepository,
		private userTemplateRepository: UserMaterialCalculationTemplateRepository
	) {}

	async execute(
		request: GetMaterialTrendingRequest
	): Promise<MaterialTrendingResponse> {
		// 1. Obtener rankings del período solicitado
		const rankings = await this.rankingRepository.findByPeriod(
			request.period,
			request.materialType,
			request.limit || 20
		);

		if (rankings.length === 0) {
			return {
				period: request.period,
				materialType: request.materialType,
				trending: [],
				totalFound: 0,
			};
		}

		// 2. Obtener detalles de los templates
		const trendingTemplates: MaterialTrendingTemplate[] = [];

		for (const ranking of rankings) {
			let template:
				| MaterialCalculationTemplate
				| UserMaterialCalculationTemplate
				| null = null;

			if (ranking.templateType === "official") {
				template = await this.materialTemplateRepository.findById(
					ranking.templateId
				);
			} else {
				template = await this.userTemplateRepository.findById(
					ranking.templateId
				);
			}

			if (template) {
				trendingTemplates.push({
					template,
					templateType: ranking.templateType,
					ranking: {
						position: ranking.rankPosition,
						trendScore: ranking.trendScore,
						usageCount: ranking.usageCount,
						uniqueUsers: ranking.uniqueUsers,
						uniqueProjects: ranking.uniqueProjects,
						successRate: ranking.successRate,
						growthRate: ranking.growthRate,
						averageExecutionTime: ranking.averageExecutionTime,
						averageMaterialsCount: ranking.averageMaterialsCount,
						totalCostCalculated: ranking.totalCostCalculated,
					},
					period: request.period,
					periodStart: ranking.periodStart,
					periodEnd: ranking.periodEnd,
				});
			}
		}

		return {
			period: request.period,
			materialType: request.materialType,
			trending: trendingTemplates,
			totalFound: trendingTemplates.length,
		};
	}
}

export interface GetMaterialTrendingRequest {
	period: "daily" | "weekly" | "monthly" | "yearly";
	materialType?: MaterialCalculationType;
	limit?: number;
}

export interface MaterialTrendingResponse {
	period: string;
	materialType?: MaterialCalculationType;
	trending: MaterialTrendingTemplate[];
	totalFound: number;
}

export interface MaterialTrendingTemplate {
	template: MaterialCalculationTemplate | UserMaterialCalculationTemplate;
	templateType: "official" | "user";
	ranking: {
		position: number;
		trendScore: number;
		usageCount: number;
		uniqueUsers: number;
		uniqueProjects: number;
		successRate: number;
		growthRate: number;
		averageExecutionTime: number;
		averageMaterialsCount: number;
		totalCostCalculated: number;
	};
	period: string;
	periodStart: Date;
	periodEnd: Date;
}
