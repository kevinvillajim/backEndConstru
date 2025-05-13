// src/domain/models/order/OrderItem.ts
export interface OrderItem {
	id: string;
	orderId: string;
	materialId: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
	status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"; // Tipos explícitos
	materialRequestId?: string;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}