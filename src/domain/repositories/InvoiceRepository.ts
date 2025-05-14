// src/domain/repositories/InvoiceRepository.ts
import {Invoice} from "../models/invoice/Invoice";

export interface InvoiceRepository {
	findById(id: string): Promise<Invoice | null>;
	findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
	findAll(
		page?: number,
		limit?: number,
		filters?: any
	): Promise<{invoices: Invoice[]; total: number; pages: number}>;
	create(invoiceData: Partial<Invoice>): Promise<Invoice>;
	update(id: string, data: Partial<Invoice>): Promise<Invoice | null>;
	delete(id: string): Promise<boolean>;
	generateInvoiceNumber(): Promise<string>;
}
