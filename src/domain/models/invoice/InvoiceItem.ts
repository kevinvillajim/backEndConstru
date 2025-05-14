// src/domain/models/InvoiceItem.ts
export interface InvoiceItem {
	id: string;
	quantity: number;
	price: number;
	subtotal: number;
	tax: number;
	total: number;
	invoiceId: string;
	materialId?: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
}
