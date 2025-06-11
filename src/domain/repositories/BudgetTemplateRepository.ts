// src/domain/repositories/BudgetTemplateRepository.ts
import { BudgetTemplate, CreateBudgetTemplateDTO, ProjectType, TemplateScope } from "../models/calculation/BudgetTemplate";
import { PaginationOptions } from "../models/common/PaginationOptions";

export interface BudgetTemplateRepository {
  findById(id: string): Promise<BudgetTemplate | null>;
  findByProjectType(projectType: ProjectType, geographicalZone?: string): Promise<BudgetTemplate[]>;
  findByScope(scope: TemplateScope, userId?: string): Promise<BudgetTemplate[]>;
  findActiveTemplates(filters?: {
    projectType?: ProjectType;
    geographicalZone?: string;
    scope?: TemplateScope;
  }): Promise<BudgetTemplate[]>;
  findPopularTemplates(limit?: number): Promise<BudgetTemplate[]>;
  create(template: CreateBudgetTemplateDTO): Promise<BudgetTemplate>;
  update(id: string, templateData: Partial<BudgetTemplate>): Promise<BudgetTemplate | null>;
  delete(id: string): Promise<boolean>;
  incrementUsage(id: string): Promise<void>;
}