// src/infrastructure/database/repositories/TypeOrmUserInteractionRepository.ts
import {Repository} from "typeorm";
import {UserInteraction} from "@domain/models/user/UserInteraction";
import {UserInteractionRepository} from "@domain/repositories/UserInteractionRepository";
import {
	UserInteractionEntity,
	InteractionType,
} from "../entities/UserInteractionEntity";
import {AppDataSource} from "../data-source";

export class TypeOrmUserInteractionRepository
	implements UserInteractionRepository
{
	private repository: Repository<UserInteractionEntity>;

	constructor() {
		if (!AppDataSource.isInitialized) {
			throw new Error("Database is not initialized");
		}
		this.repository = AppDataSource.getRepository(UserInteractionEntity);
	}

	async findByUserId(
		userId: string,
		options?: {
			limit?: number;
			startDate?: Date;
			endDate?: Date;
			types?: string[];
		}
	): Promise<UserInteraction[]> {
		let query = this.repository
			.createQueryBuilder("interaction")
			.where("interaction.userId = :userId", {userId});

		if (options?.startDate) {
			query = query.andWhere("interaction.createdAt >= :startDate", {
				startDate: options.startDate,
			});
		}

		if (options?.endDate) {
			query = query.andWhere("interaction.createdAt <= :endDate", {
				endDate: options.endDate,
			});
		}

		if (options?.types && options.types.length > 0) {
			query = query.andWhere("interaction.type IN (:...types)", {
				types: options.types,
			});
		}

		query = query.orderBy("interaction.createdAt", "DESC");

		if (options?.limit) {
			query = query.limit(options.limit);
		}

		const interactions = await query.getMany();
		return interactions.map((entity) => this.toDomainModel(entity));
	}

	async findBySessionId(sessionId: string): Promise<UserInteraction[]> {
		const interactions = await this.repository.find({
			where: {sessionId},
			order: {createdAt: "ASC"},
		});

		return interactions.map((entity) => this.toDomainModel(entity));
	}

	async findPopularMaterials(options?: {
		limit?: number;
		startDate?: Date;
		endDate?: Date;
		professionalType?: string;
	}): Promise<Array<{materialId: string; count: number}>> {
		let query = this.repository
			.createQueryBuilder("interaction")
			.select("interaction.materialId", "materialId")
			.addSelect("COUNT(interaction.id)", "count")
			.where("interaction.materialId IS NOT NULL");

		if (options?.startDate) {
			query = query.andWhere("interaction.createdAt >= :startDate", {
				startDate: options.startDate,
			});
		}

		if (options?.endDate) {
			query = query.andWhere("interaction.createdAt <= :endDate", {
				endDate: options.endDate,
			});
		}

		if (options?.professionalType) {
			query = query
				.innerJoin("interaction.user", "user")
				.andWhere("user.professionalType = :professionalType", {
					professionalType: options.professionalType,
				});
		}

		query = query.groupBy("interaction.materialId").orderBy("count", "DESC");

		if (options?.limit) {
			query = query.limit(options.limit);
		}

		const results = await query.getRawMany();

		return results.map((item) => ({
			materialId: item.materialId,
			count: parseInt(item.count, 10),
		}));
	}

	async findPopularTemplates(options?: {
		limit?: number;
		startDate?: Date;
		endDate?: Date;
		professionalType?: string;
	}): Promise<Array<{templateId: string; count: number}>> {
		// Similar a findPopularMaterials pero para plantillas de cálculo
		// Implementación omitida por brevedad
		return [];
	}

	async create(
		interaction: Omit<UserInteraction, "id">
	): Promise<UserInteraction> {
		const entity = this.toEntity(interaction as UserInteraction);
		const savedEntity = await this.repository.save(entity);
		return this.toDomainModel(savedEntity);
	}

	async bulkCreate(
		interactions: Array<Omit<UserInteraction, "id">>
	): Promise<UserInteraction[]> {
		const entities = interactions.map((interaction) =>
			this.toEntity(interaction as UserInteraction)
		);

		const savedEntities = await this.repository.save(entities);
		return savedEntities.map((entity) => this.toDomainModel(entity));
	}

	private toDomainModel(entity: UserInteractionEntity): UserInteraction {
		return {
			id: entity.id,
			userId: entity.userId,
			type: entity.type,
			materialId: entity.materialId,
			categoryId: entity.categoryId,
			projectId: entity.projectId,
			searchQuery: entity.searchQuery,
			metadata: entity.metadata,
			sessionId: entity.sessionId,
			ipAddress: entity.ipAddress,
			userAgent: entity.userAgent,
			createdAt: entity.createdAt,
		};
	}

	private toEntity(model: UserInteraction): UserInteractionEntity {
		const entity = new UserInteractionEntity();
		Object.assign(entity, model);
		return entity;
	}
}
