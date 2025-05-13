// src/infrastructure/database/repositories/TypeOrmOrderItemRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {OrderItemRepository} from "@domain/repositories/OrderItemRepository";
import {OrderItem} from "@domain/models/order/OrderItem";
import {OrderItemEntity} from "../entities/OrderItemEntity";

export class TypeOrmOrderItemRepository implements OrderItemRepository {
	private repository: Repository<OrderItemEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(OrderItemEntity);
	}

	async findById(id: string): Promise<OrderItem | null> {
		const item = await this.repository.findOne({
			where: {id},
			relations: ["material"],
		});

		return item ? this.toDomainModel(item) : null;
	}

	async findByOrder(orderId: string): Promise<OrderItem[]> {
		const items = await this.repository.find({
			where: {orderId},
			relations: ["material"],
			order: {createdAt: "ASC"},
		});

		return items.map((item) => this.toDomainModel(item));
	}

	async findByMaterial(materialId: string): Promise<OrderItem[]> {
		const items = await this.repository.find({
			where: {materialId},
		});

		return items.map((item) => this.toDomainModel(item));
	}

	async findByMaterialRequest(requestId: string): Promise<OrderItem | null> {
		const item = await this.repository.findOne({
			where: {materialRequestId: requestId},
		});

		return item ? this.toDomainModel(item) : null;
	}

	async create(item: OrderItem): Promise<OrderItem> {
		const entity = this.toEntity(item);
		const savedItem = await this.repository.save(entity);
		return this.toDomainModel(savedItem);
	}

	async createMany(items: OrderItem[]): Promise<OrderItem[]> {
		const entities = items.map((item) => this.toEntity(item));
		const savedItems = await this.repository.save(entities);
		return savedItems.map((item) => this.toDomainModel(item));
	}

	async update(
		id: string,
		data: Partial<OrderItem>
	): Promise<OrderItem | null> {
		const item = await this.repository.findOne({where: {id}});

		if (!item) return null;

		Object.assign(item, data);
		const updatedItem = await this.repository.save(item);
		return this.toDomainModel(updatedItem);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	async updateStatus(id: string, status: string): Promise<boolean> {
		const result = await this.repository.update(id, {
			status,
			updatedAt: new Date(),
		});
		return result.affected !== undefined && result.affected > 0;
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: OrderItemEntity): OrderItem {
		return {
			id: entity.id,
			orderId: entity.orderId,
			materialId: entity.materialId,
			quantity: entity.quantity,
			unitPrice: entity.unitPrice,
			subtotal: entity.subtotal,
			status: entity.status,
			materialRequestId: entity.materialRequestId,
			notes: entity.notes,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	private toEntity(model: OrderItem): OrderItemEntity {
		const entity = new OrderItemEntity();

		entity.id = model.id;
		entity.orderId = model.orderId;
		entity.materialId = model.materialId;
		entity.quantity = model.quantity;
		entity.unitPrice = model.unitPrice;
		entity.subtotal = model.subtotal;

		// Verificar que status sea uno de los valores válidos
		const validStatus = [
			"pending",
			"processing",
			"shipped",
			"delivered",
			"cancelled",
		];
		entity.status = validStatus.includes(model.status)
			? (model.status as
					| "pending"
					| "processing"
					| "shipped"
					| "delivered"
					| "cancelled")
			: "pending";

		entity.materialRequestId = model.materialRequestId;
		entity.notes = model.notes;
		entity.createdAt = model.createdAt;
		entity.updatedAt = model.updatedAt;

		return entity;
	}
}
