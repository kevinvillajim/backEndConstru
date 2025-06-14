// src/domain/models/calculation/BudgetLineItem.ts

  export enum LineItemType {
  	MATERIAL = "material",
  	LABOR = "labor",
  	EQUIPMENT = "equipment",
  	SUBCONTRACT = "subcontract",
  	PROFESSIONAL = "professional",
  	INDIRECT = "indirect",
  	CONTINGENCY = "contingency",
  	OTHER = "other",
  }
  
  export enum LineItemSource {
    CALCULATION = "calculation",
    MANUAL = "manual",
    TEMPLATE = "template",
    IMPORTED = "imported"
}
  
export enum LaborType {
	GENERAL = "general",
	SPECIALIZED = "specialized",
	TECHNICAL = "technical",
	SUPERVISION = "supervision",
	SKILLED = "skilled",
	UNSKILLED = "unskilled",
}
  
  export interface BudgetLineItem {
		id: string;
		description: string;
		specifications?: string;

		// Tipos con enums del modelo de dominio
		itemType: LineItemType;
		source: LineItemSource;
		laborType?: LaborType;

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
		category?: string;
		subcategory?: string;
		chapter?: string;
		costCode?: string;

		// Factores de ajuste
		regionalFactor: number;
		difficultyFactor: number;

		// Referencias técnicas
		necReference?: string;

		// Información de precios
		priceDate?: Date;
		priceSource?: string;
		priceValidityDays: number;

		// Metadata adicional
		metadata?: Record<string, any>;

		// Configuración de visualización
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