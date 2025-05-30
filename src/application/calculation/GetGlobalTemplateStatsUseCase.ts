// src/application/calculation/GetGlobalTemplateStatsUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {UserTemplateUsageLogRepository} from "../../domain/repositories/UserTemplateUsageLogRepository";
import {TemplateRankingRepository} from "../../domain/repositories/TemplateRankingRepository";
import {PromotionRequestRepository} from "../../domain/repositories/PromotionRequestRepository";
import {AuthorCreditRepository} from "../../domain/repositories/AuthorCreditRepository";

export interface GlobalTemplateStats {
	overview: {
		totalPersonalTemplates: number;
		totalVerifiedTemplates: number;
		totalUsageCount: number;
		activeUsers: number;
		totalPromotions: number;
	};
	usage: {
		dailyUsage: number;
		weeklyUsage: number;
		monthlyUsage: number;
		averageUsagePerTemplate: number;
		topCategories: Array<{
			category: string;
			count: number;
			percentage: number;
		}>;
	};
	promotion: {
		pendingRequests: number;
		approvedRequests: number;
		rejectedRequests: number;
		approvalRate: number;
		averageProcessingTime: number;
	};
	trending: {
		topPersonalTemplates: Array<{
			templateId: string;
			templateName: string;
			authorName: string;
			usageCount: number;
			trendScore: number;
		}>;
		topVerifiedTemplates: Array<{
			templateId: string;
			templateName: string;
			usageCount: number;
			trendScore: number;
		}>;
	};
	authors: {
		totalAuthors: number;
		authorWithPromotions: number;
		topContributors: Array<{
			authorId: string;
			authorName: string;
			totalCredits: number;
			totalPoints: number;
		}>;
	};
	temporal: {
		creationTrend: Array<{
			date: string;
			personalTemplates: number;
			verifiedTemplates: number;
		}>;
		usageTrend: Array<{
			date: string;
			usage: number;
		}>;
	};
}

export class GetGlobalTemplateStatsUseCase {
	constructor(
		private userTemplateRepository: UserCalculationTemplateRepository,
		private calculationTemplateRepository: CalculationTemplateRepository,
		private usageLogRepository: UserTemplateUsageLogRepository,
		private rankingRepository: TemplateRankingRepository,
		private promotionRequestRepository: PromotionRequestRepository,
		private authorCreditRepository: AuthorCreditRepository
	) {}

	async execute(period: string = "month"): Promise<GlobalTemplateStats> {
		const [overview, usage, promotion, trending, authors, temporal] =
			await Promise.all([
				this.getOverviewStats(),
				this.getUsageStats(period),
				this.getPromotionStats(),
				this.getTrendingStats(),
				this.getAuthorStats(),
				this.getTemporalStats(period),
			]);

		return {
			overview,
			usage,
			promotion,
			trending,
			authors,
			temporal,
		};
	}

	private async getOverviewStats() {
		try {
			// Obtener estadísticas de plantillas personales
			const personalTemplatesResult = await this.userTemplateRepository.findAll(
				{
					isActive: true,
				}
			);
			const totalPersonalTemplates = personalTemplatesResult.total;

			// Obtener estadísticas de plantillas verificadas
			const verifiedTemplatesResult =
				await this.calculationTemplateRepository.findAll({
					isActive: true,
				});
			const totalVerifiedTemplates = verifiedTemplatesResult.total;

			// Obtener estadísticas de uso más utilizadas
			const mostUsedTemplates =
				await this.usageLogRepository.getMostUsedTemplates(
					undefined,
					undefined,
					1000 // Obtener muchas para calcular totales
				);
			const totalUsageCount = mostUsedTemplates.reduce(
				(sum, template) => sum + template.usageCount,
				0
			);

			// Calcular usuarios activos únicos del último mes
			const oneMonthAgo = new Date();
			oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

			// Obtener logs del último mes para contar usuarios únicos
			const recentLogs = await this.usageLogRepository.getMostUsedTemplates(
				undefined,
				"month",
				1000
			);

			// Como no tenemos método directo para usuarios únicos, estimamos
			const activeUsers = Math.floor(totalUsageCount * 0.1); // Estimación

			// Obtener total de promociones
			const promotionStats =
				await this.promotionRequestRepository.getStatistics();
			const totalPromotions = promotionStats.byStatus["approved"] || 0;

			return {
				totalPersonalTemplates,
				totalVerifiedTemplates,
				totalUsageCount,
				activeUsers,
				totalPromotions,
			};
		} catch (error) {
			console.error("Error obteniendo estadísticas generales:", error);
			return {
				totalPersonalTemplates: 0,
				totalVerifiedTemplates: 0,
				totalUsageCount: 0,
				activeUsers: 0,
				totalPromotions: 0,
			};
		}
	}

	private async getUsageStats(period: string) {
		try {
			// Obtener usage stats por períodos
			const [dailyUsage, weeklyUsage, monthlyUsage] = await Promise.all([
				this.usageLogRepository.getMostUsedTemplates(undefined, "day", 1000),
				this.usageLogRepository.getMostUsedTemplates(undefined, "week", 1000),
				this.usageLogRepository.getMostUsedTemplates(undefined, "month", 1000),
			]);

			const dailyCount = dailyUsage.reduce((sum, t) => sum + t.usageCount, 0);
			const weeklyCount = weeklyUsage.reduce((sum, t) => sum + t.usageCount, 0);
			const monthlyCount = monthlyUsage.reduce(
				(sum, t) => sum + t.usageCount,
				0
			);

			// Obtener plantillas personales para calcular categorías
			const personalTemplates = await this.userTemplateRepository.findAll({
				isActive: true,
			});

			// Calcular top categorías
			const categoryCount = new Map<string, number>();
			personalTemplates.templates.forEach((template) => {
				const count = categoryCount.get(template.category) || 0;
				categoryCount.set(template.category, count + 1);
			});

			const totalTemplates = personalTemplates.total;
			const topCategories = Array.from(categoryCount.entries())
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([category, count]) => ({
					category,
					count,
					percentage: Math.round((count / totalTemplates) * 100),
				}));

			const averageUsagePerTemplate =
				totalTemplates > 0 ? monthlyCount / totalTemplates : 0;

			return {
				dailyUsage: dailyCount,
				weeklyUsage: weeklyCount,
				monthlyUsage: monthlyCount,
				averageUsagePerTemplate:
					Math.round(averageUsagePerTemplate * 100) / 100,
				topCategories,
			};
		} catch (error) {
			console.error("Error obteniendo estadísticas de uso:", error);
			return {
				dailyUsage: 0,
				weeklyUsage: 0,
				monthlyUsage: 0,
				averageUsagePerTemplate: 0,
				topCategories: [],
			};
		}
	}

	private async getPromotionStats() {
		try {
			const stats = await this.promotionRequestRepository.getStatistics();

			return {
				pendingRequests: stats.byStatus["pending"] || 0,
				approvedRequests: stats.byStatus["approved"] || 0,
				rejectedRequests: stats.byStatus["rejected"] || 0,
				approvalRate: Math.round(stats.approvalRate * 100) / 100,
				averageProcessingTime:
					Math.round(stats.averageProcessingTime * 100) / 100,
			};
		} catch (error) {
			console.error("Error obteniendo estadísticas de promoción:", error);
			return {
				pendingRequests: 0,
				approvedRequests: 0,
				rejectedRequests: 0,
				approvalRate: 0,
				averageProcessingTime: 0,
			};
		}
	}

	private async getTrendingStats() {
		try {
			// Obtener top templates de cada tipo
			const [personalRankings, verifiedRankings] = await Promise.all([
				this.rankingRepository.getTrendingTemplates("weekly", "personal", 5),
				this.rankingRepository.getTrendingTemplates("weekly", "verified", 5),
			]);

			// Para plantillas personales, obtener detalles
			const topPersonalTemplates = await Promise.all(
				personalRankings.map(async (ranking) => {
					try {
						const template = await this.userTemplateRepository.findById(
							ranking.templateId
						);
						return {
							templateId: ranking.templateId,
							templateName: template?.name || "Plantilla no encontrada",
							authorName: template?.author.name || "Autor desconocido",
							usageCount: ranking.usageCount,
							trendScore: ranking.trendScore,
						};
					} catch {
						return {
							templateId: ranking.templateId,
							templateName: "Plantilla no encontrada",
							authorName: "Autor desconocido",
							usageCount: ranking.usageCount,
							trendScore: ranking.trendScore,
						};
					}
				})
			);

			// Para plantillas verificadas
			const topVerifiedTemplates = await Promise.all(
				verifiedRankings.map(async (ranking) => {
					try {
						const template = await this.calculationTemplateRepository.findById(
							ranking.templateId
						);
						return {
							templateId: ranking.templateId,
							templateName: template?.name || "Plantilla no encontrada",
							usageCount: ranking.usageCount,
							trendScore: ranking.trendScore,
						};
					} catch {
						return {
							templateId: ranking.templateId,
							templateName: "Plantilla no encontrada",
							usageCount: ranking.usageCount,
							trendScore: ranking.trendScore,
						};
					}
				})
			);

			return {
				topPersonalTemplates,
				topVerifiedTemplates,
			};
		} catch (error) {
			console.error("Error obteniendo estadísticas trending:", error);
			return {
				topPersonalTemplates: [],
				topVerifiedTemplates: [],
			};
		}
	}

	private async getAuthorStats() {
		try {
			// Obtener estadísticas de créditos
			const creditStats =
				await this.authorCreditRepository.getCreditStatistics();

			// Obtener top contribuidores
			const topContributors =
				await this.authorCreditRepository.getTopContributors("credits", 5);

			// Calcular autores únicos con promociones
			const totalAuthors = topContributors.length; // Simplificado
			const authorWithPromotions = topContributors.filter(
				(c) => c.value > 0
			).length;

			const topContributorsFormatted = topContributors.map((contributor) => ({
				authorId: contributor.authorId,
				authorName: contributor.authorName,
				totalCredits: contributor.value,
				totalPoints: 0, // No tenemos datos de puntos directos
			}));

			return {
				totalAuthors,
				authorWithPromotions,
				topContributors: topContributorsFormatted,
			};
		} catch (error) {
			console.error("Error obteniendo estadísticas de autores:", error);
			return {
				totalAuthors: 0,
				authorWithPromotions: 0,
				topContributors: [],
			};
		}
	}

	private async getTemporalStats(period: string) {
		try {
			// Obtener datos temporales de los últimos días/semanas/meses
			const days = period === "day" ? 7 : period === "week" ? 4 : 12;
			const creationTrend: Array<{
				date: string;
				personalTemplates: number;
				verifiedTemplates: number;
			}> = [];
			const usageTrend: Array<{date: string; usage: number}> = [];

			// Generar datos temporales simulados (en una implementación real obtendríamos de la BD)
			for (let i = days - 1; i >= 0; i--) {
				const date = new Date();
				date.setDate(date.getDate() - i);
				const dateStr = date.toISOString().split("T")[0];

				// Datos simulados basados en la posición en el tiempo
				const personalTemplates = Math.floor(Math.random() * 10) + 1;
				const verifiedTemplates = Math.floor(Math.random() * 3) + 1;
				const usage = Math.floor(Math.random() * 50) + 10;

				creationTrend.push({
					date: dateStr,
					personalTemplates,
					verifiedTemplates,
				});

				usageTrend.push({
					date: dateStr,
					usage,
				});
			}

			return {
				creationTrend,
				usageTrend,
			};
		} catch (error) {
			console.error("Error obteniendo estadísticas temporales:", error);
			return {
				creationTrend: [],
				usageTrend: [],
			};
		}
	}
}
