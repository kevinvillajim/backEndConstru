// src/domain/models/calculation/CalculationBudget.ts
import { BudgetLineItem } from "./BudgetLineItem";
import { ProfessionalCost } from "./ProfessionalCost";

export enum CalculationBudgetStatus {
  DRAFT = "draft",
  REVIEW = "review",
  APPROVED = "approved", 
  REVISED = "revised",
  FINAL = "final",
  ARCHIVED = "archived"
}

export enum BudgetType {
  MATERIALS_ONLY = "materials_only",
  COMPLETE_PROJECT = "complete_project",
  LABOR_MATERIALS = "labor_materials", 
  PROFESSIONAL_ESTIMATE = "professional_estimate"
}

export interface CalculationBudget {
  id: string;
  name: string;
  description?: string;
  status: CalculationBudgetStatus;
  budgetType: BudgetType;
  version: number;
  parentBudgetId?: string;

  // Relaciones
  projectId: string;
  userId: string;
  calculationResultId?: string;
  budgetTemplateId?: string;

  // Totales
  materialsSubtotal: number;
  laborSubtotal: number;
  indirectCosts: number;
  contingencyPercentage: number;
  contingencyAmount: number;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  total: number;

  // Configuración
  geographicalZone: string;
  currency: string;
  exchangeRate: number;

  // Personalización
  customization?: BudgetCustomization;
  exportSettings?: BudgetExportSettings;

  // Tracking
  lastCalculatedAt?: Date;
  isTemplateBudget: boolean;
  approvedBy?: string;
  approvedAt?: Date;

  // Relaciones de datos
  lineItems?: BudgetLineItem[];
  professionalCostsTotal: number; // Total calculado
  professionalCosts?: ProfessionalCost[]; // Array de objetos

  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCustomization {
  companyName?: string;
  companyLogo?: string;
  professionalName?: string;
  professionalTitle?: string;
  professionalRegistration?: string;
  clientInfo?: any;
  headerImage?: string;
  footerText?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
}

export interface BudgetExportSettings {
  includeCalculationDetails?: boolean;
  includeMaterialSpecs?: boolean;
  includeNECReferences?: boolean;
  showPriceBreakdown?: boolean;
  showLaborDetails?: boolean;
  language?: "es" | "en";
}

export type CreateCalculationBudgetDTO = Omit<
  CalculationBudget,
  "id" | "createdAt" | "updatedAt" | "lineItems" | "professionalCosts"
>;