// src/infrastructure/database/repositories/TypeOrmMaterialTemplateUsageLogRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {MaterialTemplateUsageLogEntity} from "../entities/MaterialTemplateUsageLogEntity";
import {
	MaterialTemplateUsageLogRepository,
	UsageStatsByTemplate,
} from "../../../domain/repositories/MaterialTemplateUsageLogRepository";

export class TypeOrmMaterialTemplateUsageLogRepository
	implements MaterialTemplateUsageLogRepository
{
	private repository: Repository<MaterialTemplateUsageLogEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(
			MaterialTemplateUsageLogEntity
		);
	}

	async create(usageLog: Omit<any, "id" | "createdAt">): Promise<any> {
		const entity = this.repository.create(usageLog);
		const saved = await this.repository.save(entity);
		return this.toDomainModel(saved);
	}

	async getUsageStatsByPeriod(
		periodStart: Date,
		periodEnd: Date
	): Promise<UsageStatsByTemplate[]> {
		const query = this.repository
			.createQueryBuilder("log")
			.select([
				"log.templateId as templateId",
				"log.templateType as templateType",
				"log.materialType as materialType",
				"log.subCategory as subCategory",
				"COUNT(log.id) as usageCount",
				"COUNT(DISTINCT log.userId) as uniqueUsers",
				"COUNT(DISTINCT log.projectId) as uniqueProjects",
				"AVG(CASE WHEN log.wasSuccessful = 1 THEN 1 ELSE 0 END) * 100 as successRate",
				"AVG(log.executionTimeMs) as averageExecutionTime",
				"AVG(log.totalMaterialsCalculated) as averageMaterialsCount",
				"SUM(log.totalCost) as totalCostCalculated",
			])
			.where("log.usageDate >= :periodStart", {periodStart})
			.andWhere("log.usageDate <= :periodEnd", {periodEnd})
			.groupBy(
				"log.templateId, log.templateType, log.materialType, log.subCategory"
			)
			.orderBy("usageCount", "DESC");

		return await query.getRawMany();
	}

	async findByTemplateId(templateId: string): Promise<any[]> {
		const entities = await this.repository.find({
			where: {templateId},
			order: {usageDate: "DESC"},
		});
		return entities.map((entity) => this.toDomainModel(entity));
	}

	async findByUserId(userId: string): Promise<any[]> {
		const entities = await this.repository.find({
			where: {userId},
			order: {usageDate: "DESC"},
		});
		return entities.map((entity) => this.toDomainModel(entity));
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	private toDomainModel(entity: MaterialTemplateUsageLogEntity): any {
		return {
			id: entity.id,
			templateId: entity.templateId,
			templateType: entity.templateType,
			materialType: entity.materialType,
			subCategory: entity.subCategory,
			userId: entity.userId,
			projectId: entity.projectId,
			calculationResultId: entity.calculationResultId,
			usageDate: entity.usageDate,
			executionTimeMs: entity.executionTimeMs,
			wasSuccessful: entity.wasSuccessful,
			totalMaterialsCalculated: entity.totalMaterialsCalculated,
			wasteIncluded: entity.wasteIncluded,
			regionalFactorsApplied: entity.regionalFactorsApplied,
			totalCost: entity.totalCost,
			ipAddress: entity.ipAddress,
			userAgent: entity.userAgent,
			createdAt: entity.createdAt,
		};
	}
}
