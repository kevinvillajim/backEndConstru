// src/infrastructure/database/repositories/TypeOrmUserTemplateUsageLogRepository.ts
import {Repository, Between, MoreThan} from "typeorm";
import {AppDataSource} from "../data-source";
import {UserTemplateUsageLogRepository} from "../../../domain/repositories/UserTemplateUsageLogRepository";
import {
	UserTemplateUsageLogEntity,
	TemplateType,
} from "../entities/UserTemplateUsageLogEntity";
import {
	CreateUsageLogDTO,
	UsageAnalytics,
	TemplateUsageStats,
} from "../../../domain/models/tracking/UsageLog";

export class TypeOrmUserTemplateUsageLogRepository
	implements UserTemplateUsageLogRepository
{
	private repository: Repository<UserTemplateUsageLogEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(UserTemplateUsageLogEntity);
	}

	async create(logData: CreateUsageLogDTO): Promise<string> {
		const logEntity = this.repository.create({
			templateId: logData.templateId,
			templateType: logData.templateType as TemplateType,
			userId: logData.userId,
			projectId: logData.projectId,
			calculationResultId: logData.calculationResultId,
			usageDate: logData.usageDate || new Date(),
			executionTimeMs: logData.executionTimeMs,
			wasSuccessful: logData.wasSuccessful,
			ipAddress: logData.ipAddress,
			userAgent: logData.userAgent,
			inputParameters: logData.inputParameters,
			outputResults: logData.outputResults,
			errorMessage: logData.errorMessage,
		});

		const savedLog = await this.repository.save(logEntity);
		return savedLog.id;
	}

	async findByTemplate(
		templateId: string,
		templateType: "personal" | "verified",
		startDate?: Date,
		endDate?: Date
	): Promise<UserTemplateUsageLogEntity[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("log")
			.leftJoinAndSelect("log.user", "user")
			.leftJoinAndSelect("log.project", "project")
			.where("log.templateId = :templateId", {templateId})
			.andWhere("log.templateType = :templateType", {templateType});

		if (startDate && endDate) {
			queryBuilder = queryBuilder.andWhere(
				"log.usageDate BETWEEN :startDate AND :endDate",
				{
					startDate,
					endDate,
				}
			);
		} else if (startDate) {
			queryBuilder = queryBuilder.andWhere("log.usageDate >= :startDate", {
				startDate,
			});
		}

		return queryBuilder.orderBy("log.usageDate", "DESC").getMany();
	}

	async findByUser(
		userId: string,
		startDate?: Date,
		endDate?: Date
	): Promise<UserTemplateUsageLogEntity[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("log")
			.where("log.userId = :userId", {userId});

		if (startDate && endDate) {
			queryBuilder = queryBuilder.andWhere(
				"log.usageDate BETWEEN :startDate AND :endDate",
				{
					startDate,
					endDate,
				}
			);
		}

		return queryBuilder.orderBy("log.usageDate", "DESC").getMany();
	}

	async getUsageAnalytics(
		templateId: string,
		templateType: "personal" | "verified",
		period: "day" | "week" | "month" | "year",
		startDate: Date,
		endDate: Date
	): Promise<UsageAnalytics> {
		const logs = await this.findByTemplate(
			templateId,
			templateType,
			startDate,
			endDate
		);

		const totalUsage = logs.length;
		const uniqueUsers = new Set(logs.map((log) => log.userId)).size;
		const successfulUsage = logs.filter((log) => log.wasSuccessful).length;
		const successRate =
			totalUsage > 0 ? (successfulUsage / totalUsage) * 100 : 0;

		const executionTimes = logs
			.filter((log) => log.wasSuccessful && log.executionTimeMs > 0)
			.map((log) => log.executionTimeMs);

		const averageExecutionTime =
			executionTimes.length > 0
				? executionTimes.reduce((sum, time) => sum + time, 0) /
					executionTimes.length
				: 0;

		// Calcular datos por período
		const periodData = this.groupByPeriod(logs, period);

		return {
			templateId,
			templateType,
			period: {
				start: startDate,
				end: endDate,
				type: period,
			},
			metrics: {
				totalUsage,
				uniqueUsers,
				successRate,
				averageExecutionTime,
				totalErrors: totalUsage - successfulUsage,
			},
			periodData,
			trends: this.calculateTrends(periodData),
		};
	}

	async getTemplateStats(
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<TemplateUsageStats> {
		const [
			totalUsage,
			uniqueUsers,
			recentUsage,
			avgExecutionTime,
			successRate,
		] = await Promise.all([
			this.repository.count({
				where: {templateId, templateType: templateType as TemplateType},
			}),
			this.repository
				.createQueryBuilder("log")
				.select("COUNT(DISTINCT log.userId)", "count")
				.where("log.templateId = :templateId", {templateId})
				.andWhere("log.templateType = :templateType", {templateType})
				.getRawOne()
				.then((result) => parseInt(result.count)),
			this.repository.count({
				where: {
					templateId,
					templateType: templateType as TemplateType,
					usageDate: MoreThan(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
				},
			}),
			this.repository
				.createQueryBuilder("log")
				.select("AVG(log.executionTimeMs)", "avg")
				.where("log.templateId = :templateId", {templateId})
				.andWhere("log.templateType = :templateType", {templateType})
				.andWhere("log.wasSuccessful = :successful", {successful: true})
				.getRawOne()
				.then((result) => parseFloat(result.avg) || 0),
			this.calculateSuccessRate(templateId, templateType),
		]);

		return {
			templateId,
			templateType,
			totalUsage,
			uniqueUsers,
			recentUsage,
			averageExecutionTime: avgExecutionTime,
			successRate,
			lastUsed: await this.getLastUsageDate(templateId, templateType),
			trending: this.calculateTrendingScore(
				totalUsage,
				recentUsage,
				uniqueUsers
			),
		};
	}

	async getMostUsedTemplates(
		templateType?: "personal" | "verified",
		period?: "day" | "week" | "month",
		limit: number = 10
	): Promise<
		Array<{templateId: string; templateType: string; usageCount: number}>
	> {
		let queryBuilder = this.repository
			.createQueryBuilder("log")
			.select("log.templateId", "templateId")
			.addSelect("log.templateType", "templateType")
			.addSelect("COUNT(*)", "usageCount")
			.groupBy("log.templateId")
			.addGroupBy("log.templateType")
			.orderBy("usageCount", "DESC")
			.limit(limit);

		if (templateType) {
			queryBuilder = queryBuilder.where("log.templateType = :templateType", {
				templateType,
			});
		}

		if (period) {
			const startDate = this.getPeriodStartDate(period);
			queryBuilder = queryBuilder.andWhere("log.usageDate >= :startDate", {
				startDate,
			});
		}

		return queryBuilder.getRawMany();
	}

	async deleteOldLogs(olderThanDays: number): Promise<number> {
		const cutoffDate = new Date(
			Date.now() - olderThanDays * 24 * 60 * 60 * 1000
		);

		const result = await this.repository.delete({
			usageDate: MoreThan(cutoffDate) as any,
		});

		return result.affected || 0;
	}

	// === MÉTODOS PRIVADOS ===
	private groupByPeriod(
		logs: UserTemplateUsageLogEntity[],
		period: "day" | "week" | "month" | "year"
	): Array<{date: string; count: number; uniqueUsers: number}> {
		const groups = new Map<string, {count: number; users: Set<string>}>();

		logs.forEach((log) => {
			const key = this.getPeriodKey(log.usageDate, period);
			if (!groups.has(key)) {
				groups.set(key, {count: 0, users: new Set()});
			}
			const group = groups.get(key)!;
			group.count++;
			group.users.add(log.userId);
		});

		return Array.from(groups.entries())
			.map(([date, data]) => ({
				date,
				count: data.count,
				uniqueUsers: data.users.size,
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
	}

	private getPeriodKey(
		date: Date,
		period: "day" | "week" | "month" | "year"
	): string {
		const d = new Date(date);
		switch (period) {
			case "day":
				return d.toISOString().split("T")[0];
			case "week":
				const weekStart = new Date(d);
				weekStart.setDate(d.getDate() - d.getDay());
				return weekStart.toISOString().split("T")[0];
			case "month":
				return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
			case "year":
				return String(d.getFullYear());
			default:
				return d.toISOString().split("T")[0];
		}
	}

	private calculateTrends(
		periodData: Array<{date: string; count: number; uniqueUsers: number}>
	): { growth: number; trend: "stable" | "growing" | "declining" } {
		if (periodData.length < 2) return {growth: 0, trend: "stable"};

		const recent = periodData.slice(-3);
		const older = periodData.slice(-6, -3);

		const recentAvg =
			recent.reduce((sum, item) => sum + item.count, 0) / recent.length;
		const olderAvg =
			older.reduce((sum, item) => sum + item.count, 0) / older.length;

		const growth = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

		return {
			growth,
			trend: growth > 10 ? "growing" : growth < -10 ? "declining" : "stable" as "stable" | "growing" | "declining",
		};
	}

	private async calculateSuccessRate(
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<number> {
		const [total, successful] = await Promise.all([
			this.repository.count({
				where: {templateId, templateType: templateType as TemplateType},
			}),
			this.repository.count({
				where: {
					templateId,
					templateType: templateType as TemplateType,
					wasSuccessful: true,
				},
			}),
		]);

		return total > 0 ? (successful / total) * 100 : 0;
	}

	private async getLastUsageDate(
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<Date | null> {
		const lastLog = await this.repository.findOne({
			where: {templateId, templateType: templateType as TemplateType},
			order: {usageDate: "DESC"},
		});

		return lastLog?.usageDate || null;
	}

	private calculateTrendingScore(
		totalUsage: number,
		recentUsage: number,
		uniqueUsers: number
	): number {
		// Score simple basado en uso reciente vs total y usuarios únicos
		const recencyFactor = totalUsage > 0 ? recentUsage / totalUsage : 0;
		const userDiversityFactor = totalUsage > 0 ? uniqueUsers / totalUsage : 0;

		return (recencyFactor * 0.6 + userDiversityFactor * 0.4) * 100;
	}

	private getPeriodStartDate(period: "day" | "week" | "month"): Date {
		const now = new Date();
		switch (period) {
			case "day":
				return new Date(now.getTime() - 24 * 60 * 60 * 1000);
			case "week":
				return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			case "month":
				return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			default:
				return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		}
	}
}
