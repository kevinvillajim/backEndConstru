// src/domain/repositories/OrderItemRepository.ts
import {OrderItem} from "../models/order/OrderItem";

export interface OrderItemRepository {
	findById(id: string): Promise<OrderItem | null>;
	findByOrder(orderId: string): Promise<OrderItem[]>;
	findByMaterial(materialId: string): Promise<OrderItem[]>;
	findByMaterialRequest(requestId: string): Promise<OrderItem | null>;
	create(item: OrderItem): Promise<OrderItem>;
	createMany(items: OrderItem[]): Promise<OrderItem[]>;
	update(id: string, data: Partial<OrderItem>): Promise<OrderItem | null>;
	delete(id: string): Promise<boolean>;
	updateStatus(id: string, status: string): Promise<boolean>;
}
