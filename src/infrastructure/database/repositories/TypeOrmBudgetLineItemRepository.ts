// src/infrastructure/database/repositories/TypeOrmBudgetLineItemRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {BudgetLineItemRepository} from "../../../domain/repositories/BudgetLineItemRepository";
import {
	BudgetLineItem,
	CreateBudgetLineItemDTO,
	LineItemType,
	LineItemSource,
	LaborType,
} from "../../../domain/models/calculation/BudgetLineItem";
import {
	BudgetLineItemEntity,
	ItemType,
	ItemSource,
	LaborType as EntityLaborType,
} from "../entities/BudgetLineItemEntity";
import {v4 as uuidv4} from "uuid";

export class TypeOrmBudgetLineItemRepository
	implements BudgetLineItemRepository
{
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
			item.id = uuidv4();
			item.createdAt = new Date();
		}

		// Siempre actualizar updatedAt
		item.updatedAt = new Date();

		// Guardar en base de datos
		return await this.repository.save(item);
	}

	async findByBudget(
		calculationBudgetId: string
	): Promise<BudgetLineItemEntity[]> {
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
				itemType: this.mapDomainItemTypeToEntity(itemType),
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
				source: this.mapDomainSourceToEntity(source),
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

		// Convert domain types to entity types before assignment
		const entityData = this.convertDomainDataToEntityData(lineItemData);
		Object.assign(lineItem, entityData);

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
			.andWhere("lineItem.itemType = :itemType", {
				itemType: this.mapDomainItemTypeToEntity(itemType),
			})
			.getRawOne();

		return parseFloat(result.total) || 0;
	}

	// Mapping methods for converting between domain and entity enums
	private mapDomainItemTypeToEntity(domainType: LineItemType): ItemType {
		const mapping: Record<LineItemType, ItemType> = {
			[LineItemType.MATERIAL]: ItemType.MATERIAL,
			[LineItemType.LABOR]: ItemType.LABOR,
			[LineItemType.EQUIPMENT]: ItemType.EQUIPMENT,
			[LineItemType.SUBCONTRACT]: ItemType.SUBCONTRACT,
			[LineItemType.PROFESSIONAL]: ItemType.OTHER, // Map to OTHER since PROFESSIONAL doesn't exist in entity
			[LineItemType.INDIRECT]: ItemType.OTHER, // Map to OTHER since INDIRECT doesn't exist in entity
			[LineItemType.CONTINGENCY]: ItemType.OTHER, // Map to OTHER since CONTINGENCY doesn't exist in entity
			[LineItemType.OTHER]: ItemType.OTHER,
		};
		return mapping[domainType];
	}

	private mapEntityItemTypeToDomain(entityType: ItemType): LineItemType {
		const mapping: Record<ItemType, LineItemType> = {
			[ItemType.MATERIAL]: LineItemType.MATERIAL,
			[ItemType.LABOR]: LineItemType.LABOR,
			[ItemType.EQUIPMENT]: LineItemType.EQUIPMENT,
			[ItemType.SUBCONTRACT]: LineItemType.SUBCONTRACT,
			[ItemType.OTHER]: LineItemType.OTHER,
		};
		return mapping[entityType];
	}

	private mapDomainSourceToEntity(domainSource: LineItemSource): ItemSource {
		const mapping: Record<LineItemSource, ItemSource> = {
			[LineItemSource.CALCULATION]: ItemSource.CALCULATION,
			[LineItemSource.MANUAL]: ItemSource.MANUAL,
			[LineItemSource.TEMPLATE]: ItemSource.TEMPLATE,
			[LineItemSource.IMPORTED]: ItemSource.IMPORTED,
		};
		return mapping[domainSource];
	}

	private mapEntitySourceToDomain(entitySource: ItemSource): LineItemSource {
		const mapping: Record<ItemSource, LineItemSource> = {
			[ItemSource.CALCULATION]: LineItemSource.CALCULATION,
			[ItemSource.MANUAL]: LineItemSource.MANUAL,
			[ItemSource.TEMPLATE]: LineItemSource.TEMPLATE,
			[ItemSource.IMPORTED]: LineItemSource.IMPORTED,
		};
		return mapping[entitySource];
	}

	private mapDomainLaborTypeToEntity(
		domainLaborType?: LaborType
	): EntityLaborType | undefined {
		if (!domainLaborType) return undefined;

		const mapping: Record<LaborType, EntityLaborType> = {
			[LaborType.GENERAL]: EntityLaborType.GENERAL,
			[LaborType.SPECIALIZED]: EntityLaborType.SPECIALIZED,
			[LaborType.TECHNICAL]: EntityLaborType.TECHNICAL,
			[LaborType.SUPERVISION]: EntityLaborType.SUPERVISION,
			[LaborType.SKILLED]: EntityLaborType.SKILLED,
			[LaborType.UNSKILLED]: EntityLaborType.UNSKILLED,
		};
		return mapping[domainLaborType];
	}

	private mapEntityLaborTypeToDomain(
		entityLaborType?: EntityLaborType
	): LaborType | undefined {
		if (!entityLaborType) return undefined;

		const mapping: Record<EntityLaborType, LaborType> = {
			[EntityLaborType.GENERAL]: LaborType.GENERAL,
			[EntityLaborType.SPECIALIZED]: LaborType.SPECIALIZED,
			[EntityLaborType.TECHNICAL]: LaborType.TECHNICAL,
			[EntityLaborType.SUPERVISION]: LaborType.SUPERVISION,
			[EntityLaborType.SKILLED]: LaborType.SKILLED,
			[EntityLaborType.UNSKILLED]: LaborType.UNSKILLED,
		};
		return mapping[entityLaborType];
	}

	private convertDomainDataToEntityData(
		domainData: Partial<BudgetLineItem>
	): Partial<BudgetLineItemEntity> {
		const entityData: any = {...domainData};

		if (domainData.itemType) {
			entityData.itemType = this.mapDomainItemTypeToEntity(domainData.itemType);
		}

		if (domainData.source) {
			entityData.source = this.mapDomainSourceToEntity(domainData.source);
		}

		if (domainData.laborType) {
			entityData.laborType = this.mapDomainLaborTypeToEntity(
				domainData.laborType
			);
		}

		return entityData;
	}

	private toDomainModel(entity: BudgetLineItemEntity): BudgetLineItem {
		return {
			id: entity.id,
			description: entity.description,
			specifications: entity.specifications,
			itemType: this.mapEntityItemTypeToDomain(entity.itemType),
			source: this.mapEntitySourceToDomain(entity.source),
			laborType: this.mapEntityLaborTypeToDomain(entity.laborType),
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

		// Map basic properties
		Object.assign(entity, {
			...model,
			// Convert domain enums to entity enums
			itemType: this.mapDomainItemTypeToEntity(model.itemType),
			source: this.mapDomainSourceToEntity(model.source),
			laborType: this.mapDomainLaborTypeToEntity(model.laborType),
		});

		return entity;
	}
}
