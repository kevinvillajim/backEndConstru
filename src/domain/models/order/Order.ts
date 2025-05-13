// src/domain/models/order/Order.ts
export enum OrderStatus {
	PENDING = "pending",
	PROCESSING = "processing",
	SHIPPED = "shipped",
	DELIVERED = "delivered",
	CANCELLED = "cancelled",
}

export enum PaymentStatus {
	PENDING = "pending",
	PAID = "paid",
	REFUNDED = "refunded",
	FAILED = "failed",
}

export interface Order {
	id: string;
	projectId: string;
	userId: string;
	reference: string;
	status: OrderStatus;
	paymentStatus: PaymentStatus;
	subtotal: number;
	taxAmount: number;
	shippingAmount: number;
	discountAmount: number;
	total: number;
	notes?: string;
	shippingAddress: {
		street: string;
		city: string;
		province: string;
		postalCode: string;
		additionalInfo?: string;
		latitude?: number;
		longitude?: number;
	};
	estimatedDeliveryDate?: Date;
	actualDeliveryDate?: Date;
	trackingInfo?: {
		carrier: string;
		trackingNumber: string;
		trackingUrl?: string;
	};
	createdAt: Date;
	updatedAt: Date;
}
