// src/domain/models/project/BudgetItem.ts
export interface BudgetItem {
	id: string;
	description: string;
	quantity: number;
	unitOfMeasure: string;
	unitPrice: number;
	subtotal: number;
	category?: string;
	budgetId: string;
	materialId?: string;
	createdAt: Date;
	updatedAt: Date;
}
