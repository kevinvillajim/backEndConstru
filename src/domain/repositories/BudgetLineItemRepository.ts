// src/domain/repositories/BudgetLineItemRepository.ts
import { BudgetLineItem, CreateBudgetLineItemDTO, LineItemType, LineItemSource } from "../models/calculation/BudgetLineItem";

export interface BudgetLineItemRepository {
  findById(id: string): Promise<BudgetLineItem | null>;
  findByBudget(calculationBudgetId: string): Promise<BudgetLineItem[]>;
  findByType(calculationBudgetId: string, itemType: LineItemType): Promise<BudgetLineItem[]>;
  findBySource(calculationBudgetId: string, source: LineItemSource): Promise<BudgetLineItem[]>;
  findByCalculationResult(sourceCalculationId: string): Promise<BudgetLineItem[]>;
  findByMaterial(materialId: string): Promise<BudgetLineItem[]>;
  create(lineItem: CreateBudgetLineItemDTO): Promise<BudgetLineItem>;
  createMany(lineItems: CreateBudgetLineItemDTO[]): Promise<BudgetLineItem[]>;
  update(id: string, lineItemData: Partial<BudgetLineItem>): Promise<BudgetLineItem | null>;
  updateQuantity(id: string, quantity: number, finalQuantity?: number): Promise<BudgetLineItem | null>;
  updatePrice(id: string, unitPrice: number): Promise<BudgetLineItem | null>;
  delete(id: string): Promise<boolean>;
  deleteByBudget(calculationBudgetId: string): Promise<boolean>;
  getTotalByCategory(calculationBudgetId: string, category: string): Promise<number>;
  getTotalByType(calculationBudgetId: string, itemType: LineItemType): Promise<number>;
}