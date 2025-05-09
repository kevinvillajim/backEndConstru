// src/domain/repositories/BudgetItemRepository.ts
import {BudgetItem} from "../models/project/BudgetItem";

export interface BudgetItemRepository {
	findById(id: string): Promise<BudgetItem | null>;
	findByBudget(budgetId: string): Promise<BudgetItem[]>;
	create(item: BudgetItem): Promise<BudgetItem>;
	createMany(items: BudgetItem[]): Promise<BudgetItem[]>;
	update(id: string, itemData: Partial<BudgetItem>): Promise<BudgetItem | null>;
	delete(id: string): Promise<boolean>;
	deleteByBudget(budgetId: string): Promise<boolean>;
}
