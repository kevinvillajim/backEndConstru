// src/infrastructure/database/repositories/TypeOrmMaterialCalculationTemplateRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {
	MaterialCalculationTemplateRepository,
	MaterialTemplateFilters,
} from "../../../domain/repositories/MaterialCalculationTemplateRepository";
import {
	MaterialCalculationTemplate,
	MaterialCalculationType,
} from "../../../domain/models/calculation/MaterialCalculationTemplate";
import {MaterialCalculationTemplateEntity} from "../entities/MaterialCalculationTemplateEntity";
import {PaginationOptions} from "../../../domain/models/common/PaginationOptions";

export class TypeOrmMaterialCalculationTemplateRepository
	implements MaterialCalculationTemplateRepository
{
	private repository: Repository<MaterialCalculationTemplateEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(
			MaterialCalculationTemplateEntity
		);
	}

	async findById(id: string): Promise<MaterialCalculationTemplate | null> {
		const entity = await this.repository.findOne({
			where: {id},
			relations: ["parameters"],
		});

		return entity ? this.toDomainModel(entity) : null;
	}

	async findByType(
		type: MaterialCalculationType
	): Promise<MaterialCalculationTemplate[]> {
		const entities = await this.repository.find({
			where: {type: type as string, isActive: true},
			relations: ["parameters"],
			order: {isFeatured: "DESC", usageCount: "DESC", name: "ASC"},
		});

		return entities.map((entity) => this.toDomainModel(entity));
	}

	async findBySubCategory(
		subCategory: string
	): Promise<MaterialCalculationTemplate[]> {
		const entities = await this.repository.find({
			where: {subCategory, isActive: true},
			relations: ["parameters"],
			order: {usageCount: "DESC", averageRating: "DESC"},
		});

		return entities.map((entity) => this.toDomainModel(entity));
	}

	async findFeatured(): Promise<MaterialCalculationTemplate[]> {
		const entities = await this.repository.find({
			where: {isFeatured: true, isActive: true},
			relations: ["parameters"],
			order: {usageCount: "DESC", averageRating: "DESC"},
			take: 12,
		});

		return entities.map((entity) => this.toDomainModel(entity));
	}

	async findAll(
		filters?: MaterialTemplateFilters,
		pagination?: PaginationOptions
	): Promise<{templates: MaterialCalculationTemplate[]; total: number}> {
		let queryBuilder = this.repository
			.createQueryBuilder("template")
			.leftJoinAndSelect("template.parameters", "parameters");

		// Aplicar filtros
		if (filters) {
			if (filters.type) {
				queryBuilder = queryBuilder.andWhere("template.type = :type", {
					type: filters.type,
				});
			}

			if (filters.subCategory) {
				queryBuilder = queryBuilder.andWhere(
					"template.subCategory = :subCategory",
					{
						subCategory: filters.subCategory,
					}
				);
			}

			if (filters.isActive !== undefined) {
				queryBuilder = queryBuilder.andWhere("template.isActive = :isActive", {
					isActive: filters.isActive,
				});
			}

			if (filters.isFeatured !== undefined) {
				queryBuilder = queryBuilder.andWhere(
					"template.isFeatured = :isFeatured",
					{
						isFeatured: filters.isFeatured,
					}
				);
			}

			if (filters.searchTerm) {
				queryBuilder = queryBuilder.andWhere(
					"(template.name LIKE :term OR template.description LIKE :term OR template.tags LIKE :term)",
					{term: `%${filters.searchTerm}%`}
				);
			}

			if (filters.minRating) {
				queryBuilder = queryBuilder.andWhere(
					"template.averageRating >= :minRating",
					{
						minRating: filters.minRating,
					}
				);
			}

			if (filters.tags && filters.tags.length > 0) {
				const tagConditions = filters.tags
					.map((tag, index) => `template.tags LIKE :tag${index}`)
					.join(" OR ");

				const tagParams = filters.tags.reduce(
					(params, tag, index) => {
						params[`tag${index}`] = `%${tag}%`;
						return params;
					},
					{} as Record<string, string>
				);

				queryBuilder = queryBuilder.andWhere(`(${tagConditions})`, tagParams);
			}
		}

		// Contar total
		const total = await queryBuilder.getCount();

		// Aplicar paginación y ordenamiento
		if (pagination) {
			const skip = ((pagination.page || 1) - 1) * (pagination.limit || 10);
			queryBuilder = queryBuilder.skip(skip).take(pagination.limit || 10);

			if (pagination.sortBy) {
				const order = (pagination.sortOrder || "ASC").toUpperCase() as
					| "ASC"
					| "DESC";
				queryBuilder = queryBuilder.orderBy(
					`template.${pagination.sortBy}`,
					order
				);
			} else {
				queryBuilder = queryBuilder
					.orderBy("template.isFeatured", "DESC")
					.addOrderBy("template.usageCount", "DESC")
					.addOrderBy("template.averageRating", "DESC");
			}
		}

		const entities = await queryBuilder.getMany();
		const templates = entities.map((entity) => this.toDomainModel(entity));

		return {templates, total};
	}

	async create(
		data: Omit<MaterialCalculationTemplate, "id" | "createdAt" | "updatedAt">
	): Promise<MaterialCalculationTemplate> {
		const entity = this.repository.create({
			...data,
			type: data.type as string,
			shareLevel: data.shareLevel as string,
			createdAt: new Date(),
			updatedAt: new Date(),
		} as any);

		const savedEntity = await this.repository.save(entity);
		if (Array.isArray(savedEntity)) {
			throw new Error("Expected a single entity but received an array.");
		}
		return this.toDomainModel(savedEntity);
	}

	async update(
		id: string,
		data: Partial<MaterialCalculationTemplate>
	): Promise<MaterialCalculationTemplate | null> {
		const updateData = {
			...data,
			updatedAt: new Date(),
		};

		// Remover campos que causan problemas de tipo
		const {parameters, ...safeUpdateData} = updateData as any;

		await this.repository.update(id, safeUpdateData);
		return this.findById(id);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.update(id, {
			isActive: false,
			updatedAt: new Date(),
		} as any);
		return result.affected !== undefined && result.affected > 0;
	}

	async incrementUsage(id: string): Promise<boolean> {
		const result = await this.repository.increment({id}, "usageCount", 1);
		return result.affected !== undefined && result.affected > 0;
	}

	async updateRating(id: string, newRating: number): Promise<boolean> {
		const template = await this.repository.findOne({where: {id}});
		if (!template) return false;

		const totalRating =
			template.averageRating * template.ratingCount + newRating;
		const newRatingCount = template.ratingCount + 1;
		const newAverageRating = totalRating / newRatingCount;

		const result = await this.repository.update(id, {
			averageRating: Math.round(newAverageRating * 100) / 100,
			ratingCount: newRatingCount,
			updatedAt: new Date(),
		} as any);

		return result.affected !== undefined && result.affected > 0;
	}

	private toDomainModel(
		entity: MaterialCalculationTemplateEntity
	): MaterialCalculationTemplate {
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
					materialCalculationTemplateId: entity.id,
				})) || [],
			wasteFactors: entity.wasteFactors,
			regionalFactors: entity.regionalFactors,
			normativeReference: entity.normativeReference,
			isActive: entity.isActive,
			isVerified: entity.isVerified,
			isFeatured: entity.isFeatured,
			shareLevel: entity.shareLevel as any,
			createdBy: entity.createdBy,
			version: entity.version,
			usageCount: entity.usageCount,
			averageRating: entity.averageRating,
			ratingCount: entity.ratingCount,
			tags: entity.tags,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
