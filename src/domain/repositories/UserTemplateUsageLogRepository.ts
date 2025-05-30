// src/domain/repositories/UserTemplateUsageLogRepository.ts
import {
	CreateUsageLogDTO,
	UsageAnalytics,
	TemplateUsageStats,
} from "../models/tracking/UsageLog";

export interface UserTemplateUsageLogRepository {
	/**
	 * Crea un nuevo log de uso
	 */
	create(logData: CreateUsageLogDTO): Promise<string>;

	/**
	 * Encuentra logs por plantilla
	 */
	findByTemplate(
		templateId: string,
		templateType: "personal" | "verified",
		startDate?: Date,
		endDate?: Date
	): Promise<any[]>;

	/**
	 * Encuentra logs por usuario
	 */
	findByUser(userId: string, startDate?: Date, endDate?: Date): Promise<any[]>;

	/**
	 * Obtiene analytics de uso
	 */
	getUsageAnalytics(
		templateId: string,
		templateType: "personal" | "verified",
		period: "day" | "week" | "month" | "year",
		startDate: Date,
		endDate: Date
	): Promise<UsageAnalytics>;

	/**
	 * Obtiene estadísticas de una plantilla
	 */
	getTemplateStats(
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<TemplateUsageStats>;

	/**
	 * Obtiene plantillas más usadas
	 */
	getMostUsedTemplates(
		templateType?: "personal" | "verified",
		period?: "day" | "week" | "month",
		limit?: number
	): Promise<
		Array<{templateId: string; templateType: string; usageCount: number}>
	>;

	/**
	 * Elimina logs antiguos
	 */
	deleteOldLogs(olderThanDays: number): Promise<number>;
}
