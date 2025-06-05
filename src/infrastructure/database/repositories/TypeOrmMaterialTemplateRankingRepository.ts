// src/infrastructure/database/repositories/TypeOrmMaterialTemplateRankingRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {MaterialTemplateRankingEntity} from "../entities/MaterialTemplateRankingEntity";
import {MaterialTemplateRankingRepository} from "../../../domain/repositories/MaterialTemplateRankingRepository";

export class TypeOrmMaterialTemplateRankingRepository
	implements MaterialTemplateRankingRepository
{
	private repository: Repository<MaterialTemplateRankingEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(
			MaterialTemplateRankingEntity
		);
	}

	async findByPeriod(
		period: "daily" | "weekly" | "monthly" | "yearly",
		materialType?: string,
		limit: number = 20
	): Promise<any[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("ranking")
			.where("ranking.period = :period", {period})
			.orderBy("ranking.rankPosition", "ASC");

		if (materialType) {
			queryBuilder = queryBuilder.andWhere(
				"ranking.materialType = :materialType",
				{materialType}
			);
		}

		if (limit) {
			queryBuilder = queryBuilder.limit(limit);
		}

		const entities = await queryBuilder.getMany();
		return entities.map((entity) => this.toDomainModel(entity));
	}

	async upsert(
		ranking: Omit<any, "id" | "createdAt" | "updatedAt">
	): Promise<any> {
		// Buscar ranking existente
		const existing = await this.repository.findOne({
			where: {
				templateId: ranking.templateId,
				templateType: ranking.templateType,
				period: ranking.period,
				periodStart: ranking.periodStart,
			},
		});

		if (existing) {
			// Actualizar existente
			Object.assign(existing, ranking);
			const updated = await this.repository.save(existing);
			return this.toDomainModel(updated);
		} else {
			// Crear nuevo
			const entity = this.repository.create(ranking);
			const saved = await this.repository.save(entity);
			return this.toDomainModel(saved);
		}
	}

	async findByTemplateId(templateId: string): Promise<any[]> {
		const entities = await this.repository.find({
			where: {templateId},
			order: {period: "DESC", periodStart: "DESC"},
		});
		return entities.map((entity) => this.toDomainModel(entity));
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	private toDomainModel(entity: MaterialTemplateRankingEntity): any {
		return {
			id: entity.id,
			templateId: entity.templateId,
			templateType: entity.templateType,
			materialType: entity.materialType,
			subCategory: entity.subCategory,
			period: entity.period,
			periodStart: entity.periodStart,
			periodEnd: entity.periodEnd,
			usageCount: entity.usageCount,
			uniqueUsers: entity.uniqueUsers,
			uniqueProjects: entity.uniqueProjects,
			successRate: entity.successRate,
			averageExecutionTime: entity.averageExecutionTime,
			averageMaterialsCount: entity.averageMaterialsCount,
			totalCostCalculated: entity.totalCostCalculated,
			rankPosition: entity.rankPosition,
			trendScore: entity.trendScore,
			growthRate: entity.growthRate,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
