// src/domain/models/calculation/ProfessionalCost.ts

import { ProfessionalFees } from "./BudgetTemplate";

export enum ProfessionalService {
    ARCHITECTURAL_DESIGN = "architectural_design",
    STRUCTURAL_DESIGN = "structural_design",
    ELECTRICAL_DESIGN = "electrical_design", 
    MECHANICAL_DESIGN = "mechanical_design",
    PLUMBING_DESIGN = "plumbing_design",
    CONSTRUCTION_SUPERVISION = "construction_supervision",
    PROJECT_MANAGEMENT = "project_management",
    SPECIALTY_CONSULTATION = "specialty_consultation",
    PERMITS_PROCESSING = "permits_processing",
    QUALITY_CONTROL = "quality_control"
  }
  
  export enum ComplexityLevel {
    BASIC = "basic",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced", 
    COMPLEX = "complex"
  }
  
  export interface ProfessionalCost {
    type: any;
    amount: number;
    percentage: number;
    id: string;
    calculationBudgetId: string;
    service: ProfessionalService;
    description: string;
    complexityLevel: ComplexityLevel;
    basedOnAmount?: number;
    costType: string;
  
    // Cálculo del honorario
    basePercentage: number;
    fixedAmount: number;
    hourlyRate?: number;
    estimatedHours?: number;
    complexityMultiplier: number;
    calculatedAmount: number;
  
    // Información del profesional
    professionalId?: string;
    professionalName?: string;
    professionalRegistration?: string;
    professionalSpeciality?: string;
  
    // Normativa ecuatoriana
    ecuadorianRegulation?: EcuadorianRegulation;
    includesTaxes: boolean;
    taxPercentage: number;
  
    // Aprobación
    isApproved: boolean;
    approvalDate?: Date;
  
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface EcuadorianRegulation {
    collegeProfessional?: string;
    minimumPercentage?: number;
    maximumPercentage?: number;
    regulationReference?: string;
  }
  
  export type CreateProfessionalCostDTO = Omit<
    ProfessionalCost,
    "id" | "createdAt" | "updatedAt"
  >;