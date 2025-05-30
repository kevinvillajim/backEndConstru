// src/infrastructure/database/repositories/TypeOrmAuthorCreditRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {AuthorCreditRepository} from "../../../domain/repositories/AuthorCreditRepository";
import {
	AuthorCreditEntity,
	CreditType,
	CreditVisibility,
} from "../entities/AuthorCreditEntity";
import {
	CreateAuthorCreditDTO,
	UpdateAuthorCreditDTO,
	AuthorCreditData,
	AuthorStats,
} from "../../../domain/models/tracking/AuthorCredit";

export class TypeOrmAuthorCreditRepository implements AuthorCreditRepository {
	private repository: Repository<AuthorCreditEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(AuthorCreditEntity);
	}

	async create(creditData: CreateAuthorCreditDTO): Promise<AuthorCreditEntity> {
		const entity = this.repository.create({
			verifiedTemplateId: creditData.verifiedTemplateId,
			originalPersonalTemplateId: creditData.originalPersonalTemplateId,
			originalAuthorId: creditData.originalAuthorId,
			creditType: creditData.creditType as CreditType,
			creditText: creditData.creditText,
			customAttribution: creditData.customAttribution,
			isVisible: creditData.isVisible ?? true,
			visibility:
				(creditData.visibility as CreditVisibility) || CreditVisibility.PUBLIC,
			contributionDescription: creditData.contributionDescription,
			contributionPercentage: creditData.contributionPercentage,
			originalCreationDate: creditData.originalCreationDate,
			promotionDate: creditData.promotionDate,
			promotionRequestId: creditData.promotionRequestId,
			metricsAtPromotion: creditData.metricsAtPromotion,
			pointsAwarded: creditData.pointsAwarded || 0,
			badgeEarned: creditData.badgeEarned,
			recognitionLevel: creditData.recognitionLevel,
			displayOrder: creditData.displayOrder || 0,
			showAuthorContact: creditData.showAuthorContact ?? false,
			showOriginalDate: creditData.showOriginalDate ?? true,
		});

		return await this.repository.save(entity);
	}

	async findById(id: string): Promise<AuthorCreditEntity | null> {
		return await this.repository.findOne({
			where: {id},
			relations: [
				"verifiedTemplate",
				"originalPersonalTemplate",
				"originalAuthor",
			],
		});
	}

	async findByVerifiedTemplate(
		verifiedTemplateId: string,
		onlyVisible: boolean = true
	): Promise<AuthorCreditEntity[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("credit")
			.leftJoinAndSelect("credit.verifiedTemplate", "verifiedTemplate")
			.leftJoinAndSelect("credit.originalPersonalTemplate", "originalTemplate")
			.leftJoinAndSelect("credit.originalAuthor", "author")
			.where("credit.verifiedTemplateId = :verifiedTemplateId", {
				verifiedTemplateId,
			});

		if (onlyVisible) {
			queryBuilder = queryBuilder.andWhere("credit.isVisible = :isVisible", {
				isVisible: true,
			});
		}

		return queryBuilder
			.orderBy("credit.displayOrder", "ASC")
			.addOrderBy("credit.createdAt", "ASC")
			.getMany();
	}

	async findByAuthor(
		authorId: string,
		onlyVisible: boolean = true
	): Promise<AuthorCreditEntity[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("credit")
			.leftJoinAndSelect("credit.verifiedTemplate", "verifiedTemplate")
			.leftJoinAndSelect("credit.originalPersonalTemplate", "originalTemplate")
			.leftJoinAndSelect("credit.originalAuthor", "author")
			.where("credit.originalAuthorId = :authorId", {authorId});

		if (onlyVisible) {
			queryBuilder = queryBuilder.andWhere("credit.isVisible = :isVisible", {
				isVisible: true,
			});
		}

		return queryBuilder.orderBy("credit.promotionDate", "DESC").getMany();
	}

	async findByCreditType(
		creditType:
			| "full_author"
			| "contributor"
			| "inspiration"
			| "collaborator"
			| "reviewer"
	): Promise<AuthorCreditEntity[]> {
		return await this.repository.find({
			where: {
				creditType: creditType as CreditType,
				isVisible: true,
			},
			relations: [
				"verifiedTemplate",
				"originalPersonalTemplate",
				"originalAuthor",
			],
			order: {createdAt: "DESC"},
		});
	}

	async findRecentCredits(days: number = 30): Promise<AuthorCreditEntity[]> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		return await this.repository
			.createQueryBuilder("credit")
			.leftJoinAndSelect("credit.verifiedTemplate", "verifiedTemplate")
			.leftJoinAndSelect("credit.originalPersonalTemplate", "originalTemplate")
			.leftJoinAndSelect("credit.originalAuthor", "author")
			.where("credit.createdAt >= :cutoffDate", {cutoffDate})
			.andWhere("credit.isVisible = :isVisible", {isVisible: true})
			.orderBy("credit.createdAt", "DESC")
			.getMany();
	}

	async update(
		id: string,
		updateData: UpdateAuthorCreditDTO
	): Promise<AuthorCreditEntity | null> {
		const credit = await this.repository.findOne({where: {id}});
		if (!credit) return null;

		Object.assign(credit, updateData);
		return await this.repository.save(credit);
	}

	async updateVisibility(
		id: string,
		isVisible: boolean,
		visibility?: "public" | "restricted" | "private"
	): Promise<AuthorCreditEntity | null> {
		const updateData: UpdateAuthorCreditDTO = {isVisible};
		if (visibility) {
			updateData.visibility = visibility;
		}

		return this.update(id, updateData);
	}

	async approve(
		id: string,
		approvedBy: string,
		approvalNotes?: string
	): Promise<AuthorCreditEntity | null> {
		return this.update(id, {
			approvedBy,
			approvedAt: new Date(),
			approvalNotes,
			isVisible: true,
		});
	}

	async awardPoints(
		id: string,
		points: number,
		badge?: string,
		recognitionLevel?: "bronze" | "silver" | "gold" | "platinum"
	): Promise<AuthorCreditEntity | null> {
		const updateData: UpdateAuthorCreditDTO = {pointsAwarded: points};
		if (badge) updateData.badgeEarned = badge;
		if (recognitionLevel) updateData.recognitionLevel = recognitionLevel;

		return this.update(id, updateData);
	}

	async getAuthorStats(authorId: string): Promise<AuthorStats> {
		const credits = await this.findByAuthor(authorId, false);

		const totalCredits = credits.length;
		const visibleCredits = credits.filter((c) => c.isVisible).length;

		const creditsByType = credits.reduce(
			(acc, credit) => {
				acc[credit.creditType] = (acc[credit.creditType] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const totalPointsAwarded = credits.reduce(
			(sum, credit) => sum + credit.pointsAwarded,
			0
		);

		const badgesEarned = [
			...new Set(
				credits.filter((c) => c.badgeEarned).map((c) => c.badgeEarned!)
			),
		];

		const recognitionLevels = credits
			.filter((c) => c.recognitionLevel)
			.map((c) => c.recognitionLevel!);

		const highestRecognition =
			this.getHighestRecognitionLevel(recognitionLevels);

		const contributedTemplates = credits.map((credit) => ({
			verifiedTemplateId: credit.verifiedTemplateId,
			templateName: credit.verifiedTemplate?.name || "Template",
			creditType: credit.creditType,
			promotionDate: credit.promotionDate,
			pointsAwarded: credit.pointsAwarded,
		}));

		const recentActivity = credits.filter((c) => {
			const monthAgo = new Date();
			monthAgo.setMonth(monthAgo.getMonth() - 1);
			return c.createdAt >= monthAgo;
		}).length;

		return {
			authorId,
			totalCredits,
			visibleCredits,
			creditsByType,
			totalPointsAwarded,
			badgesEarned,
			highestRecognition,
			contributedTemplates,
			recentActivity,
			averageContributionPercentage: this.calculateAverageContribution(credits),
		};
	}

	async getTopContributors(
		metric: "credits" | "points" | "recent_activity" = "credits",
		limit: number = 10,
		period?: "month" | "quarter" | "year"
	): Promise<
		Array<{
			authorId: string;
			authorName: string;
			value: number;
			rank: number;
		}>
	> {
		let queryBuilder = this.repository
			.createQueryBuilder("credit")
			.leftJoinAndSelect("credit.originalAuthor", "author")
			.select("credit.originalAuthorId", "authorId")
			.addSelect("author.firstName", "firstName")
			.addSelect("author.lastName", "lastName");

		// Filtro por período si se especifica
		if (period) {
			const startDate = this.getPeriodStartDate(period);
			queryBuilder = queryBuilder.where("credit.createdAt >= :startDate", {
				startDate,
			});
		}

		// Agregar métricas según el tipo
		switch (metric) {
			case "credits":
				queryBuilder = queryBuilder
					.addSelect("COUNT(*)", "value")
					.groupBy("credit.originalAuthorId")
					.addGroupBy("author.firstName")
					.addGroupBy("author.lastName")
					.orderBy("value", "DESC");
				break;
			case "points":
				queryBuilder = queryBuilder
					.addSelect("SUM(credit.pointsAwarded)", "value")
					.groupBy("credit.originalAuthorId")
					.addGroupBy("author.firstName")
					.addGroupBy("author.lastName")
					.orderBy("value", "DESC");
				break;
			case "recent_activity":
				const recentDate = new Date();
				recentDate.setMonth(recentDate.getMonth() - 1);
				queryBuilder = queryBuilder
					.addSelect("COUNT(*)", "value")
					.andWhere("credit.createdAt >= :recentDate", {recentDate})
					.groupBy("credit.originalAuthorId")
					.addGroupBy("author.firstName")
					.addGroupBy("author.lastName")
					.orderBy("value", "DESC");
				break;
		}

		const results = await queryBuilder.limit(limit).getRawMany();

		return results.map((result, index) => ({
			authorId: result.authorId,
			authorName: `${result.firstName} ${result.lastName}`.trim(),
			value: parseInt(result.value) || 0,
			rank: index + 1,
		}));
	}

	async getCreditStatistics(): Promise<{
		total: number;
		byCreditType: Record<string, number>;
		byVisibility: Record<string, number>;
		byRecognitionLevel: Record<string, number>;
		totalPointsAwarded: number;
		averagePointsPerCredit: number;
	}> {
		const [
			total,
			creditTypeCounts,
			visibilityCounts,
			recognitionCounts,
			pointsStats,
		] = await Promise.all([
			this.repository.count(),
			this.getCountsByCreditType(),
			this.getCountsByVisibility(),
			this.getCountsByRecognitionLevel(),
			this.getPointsStatistics(),
		]);

		return {
			total,
			byCreditType: creditTypeCounts,
			byVisibility: visibilityCounts,
			byRecognitionLevel: recognitionCounts,
			totalPointsAwarded: pointsStats.total,
			averagePointsPerCredit: pointsStats.average,
		};
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== 0;
	}

	// === MÉTODOS PRIVADOS ===
	private getHighestRecognitionLevel(levels: string[]): string | null {
		const levelOrder = ["bronze", "silver", "gold", "platinum"];

		for (const level of levelOrder.reverse()) {
			if (levels.includes(level)) {
				return level;
			}
		}

		return null;
	}

	private calculateAverageContribution(credits: AuthorCreditEntity[]): number {
		const creditsWithPercentage = credits.filter(
			(c) => c.contributionPercentage !== null
		);

		if (creditsWithPercentage.length === 0) return 0;

		const sum = creditsWithPercentage.reduce(
			(total, credit) => total + (credit.contributionPercentage || 0),
			0
		);

		return sum / creditsWithPercentage.length;
	}

	private getPeriodStartDate(period: "month" | "quarter" | "year"): Date {
		const date = new Date();

		switch (period) {
			case "month":
				date.setMonth(date.getMonth() - 1);
				break;
			case "quarter":
				date.setMonth(date.getMonth() - 3);
				break;
			case "year":
				date.setFullYear(date.getFullYear() - 1);
				break;
		}

		return date;
	}

	private async getCountsByCreditType(): Promise<Record<string, number>> {
		const counts = await this.repository
			.createQueryBuilder("credit")
			.select("credit.creditType", "creditType")
			.addSelect("COUNT(*)", "count")
			.groupBy("credit.creditType")
			.getRawMany();

		const result: Record<string, number> = {};
		counts.forEach((item) => {
			result[item.creditType] = parseInt(item.count, 10);
		});

		return result;
	}

	private async getCountsByVisibility(): Promise<Record<string, number>> {
		const counts = await this.repository
			.createQueryBuilder("credit")
			.select("credit.visibility", "visibility")
			.addSelect("COUNT(*)", "count")
			.groupBy("credit.visibility")
			.getRawMany();

		const result: Record<string, number> = {};
		counts.forEach((item) => {
			result[item.visibility] = parseInt(item.count, 10);
		});

		return result;
	}

	private async getCountsByRecognitionLevel(): Promise<Record<string, number>> {
		const counts = await this.repository
			.createQueryBuilder("credit")
			.select("credit.recognitionLevel", "recognitionLevel")
			.addSelect("COUNT(*)", "count")
			.where("credit.recognitionLevel IS NOT NULL")
			.groupBy("credit.recognitionLevel")
			.getRawMany();

		const result: Record<string, number> = {};
		counts.forEach((item) => {
			result[item.recognitionLevel] = parseInt(item.count, 10);
		});

		return result;
	}

	private async getPointsStatistics(): Promise<{
		total: number;
		average: number;
	}> {
		const result = await this.repository
			.createQueryBuilder("credit")
			.select("SUM(credit.pointsAwarded)", "total")
			.addSelect("AVG(credit.pointsAwarded)", "average")
			.getRawOne();

		return {
			total: parseInt(result.total) || 0,
			average: parseFloat(result.average) || 0,
		};
	}
}
