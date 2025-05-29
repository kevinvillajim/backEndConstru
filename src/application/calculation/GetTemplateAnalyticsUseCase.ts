// src/application/calculation/GetTemplateAnalyticsUseCase.ts
import {UserTemplateUsageLogRepository} from "../../domain/repositories/UserTemplateUsageLogRepository";
import {TemplateRankingRepository} from "../../domain/repositories/TemplateRankingRepository";
import {
	UsageAnalytics,
	TemplateUsageStats,
} from "../../domain/models/tracking/UsageLog";

export interface TemplateAnalyticsResult {
	basicStats: TemplateUsageStats;
	periodAnalytics: UsageAnalytics;
	currentRanking: {
		daily: number;
		weekly: number;
		monthly: number;
		yearly: number;
	};
	trendingScore: number;
	competitionAnalysis: {
		percentile: number;
		totalCompetitors: number;
	};
}

export class GetTemplateAnalyticsUseCase {
	constructor(
		private usageLogRepository: UserTemplateUsageLogRepository,
		private templateRankingRepository: TemplateRankingRepository
	) {}

	async execute(
		templateId: string,
		templateType: "personal" | "verified",
		period: "day" | "week" | "month" | "year" = "month"
	): Promise<TemplateAnalyticsResult> {
		// 1. Obtener estadísticas básicas
		const basicStats = await this.usageLogRepository.getTemplateStats(
			templateId,
			templateType
		);

		// 2. Obtener analytics del período
		const endDate = new Date();
		const startDate = this.getStartDate(endDate, period);

		const periodAnalytics = await this.usageLogRepository.getUsageAnalytics(
			templateId,
			templateType,
			period,
			startDate,
			endDate
		);

		// 3. Obtener rankings actuales
		const currentRanking = await this.getCurrentRankings(
			templateId,
			templateType
		);

		// 4. Obtener análisis de competencia
		const competitionAnalysis =
			await this.templateRankingRepository.getCompetitionAnalysis(
				templateId,
				templateType,
				"monthly"
			);

		return {
			basicStats,
			periodAnalytics,
			currentRanking,
			trendingScore: basicStats.trending,
			competitionAnalysis: {
				percentile: competitionAnalysis.percentile,
				totalCompetitors: competitionAnalysis.totalCompetitors,
			},
		};
	}

	private async getCurrentRankings(
		templateId: string,
		templateType: "personal" | "verified"
	) {
		const periods = ["daily", "weekly", "monthly", "yearly"] as const;
		const rankings = {
			daily: 0,
			weekly: 0,
			monthly: 0,
			yearly: 0,
		};

		for (const period of periods) {
			try {
				const history = await this.templateRankingRepository.getRankingHistory(
					templateId,
					templateType,
					period,
					1
				);
				rankings[period] = history.length > 0 ? history[0].position : 0;
			} catch (error) {
				console.error(`Error obteniendo ranking ${period}:`, error);
			}
		}

		return rankings;
	}

	private getStartDate(
		endDate: Date,
		period: "day" | "week" | "month" | "year"
	): Date {
		const startDate = new Date(endDate);

		switch (period) {
			case "day":
				startDate.setDate(startDate.getDate() - 30); // últimos 30 días
				break;
			case "week":
				startDate.setDate(startDate.getDate() - 84); // últimas 12 semanas
				break;
			case "month":
				startDate.setMonth(startDate.getMonth() - 12); // últimos 12 meses
				break;
			case "year":
				startDate.setFullYear(startDate.getFullYear() - 5); // últimos 5 años
				break;
		}

		return startDate;
	}
}
