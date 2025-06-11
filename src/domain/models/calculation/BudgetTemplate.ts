// src/domain/models/calculation/BudgetTemplate.ts

export enum ProjectType {
    RESIDENTIAL_SINGLE = "residential_single",
    RESIDENTIAL_MULTI = "residential_multi",
    COMMERCIAL_SMALL = "commercial_small", 
    COMMERCIAL_LARGE = "commercial_large",
    INDUSTRIAL = "industrial",
    INFRASTRUCTURE = "infrastructure",
    RENOVATION = "renovation",
    SPECIALIZED = "specialized"
  }
  
  export enum TemplateScope {
    SYSTEM = "system",
    COMPANY = "company",
    PERSONAL = "personal", 
    SHARED = "shared"
  }
  
  export interface BudgetTemplate {
    id: string;
    name: string;
    description: string;
    projectType: ProjectType;
    scope: TemplateScope;
    geographicalZone: string;
  
    // Factores de cálculo
    wasteFactors: WasteFactors;
    laborRates: LaborRates;
    laborProductivity: LaborProductivity;
    indirectCosts: IndirectCosts;
    professionalFees: ProfessionalFees;
  
    // Cumplimiento NEC
    necCompliance?: NECCompliance;
  
    // Metadata
    createdBy: string;
    isActive: boolean;
    isVerified: boolean;
    usageCount: number;
  
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface WasteFactors {
    concrete?: number;
    steel?: number;
    ceramics?: number;
    electrical?: number;
    plumbing?: number;
    general?: number;
  }
  
  export interface LaborRates {
    masterBuilder?: number;
    builder?: number;
    helper?: number;
    electrician?: number;
    plumber?: number;
    painter?: number;
    carpenter?: number;
  }
  
  export interface LaborProductivity {
    concretePouring?: number;
    wallConstruction?: number;
    tileInstallation?: number;
    paintingInterior?: number;
    paintingExterior?: number;
  }
  
  export interface IndirectCosts {
    administration?: number;
    utilities?: number;
    tools?: number;
    safety?: number;
    permits?: number;
  }
  
  export interface ProfessionalFees {
    architectural?: number;
    structural?: number;
    electrical?: number;
    mechanical?: number;
    supervision?: number;
    consultation?: number;
  }
  
  export interface NECCompliance {
    seismicZone?: string;
    soilType?: string;
    windZone?: string;
    requiredFactors?: any;
  }
  
  export type CreateBudgetTemplateDTO = Omit<
    BudgetTemplate,
    "id" | "createdAt" | "updatedAt" | "usageCount"
  >;