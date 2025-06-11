// src/domain/repositories/CalculationBudgetRepository.ts
import { CalculationBudget, CreateCalculationBudgetDTO } from "../models/calculation/CalculationBudget";
import { PaginationOptions } from "../models/common/PaginationOptions";

export interface CalculationBudgetRepository {
  findById(id: string): Promise<CalculationBudget | null>;
  findByProject(projectId: string, options?: PaginationOptions): Promise<{
    budgets: CalculationBudget[];
    total: number;
  }>;
  findByUser(userId: string, options?: PaginationOptions): Promise<{
    budgets: CalculationBudget[];
    total: number;
  }>;
  findByUserWithFilters(
    userId: string,
    filters: any,
    options?: PaginationOptions
  ): Promise<{ budgets: CalculationBudget[]; total: number }>;
  countByUserAndMonth(userId: string, date: Date): Promise<number>;

  findByCalculationResult(calculationResultId: string): Promise<CalculationBudget[]>;
  findVersions(parentBudgetId: string): Promise<CalculationBudget[]>;
  create(budget: CreateCalculationBudgetDTO): Promise<CalculationBudget>;
  update(id: string, budgetData: Partial<CalculationBudget>): Promise<CalculationBudget | null>;
  delete(id: string): Promise<boolean>;
  recalculateTotals(id: string): Promise<CalculationBudget | null>;
}