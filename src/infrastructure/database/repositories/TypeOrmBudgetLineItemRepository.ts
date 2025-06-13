// src/infrastructure/database/repositories/TypeOrmBudgetLineItemRepository.ts
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { BudgetLineItemRepository } from "../../../domain/repositories/BudgetLineItemRepository";
import { BudgetLineItem, CreateBudgetLineItemDTO, LineItemType, LineItemSource } from "../../../domain/models/calculation/BudgetLineItem";
import { BudgetLineItemEntity } from "../entities/BudgetLineItemEntity";

export class TypeOrmBudgetLineItemRepository implements BudgetLineItemRepository {
	private repository: Repository<BudgetLineItemEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(BudgetLineItemEntity);
	}

	async findById(id: string): Promise<BudgetLineItem | null> {
		const lineItem = await this.repository.findOne({
			where: {id},
			relations: ["material", "sourceCalculation"],
		});

		return lineItem ? this.toDomainModel(lineItem) : null;
	}

	async save(item: BudgetLineItemEntity): Promise<BudgetLineItemEntity> {
		// Si es una entidad nueva, generar ID
		if (!item.id) {
			item.id = uuidv4(); // Asegurar que uuid esté importado
			item.createdAt = new Date();
		}

		// Siempre actualizar updatedAt
		item.updatedAt = new Date();

		// Guardar en base de datos
		return await this.repository.save(item);
	}

	async findByBudget(calculationBudgetId: string): Promise<BudgetLineItemEntity[]> {
		return await this.repository.find({
			where: {calculationBudgetId},
			relations: ["material"],
			order: {displayOrder: "ASC", createdAt: "ASC"},
		});
	}

	async findByType(
		calculationBudgetId: string,
		itemType: LineItemType
	): Promise<BudgetLineItem[]> {
		const lineItems = await this.repository.find({
			where: {
				calculationBudgetId,
				itemType,
			},
			relations: ["material"],
			order: {displayOrder: "ASC"},
		});

		return lineItems.map((item) => this.toDomainModel(item));
	}

	async findBySource(
		calculationBudgetId: string,
		source: LineItemSource
	): Promise<BudgetLineItem[]> {
		const lineItems = await this.repository.find({
			where: {
				calculationBudgetId,
				source,
			},
			relations: ["material", "sourceCalculation"],
			order: {displayOrder: "ASC"},
		});

		return lineItems.map((item) => this.toDomainModel(item));
	}

	async findByCalculationResult(
		sourceCalculationId: string
	): Promise<BudgetLineItem[]> {
		const lineItems = await this.repository.find({
			where: {sourceCalculationId},
			relations: ["calculationBudget", "material"],
		});

		return lineItems.map((item) => this.toDomainModel(item));
	}

	async findByMaterial(materialId: string): Promise<BudgetLineItem[]> {
		const lineItems = await this.repository.find({
			where: {materialId},
			relations: ["calculationBudget", "material"],
		});

		return lineItems.map((item) => this.toDomainModel(item));
	}

	async create(lineItemData: CreateBudgetLineItemDTO): Promise<BudgetLineItem> {
		const lineItemEntity = this.toEntity(lineItemData);
		const savedLineItem = await this.repository.save(lineItemEntity);
		return this.toDomainModel(savedLineItem);
	}

	async createMany(
		lineItemsData: CreateBudgetLineItemDTO[]
	): Promise<BudgetLineItem[]> {
		const lineItemEntities = lineItemsData.map((data) => this.toEntity(data));
		const savedLineItems = await this.repository.save(lineItemEntities);
		return savedLineItems.map((item) => this.toDomainModel(item));
	}

	async update(
		id: string,
		lineItemData: Partial<BudgetLineItem>
	): Promise<BudgetLineItem | null> {
		const lineItem = await this.repository.findOne({where: {id}});
		if (!lineItem) return null;

		Object.assign(lineItem, lineItemData);
		const updatedLineItem = await this.repository.save(lineItem);
		return this.toDomainModel(updatedLineItem);
	}

	async updateQuantity(
		id: string,
		quantity: number,
		finalQuantity?: number
	): Promise<BudgetLineItem | null> {
		const lineItem = await this.repository.findOne({where: {id}});
		if (!lineItem) return null;

		lineItem.quantity = quantity;
		lineItem.finalQuantity = finalQuantity || quantity;
		lineItem.subtotal = lineItem.finalQuantity * lineItem.unitPrice;

		const updatedLineItem = await this.repository.save(lineItem);
		return this.toDomainModel(updatedLineItem);
	}

	async updatePrice(
		id: string,
		unitPrice: number
	): Promise<BudgetLineItem | null> {
		const lineItem = await this.repository.findOne({where: {id}});
		if (!lineItem) return null;

		lineItem.unitPrice = unitPrice;
		lineItem.subtotal = lineItem.finalQuantity * unitPrice;
		lineItem.priceDate = new Date();

		const updatedLineItem = await this.repository.save(lineItem);
		return this.toDomainModel(updatedLineItem);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== 0;
	}

	async deleteByBudget(calculationBudgetId: string): Promise<boolean> {
		const result = await this.repository.delete({calculationBudgetId});
		return result.affected !== 0;
	}

	async getTotalByCategory(
		calculationBudgetId: string,
		category: string
	): Promise<number> {
		const result = await this.repository
			.createQueryBuilder("lineItem")
			.select("SUM(lineItem.subtotal)", "total")
			.where("lineItem.calculationBudgetId = :calculationBudgetId", {
				calculationBudgetId,
			})
			.andWhere("lineItem.category = :category", {category})
			.getRawOne();

		return parseFloat(result.total) || 0;
	}

	async getTotalByType(
		calculationBudgetId: string,
		itemType: LineItemType
	): Promise<number> {
		const result = await this.repository
			.createQueryBuilder("lineItem")
			.select("SUM(lineItem.subtotal)", "total")
			.where("lineItem.calculationBudgetId = :calculationBudgetId", {
				calculationBudgetId,
			})
			.andWhere("lineItem.itemType = :itemType", {itemType})
			.getRawOne();

		return parseFloat(result.total) || 0;
	}

	private toDomainModel(entity: BudgetLineItemEntity): BudgetLineItem {
		return {
			id: entity.id,
			description: entity.description,
			specifications: entity.specifications,
			itemType: entity.itemType,
			source: entity.source,
			calculationBudgetId: entity.calculationBudgetId,
			sourceCalculationId: entity.sourceCalculationId,
			calculationParameterKey: entity.calculationParameterKey,
			materialId: entity.materialId,
			quantity: entity.quantity,
			unitOfMeasure: entity.unitOfMeasure,
			unitPrice: entity.unitPrice,
			wastePercentage: entity.wastePercentage,
			finalQuantity: entity.finalQuantity,
			subtotal: entity.subtotal,
			category: entity.category,
			subcategory: entity.subcategory,
			chapter: entity.chapter,
			costCode: entity.costCode,
			regionalFactor: entity.regionalFactor,
			difficultyFactor: entity.difficultyFactor,
			necReference: entity.necReference,
			priceDate: entity.priceDate,
			priceSource: entity.priceSource,
			priceValidityDays: entity.priceValidityDays,
			metadata: entity.metadata,
			displayOrder: entity.displayOrder,
			isOptional: entity.isOptional,
			isAlternate: entity.isAlternate,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	private toEntity(model: CreateBudgetLineItemDTO): BudgetLineItemEntity {
		const entity = new BudgetLineItemEntity();
		Object.assign(entity, model);
		return entity;
	}
}

function uuidv4(): string {
  throw new Error("Function not implemented.");
}
