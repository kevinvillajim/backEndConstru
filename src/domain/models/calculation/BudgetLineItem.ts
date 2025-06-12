// src/domain/models/calculation/BudgetLineItem.ts

export enum LineItemType {
    MATERIAL = "material",
    LABOR = "labor",
    EQUIPMENT = "equipment", 
    SUBCONTRACT = "subcontract",
    PROFESSIONAL = "professional",
    INDIRECT = "indirect",
    CONTINGENCY = "contingency"
  }
  
  export enum LineItemSource {
    CALCULATION = "calculation",
    MANUAL = "manual",
    TEMPLATE = "template",
    IMPORTED = "imported"
  }
  
  export interface BudgetLineItem {
    id: string;
    description: string;
    specifications?: string;
    itemType: LineItemType;
    source: LineItemSource;
  
    // Relaciones
    calculationBudgetId: string;
    sourceCalculationId?: string;
    calculationParameterKey?: string;
    materialId?: string;
  
    // Cantidades y precios
    quantity: number;
    unitOfMeasure: string;
    unitPrice: number;
    wastePercentage: number;
    finalQuantity: number;
    subtotal: number;
  
    // Categorización
    category: string;
    subcategory?: string;
    chapter?: string;
    costCode?: string;
  
    // Factores regionales
    regionalFactor: number;
    difficultyFactor: number;
    necReference?: string;
  
    // Tracking de precios
    priceDate?: Date;
    priceSource?: string;
    priceValidityDays: number;
  
    // Metadata
    metadata?: LineItemMetadata;
    displayOrder: number;
    isOptional: boolean;
    isAlternate: boolean;
  
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface LineItemMetadata {
    supplierInfo?: any;
    technicalSpecs?: any;
    alternativeOptions?: any;
    notes?: string;
  }
  
  export type CreateBudgetLineItemDTO = Omit<
    BudgetLineItem,
    "id" | "createdAt" | "updatedAt"
  >;