// src/infrastructure/webserver/controllers/GlobalStatsController.ts
import {Request, Response} from "express";
import {RequestWithUser} from "../middlewares/authMiddleware";
import {handleError} from "../utils/errorHandler";
import {GetGlobalTemplateStatsUseCase} from "../../../application/calculation/GetGlobalTemplateStatsUseCase";
export class GlobalStatsController {
    constructor(
        private getGlobalTemplateStatsUseCase: GetGlobalTemplateStatsUseCase
    ) { }
    /**
     * GET /api/admin/stats/global
     * Obtiene estadísticas globales completas del sistema
     */
    async getGlobalStats(req: RequestWithUser, res: Response): Promise<void> {
        try {
            const { period = "month" } = req.query;

            if (!["day", "week", "month", "year"].includes(period as string)) {
                res.status(400).json({
                    success: false,
                    message: "period debe ser 'day', 'week', 'month' o 'year'",
                });
                return;
            }

            const globalStats = await this.getGlobalTemplateStatsUseCase.execute(
                period as string
            );

            res.status(200).json({
                success: true,
                data: globalStats,
                meta: {
                    period,
                    generatedAt: new Date(),
                    userId: req.user?.id,
                },
            });
        } catch (error) {
            const typedError = handleError(error);
            console.error("Error obteniendo estadísticas globales:", typedError);

            res.status(500).json({
                success: false,
                message: typedError.message || "Error obteniendo estadísticas globales",
            });
        }
    }

    /**
     * GET /api/admin/stats/templates
     * Obtiene estadísticas específicas de plantillas
     */
    async getTemplateStats(req: RequestWithUser, res: Response): Promise<void> {
        try {
            const { period = "month" } = req.query;

            const globalStats = await this.getGlobalTemplateStatsUseCase.execute(
                period as string
            );

            // Extraer solo estadísticas relacionadas con plantillas
            const templateStats = {
                overview: globalStats.overview,
                trending: globalStats.trending,
                temporal: globalStats.temporal,
            };

            res.status(200).json({
                success: true,
                data: templateStats,
                meta: {
                    period,
                    focus: "templates",
                    generatedAt: new Date(),
                },
            });
        } catch (error) {
            const typedError = handleError(error);
            console.error("Error obteniendo estadísticas de plantillas:", typedError);

            res.status(500).json({
                success: false,
                message: typedError.message || "Error obteniendo estadísticas de plantillas",
            });
        }
    }

    /**
     * GET /api/admin/stats/usage
     * Obtiene estadísticas específicas de uso
     */
    async getUsageStats(req: RequestWithUser, res: Response): Promise<void> {
        try {
            const { period = "month", detailed = "false" } = req.query;

            const globalStats = await this.getGlobalTemplateStatsUseCase.execute(
                period as string
            );

            let usageStats;
            if (detailed === "true") {
                // Estadísticas detalladas de uso
                usageStats = {
                    usage: globalStats.usage,
                    trends: globalStats.temporal,
                    breakdown: {
                        dailyAverage: Math.round(globalStats.usage.dailyUsage / 30), // Aproximación
                        weeklyGrowth: this.calculateGrowth(
                            globalStats.usage.weeklyUsage,
                            globalStats.usage.monthlyUsage
                        ),
                        topPerformingCategories: globalStats.usage.topCategories.slice(0, 3),
                    },
                };
            } else {
                // Estadísticas básicas de uso
                usageStats = {
                    usage: globalStats.usage,
                    summary: {
                        totalUsage: globalStats.usage.monthlyUsage,
                        averagePerTemplate: globalStats.usage.averageUsagePerTemplate,
                        growthTrend: "stable", // Simplificado
                    },
                };
            }

            res.status(200).json({
                success: true,
                data: usageStats,
                meta: {
                    period,
                    detailed: detailed === "true",
                    generatedAt: new Date(),
                },
            });
        } catch (error) {
            const typedError = handleError(error);
            console.error("Error obteniendo estadísticas de uso:", typedError);

            res.status(500).json({
                success: false,
                message: typedError.message || "Error obteniendo estadísticas de uso",
            });
        }
    }

    /**
     * GET /api/admin/stats/overview
     * Obtiene resumen rápido de estadísticas
     */
    async getStatsOverview(req: RequestWithUser, res: Response): Promise<void> {
        try {
            const globalStats = await this.getGlobalTemplateStatsUseCase.execute("month");

            const overview = {
                // Métricas clave
                keyMetrics: {
                    totalTemplates: globalStats.overview.totalPersonalTemplates + globalStats.overview.totalVerifiedTemplates,
                    totalUsage: globalStats.overview.totalUsageCount,
                    activeUsers: globalStats.overview.activeUsers,
                    promotionRequests: globalStats.promotion.pendingRequests,
                },
			
                // Estado del sistema
                systemHealth: {
                    templatesGrowth: this.calculatePercentage(
                        globalStats.overview.totalPersonalTemplates,
                        globalStats.overview.totalVerifiedTemplates
                    ),
                    usageGrowth: globalStats.usage.weeklyUsage > 0 ? "positive" : "stable",
                    promotionRate: globalStats.promotion.approvalRate,
                },

                // Top performers
                highlights: {
                    topPersonalTemplates: globalStats.trending.topPersonalTemplates.slice(0, 3),
                    topVerifiedTemplates: globalStats.trending.topVerifiedTemplates.slice(0, 3),
                    topCategories: globalStats.usage.topCategories.slice(0, 3),
                },
            };

            res.status(200).json({
                success: true,
                data: overview,
                meta: {
                    type: "overview",
                    generatedAt: new Date(),
                    period: "current",
                },
            });
        } catch (error) {
            const typedError = handleError(error);
            console.error("Error obteniendo overview de estadísticas:", typedError);

            res.status(500).json({
                success: false,
                message: typedError.message || "Error obteniendo overview de estadísticas",
            });
        }
    }

    /**
     * GET /api/admin/stats/export
     * Exporta estadísticas completas
     */
    async exportStats(req: RequestWithUser, res: Response): Promise<void> {
        try {
            const { period = "month", format = "json" } = req.query;

            if (!["json", "csv"].includes(format as string)) {
                res.status(400).json({
                    success: false,
                    message: "format debe ser 'json' o 'csv'",
                });
                return;
            }

            const globalStats = await this.getGlobalTemplateStatsUseCase.execute(
                period as string
            );

            // Agregar metadatos de exportación
            const exportData = {
                ...globalStats,
                exportMetadata: {
                    exportedAt: new Date(),
                    exportedBy: req.user?.id,
                    period: period as string,
                    format: format as string,
                    version: "1.0",
                },
            };

            if (format === "json") {
                res.setHeader("Content-Type", "application/json");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="global-stats-${period}-${new Date().toISOString().split('T')[0]}.json"`
                );

                res.status(200).json({
                    success: true,
                    data: exportData,
                });
            } else if (format === "csv") {
                // Para CSV, simplificar los datos
                const csvData = this.convertStatsToCSV(globalStats);
			
                res.setHeader("Content-Type", "text/csv");
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="global-stats-${period}-${new Date().toISOString().split('T')[0]}.csv"`
                );

                res.status(200).send(csvData);
            }
        } catch (error) {
            const typedError = handleError(error);
            console.error("Error exportando estadísticas:", typedError);

            res.status(500).json({
                success: false,
                message: typedError.message || "Error exportando estadísticas",
            });
        }
    }

    // === MÉTODOS PRIVADOS DE UTILIDAD ===
    private calculateGrowth(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    private calculatePercentage(part: number, total: number): number {
        if (total === 0) return 0;
        return Math.round((part / (part + total)) * 100);
    }

    private convertStatsToCSV(stats: any): string {
        const headers = [
            "Metric",
            "Value",
            "Category",
            "Period"
        ];

        const rows = [
            ["Total Personal Templates", stats.overview.totalPersonalTemplates, "Overview", "Current"],
            ["Total Verified Templates", stats.overview.totalVerifiedTemplates, "Overview", "Current"],
            ["Total Usage Count", stats.overview.totalUsageCount, "Overview", "Current"],
            ["Active Users", stats.overview.activeUsers, "Overview", "Current"],
            ["Daily Usage", stats.usage.dailyUsage, "Usage", "Daily"],
            ["Weekly Usage", stats.usage.weeklyUsage, "Usage", "Weekly"],
            ["Monthly Usage", stats.usage.monthlyUsage, "Usage", "Monthly"],
            ["Pending Promotions", stats.promotion.pendingRequests, "Promotion", "Current"],
            ["Approved Promotions", stats.promotion.approvedRequests, "Promotion", "Current"],
            ["Approval Rate", stats.promotion.approvalRate, "Promotion", "Current"],
        ];

        // Convertir a CSV
        let csv = headers.join(",") + "\n";
        rows.forEach(row => {
            csv += row.map(field => `"${field}"`).join(",") + "\n";
        });

        return csv;
    }
}