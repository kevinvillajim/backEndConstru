// src/application/calculation/CalculateTemplateRankingsUseCase.ts
import {TemplateRankingRepository} from "../../domain/repositories/TemplateRankingRepository";
import {UserTemplateUsageLogRepository} from "../../domain/repositories/UserTemplateUsageLogRepository";
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {UserFavoriteRepository} from "../../domain/repositories/UserFavoriteRepository";
import {TemplateRatingRepository} from "../../domain/repositories/TemplateRatingRepository";
import {CreateRankingDTO} from "../../domain/models/tracking/TemplateRanking";

export interface RankingCalculationResult {
	period: "daily" | "weekly" | "monthly" | "yearly";
	periodStart: Date;
	periodEnd: Date;
	totalRankingsCalculated: number;
	personalTemplates: number;
	verifiedTemplates: number;
	topTemplate: {
		templateId: string;
		templateType: "personal" | "verified";
		score: number;
	} | null;
}

export class CalculateTemplateRankingsUseCase {
	constructor(
		private rankingRepository: TemplateRankingRepository,
		private usageLogRepository: UserTemplateUsageLogRepository,
		private userTemplateRepository: UserCalculationTemplateRepository,
		private calculationTemplateRepository: CalculationTemplateRepository,
		private userFavoriteRepository: UserFavoriteRepository,
		private templateRatingRepository: TemplateRatingRepository
	) {}

	/**
	 * Calcula rankings para un período específico
	 */
	async execute(
		period: "daily" | "weekly" | "monthly" | "yearly",
		targetDate?: Date
	): Promise<RankingCalculationResult> {
		const calculationDate = targetDate || new Date();
		const {periodStart, periodEnd} = this.getPeriodDates(
			calculationDate,
			period
		);

		console.log(
			`Calculando rankings para período ${period}: ${periodStart.toISOString()} - ${periodEnd.toISOString()}`
		);

		// 1. Calcular rankings para plantillas personales
		const personalRankings = await this.calculatePersonalTemplateRankings(
			period,
			periodStart,
			periodEnd
		);

		// 2. Calcular rankings para plantillas verificadas
		const verifiedRankings = await this.calculateVerifiedTemplateRankings(
			period,
			periodStart,
			periodEnd
		);

		// 3. Guardar todos los rankings calculados
		const allRankings = [...personalRankings, ...verifiedRankings];
		await this.rankingRepository.bulkUpsert(allRankings);

		// 4. Calcular y actualizar posiciones de ranking
		await this.rankingRepository.calculateAndUpdateRanks(
			period,
			periodStart,
			"personal"
		);
		await this.rankingRepository.calculateAndUpdateRanks(
			period,
			periodStart,
			"verified"
		);

		// 5. Encontrar el template top
		const topTemplate = this.findTopTemplate(allRankings);

		return {
			period,
			periodStart,
			periodEnd,
			totalRankingsCalculated: allRankings.length,
			personalTemplates: personalRankings.length,
			verifiedTemplates: verifiedRankings.length,
			topTemplate,
		};
	}

	/**
	 * Recalcula rankings para múltiples períodos (útil para mantenimiento)
	 */
	async recalculateMultiplePeriods(
		periods: Array<"daily" | "weekly" | "monthly" | "yearly">,
		daysBack: number = 30
	): Promise<RankingCalculationResult[]> {
		const results: RankingCalculationResult[] = [];
		const endDate = new Date();

		for (let i = 0; i < daysBack; i++) {
			const targetDate = new Date(endDate);
			targetDate.setDate(targetDate.getDate() - i);

			for (const period of periods) {
				try {
					const result = await this.execute(period, targetDate);
					results.push(result);
				} catch (error) {
					console.error(
						`Error calculando ranking ${period} para ${targetDate.toISOString()}:`,
						error
					);
				}
			}
		}

		return results;
	}

	/**
	 * Obtiene plantillas trending actuales
	 */
	async getTrendingTemplates(
		period: "daily" | "weekly" | "monthly" | "yearly",
		templateType?: "personal" | "verified",
		limit: number = 10
	) {
		return await this.rankingRepository.getTrendingTemplates(
			period,
			templateType,
			limit
		);
	}

	// === MÉTODOS PRIVADOS ===
	private async calculatePersonalTemplateRankings(
		period: "daily" | "weekly" | "monthly" | "yearly",
		periodStart: Date,
		periodEnd: Date
	): Promise<CreateRankingDTO[]> {
		// Obtener todas las plantillas personales activas
		const personalTemplates = await this.userTemplateRepository.findAll({
			status: ["active"],
			isActive: true,
		});

		const rankings: CreateRankingDTO[] = [];

		for (const template of personalTemplates.templates) {
			try {
				// Obtener métricas de uso para el período
				const usageLogs = await this.usageLogRepository.findByTemplate(
					template.id,
					"personal",
					periodStart,
					periodEnd
				);

				if (usageLogs.length === 0) continue; // Skip si no hay uso en el período

				// Calcular métricas
				const usageCount = usageLogs.length;
				const uniqueUsers = new Set(usageLogs.map((log) => log.userId)).size;
				const successfulUsage = usageLogs.filter(
					(log) => log.wasSuccessful
				).length;
				const successRate =
					usageCount > 0 ? (successfulUsage / usageCount) * 100 : 0;

				const executionTimes = usageLogs
					.filter((log) => log.wasSuccessful && log.executionTimeMs > 0)
					.map((log) => log.executionTimeMs);

				const averageExecutionTime =
					executionTimes.length > 0
						? executionTimes.reduce((sum, time) => sum + time, 0) /
							executionTimes.length
						: 0;

				// Obtener métricas adicionales
				const [averageRating, totalRatings, favoriteCount] = await Promise.all([
					this.getTemplateAverageRating(template.id, "personal"),
					this.getTemplateRatingCount(template.id, "personal"),
					this.getTemplateFavoriteCount(template.id, "personal"),
				]);

				// Calcular scores
				const trendScore = this.calculateTrendScore({
					usageCount,
					uniqueUsers,
					successRate,
					averageRating,
					favoriteCount,
					averageExecutionTime,
				});

				const growthRate = await this.calculateGrowthRate(
					template.id,
					"personal",
					period,
					periodStart
				);

				// Crear ranking
				const ranking: CreateRankingDTO = {
					templateId: template.id,
					templateType: "personal",
					period,
					periodStart,
					periodEnd,
					usageCount,
					uniqueUsers,
					successRate,
					averageExecutionTime,
					trendScore,
					growthRate,
					averageRating,
					totalRatings,
					favoriteCount,
					weightedScore: this.calculateWeightedScore({
						trendScore,
						usageCount,
						uniqueUsers,
						successRate,
						averageRating,
					}),
					velocityScore: this.calculateVelocityScore(usageLogs),
				};

				rankings.push(ranking);
			} catch (error) {
				console.error(
					`Error calculando ranking para plantilla personal ${template.id}:`,
					error
				);
			}
		}

		return rankings;
	}

	private async calculateVerifiedTemplateRankings(
		period: "daily" | "weekly" | "monthly" | "yearly",
		periodStart: Date,
		periodEnd: Date
	): Promise<CreateRankingDTO[]> {
		// Obtener todas las plantillas verificadas activas
		const {templates: verifiedTemplates} =
			await this.calculationTemplateRepository.findAll({
				isActive: true,
				isVerified: true,
			});

		const rankings: CreateRankingDTO[] = [];

		for (const template of verifiedTemplates) {
			try {
				// Obtener métricas de uso para el período
				const usageLogs = await this.usageLogRepository.findByTemplate(
					template.id,
					"verified",
					periodStart,
					periodEnd
				);

				if (usageLogs.length === 0) continue; // Skip si no hay uso en el período

				// Calcular métricas (similar a plantillas personales)
				const usageCount = usageLogs.length;
				const uniqueUsers = new Set(usageLogs.map((log) => log.userId)).size;
				const successfulUsage = usageLogs.filter(
					(log) => log.wasSuccessful
				).length;
				const successRate =
					usageCount > 0 ? (successfulUsage / usageCount) * 100 : 0;

				const executionTimes = usageLogs
					.filter((log) => log.wasSuccessful && log.executionTimeMs > 0)
					.map((log) => log.executionTimeMs);

				const averageExecutionTime =
					executionTimes.length > 0
						? executionTimes.reduce((sum, time) => sum + time, 0) /
							executionTimes.length
						: 0;

				// Obtener métricas adicionales
				const [averageRating, totalRatings, favoriteCount] = await Promise.all([
					this.getTemplateAverageRating(template.id, "verified"),
					this.getTemplateRatingCount(template.id, "verified"),
					this.getTemplateFavoriteCount(template.id, "verified"),
				]);

				// Calcular scores
				const trendScore = this.calculateTrendScore({
					usageCount,
					uniqueUsers,
					successRate,
					averageRating,
					favoriteCount,
					averageExecutionTime,
				});

				const growthRate = await this.calculateGrowthRate(
					template.id,
					"verified",
					period,
					periodStart
				);

				// Crear ranking
				const ranking: CreateRankingDTO = {
					templateId: template.id,
					templateType: "verified",
					period,
					periodStart,
					periodEnd,
					usageCount,
					uniqueUsers,
					successRate,
					averageExecutionTime,
					trendScore,
					growthRate,
					averageRating: averageRating || template.averageRating,
					totalRatings: totalRatings || template.ratingCount,
					favoriteCount,
					weightedScore: this.calculateWeightedScore({
						trendScore,
						usageCount,
						uniqueUsers,
						successRate,
						averageRating: averageRating || template.averageRating,
					}),
					velocityScore: this.calculateVelocityScore(usageLogs),
				};

				rankings.push(ranking);
			} catch (error) {
				console.error(
					`Error calculando ranking para plantilla verificada ${template.id}:`,
					error
				);
			}
		}

		return rankings;
	}

	private calculateTrendScore(metrics: {
		usageCount: number;
		uniqueUsers: number;
		successRate: number;
		averageRating: number;
		favoriteCount: number;
		averageExecutionTime: number;
	}): number {
		// Algorithm ponderado para calcular trend score
		const weights = {
			usage: 0.25, // 25% - Uso total
			users: 0.2, // 20% - Diversidad de usuarios
			success: 0.2, // 20% - Tasa de éxito
			rating: 0.15, // 15% - Calificación promedio
			favorites: 0.1, // 10% - Favoritos
			performance: 0.1, // 10% - Performance (tiempo de ejecución)
		};

		// Normalizar métricas (0-100)
		const normalizedMetrics = {
			usage: Math.min(metrics.usageCount, 100), // Cap at 100
			users: Math.min(metrics.uniqueUsers * 5, 100), // Scale unique users
			success: metrics.successRate, // Already 0-100
			rating: (metrics.averageRating / 5) * 100, // Convert 0-5 to 0-100
			favorites: Math.min(metrics.favoriteCount * 10, 100), // Scale favorites
			performance: Math.max(0, 100 - metrics.averageExecutionTime / 1000), // Better performance = higher score
		};

		const score =
			normalizedMetrics.usage * weights.usage +
			normalizedMetrics.users * weights.users +
			normalizedMetrics.success * weights.success +
			normalizedMetrics.rating * weights.rating +
			normalizedMetrics.favorites * weights.favorites +
			normalizedMetrics.performance * weights.performance;

		return Math.round(score * 100) / 100; // Round to 2 decimals
	}

	private calculateWeightedScore(metrics: {
		trendScore: number;
		usageCount: number;
		uniqueUsers: number;
		successRate: number;
		averageRating: number;
	}): number {
		// Score combinado considerando todos los factores
		return (
			metrics.trendScore * 0.4 +
			Math.min(metrics.usageCount, 50) * 0.3 +
			Math.min(metrics.uniqueUsers * 2, 30) * 0.2 +
			(metrics.averageRating / 5) * 20 * 0.1
		);
	}

	private calculateVelocityScore(usageLogs: any[]): number {
		if (usageLogs.length < 2) return 0;

		// Calcular velocidad de adopción basada en timestamps
		const sortedLogs = usageLogs.sort(
			(a, b) =>
				new Date(a.usageDate).getTime() - new Date(b.usageDate).getTime()
		);

		const firstUse = new Date(sortedLogs[0].usageDate).getTime();
		const lastUse = new Date(
			sortedLogs[sortedLogs.length - 1].usageDate
		).getTime();
		const timeSpan = lastUse - firstUse;

		if (timeSpan === 0) return 100; // All usage in same moment = high velocity

		// Calculate usage per hour
		const hoursSpan = timeSpan / (1000 * 60 * 60);
		const usagePerHour = usageLogs.length / hoursSpan;

		return Math.min(usagePerHour * 10, 100); // Scale and cap at 100
	}

	private async calculateGrowthRate(
		templateId: string,
		templateType: "personal" | "verified",
		period: "daily" | "weekly" | "monthly" | "yearly",
		currentPeriodStart: Date
	): Promise<number> {
		try {
			// Obtener período anterior
			const previousPeriodStart = new Date(currentPeriodStart);
			const previousPeriodEnd = new Date(currentPeriodStart);

			switch (period) {
				case "daily":
					previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
					break;
				case "weekly":
					previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
					break;
				case "monthly":
					previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
					break;
				case "yearly":
					previousPeriodStart.setFullYear(
						previousPeriodStart.getFullYear() - 1
					);
					break;
			}

			const previousLogs = await this.usageLogRepository.findByTemplate(
				templateId,
				templateType,
				previousPeriodStart,
				previousPeriodEnd
			);

			const currentPeriodEnd = new Date(currentPeriodStart);
			switch (period) {
				case "daily":
					currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 1);
					break;
				case "weekly":
					currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 7);
					break;
				case "monthly":
					currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
					break;
				case "yearly":
					currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
					break;
			}

			const currentLogs = await this.usageLogRepository.findByTemplate(
				templateId,
				templateType,
				currentPeriodStart,
				currentPeriodEnd
			);

			const previousCount = previousLogs.length;
			const currentCount = currentLogs.length;

			if (previousCount === 0) return currentCount > 0 ? 100 : 0;

			return ((currentCount - previousCount) / previousCount) * 100;
		} catch (error) {
			console.error("Error calculando growth rate:", error);
			return 0;
		}
	}

	private getPeriodDates(
		date: Date,
		period: "daily" | "weekly" | "monthly" | "yearly"
	): {
		periodStart: Date;
		periodEnd: Date;
	} {
		const periodStart = new Date(date);
		const periodEnd = new Date(date);

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

	private findTopTemplate(rankings: CreateRankingDTO[]): {
		templateId: string;
		templateType: "personal" | "verified";
		score: number;
	} | null {
		if (rankings.length === 0) return null;

		const sorted = rankings.sort((a, b) => b.trendScore - a.trendScore);
		const top = sorted[0];

		return {
			templateId: top.templateId,
			templateType: top.templateType,
			score: top.trendScore,
		};
	}

	// Métodos helper para obtener métricas adicionales
	private async getTemplateAverageRating(
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<number> {
		try {
			if (this.templateRatingRepository) {
				const rating =
					await this.templateRatingRepository.getAverageRating(templateId);
				return rating?.average || 0;
			}
		} catch (error) {
			console.error("Error obteniendo rating promedio:", error);
		}
		return 0;
	}

	private async getTemplateRatingCount(
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<number> {
		try {
			if (this.templateRatingRepository) {
				const rating =
					await this.templateRatingRepository.getAverageRating(templateId);
				return rating?.count || 0;
			}
		} catch (error) {
			console.error("Error obteniendo conteo de ratings:", error);
		}
		return 0;
	}

	private async getTemplateFavoriteCount(
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<number> {
		try {
			if (this.userFavoriteRepository) {
				return await this.userFavoriteRepository.getFavoriteCount(templateId);
			}
		} catch (error) {
			console.error("Error obteniendo conteo de favoritos:", error);
		}
		return 0;
	}
}
