import { MaterialCalculationType } from "../../../domain/models/calculation/MaterialCalculationTemplate";

// src/application/calculation/material/CalculateMaterialTemplateRankingsUseCase.ts
export class CalculateMaterialTemplateRankingsUseCase {
	constructor(
		private usageLogRepository: MaterialTemplateUsageLogRepository,
		private rankingRepository: MaterialTemplateRankingRepository
	) {}

	async execute(
		period: "daily" | "weekly" | "monthly" | "yearly",
		targetDate: Date = new Date()
	): Promise<void> {
		const {periodStart, periodEnd} = this.calculatePeriodRange(
			period,
			targetDate
		);

		// 1. Obtener datos de uso por template en el período
		const usageStats = await this.usageLogRepository.getUsageStatsByPeriod(
			periodStart,
			periodEnd
		);

		// 2. Calcular métricas por tipo de material
		const materialTypes = Object.values(MaterialCalculationType);

		for (const materialType of materialTypes) {
			const typeStats = usageStats.filter(
				(stat) => stat.materialType === materialType
			);

			if (typeStats.length === 0) continue;

			// 3. Calcular trend scores y rankings
			const rankedStats = await this.calculateTrendScores(
				typeStats,
				period,
				periodStart
			);

			// 4. Guardar rankings
			for (let i = 0; i < rankedStats.length; i++) {
				const stat = rankedStats[i];

				await this.rankingRepository.upsert({
					templateId: stat.templateId,
					templateType: stat.templateType,
					materialType,
					subCategory: stat.subCategory,
					period,
					periodStart,
					periodEnd,
					usageCount: stat.usageCount,
					uniqueUsers: stat.uniqueUsers,
					uniqueProjects: stat.uniqueProjects,
					successRate: stat.successRate,
					averageExecutionTime: stat.averageExecutionTime,
					averageMaterialsCount: stat.averageMaterialsCount,
					totalCostCalculated: stat.totalCostCalculated,
					rankPosition: i + 1,
					trendScore: stat.trendScore,
					growthRate: stat.growthRate,
				});
			}
		}
	}

	private async calculateTrendScores(
		stats: UsageStatsByTemplate[],
		period: string,
		currentPeriodStart: Date
	): Promise<TrendScoredTemplate[]> {
		const previousPeriodStart = this.getPreviousPeriodStart(
			period,
			currentPeriodStart
		);
		const previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);

		// Obtener estadísticas del período anterior para calcular crecimiento
		const previousStats = await this.usageLogRepository.getUsageStatsByPeriod(
			previousPeriodStart,
			previousPeriodEnd
		);

		const scoredTemplates: TrendScoredTemplate[] = stats.map((stat) => {
			const previousStat = previousStats.find(
				(p) =>
					p.templateId === stat.templateId &&
					p.templateType === stat.templateType
			);

			// Calcular tasa de crecimiento
			const growthRate =
				previousStat && previousStat.usageCount > 0
					? ((stat.usageCount - previousStat.usageCount) /
							previousStat.usageCount) *
						100
					: stat.usageCount > 0
						? 100
						: 0; // 100% si es nuevo

			// Calcular trend score (algoritmo ponderado)
			const trendScore = this.calculateTrendScore({
				usageCount: stat.usageCount,
				uniqueUsers: stat.uniqueUsers,
				successRate: stat.successRate,
				growthRate,
				averageExecutionTime: stat.averageExecutionTime,
				averageMaterialsCount: stat.averageMaterialsCount,
			});

			return {
				...stat,
				trendScore,
				growthRate,
			};
		});

		// Ordenar por trend score
		return scoredTemplates.sort((a, b) => b.trendScore - a.trendScore);
	}

	private calculateTrendScore(metrics: TrendScoreMetrics): number {
		// Algoritmo de scoring para templates de materiales
		const weights = {
			usage: 0.3, // 30% - Número de usos
			users: 0.25, // 25% - Usuarios únicos
			success: 0.2, // 20% - Tasa de éxito
			growth: 0.15, // 15% - Tasa de crecimiento
			efficiency: 0.1, // 10% - Eficiencia (tiempo + materiales)
		};

		// Normalizar métricas (0-100)
		const normalizedUsage = Math.min((metrics.usageCount / 100) * 100, 100);
		const normalizedUsers = Math.min((metrics.uniqueUsers / 50) * 100, 100);
		const normalizedSuccess = metrics.successRate; // Ya está en porcentaje
		const normalizedGrowth = Math.min(
			Math.max(metrics.growthRate + 50, 0),
			100
		); // -50% a +50% = 0-100

		// Eficiencia: menos tiempo de ejecución y más materiales = mejor
		const avgTime = metrics.averageExecutionTime || 5000; // 5s default
		const timeScore = Math.max(100 - avgTime / 100, 0); // Mejor score = menos tiempo
		const materialScore = Math.min(metrics.averageMaterialsCount * 10, 100); // Más materiales = mejor
		const normalizedEfficiency = (timeScore + materialScore) / 2;

		// Calcular score final
		const trendScore =
			normalizedUsage * weights.usage +
			normalizedUsers * weights.users +
			normalizedSuccess * weights.success +
			normalizedGrowth * weights.growth +
			normalizedEfficiency * weights.efficiency;

		return Math.round(trendScore * 100) / 100; // 2 decimales
	}

	private calculatePeriodRange(
		period: string,
		targetDate: Date
	): {periodStart: Date; periodEnd: Date} {
		const periodStart = new Date(targetDate);
		const periodEnd = new Date(targetDate);

		switch (period) {
			case "daily":
				periodStart.setHours(0, 0, 0, 0);
				periodEnd.setHours(23, 59, 59, 999);
				break;
			case "weekly":
				const dayOfWeek = periodStart.getDay();
				periodStart.setDate(periodStart.getDate() - dayOfWeek);
				periodStart.setHours(0, 0, 0, 0);
				periodEnd.setDate(periodStart.getDate() + 6);
				periodEnd.setHours(23, 59, 59, 999);
				break;
			case "monthly":
				periodStart.setDate(1);
				periodStart.setHours(0, 0, 0, 0);
				periodEnd.setMonth(periodEnd.getMonth() + 1, 0);
				periodEnd.setHours(23, 59, 59, 999);
				break;
			case "yearly":
				periodStart.setMonth(0, 1);
				periodStart.setHours(0, 0, 0, 0);
				periodEnd.setMonth(11, 31);
				periodEnd.setHours(23, 59, 59, 999);
				break;
		}

		return {periodStart, periodEnd};
	}

	private getPreviousPeriodStart(period: string, currentStart: Date): Date {
		const previousStart = new Date(currentStart);

		switch (period) {
			case "daily":
				previousStart.setDate(previousStart.getDate() - 1);
				break;
			case "weekly":
				previousStart.setDate(previousStart.getDate() - 7);
				break;
			case "monthly":
				previousStart.setMonth(previousStart.getMonth() - 1);
				break;
			case "yearly":
				previousStart.setFullYear(previousStart.getFullYear() - 1);
				break;
		}

		return previousStart;
	}
}

interface UsageStatsByTemplate {
	templateId: string;
	templateType: "official" | "user";
	materialType: MaterialCalculationType;
	subCategory: string;
	usageCount: number;
	uniqueUsers: number;
	uniqueProjects: number;
	successRate: number;
	averageExecutionTime: number;
	averageMaterialsCount: number;
	totalCostCalculated: number;
}

interface TrendScoredTemplate extends UsageStatsByTemplate {
	trendScore: number;
	growthRate: number;
}

interface TrendScoreMetrics {
	usageCount: number;
	uniqueUsers: number;
	successRate: number;
	growthRate: number;
	averageExecutionTime: number;
	averageMaterialsCount: number;
}
