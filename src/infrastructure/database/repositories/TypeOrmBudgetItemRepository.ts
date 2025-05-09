// src/infrastructure/database/repositories/TypeOrmBudgetItemRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {BudgetItemRepository} from "@domain/repositories/BudgetItemRepository";
import {BudgetItem} from "@domain/models/project/BudgetItem";
import {BudgetItemEntity} from "../entities/BudgetItemEntity";

export class TypeOrmBudgetItemRepository implements BudgetItemRepository {
	private repository: Repository<BudgetItemEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(BudgetItemEntity);
	}

	async findById(id: string): Promise<BudgetItem | null> {
		const item = await this.repository.findOne({
			where: {id},
			relations: ["material"],
		});

		return item ? this.toDomainModel(item) : null;
	}

	async findByBudget(budgetId: string): Promise<BudgetItem[]> {
		const items = await this.repository.find({
			where: {budgetId},
			relations: ["material"],
		});

		return items.map((item) => this.toDomainModel(item));
	}

	async create(item: BudgetItem): Promise<BudgetItem> {
		const itemEntity = this.toEntity(item);
		const savedItem = await this.repository.save(itemEntity);
		return this.toDomainModel(savedItem);
	}

	async createMany(items: BudgetItem[]): Promise<BudgetItem[]> {
		const itemEntities = items.map((item) => this.toEntity(item));
		const savedItems = await this.repository.save(itemEntities);
		return savedItems.map((item) => this.toDomainModel(item));
	}

	async update(
		id: string,
		itemData: Partial<BudgetItem>
	): Promise<BudgetItem | null> {
		const item = await this.repository.findOne({where: {id}});

		if (!item) return null;

		// Actualizar campos
		Object.assign(item, itemData);

		const updatedItem = await this.repository.save(item);
		return this.toDomainModel(updatedItem);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== 0;
	}

	async deleteByBudget(budgetId: string): Promise<boolean> {
		const result = await this.repository.delete({budgetId});
		return result.affected !== 0;
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: BudgetItemEntity): BudgetItem {
		return {
			id: entity.id,
			description: entity.description,
			quantity: entity.quantity,
			unitOfMeasure: entity.unitOfMeasure,
			unitPrice: entity.unitPrice,
			subtotal: entity.subtotal,
			category: entity.category,
			budgetId: entity.budgetId,
			materialId: entity.materialId,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	private toEntity(model: BudgetItem): BudgetItemEntity {
		const entity = new BudgetItemEntity();

		// Copiar campos
		Object.assign(entity, model);

		return entity;
	}
}
