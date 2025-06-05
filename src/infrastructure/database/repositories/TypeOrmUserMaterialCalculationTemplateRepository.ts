import { MaterialCalculationType } from "../../../domain/models/calculation/MaterialCalculationTemplate";
import { UserMaterialCalculationTemplate } from "../../../domain/models/calculation/UserMaterialCalculationTemplate";
import { UserMaterialCalculationTemplateRepository } from "../../../domain/repositories/UserMaterialCalculationTemplateRepository";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { UserMaterialCalculationTemplateEntity } from "../entities/UserMaterialCalculationTemplateEntity";


export class TypeOrmUserMaterialCalculationTemplateRepository
	implements UserMaterialCalculationTemplateRepository
{
	private repository: Repository<UserMaterialCalculationTemplateEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(
			UserMaterialCalculationTemplateEntity
		);
	}

	async findById(id: string): Promise<UserMaterialCalculationTemplate | null> {
		const entity = await this.repository.findOne({
			where: {id},
			relations: ["parameters"],
		});
		return entity ? this.toDomainModel(entity) : null;
	}

	async findByUserId(
		userId: string
	): Promise<UserMaterialCalculationTemplate[]> {
		const entities = await this.repository.find({
			where: {userId, isActive: true},
			relations: ["parameters"],
			order: {createdAt: "DESC"},
		});
		return entities.map((entity) => this.toDomainModel(entity));
	}

	async findPublic(filters?: any): Promise<UserMaterialCalculationTemplate[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("template")
			.leftJoinAndSelect("template.parameters", "parameters")
			.where("template.isPublic = :isPublic", {isPublic: true})
			.andWhere("template.isActive = :isActive", {isActive: true});

		if (filters) {
			if (filters.type) {
				queryBuilder = queryBuilder.andWhere("template.type = :type", {
					type: filters.type,
				});
			}
			if (filters.searchTerm) {
				queryBuilder = queryBuilder.andWhere(
					"(template.name LIKE :term OR template.description LIKE :term)",
					{term: `%${filters.searchTerm}%`}
				);
			}
		}

		const entities = await queryBuilder
			.orderBy("template.usageCount", "DESC")
			.addOrderBy("template.averageRating", "DESC")
			.getMany();

		return entities.map((entity) => this.toDomainModel(entity));
	}

	async findByType(
		type: MaterialCalculationType,
		userId?: string
	): Promise<UserMaterialCalculationTemplate[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("template")
			.leftJoinAndSelect("template.parameters", "parameters")
			.where("template.type = :type", {type})
			.andWhere("template.isActive = :isActive", {isActive: true});

		if (userId) {
			queryBuilder = queryBuilder.andWhere(
				"(template.isPublic = :isPublic OR template.userId = :userId)",
				{isPublic: true, userId}
			);
		} else {
			queryBuilder = queryBuilder.andWhere("template.isPublic = :isPublic", {
				isPublic: true,
			});
		}

		const entities = await queryBuilder
			.orderBy("template.usageCount", "DESC")
			.getMany();

		return entities.map((entity) => this.toDomainModel(entity));
	}

	async create(
		template: Omit<
			UserMaterialCalculationTemplate,
			"id" | "createdAt" | "updatedAt"
		>
	): Promise<UserMaterialCalculationTemplate> {
		const entity = this.repository.create(template as any);
		const saved = await this.repository.save(entity);
		return this.toDomainModel(Array.isArray(saved) ? saved[0] : saved);
	}

	async update(
		id: string,
		data: Partial<UserMaterialCalculationTemplate>
	): Promise<UserMaterialCalculationTemplate | null> {
		await this.repository.update(id, data);
		return this.findById(id);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.update(id, {isActive: false});
		return result.affected !== undefined && result.affected > 0;
	}

	async togglePublic(id: string, isPublic: boolean): Promise<boolean> {
		const result = await this.repository.update(id, {isPublic});
		return result.affected !== undefined && result.affected > 0;
	}

	async incrementUsage(id: string): Promise<boolean> {
		const result = await this.repository.increment({id}, "usageCount", 1);
		return result.affected !== undefined && result.affected > 0;
	}

	private toDomainModel(
		entity: UserMaterialCalculationTemplateEntity
	): UserMaterialCalculationTemplate {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			type: entity.type as MaterialCalculationType,
			subCategory: entity.subCategory,
			formula: entity.formula,
			materialOutputs: entity.materialOutputs,
			parameters:
				entity.parameters?.map((p) => ({
					id: p.id,
					name: p.name,
					description: p.description,
					dataType: p.dataType as any,
					scope: p.scope as any,
					displayOrder: p.displayOrder,
					isRequired: p.isRequired,
					defaultValue: p.defaultValue,
					minValue: p.minValue,
					maxValue: p.maxValue,
					unit: p.unit as any,
					allowedValues: p.allowedValues,
					helpText: p.helpText,
					dependsOnParameters: p.dependsOnParameters,
					userMaterialCalculationTemplateId: entity.id,
				})) || [],
			wasteFactors: entity.wasteFactors,
			userId: entity.userId,
			baseTemplateId: entity.baseTemplateId,
			isPublic: entity.isPublic,
			isActive: entity.isActive,
			usageCount: entity.usageCount,
			averageRating: entity.averageRating,
			ratingCount: entity.ratingCount,
			tags: entity.tags,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
