// src/domain/repositories/OrderRepository.ts
import {Order} from "../models/order/Order";

export interface OrderRepository {
	findById(id: string): Promise<Order | null>;
	findByProject(projectId: string): Promise<Order[]>;
	findByUser(userId: string, filters?: any): Promise<Order[]>;
	create(order: Order): Promise<Order>;
	update(id: string, data: Partial<Order>): Promise<Order | null>;
	delete(id: string): Promise<boolean>;
	updateStatus(id: string, status: string): Promise<boolean>;
	updatePaymentStatus(id: string, status: string): Promise<boolean>;
}