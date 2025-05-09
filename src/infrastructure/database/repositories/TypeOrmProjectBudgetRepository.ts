// src/infrastructure/database/repositories/TypeOrmProjectBudgetRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {ProjectBudgetRepository} from "@domain/repositories/ProjectBudgetRepository";
import {ProjectBudget} from "@domain/models/project/ProjectBudget";
import {ProjectBudgetEntity} from "../entities/ProjectBudgetEntity";

export class TypeOrmProjectBudgetRepository implements ProjectBudgetRepository {
	private repository: Repository<ProjectBudgetEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(ProjectBudgetEntity);
	}

	async findById(id: string): Promise<ProjectBudget | null> {
		const budget = await this.repository.findOne({
			where: {id},
			relations: ["items"],
		});

		return budget ? this.toDomainModel(budget) : null;
	}

	async findByProject(projectId: string): Promise<ProjectBudget[]> {
		const budgets = await this.repository.find({
			where: {projectId},
			order: {version: "DESC"},
		});

		return budgets.map((budget) => this.toDomainModel(budget));
	}

	async findLatestVersion(projectId: string): Promise<ProjectBudget | null> {
		const budget = await this.repository.findOne({
			where: {projectId},
			order: {version: "DESC"},
		});

		return budget ? this.toDomainModel(budget) : null;
	}

	async findAll(
		filters?: any,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{budgets: ProjectBudget[]; total: number}> {
		let queryBuilder = this.repository.createQueryBuilder("budget");

		// Aplicar filtros
		if (filters) {
			if (filters.projectId) {
				queryBuilder = queryBuilder.andWhere("budget.project_id = :projectId", {
					projectId: filters.projectId,
				});
			}

			if (filters.status) {
				queryBuilder = queryBuilder.andWhere("budget.status = :status", {
					status: filters.status,
				});
			}

			if (filters.searchTerm) {
				queryBuilder = queryBuilder.andWhere(
					"(budget.name LIKE :term OR budget.description LIKE :term)",
					{term: `%${filters.searchTerm}%`}
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
					`budget.${pagination.sortBy}`,
					order
				);
			} else {
				// Ordenamiento por defecto
				queryBuilder = queryBuilder.orderBy("budget.created_at", "DESC");
			}
		}

		// Ejecutar consulta
		const budgetEntities = await queryBuilder.getMany();

		// Convertir a modelos de dominio
		const budgets = budgetEntities.map((entity) => this.toDomainModel(entity));

		return {budgets, total};
	}

	async create(budget: ProjectBudget): Promise<ProjectBudget> {
		const budgetEntity = this.toEntity(budget);
		const savedBudget = await this.repository.save(budgetEntity);
		return this.toDomainModel(savedBudget);
	}

	async update(
		id: string,
		budgetData: Partial<ProjectBudget>
	): Promise<ProjectBudget | null> {
		const budget = await this.repository.findOne({where: {id}});

		if (!budget) return null;

		// Actualizar campos
		Object.assign(budget, budgetData);

		const updatedBudget = await this.repository.save(budget);
		return this.toDomainModel(updatedBudget);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== 0;
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: ProjectBudgetEntity): ProjectBudget {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			status: entity.status,
			version: entity.version,
			subtotal: entity.subtotal,
			taxPercentage: entity.taxPercentage,
			tax: entity.tax,
			total: entity.total,
			projectId: entity.projectId,
			items: entity.items?.map((item) => ({
				id: item.id,
				description: item.description,
				quantity: item.quantity,
				unitOfMeasure: item.unitOfMeasure,
				unitPrice: item.unitPrice,
				subtotal: item.subtotal,
				category: item.category,
				budgetId: item.budgetId,
				materialId: item.materialId,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
			})),
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	private toEntity(model: ProjectBudget): ProjectBudgetEntity {
		const entity = new ProjectBudgetEntity();

		// Copiar campos básicos
		entity.id = model.id;
		entity.name = model.name;
		entity.description = model.description;
		entity.status = model.status;
		entity.version = model.version;
		entity.subtotal = model.subtotal;
		entity.taxPercentage = model.taxPercentage;
		entity.tax = model.tax;
		entity.total = model.total;
		entity.projectId = model.projectId;

		// No copiar items, se manejan por separado

		return entity;
	}
}