// src/application/calculation/GetAdminDashboardDataUseCase.ts
import {PromotionRequestRepository} from "../../domain/repositories/PromotionRequestRepository";
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {TemplateRankingRepository} from "../../domain/repositories/TemplateRankingRepository";
import {UserTemplateUsageLogRepository} from "../../domain/repositories/UserTemplateUsageLogRepository";
import {AuthorCreditRepository} from "../../domain/repositories/AuthorCreditRepository";
import {GetGlobalTemplateStatsUseCase} from "./GetGlobalTemplateStatsUseCase";

export interface AdminDashboardData {
	summary: {
		pendingPromotions: number;
		todayUsage: number;
		newTemplatesThisWeek: number;
		activeAuthors: number;
	};
	promotionRequests: {
		pending: any[];
		highPriority: any[];
		recentlyProcessed: any[];
		workloadDistribution: Array<{
			reviewerId: string;
			reviewerName: string;
			pending: number;
			completed: number;
			averageTime: number;
		}>;
	};
	templates: {
		promotionCandidates: Array<{
			templateId: string;
			templateName: string;
			authorName: string;
			usageCount: number;
			successRate: number;
			trendScore: number;
			qualityScore: number;
		}>;
		recentlyPromoted: Array<{
			templateId: string;
			verifiedTemplateId: string;
			templateName: string;
			authorName: string;
			promotionDate: Date;
		}>;
	};
	analytics: {
		usageTrends: Array<{
			date: string;
			personalUsage: number;
			verifiedUsage: number;
		}>;
		topCategories: Array<{
			category: string;
			personalCount: number;
			verifiedCount: number;
			totalUsage: number;
		}>;
		qualityMetrics: {
			averageSuccessRate: number;
			averageRating: number;
			totalFeedback: number;
		};
	};
	alerts: Array<{
		type: "warning" | "info" | "success" | "error";
		title: string;
		message: string;
		actionUrl?: string;
		timestamp: Date;
	}>;
}

export class GetAdminDashboardDataUseCase {
	constructor(
		private promotionRequestRepository: PromotionRequestRepository,
		private userTemplateRepository: UserCalculationTemplateRepository,
		private calculationTemplateRepository: CalculationTemplateRepository,
		private rankingRepository: TemplateRankingRepository,
		private usageLogRepository: UserTemplateUsageLogRepository,
		private authorCreditRepository: AuthorCreditRepository,
		private globalStatsUseCase: GetGlobalTemplateStatsUseCase
	) {}

	async execute(): Promise<AdminDashboardData> {
		const [summary, promotionRequests, templates, analytics, alerts] =
			await Promise.all([
				this.getSummaryData(),
				this.getPromotionRequestsData(),
				this.getTemplatesData(),
				this.getAnalyticsData(),
				this.generateAlerts(),
			]);

		return {
			summary,
			promotionRequests,
			templates,
			analytics,
			alerts,
		};
	}

	private async getSummaryData() {
		try {
			// Obtener solicitudes pendientes
			const pendingRequests =
				await this.promotionRequestRepository.findPending();
			const pendingPromotions = pendingRequests.length;

			// Obtener uso de hoy
			const todayUsage = await this.getTodayUsage();

			// Obtener plantillas nuevas de esta semana
			const newTemplatesThisWeek = await this.getNewTemplatesThisWeek();

			// Obtener autores activos (simplificado)
			const activeAuthors = await this.getActiveAuthorsCount();

			return {
				pendingPromotions,
				todayUsage,
				newTemplatesThisWeek,
				activeAuthors,
			};
		} catch (error) {
			console.error("Error obteniendo datos de resumen:", error);
			return {
				pendingPromotions: 0,
				todayUsage: 0,
				newTemplatesThisWeek: 0,
				activeAuthors: 0,
			};
		}
	}

	private async getPromotionRequestsData() {
		try {
			// Obtener solicitudes pendientes
			const pending = await this.promotionRequestRepository.findPending();

			// Obtener solicitudes de alta prioridad
			const highPriority =
				await this.promotionRequestRepository.findHighPriority();

			// Obtener solicitudes procesadas recientemente
			const allRequests = await this.promotionRequestRepository.findAll();
			const recentlyProcessed = allRequests
				.filter(
					(req) =>
						req.reviewedAt &&
						new Date(req.reviewedAt).getTime() >
							Date.now() - 7 * 24 * 60 * 60 * 1000
				)
				.slice(0, 10);

			// Obtener distribución de carga de trabajo
			const workloadDistribution =
				await this.promotionRequestRepository.getWorkloadByReviewer();

			return {
				pending: pending.slice(0, 10), // Últimas 10
				highPriority: highPriority.slice(0, 5), // Últimas 5
				recentlyProcessed,
				workloadDistribution,
			};
		} catch (error) {
			console.error("Error obteniendo datos de promoción:", error);
			return {
				pending: [],
				highPriority: [],
				recentlyProcessed: [],
				workloadDistribution: [],
			};
		}
	}

	private async getTemplatesData() {
		try {
			// Obtener candidatos para promoción
			const promotionCandidates = await this.getPromotionCandidates();

			// Obtener plantillas recientemente promovidas
			const recentlyPromoted = await this.getRecentlyPromotedTemplates();

			return {
				promotionCandidates,
				recentlyPromoted,
			};
		} catch (error) {
			console.error("Error obteniendo datos de plantillas:", error);
			return {
				promotionCandidates: [],
				recentlyPromoted: [],
			};
		}
	}

	private async getAnalyticsData() {
		try {
			// Obtener tendencias de uso de los últimos 7 días
			const usageTrends = await this.getUsageTrends();

			// Obtener top categorías
			const topCategories = await this.getTopCategories();

			// Obtener métricas de calidad
			const qualityMetrics = await this.getQualityMetrics();

			return {
				usageTrends,
				topCategories,
				qualityMetrics,
			};
		} catch (error) {
			console.error("Error obteniendo datos de analytics:", error);
			return {
				usageTrends: [],
				topCategories: [],
				qualityMetrics: {
					averageSuccessRate: 0,
					averageRating: 0,
					totalFeedback: 0,
				},
			};
		}
	}

	private async generateAlerts() {
		const alerts: AdminDashboardData["alerts"] = [];

		try {
			// Alert por solicitudes pendientes de alta prioridad
			const highPriorityRequests =
				await this.promotionRequestRepository.findHighPriority();
			if (highPriorityRequests.length > 0) {
				alerts.push({
					type: "warning",
					title: "Solicitudes de Alta Prioridad",
					message: `Hay ${highPriorityRequests.length} solicitudes de promoción de alta prioridad pendientes`,
					actionUrl: "/admin/promotion-requests?priority=high",
					timestamp: new Date(),
				});
			}

			// Alert por plantillas con muchos usos sin promoción
			const promotionCandidates = await this.getPromotionCandidates();
			const highUsageCandidates = promotionCandidates.filter(
				(c) => c.usageCount > 100
			);
			if (highUsageCandidates.length > 0) {
				alerts.push({
					type: "info",
					title: "Candidatos para Promoción",
					message: `${highUsageCandidates.length} plantillas personales tienen alto uso y podrían ser promovidas`,
					actionUrl: "/admin/promotion-candidates",
					timestamp: new Date(),
				});
			}

			// Alert por nuevas plantillas verificadas
			const recentlyPromoted = await this.getRecentlyPromotedTemplates();
			if (recentlyPromoted.length > 0) {
				alerts.push({
					type: "success",
					title: "Nuevas Plantillas Verificadas",
					message: `${recentlyPromoted.length} plantillas han sido promovidas recientemente`,
					actionUrl: "/admin/recently-promoted",
					timestamp: new Date(),
				});
			}

			// Alert por uso alto del sistema
			const todayUsage = await this.getTodayUsage();
			if (todayUsage > 1000) {
				alerts.push({
					type: "success",
					title: "Alto Uso del Sistema",
					message: `El sistema ha registrado ${todayUsage} usos hoy`,
					timestamp: new Date(),
				});
			}
		} catch (error) {
			console.error("Error generando alertas:", error);
			alerts.push({
				type: "error",
				title: "Error del Sistema",
				message: "Hubo un error al cargar algunas métricas del dashboard",
				timestamp: new Date(),
			});
		}

		return alerts;
	}

	// === MÉTODOS HELPER PRIVADOS ===

	private async getTodayUsage(): Promise<number> {
		try {
			const dailyUsage = await this.usageLogRepository.getMostUsedTemplates(
				undefined,
				"day",
				1000
			);
			return dailyUsage.reduce((sum, template) => sum + template.usageCount, 0);
		} catch {
			return 0;
		}
	}

	private async getNewTemplatesThisWeek(): Promise<number> {
		try {
			const oneWeekAgo = new Date();
			oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

			const personalTemplates = await this.userTemplateRepository.findAll({
				isActive: true,
			});

			// Filtrar las creadas esta semana
			const newThisWeek = personalTemplates.templates.filter(
				(template) => new Date(template.createdAt) >= oneWeekAgo
			);

			return newThisWeek.length;
		} catch {
			return 0;
		}
	}

	private async getActiveAuthorsCount(): Promise<number> {
		try {
			const credits = await this.authorCreditRepository.getCreditStatistics();
			return credits.total; // Simplificado
		} catch {
			return 0;
		}
	}

	private async getPromotionCandidates() {
		try {
			// Obtener plantillas trending que podrían ser candidatas
			const trendingPersonal =
				await this.rankingRepository.getTrendingTemplates(
					"weekly",
					"personal",
					20
				);

			const candidates = await Promise.all(
				trendingPersonal.map(async (ranking) => {
					try {
						const template = await this.userTemplateRepository.findById(
							ranking.templateId
						);
						if (!template) return null;

						// Calcular quality score basado en métricas
						const qualityScore = this.calculateQualityScore({
							usageCount: ranking.usageCount,
							successRate: ranking.successRate,
							trendScore: ranking.trendScore,
						});

						return {
							templateId: ranking.templateId,
							templateName: template.name,
							authorName: template.author.name,
							usageCount: ranking.usageCount,
							successRate: ranking.successRate,
							trendScore: ranking.trendScore,
							qualityScore,
						};
					} catch {
						return null;
					}
				})
			);

			return candidates.filter(Boolean).slice(0, 10);
		} catch {
			return [];
		}
	}

	private async getRecentlyPromotedTemplates() {
		try {
			// Obtener créditos recientes (últimas 2 semanas)
			const recentCredits =
				await this.authorCreditRepository.findRecentCredits(14);

			const recentlyPromoted = await Promise.all(
				recentCredits.map(async (credit) => {
					try {
						const personalTemplate = await this.userTemplateRepository.findById(
							credit.originalPersonalTemplateId
						);
						const verifiedTemplate =
							await this.calculationTemplateRepository.findById(
								credit.verifiedTemplateId
							);

						if (!personalTemplate || !verifiedTemplate) return null;

						return {
							templateId: credit.originalPersonalTemplateId,
							verifiedTemplateId: credit.verifiedTemplateId,
							templateName: verifiedTemplate.name,
							authorName: personalTemplate.author.name,
							promotionDate: credit.createdAt,
						};
					} catch {
						return null;
					}
				})
			);

			return recentlyPromoted.filter(Boolean).slice(0, 5);
		} catch {
			return [];
		}
	}

	private async getUsageTrends() {
		try {
			const trends = [];
			for (let i = 6; i >= 0; i--) {
				const date = new Date();
				date.setDate(date.getDate() - i);

				// Simulación de datos (en implementación real obtendríamos de BD)
				trends.push({
					date: date.toISOString().split("T")[0],
					personalUsage: Math.floor(Math.random() * 100) + 50,
					verifiedUsage: Math.floor(Math.random() * 200) + 100,
				});
			}
			return trends;
		} catch {
			return [];
		}
	}

	private async getTopCategories() {
		try {
			// Obtener plantillas personales agrupadas por categoría
			const personalTemplates = await this.userTemplateRepository.findAll({
				isActive: true,
			});

			const categoryStats = new Map<
				string,
				{personalCount: number; verifiedCount: number; totalUsage: number}
			>();

			personalTemplates.templates.forEach((template) => {
				const stats = categoryStats.get(template.category) || {
					personalCount: 0,
					verifiedCount: 0,
					totalUsage: 0,
				};
				stats.personalCount++;
				stats.totalUsage += template.usageCount;
				categoryStats.set(template.category, stats);
			});

			return Array.from(categoryStats.entries())
				.map(([category, stats]) => ({
					category,
					...stats,
				}))
				.sort((a, b) => b.totalUsage - a.totalUsage)
				.slice(0, 5);
		} catch {
			return [];
		}
	}

	private async getQualityMetrics() {
		try {
			// Obtener métricas de calidad globales
			const globalStats = await this.globalStatsUseCase.execute();

			return {
				averageSuccessRate: 85.5, // Simulado
				averageRating: 4.2, // Simulado
				totalFeedback: globalStats.usage.monthlyUsage,
			};
		} catch {
			return {
				averageSuccessRate: 0,
				averageRating: 0,
				totalFeedback: 0,
			};
		}
	}

	private calculateQualityScore(metrics: {
		usageCount: number;
		successRate: number;
		trendScore: number;
	}): number {
		// Algoritmo simple de calidad
		const usageScore = Math.min(metrics.usageCount / 100, 1) * 4; // 0-4 puntos
		const successScore = (metrics.successRate / 100) * 3; // 0-3 puntos
		const trendScorePoints = (metrics.trendScore / 100) * 3; // 0-3 puntos

		return (
			Math.round((usageScore + successScore + trendScorePoints) * 100) / 100
		);
	}
}
