// src/domain/models/Invoice.ts
import {InvoiceItem} from "./InvoiceItem";
import {
	InvoiceStatus,
	InvoiceType,
	PaymentMethod,
} from "../../../infrastructure/database/entities/InvoiceEntity";

export interface Invoice {
	id: string;
	invoiceNumber: string;
	type: InvoiceType;
	issueDate: Date;
	dueDate: Date;
	subtotal: number;
	taxPercentage: number;
	tax: number;
	discountPercentage: number;
	discount: number;
	total: number;
	amountPaid: number;
	amountDue: number;
	paymentMethod?: PaymentMethod;
	paymentReference?: string;
	paymentDate?: Date;
	sriAuthorization?: string;
	sriAccessKey?: string;
	electronicInvoiceUrl?: string;
	notes?: string;
	status: InvoiceStatus;
	clientId: string;
	sellerId: string;
	projectId?: string;
	items: InvoiceItem[];
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}
