// src/infrastructure/database/repositories/TypeOrmOrderRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {OrderRepository} from "../../../domain/repositories/OrderRepository";
import {
	Order,
	OrderStatus,
	PaymentStatus,
} from "../../../domain/models/order/Order";
import {OrderEntity} from "../entities/OrderEntity";

export class TypeOrmOrderRepository implements OrderRepository {
	private repository: Repository<OrderEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(OrderEntity);
	}

	async findById(id: string): Promise<Order | null> {
		const order = await this.repository.findOne({
			where: {id},
			relations: ["user", "project"],
		});

		return order ? this.toDomainModel(order) : null;
	}

	async findByProject(projectId: string): Promise<Order[]> {
		const orders = await this.repository.find({
			where: {projectId},
			order: {createdAt: "DESC"},
		});

		return orders.map((order) => this.toDomainModel(order));
	}

	async findByUser(userId: string, filters?: any): Promise<Order[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("order")
			.where("order.user_id = :userId", {userId});

		// Aplicar filtros
		if (filters) {
			if (filters.status) {
				queryBuilder = queryBuilder.andWhere("order.status = :status", {
					status: filters.status,
				});
			}

			if (filters.paymentStatus) {
				queryBuilder = queryBuilder.andWhere(
					"order.payment_status = :paymentStatus",
					{
						paymentStatus: filters.paymentStatus,
					}
				);
			}

			if (filters.startDate) {
				queryBuilder = queryBuilder.andWhere("order.created_at >= :startDate", {
					startDate: filters.startDate,
				});
			}

			if (filters.endDate) {
				queryBuilder = queryBuilder.andWhere("order.created_at <= :endDate", {
					endDate: filters.endDate,
				});
			}
		}

		// Ordenar por fecha de creación
		queryBuilder = queryBuilder.orderBy("order.created_at", "DESC");

		const orders = await queryBuilder.getMany();
		return orders.map((order) => this.toDomainModel(order));
	}

	async create(order: Order): Promise<Order> {
		const entity = this.toEntity(order);
		const savedOrder = await this.repository.save(entity);
		return this.toDomainModel(savedOrder);
	}

	async update(id: string, data: Partial<Order>): Promise<Order | null> {
		const order = await this.repository.findOne({where: {id}});

		if (!order) return null;

		Object.assign(order, data);
		const updatedOrder = await this.repository.save(order);
		return this.toDomainModel(updatedOrder);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	async updateStatus(id: string, status: string): Promise<boolean> {
		const result = await this.repository.update(id, {
			status: status as OrderStatus,
			updatedAt: new Date(),
		});
		return result.affected !== undefined && result.affected > 0;
	}

	async updatePaymentStatus(id: string, status: string): Promise<boolean> {
		const result = await this.repository.update(id, {
			paymentStatus: status as PaymentStatus,
			updatedAt: new Date(),
		});
		return result.affected !== undefined && result.affected > 0;
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: OrderEntity): Order {
		return {
			id: entity.id,
			projectId: entity.projectId,
			userId: entity.userId,
			reference: entity.reference,
			status: entity.status,
			paymentStatus: entity.paymentStatus,
			subtotal: entity.subtotal,
			taxAmount: entity.taxAmount,
			shippingAmount: entity.shippingAmount,
			discountAmount: entity.discountAmount,
			total: entity.total,
			notes: entity.notes,
			shippingAddress: entity.shippingAddress,
			estimatedDeliveryDate: entity.estimatedDeliveryDate,
			actualDeliveryDate: entity.actualDeliveryDate,
			trackingInfo: entity.trackingInfo,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	private toEntity(model: Order): OrderEntity {
		const entity = new OrderEntity();

		entity.id = model.id;
		entity.projectId = model.projectId;
		entity.userId = model.userId;
		entity.reference = model.reference;
		entity.status = model.status;
		entity.paymentStatus = model.paymentStatus;
		entity.subtotal = model.subtotal;
		entity.taxAmount = model.taxAmount;
		entity.shippingAmount = model.shippingAmount;
		entity.discountAmount = model.discountAmount;
		entity.total = model.total;
		entity.notes = model.notes;
		entity.shippingAddress = model.shippingAddress;
		entity.estimatedDeliveryDate = model.estimatedDeliveryDate;
		entity.actualDeliveryDate = model.actualDeliveryDate;
		entity.trackingInfo = model.trackingInfo;
		entity.createdAt = model.createdAt;
		entity.updatedAt = model.updatedAt;

		return entity;
	}
}
