// src/infrastructure/database/repositories/TypeOrmTemplateRankingRepository.ts
import {Repository, Between, LessThanOrEqual, MoreThanOrEqual} from "typeorm";
import {AppDataSource} from "../data-source";
import {TemplateRankingRepository} from "../../../domain/repositories/TemplateRankingRepository";
import {
	TemplateRankingEntity,
	RankingPeriod,
	TemplateTypeRanking,
} from "../entities/TemplateRankingEntity";
import {
	CreateRankingDTO,
	UpdateRankingDTO,
	RankingData,
	TrendingTemplate,
} from "../../../domain/models/tracking/TemplateRanking";

export class TypeOrmTemplateRankingRepository
	implements TemplateRankingRepository
{
	private repository: Repository<TemplateRankingEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(TemplateRankingEntity);
	}

	async create(rankingData: CreateRankingDTO): Promise<TemplateRankingEntity> {
		const entity = this.repository.create({
			templateId: rankingData.templateId,
			templateType: rankingData.templateType as TemplateTypeRanking,
			period: rankingData.period as RankingPeriod,
			periodStart: rankingData.periodStart,
			periodEnd: rankingData.periodEnd,
			usageCount: rankingData.usageCount,
			uniqueUsers: rankingData.uniqueUsers,
			successRate: rankingData.successRate,
			averageExecutionTime: rankingData.averageExecutionTime,
			rankPosition: rankingData.rankPosition || 0,
			trendScore: rankingData.trendScore || 0,
			growthRate: rankingData.growthRate || 0,
			averageRating: rankingData.averageRating || 0,
			totalRatings: rankingData.totalRatings || 0,
			favoriteCount: rankingData.favoriteCount || 0,
			weightedScore: rankingData.weightedScore || 0,
			velocityScore: rankingData.velocityScore || 0,
		});

		return await this.repository.save(entity);
	}

	async update(
		id: string,
		updateData: UpdateRankingDTO
	): Promise<TemplateRankingEntity | null> {
		const ranking = await this.repository.findOne({where: {id}});
		if (!ranking) return null;

		Object.assign(ranking, updateData);
		return await this.repository.save(ranking);
	}

	async findByPeriod(
		period: "daily" | "weekly" | "monthly" | "yearly",
		periodStart: Date,
		templateType?: "personal" | "verified",
		limit?: number
	): Promise<TemplateRankingEntity[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("ranking")
			.where("ranking.period = :period", {period})
			.andWhere("ranking.periodStart = :periodStart", {periodStart})
			.orderBy("ranking.rankPosition", "ASC");

		if (templateType) {
			queryBuilder = queryBuilder.andWhere(
				"ranking.templateType = :templateType",
				{
					templateType,
				}
			);
		}

		if (limit) {
			queryBuilder = queryBuilder.limit(limit);
		}

		return queryBuilder.getMany();
	}

	async findByTemplate(
		templateId: string,
		templateType: "personal" | "verified",
		period?: "daily" | "weekly" | "monthly" | "yearly",
		limit?: number
	): Promise<TemplateRankingEntity[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("ranking")
			.where("ranking.templateId = :templateId", {templateId})
			.andWhere("ranking.templateType = :templateType", {templateType})
			.orderBy("ranking.periodStart", "DESC");

		if (period) {
			queryBuilder = queryBuilder.andWhere("ranking.period = :period", {
				period,
			});
		}

		if (limit) {
			queryBuilder = queryBuilder.limit(limit);
		}

		return queryBuilder.getMany();
	}

	async getCurrentRanking(
		period: "daily" | "weekly" | "monthly" | "yearly",
		templateType?: "personal" | "verified",
		limit: number = 10
	): Promise<TemplateRankingEntity[]> {
		const now = new Date();
		const periodStart = this.getPeriodStart(now, period);

		return this.findByPeriod(period, periodStart, templateType, limit);
	}

	async getTrendingTemplates(
		period: "daily" | "weekly" | "monthly" | "yearly",
		templateType?: "personal" | "verified",
		limit: number = 10
	): Promise<TrendingTemplate[]> {
		const rankings = await this.getCurrentRanking(period, templateType, limit);

		return rankings.map((ranking) => ({
			templateId: ranking.templateId,
			templateType: ranking.templateType,
			rankPosition: ranking.rankPosition,
			trendScore: ranking.trendScore,
			usageCount: ranking.usageCount,
			uniqueUsers: ranking.uniqueUsers,
			successRate: ranking.successRate,
			growthRate: ranking.growthRate,
			averageRating: ranking.averageRating,
			period: {
				type: ranking.period,
				start: ranking.periodStart,
				end: ranking.periodEnd,
			},
		}));
	}

	async getRankingHistory(
		templateId: string,
		templateType: "personal" | "verified",
		period: "daily" | "weekly" | "monthly" | "yearly",
		months: number = 6
	): Promise<Array<{date: Date; position: number; score: number}>> {
		const endDate = new Date();
		const startDate = new Date();
		startDate.setMonth(startDate.getMonth() - months);

		const rankings = await this.repository.find({
			where: {
				templateId,
				templateType: templateType as TemplateTypeRanking,
				period: period as RankingPeriod,
				periodStart: Between(startDate, endDate),
			},
			order: {periodStart: "ASC"},
		});

		return rankings.map((ranking) => ({
			date: ranking.periodStart,
			position: ranking.rankPosition,
			score: ranking.trendScore,
		}));
	}

	async bulkUpsert(rankings: CreateRankingDTO[]): Promise<void> {
		for (const rankingData of rankings) {
			// Buscar si ya existe
			const existing = await this.repository.findOne({
				where: {
					templateId: rankingData.templateId,
					templateType: rankingData.templateType as TemplateTypeRanking,
					period: rankingData.period as RankingPeriod,
					periodStart: rankingData.periodStart,
				},
			});

			if (existing) {
				// Actualizar existente
				Object.assign(existing, rankingData);
				await this.repository.save(existing);
			} else {
				// Crear nuevo
				await this.create(rankingData);
			}
		}
	}

	async calculateAndUpdateRanks(
		period: "daily" | "weekly" | "monthly" | "yearly",
		periodStart: Date,
		templateType?: "personal" | "verified"
	): Promise<void> {
		let queryBuilder = this.repository
			.createQueryBuilder("ranking")
			.where("ranking.period = :period", {period})
			.andWhere("ranking.periodStart = :periodStart", {periodStart})
			.orderBy("ranking.trendScore", "DESC")
			.addOrderBy("ranking.usageCount", "DESC")
			.addOrderBy("ranking.uniqueUsers", "DESC");

		if (templateType) {
			queryBuilder = queryBuilder.andWhere(
				"ranking.templateType = :templateType",
				{
					templateType,
				}
			);
		}

		const rankings = await queryBuilder.getMany();

		// Actualizar posiciones
		for (let i = 0; i < rankings.length; i++) {
			rankings[i].rankPosition = i + 1;
		}

		await this.repository.save(rankings);
	}

	async getTopPerformers(
		period: "daily" | "weekly" | "monthly" | "yearly",
		metric: "usage" | "users" | "rating" | "trend",
		limit: number = 5
	): Promise<RankingData[]> {
		const now = new Date();
		const periodStart = this.getPeriodStart(now, period);

		let orderBy: string;
		switch (metric) {
			case "usage":
				orderBy = "ranking.usageCount";
				break;
			case "users":
				orderBy = "ranking.uniqueUsers";
				break;
			case "rating":
				orderBy = "ranking.averageRating";
				break;
			case "trend":
			default:
				orderBy = "ranking.trendScore";
				break;
		}

		const rankings = await this.repository
			.createQueryBuilder("ranking")
			.where("ranking.period = :period", {period})
			.andWhere("ranking.periodStart = :periodStart", {periodStart})
			.orderBy(orderBy, "DESC")
			.limit(limit)
			.getMany();

		return rankings.map((ranking) => this.toRankingData(ranking));
	}

	async getCompetitionAnalysis(
		templateId: string,
		templateType: "personal" | "verified",
		period: "daily" | "weekly" | "monthly" | "yearly"
	): Promise<{
		currentRank: number;
		totalCompetitors: number;
		percentile: number;
		nearbyCompetitors: RankingData[];
	}> {
		const now = new Date();
		const periodStart = this.getPeriodStart(now, period);

		const currentRanking = await this.repository.findOne({
			where: {
				templateId,
				templateType: templateType as TemplateTypeRanking,
				period: period as RankingPeriod,
				periodStart,
			},
		});

		if (!currentRanking) {
			return {
				currentRank: 0,
				totalCompetitors: 0,
				percentile: 0,
				nearbyCompetitors: [],
			};
		}

		const totalCompetitors = await this.repository.count({
			where: {
				period: period as RankingPeriod,
				periodStart,
				templateType: templateType as TemplateTypeRanking,
			},
		});

		const percentile =
			totalCompetitors > 0
				? ((totalCompetitors - currentRanking.rankPosition + 1) /
						totalCompetitors) *
					100
				: 0;

		// Obtener competidores cercanos (±2 posiciones)
		const nearbyCompetitors = await this.repository.find({
			where: {
				period: period as RankingPeriod,
				periodStart,
				templateType: templateType as TemplateTypeRanking,
			},
			order: {rankPosition: "ASC"},
			skip: Math.max(0, currentRanking.rankPosition - 3),
			take: 5,
		});

		return {
			currentRank: currentRanking.rankPosition,
			totalCompetitors,
			percentile,
			nearbyCompetitors: nearbyCompetitors.map((r) => this.toRankingData(r)),
		};
	}

	async deleteOldRankings(olderThanDays: number): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		const result = await this.repository.delete({
			periodStart: LessThanOrEqual(cutoffDate),
		});

		return result.affected || 0;
	}

	// === MÉTODOS PRIVADOS ===
	private getPeriodStart(
		date: Date,
		period: "daily" | "weekly" | "monthly" | "yearly"
	): Date {
		const result = new Date(date);

		switch (period) {
			case "daily":
				result.setHours(0, 0, 0, 0);
				break;
			case "weekly":
				const dayOfWeek = result.getDay();
				result.setDate(result.getDate() - dayOfWeek);
				result.setHours(0, 0, 0, 0);
				break;
			case "monthly":
				result.setDate(1);
				result.setHours(0, 0, 0, 0);
				break;
			case "yearly":
				result.setMonth(0, 1);
				result.setHours(0, 0, 0, 0);
				break;
		}

		return result;
	}

	private toRankingData(entity: TemplateRankingEntity): RankingData {
		return {
			templateId: entity.templateId,
			templateType: entity.templateType,
			period: entity.period,
			periodStart: entity.periodStart,
			periodEnd: entity.periodEnd,
			usageCount: entity.usageCount,
			uniqueUsers: entity.uniqueUsers,
			successRate: entity.successRate,
			averageExecutionTime: entity.averageExecutionTime,
			rankPosition: entity.rankPosition,
			trendScore: entity.trendScore,
			growthRate: entity.growthRate,
			averageRating: entity.averageRating,
			totalRatings: entity.totalRatings,
			favoriteCount: entity.favoriteCount,
			weightedScore: entity.weightedScore,
			velocityScore: entity.velocityScore,
		};
	}
}
