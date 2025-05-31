// src/infrastructure/database/repositories/TypeOrmUserCalculationTemplateRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {UserCalculationTemplateRepository} from "../../../domain/repositories/UserCalculationTemplateRepository";
import {
	UserCalculationTemplate,
	CreateUserCalculationTemplateDTO,
	UpdateUserCalculationTemplateDTO,
	DuplicateTemplateDTO,
	CreateFromResultDTO,
	UserTemplateFilters,
	UserTemplateStats,
	UserTemplateStatus,
	UserTemplateSourceType,
	UserTemplateDifficulty,
} from "../../../domain/models/calculation/UserCalculationTemplate";
import {UserCalculationTemplateEntity} from "../entities/UserCalculationTemplateEntity";
import {CalculationTemplateEntity} from "../entities/CalculationTemplateEntity";
import {CalculationResultEntity} from "../entities/CalculationResultEntity";
import {UserEntity} from "../entities/UserEntity";

export class TypeOrmUserCalculationTemplateRepository
	implements UserCalculationTemplateRepository
{
	private repository: Repository<UserCalculationTemplateEntity>;
	private officialTemplateRepository: Repository<CalculationTemplateEntity>;
	private calculationResultRepository: Repository<CalculationResultEntity>;
	private userRepository: Repository<UserEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(
			UserCalculationTemplateEntity
		);
		this.officialTemplateRepository = AppDataSource.getRepository(
			CalculationTemplateEntity
		);
		this.calculationResultRepository = AppDataSource.getRepository(
			CalculationResultEntity
		);
		this.userRepository = AppDataSource.getRepository(UserEntity);
	}

	// === CRUD BÁSICO ===
	/**
	 * Encuentra todas las plantillas con filtros (para uso en rankings)
	 */
	async findAll(
		filters?: {
			status?: string[];
			isActive?: boolean;
			isPublic?: boolean;
			category?: string;
			targetProfessions?: string[];
		},
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{templates: UserCalculationTemplate[]; total: number}> {
		let queryBuilder = this.repository
			.createQueryBuilder("template")
			.leftJoinAndSelect("template.user", "user");

		// Aplicar filtros
		if (filters) {
			if (filters.status && filters.status.length > 0) {
				queryBuilder = queryBuilder.andWhere(
					"template.status IN (:...statuses)",
					{
						statuses: filters.status,
					}
				);
			}

			if (filters.isActive !== undefined) {
				queryBuilder = queryBuilder.andWhere("template.is_active = :isActive", {
					isActive: filters.isActive,
				});
			}

			if (filters.isPublic !== undefined) {
				queryBuilder = queryBuilder.andWhere("template.is_public = :isPublic", {
					isPublic: filters.isPublic,
				});
			}

			if (filters.category) {
				queryBuilder = queryBuilder.andWhere("template.category = :category", {
					category: filters.category,
				});
			}

			if (filters.targetProfessions && filters.targetProfessions.length > 0) {
				const professionConditions = filters.targetProfessions.map(
					(_, index) =>
						`JSON_CONTAINS(template.target_professions, :profession${index})`
				);
				queryBuilder = queryBuilder.andWhere(
					`(${professionConditions.join(" OR ")})`
				);

				filters.targetProfessions.forEach((profession, index) => {
					queryBuilder = queryBuilder.setParameter(
						`profession${index}`,
						`"${profession}"`
					);
				});
			}
		}

		// Calcular total
		const total = await queryBuilder.getCount();

		// Aplicar paginación y ordenamiento
		if (pagination) {
			const skip = (pagination.page - 1) * pagination.limit;
			queryBuilder = queryBuilder.skip(skip).take(pagination.limit);

			if (pagination.sortBy) {
				const order = pagination.sortOrder || "ASC";
				queryBuilder = queryBuilder.orderBy(
					`template.${pagination.sortBy}`,
					order
				);
			} else {
				queryBuilder = queryBuilder.orderBy("template.updated_at", "DESC");
			}
		}

		const entities = await queryBuilder.getMany();
		const templates = await Promise.all(
			entities.map((entity) => this.toDomainModel(entity))
		);

		return {templates, total};
	}
	async findByUserId(
		userId: string,
		filters?: UserTemplateFilters,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{templates: UserCalculationTemplate[]; total: number}> {
		let queryBuilder = this.repository
			.createQueryBuilder("template")
			.leftJoinAndSelect("template.user", "user")
			.where("template.user_id = :userId", {userId});

		// Aplicar filtros
		if (filters) {
			if (filters.status && filters.status.length > 0) {
				queryBuilder = queryBuilder.andWhere(
					"template.status IN (:...statuses)",
					{
						statuses: filters.status,
					}
				);
			}

			if (filters.categories && filters.categories.length > 0) {
				queryBuilder = queryBuilder.andWhere(
					"template.category IN (:...categories)",
					{
						categories: filters.categories,
					}
				);
			}

			if (filters.targetProfessions && filters.targetProfessions.length > 0) {
				// Para buscar en JSON array
				const professionConditions = filters.targetProfessions.map(
					(_, index) =>
						`JSON_CONTAINS(template.target_professions, :profession${index})`
				);
				queryBuilder = queryBuilder.andWhere(
					`(${professionConditions.join(" OR ")})`
				);

				filters.targetProfessions.forEach((profession, index) => {
					queryBuilder = queryBuilder.setParameter(
						`profession${index}`,
						`"${profession}"`
					);
				});
			}

			if (filters.difficulty && filters.difficulty.length > 0) {
				queryBuilder = queryBuilder.andWhere(
					"template.difficulty IN (:...difficulties)",
					{
						difficulties: filters.difficulty,
					}
				);
			}

			if (filters.isPublic !== undefined) {
				queryBuilder = queryBuilder.andWhere("template.is_public = :isPublic", {
					isPublic: filters.isPublic,
				});
			}

			if (filters.tags && filters.tags.length > 0) {
				filters.tags.forEach((tag, index) => {
					queryBuilder = queryBuilder.andWhere(
						`JSON_CONTAINS(template.tags, :tag${index})`,
						{[`tag${index}`]: `"${tag}"`}
					);
				});
			}

			if (filters.searchTerm) {
				queryBuilder = queryBuilder.andWhere(
					"(template.name LIKE :term OR template.description LIKE :term OR template.long_description LIKE :term)",
					{term: `%${filters.searchTerm}%`}
				);
			}

			if (filters.sourceType && filters.sourceType.length > 0) {
				queryBuilder = queryBuilder.andWhere(
					"template.source_type IN (:...sourceTypes)",
					{
						sourceTypes: filters.sourceType,
					}
				);
			}
		}

		// Calcular total
		const total = await queryBuilder.getCount();

		// Aplicar paginación y ordenamiento
		if (pagination) {
			const skip = (pagination.page - 1) * pagination.limit;
			queryBuilder = queryBuilder.skip(skip).take(pagination.limit);

			if (pagination.sortBy) {
				const order = pagination.sortOrder || "ASC";
				queryBuilder = queryBuilder.orderBy(
					`template.${pagination.sortBy}`,
					order
				);
			} else {
				queryBuilder = queryBuilder.orderBy("template.updated_at", "DESC");
			}
		}

		const entities = await queryBuilder.getMany();
		const templates = await Promise.all(
			entities.map((entity) => this.toDomainModel(entity))
		);

		return {templates, total};
	}

	async findById(id: string): Promise<UserCalculationTemplate | null> {
		const entity = await this.repository.findOne({
			where: {id},
			relations: ["user"],
		});

		return entity ? this.toDomainModel(entity) : null;
	}

	async findByIdAndUserId(
		id: string,
		userId: string
	): Promise<UserCalculationTemplate | null> {
		const entity = await this.repository.findOne({
			where: {id, userId},
			relations: ["user"],
		});

		return entity ? this.toDomainModel(entity) : null;
	}

	async create(
		template: CreateUserCalculationTemplateDTO
	): Promise<UserCalculationTemplate> {
		const entity = this.toEntity(template);
		const savedEntity = await this.repository.save(entity);
		return this.toDomainModel(savedEntity);
	}

	async update(
		id: string,
		templateData: UpdateUserCalculationTemplateDTO
	): Promise<UserCalculationTemplate | null> {
		const entity = await this.repository.findOne({
			where: {id},
			relations: ["user"],
		});

		if (!entity) return null;

		// Actualizar campos
		Object.assign(entity, templateData);
		entity.updatedAt = new Date();

		const updatedEntity = await this.repository.save(entity);
		return this.toDomainModel(updatedEntity);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== 0;
	}

	// === OPERACIONES ESPECIALES ===
	async duplicateFromOfficial(
		duplicateData: DuplicateTemplateDTO
	): Promise<UserCalculationTemplate> {
		// Obtener la plantilla oficial original
		const officialTemplate = await this.officialTemplateRepository.findOne({
			where: {id: duplicateData.originalTemplateId},
			relations: ["parameters"],
		});

		if (!officialTemplate) {
			throw new Error(
				`Plantilla oficial no encontrada: ${duplicateData.originalTemplateId}`
			);
		}

		// Crear plantilla personal basada en la oficial
		const personalTemplate: CreateUserCalculationTemplateDTO = {
			name: duplicateData.customName || `${officialTemplate.name} (Copia)`,
			description:
				duplicateData.customDescription || officialTemplate.description,
			sourceType: UserTemplateSourceType.COPIED,
			originalTemplateId: duplicateData.originalTemplateId,
			category: officialTemplate.type,
			targetProfessions: [officialTemplate.targetProfession],
			difficulty: UserTemplateDifficulty.INTERMEDIATE, // Default
			necReference: officialTemplate.necReference,
			tags: officialTemplate.tags || [], // CORREGIDO: Agregar tags
			parameters:
				officialTemplate.parameters?.map((p) => ({
					name: p.name,
					label: p.description,
					type: this.mapParameterType(p.dataType),
					scope: p.scope as "input" | "internal" | "output",
					required: p.isRequired,
					displayOrder: p.displayOrder,
					unit: p.unitOfMeasure,
					minValue: p.minValue,
					maxValue: p.maxValue,
					regexPattern: p.regexPattern,
					allowedValues: p.allowedValues
						? JSON.parse(p.allowedValues)
						: undefined,
					defaultValue: p.defaultValue,
					helpText: p.helpText,
					dependsOnParameters: p.dependsOnParameters,
					formula: p.formula,
				})) || [],
			formula: officialTemplate.formula,
			isPublic: false,
			version: "1.0",
			userId: duplicateData.userId,
		};

		return this.create(personalTemplate);
	}

	async createFromResult(
		resultData: CreateFromResultDTO
	): Promise<UserCalculationTemplate> {
		// Obtener el resultado de cálculo
		const calculationResult = await this.calculationResultRepository.findOne({
			where: {id: resultData.sourceCalculationResultId},
			relations: ["calculationTemplate", "calculationTemplate.parameters"],
		});

		if (!calculationResult) {
			throw new Error(
				`Resultado de cálculo no encontrado: ${resultData.sourceCalculationResultId}`
			);
		}

		const originalTemplate = calculationResult.calculationTemplate;

		// Crear plantilla desde el resultado
		const templateFromResult: CreateUserCalculationTemplateDTO = {
			name: resultData.name,
			description:
				resultData.description || `Plantilla creada desde resultado de cálculo`,
			sourceType: UserTemplateSourceType.FROM_RESULT,
			sourceCalculationResultId: resultData.sourceCalculationResultId,
			category: resultData.category,
			targetProfessions: resultData.targetProfessions,
			difficulty: UserTemplateDifficulty.BASIC,
			tags: [], // CORREGIDO: Agregar tags vacío por defecto
			parameters:
				originalTemplate.parameters?.map((p) => ({
					name: p.name,
					label: p.description,
					type: this.mapParameterType(p.dataType),
					scope: p.scope as "input" | "internal" | "output",
					required: p.isRequired,
					displayOrder: p.displayOrder,
					unit: p.unitOfMeasure,
					minValue: p.minValue,
					maxValue: p.maxValue,
					regexPattern: p.regexPattern,
					allowedValues: p.allowedValues
						? JSON.parse(p.allowedValues)
						: undefined,
					defaultValue:
						calculationResult.inputParameters[p.name] || p.defaultValue,
					helpText: p.helpText,
					dependsOnParameters: p.dependsOnParameters,
					formula: p.formula,
				})) || [],
			formula: originalTemplate.formula,
			isPublic: false,
			version: "1.0",
			userId: resultData.userId,
		};

		return this.create(templateFromResult);
	}

	// === CONSULTAS ESPECÍFICAS ===
	async findByStatus(
		userId: string,
		status: UserTemplateStatus
	): Promise<UserCalculationTemplate[]> {
		const entities = await this.repository.find({
			where: {userId, status},
			relations: ["user"],
			order: {updatedAt: "DESC"},
		});

		return Promise.all(entities.map((entity) => this.toDomainModel(entity)));
	}

	async findPublicTemplates(
		excludeUserId?: string,
		filters?: Omit<UserTemplateFilters, "status">,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{templates: UserCalculationTemplate[]; total: number}> {
		let queryBuilder = this.repository
			.createQueryBuilder("template")
			.leftJoinAndSelect("template.user", "user")
			.where("template.is_public = :isPublic", {isPublic: true})
			.andWhere("template.status = :status", {
				status: UserTemplateStatus.ACTIVE,
			});

		if (excludeUserId) {
			queryBuilder = queryBuilder.andWhere(
				"template.user_id != :excludeUserId",
				{excludeUserId}
			);
		}

		// Aplicar filtros (similar a findByUserId pero sin status)
		if (filters) {
			if (filters.categories && filters.categories.length > 0) {
				queryBuilder = queryBuilder.andWhere(
					"template.category IN (:...categories)",
					{
						categories: filters.categories,
					}
				);
			}

			if (filters.searchTerm) {
				queryBuilder = queryBuilder.andWhere(
					"(template.name LIKE :term OR template.description LIKE :term)",
					{term: `%${filters.searchTerm}%`}
				);
			}
		}

		const total = await queryBuilder.getCount();

		if (pagination) {
			const skip = (pagination.page - 1) * pagination.limit;
			queryBuilder = queryBuilder.skip(skip).take(pagination.limit);

			if (pagination.sortBy) {
				const order = pagination.sortOrder || "ASC";
				queryBuilder = queryBuilder.orderBy(
					`template.${pagination.sortBy}`,
					order
				);
			} else {
				queryBuilder = queryBuilder.orderBy("template.average_rating", "DESC");
			}
		}

		const entities = await queryBuilder.getMany();
		const templates = await Promise.all(
			entities.map((entity) => this.toDomainModel(entity))
		);

		return {templates, total};
	}

	async findSharedWithUser(userId: string): Promise<UserCalculationTemplate[]> {
		const entities = await this.repository
			.createQueryBuilder("template")
			.leftJoinAndSelect("template.user", "user")
			.where("JSON_CONTAINS(template.shared_with, :userId)", {
				userId: `"${userId}"`,
			})
			.andWhere("template.status = :status", {
				status: UserTemplateStatus.ACTIVE,
			})
			.getMany();

		return Promise.all(entities.map((entity) => this.toDomainModel(entity)));
	}

	async hasUserAccess(templateId: string, userId: string): Promise<boolean> {
		const template = await this.repository.findOne({
			where: {id: templateId},
		});

		if (!template) return false;

		// Es el propietario
		if (template.userId === userId) return true;

		// Está compartida con el usuario
		if (template.sharedWith && template.sharedWith.includes(userId))
			return true;

		// Es pública
		if (template.isPublic && template.status === UserTemplateStatus.ACTIVE)
			return true;

		return false;
	}

	async findByCategory(
		userId: string,
		category: string
	): Promise<UserCalculationTemplate[]> {
		const entities = await this.repository.find({
			where: {userId, category},
			relations: ["user"],
			order: {name: "ASC"},
		});

		return Promise.all(entities.map((entity) => this.toDomainModel(entity)));
	}

	async searchTemplates(
		userId: string,
		searchTerm: string,
		includeShared: boolean = false
	): Promise<UserCalculationTemplate[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("template")
			.leftJoinAndSelect("template.user", "user")
			.where("template.user_id = :userId", {userId})
			.andWhere(
				"(template.name LIKE :term OR template.description LIKE :term OR template.long_description LIKE :term)",
				{term: `%${searchTerm}%`}
			);

		if (includeShared) {
			queryBuilder = queryBuilder.orWhere(
				"JSON_CONTAINS(template.shared_with, :userIdJson) AND (template.name LIKE :term OR template.description LIKE :term)",
				{userIdJson: `"${userId}"`, term: `%${searchTerm}%`}
			);
		}

		const entities = await queryBuilder.getMany();
		return Promise.all(entities.map((entity) => this.toDomainModel(entity)));
	}

	// === GESTIÓN DE COMPARTICIÓN ===
	async shareTemplate(templateId: string, userIds: string[]): Promise<boolean> {
		const template = await this.repository.findOne({where: {id: templateId}});
		if (!template) return false;

		const currentShared = template.sharedWith || [];
		const newShared = [...new Set([...currentShared, ...userIds])];

		await this.repository.update(templateId, {sharedWith: newShared});
		return true;
	}

	async unshareTemplate(
		templateId: string,
		userIds: string[]
	): Promise<boolean> {
		const template = await this.repository.findOne({where: {id: templateId}});
		if (!template) return false;

		const currentShared = template.sharedWith || [];
		const newShared = currentShared.filter((id) => !userIds.includes(id));

		await this.repository.update(templateId, {sharedWith: newShared});
		return true;
	}

	async getSharedUsers(templateId: string): Promise<string[]> {
		const template = await this.repository.findOne({where: {id: templateId}});
		return template?.sharedWith || [];
	}

	// === ESTADÍSTICAS Y MÉTRICAS ===
	async getStats(userId: string): Promise<UserTemplateStats> {
		const [
			totalCount,
			statusCounts,
			categoryCounts,
			difficultyCounts,
			sourceTypeCounts,
			recentActivity,
		] = await Promise.all([
			this.repository.count({where: {userId}}),
			this.countByStatus(userId),
			this.getCountsByField(userId, "category"),
			this.getCountsByField(userId, "difficulty"),
			this.getCountsByField(userId, "sourceType"),
			this.getRecentActivity(userId),
		]);

		const favorites = 0; // TODO: Implementar con UserFavoriteRepository
		const publicCount = await this.repository.count({
			where: {userId, isPublic: true},
		});

		return {
			total: totalCount,
			active: statusCounts[UserTemplateStatus.ACTIVE] || 0,
			draft: statusCounts[UserTemplateStatus.DRAFT] || 0,
			archived: statusCounts[UserTemplateStatus.ARCHIVED] || 0,
			favorites,
			public: publicCount,
			private: totalCount - publicCount,
			byCategory: categoryCounts,
			byDifficulty: difficultyCounts as Record<UserTemplateDifficulty, number>,
			bySourceType: sourceTypeCounts as Record<UserTemplateSourceType, number>,
			recentActivity,
		};
	}

	async incrementUsageCount(id: string): Promise<void> {
		await this.repository.increment({id}, "usageCount", 1);
	}

	async updateRatingStats(
		id: string,
		newRating: number,
		isNewRating: boolean
	): Promise<void> {
		const template = await this.repository.findOne({where: {id}});
		if (!template) return;

		let newTotalRatings = template.totalRatings;
		let newAverageRating = template.averageRating;

		if (isNewRating) {
			newTotalRatings += 1;
			const currentRatingSum = template.averageRating * template.totalRatings;
			newAverageRating = (currentRatingSum + newRating) / newTotalRatings;
		} else {
			// Actualizar rating existente (no implementado aún)
		}

		await this.repository.update(id, {
			totalRatings: newTotalRatings,
			averageRating: newAverageRating,
		});
	}

	// === VALIDACIONES ===
	async isNameUniqueForUser(
		userId: string,
		name: string,
		excludeId?: string
	): Promise<boolean> {
		let queryBuilder = this.repository
			.createQueryBuilder("template")
			.where("template.user_id = :userId", {userId})
			.andWhere("template.name = :name", {name});

		if (excludeId) {
			queryBuilder = queryBuilder.andWhere("template.id != :excludeId", {
				excludeId,
			});
		}

		const count = await queryBuilder.getCount();
		return count === 0;
	}

	async countByStatus(
		userId: string
	): Promise<Record<UserTemplateStatus, number>> {
		const counts = await this.repository
			.createQueryBuilder("template")
			.select("template.status", "status")
			.addSelect("COUNT(*)", "count")
			.where("template.user_id = :userId", {userId})
			.groupBy("template.status")
			.getRawMany();

		const result = {} as Record<UserTemplateStatus, number>;

		// Inicializar con 0
		Object.values(UserTemplateStatus).forEach((status) => {
			result[status] = 0;
		});

		// Establecer valores reales
		counts.forEach((item) => {
			result[item.status as UserTemplateStatus] = parseInt(item.count, 10);
		});

		return result;
	}

	async findRecentTemplates(
		userId: string,
		days: number = 30
	): Promise<UserCalculationTemplate[]> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		const entities = await this.repository.find({
			where: {
				userId,
				createdAt: {$gte: cutoffDate} as any,
			},
			relations: ["user"],
			order: {createdAt: "DESC"},
		});

		return Promise.all(entities.map((entity) => this.toDomainModel(entity)));
	}

	// === MANTENIMIENTO ===
	async changeStatus(
		id: string,
		status: UserTemplateStatus
	): Promise<UserCalculationTemplate | null> {
		const result = await this.repository.update(id, {status});
		if (result.affected === 0) return null;

		return this.findById(id);
	}

	async archiveInactiveTemplates(
		userId: string,
		daysInactive: number
	): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

		const result = await this.repository.update(
			{
				userId,
				updatedAt: {$lt: cutoffDate} as any,
				status: UserTemplateStatus.ACTIVE,
			},
			{status: UserTemplateStatus.ARCHIVED}
		);

		return result.affected || 0;
	}

	async cleanupOldDrafts(userId: string, daysOld: number): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysOld);

		const result = await this.repository.delete({
			userId,
			createdAt: {$lt: cutoffDate} as any,
			status: UserTemplateStatus.DRAFT,
		});

		return result.affected || 0;
	}

	// === MÉTODOS PRIVADOS DE UTILIDAD ===
	private async toDomainModel(
		entity: UserCalculationTemplateEntity
	): Promise<UserCalculationTemplate> {
		// Obtener información del autor
		const user =
			entity.user ||
			(await this.userRepository.findOne({where: {id: entity.userId}}));

		// CORREGIDO: Crear nombre completo del usuario
		const author = {
			id: user?.id || entity.userId,
			name: user ? `${user.firstName} ${user.lastName}`.trim() : "Usuario",
			email: user?.email || "",
		};

		// Calcular si es nueva (últimos 30 días)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const isNew = entity.createdAt > thirtyDaysAgo;

		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			longDescription: entity.longDescription,
			sourceType: entity.sourceType,
			originalTemplateId: entity.originalTemplateId,
			sourceCalculationResultId: entity.sourceCalculationResultId,
			category: entity.category,
			subcategory: entity.subcategory,
			targetProfessions: entity.targetProfessions,
			difficulty: entity.difficulty,
			estimatedTime: entity.estimatedTime,
			necReference: entity.necReference,
			tags: entity.tags || [],
			parameters: entity.parameters || [],
			formula: entity.formula,
			isPublic: entity.isPublic,
			isActive: entity.isActive,
			version: entity.version,
			status: entity.status,
			requirements: entity.requirements,
			applicationCases: entity.applicationCases,
			limitations: entity.limitations,
			sharedWith: entity.sharedWith,
			author,
			contributors: entity.contributors,
			usageCount: entity.usageCount,
			totalRatings: entity.totalRatings,
			averageRating: entity.averageRating,
			isFavorite: false, // TODO: Calcular desde UserFavoriteRepository
			isNew,
			createdAt: entity.createdAt,
			lastModified: entity.updatedAt,
		};
	}

	private toEntity(
		model: CreateUserCalculationTemplateDTO
	): UserCalculationTemplateEntity {
		const entity = new UserCalculationTemplateEntity();

		entity.userId = model.userId;
		entity.name = model.name;
		entity.description = model.description;
		entity.longDescription = model.longDescription;
		entity.sourceType = model.sourceType;
		entity.originalTemplateId = model.originalTemplateId;
		entity.sourceCalculationResultId = model.sourceCalculationResultId;
		entity.category = model.category;
		entity.subcategory = model.subcategory;
		entity.targetProfessions = model.targetProfessions;
		entity.difficulty = model.difficulty;
		entity.estimatedTime = model.estimatedTime;
		entity.necReference = model.necReference;
		entity.tags = model.tags;
		entity.parameters = model.parameters;
		entity.formula = model.formula;
		entity.isPublic = model.isPublic;
		entity.version = model.version;
		entity.requirements = model.requirements;
		entity.applicationCases = model.applicationCases;
		entity.limitations = model.limitations;
		entity.sharedWith = model.sharedWith;
		entity.contributors = model.contributors;

		return entity;
	}

	private mapParameterType(
		dataType: string
	): "number" | "text" | "select" | "boolean" {
		switch (dataType) {
			case "number":
				return "number";
			case "boolean":
				return "boolean";
			case "enum":
				return "select";
			default:
				return "text";
		}
	}

	private async getCountsByField(
		userId: string,
		field: string
	): Promise<Record<string, number>> {
		const counts = await this.repository
			.createQueryBuilder("template")
			.select(`template.${field}`, "value")
			.addSelect("COUNT(*)", "count")
			.where("template.user_id = :userId", {userId})
			.groupBy(`template.${field}`)
			.getRawMany();

		const result: Record<string, number> = {};
		counts.forEach((item) => {
			result[item.value] = parseInt(item.count, 10);
		});

		return result;
	}

	private async getRecentActivity(userId: string) {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

		const [createdThisWeek, updatedThisWeek] = await Promise.all([
			this.repository.count({
				where: {
					userId,
					createdAt: {$gte: oneWeekAgo} as any,
				},
			}),
			this.repository.count({
				where: {
					userId,
					updatedAt: {$gte: oneWeekAgo} as any,
				},
			}),
		]);

		return {
			createdThisWeek,
			updatedThisWeek,
			usedThisWeek: 0, // TODO: Implementar desde usage logs
		};
	}
}
