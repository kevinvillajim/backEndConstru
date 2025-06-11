// src/domain/repositories/ProfessionalCostRepository.ts
import { ProfessionalCost, CreateProfessionalCostDTO, ProfessionalService, ComplexityLevel } from "../models/calculation/ProfessionalCost";

export interface ProfessionalCostRepository {
  findById(id: string): Promise<ProfessionalCost | null>;
  findByBudget(calculationBudgetId: string): Promise<ProfessionalCost[]>;
  findByService(calculationBudgetId: string, service: ProfessionalService): Promise<ProfessionalCost | null>;
  findByProfessional(professionalId: string): Promise<ProfessionalCost[]>;
  findApproved(calculationBudgetId: string): Promise<ProfessionalCost[]>;
  create(professionalCost: CreateProfessionalCostDTO): Promise<ProfessionalCost>;
  createMany(professionalCosts: CreateProfessionalCostDTO[]): Promise<ProfessionalCost[]>;
  update(id: string, professionalCostData: Partial<ProfessionalCost>): Promise<ProfessionalCost | null>;
  approve(id: string, approvedBy?: string): Promise<ProfessionalCost | null>;
  recalculateAmount(id: string, budgetSubtotal: number): Promise<ProfessionalCost | null>;
  delete(id: string): Promise<boolean>;
  deleteByBudget(calculationBudgetId: string): Promise<boolean>;
  getTotalByBudget(calculationBudgetId: string): Promise<number>;
}