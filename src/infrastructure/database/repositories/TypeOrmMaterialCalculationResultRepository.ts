import { MaterialCalculationResult } from "../../../domain/models/calculation/MaterialCalculationResult";
import { MaterialCalculationResultRepository, ResultFilters } from "../../../domain/repositories/MaterialCalculationResultRepository";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { MaterialCalculationResultEntity } from "../entities/MaterialCalculationResultEntity";

export class TypeOrmMaterialCalculationResultRepository
	implements MaterialCalculationResultRepository
{
	private repository: Repository<MaterialCalculationResultEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(
			MaterialCalculationResultEntity
		);
	}

	async findById(id: string): Promise<MaterialCalculationResult | null> {
		const entity = await this.repository.findOne({where: {id}});
		return entity ? this.toDomainModel(entity) : null;
	}

	async findByUserId(
		userId: string,
		filters?: ResultFilters
	): Promise<MaterialCalculationResult[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("result")
			.where("result.user_id = :userId", {userId});

		if (filters) {
			if (filters.templateType) {
				queryBuilder = queryBuilder.andWhere(
					"result.template_type = :templateType",
					{
						templateType: filters.templateType,
					}
				);
			}

			if (filters.dateFrom) {
				queryBuilder = queryBuilder.andWhere("result.created_at >= :dateFrom", {
					dateFrom: filters.dateFrom,
				});
			}

			if (filters.dateTo) {
				queryBuilder = queryBuilder.andWhere("result.created_at <= :dateTo", {
					dateTo: filters.dateTo,
				});
			}

			if (filters.isSaved !== undefined) {
				queryBuilder = queryBuilder.andWhere("result.is_saved = :isSaved", {
					isSaved: filters.isSaved,
				});
			}
		}

		const entities = await queryBuilder
			.orderBy("result.created_at", "DESC")
			.getMany();

		return entities.map((entity) => this.toDomainModel(entity));
	}

	async findByProject(projectId: string): Promise<MaterialCalculationResult[]> {
		const entities = await this.repository.find({
			where: {projectId},
			order: {createdAt: "DESC"},
		});
		return entities.map((entity) => this.toDomainModel(entity));
	}

	async findSaved(userId: string): Promise<MaterialCalculationResult[]> {
		const entities = await this.repository.find({
			where: {userId, isSaved: true},
			order: {createdAt: "DESC"},
		});
		return entities.map((entity) => this.toDomainModel(entity));
	}

	async findShared(): Promise<MaterialCalculationResult[]> {
		const entities = await this.repository.find({
			where: {isShared: true},
			order: {createdAt: "DESC"},
		});
		return entities.map((entity) => this.toDomainModel(entity));
	}

	async create(
		result: Omit<MaterialCalculationResult, "id" | "createdAt" | "updatedAt">
	): Promise<MaterialCalculationResult> {
		const entity = this.repository.create(result as any);
		const saved = await this.repository.save(entity);
		return this.toDomainModel(Array.isArray(saved) ? saved[0] : saved);
	}

	async update(
		id: string,
		data: Partial<MaterialCalculationResult>
	): Promise<MaterialCalculationResult | null> {
		await this.repository.update(id, data);
		return this.findById(id);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	async toggleSaved(id: string, isSaved: boolean): Promise<boolean> {
		const result = await this.repository.update(id, {isSaved});
		return result.affected !== undefined && result.affected > 0;
	}

	async toggleShared(id: string, isShared: boolean): Promise<boolean> {
		const result = await this.repository.update(id, {isShared});
		return result.affected !== undefined && result.affected > 0;
	}

	private toDomainModel(
		entity: MaterialCalculationResultEntity
	): MaterialCalculationResult {
		return {
			id: entity.id,
			templateId: entity.templateId,
			templateType: entity.templateType as "official" | "user",
			userId: entity.userId,
			projectId: entity.projectId,
			inputParameters: entity.inputParameters,
			materialQuantities: entity.materialQuantities,
			totalCost: entity.totalCost,
			currency: entity.currency,
			wasteIncluded: entity.wasteIncluded,
			regionalFactorsApplied: entity.regionalFactorsApplied,
			notes: entity.notes,
			isSaved: entity.isSaved,
			isShared: entity.isShared,
			executionTime: entity.executionTime,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
