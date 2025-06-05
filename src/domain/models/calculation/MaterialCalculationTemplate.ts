// src/domain/models/calculation/MaterialCalculationTemplate.ts
// Import or define ParameterDataType
export type ParameterDataType = "string" | "number" | "boolean" | "date"; // Example definition

export enum MaterialCalculationType {
	MASONRY = "masonry", // Mampostería (ladrillos, bloques)
	CONCRETE = "concrete", // Hormigón y fundiciones
	FINISHES = "finishes", // Acabados (cerámicos, enlucidos)
	STAIRS = "stairs", // Escaleras
	ELECTRICAL = "electrical", // Instalaciones eléctricas
	FURNITURE = "furniture", // Muebles de melamina
	MORTAR = "mortar", // Morteros y mezclas
	FLOORING = "flooring", // Pisos y contrapisos
}

export enum MaterialUnit {
	M2 = "m2", // Metro cuadrado
	M3 = "m3", // Metro cúbico
	ML = "ml", // Metro lineal
	UNITS = "units", // Unidades
	KG = "kg", // Kilogramos
	BAGS = "bags", // Bolsas/sacos
	SHEETS = "sheets", // Planchas
}

export interface MaterialCalculationTemplate {
	id: string;
	name: string;
	description: string;
	type: MaterialCalculationType;
	subCategory: string; // "ladrillo_comun", "ceramico_piso", etc.
	formula: string; // JavaScript formula
	materialOutputs: MaterialOutput[]; // Salidas específicas de materiales
	parameters: MaterialParameter[];
	wasteFactors: WasteFactor[]; // Factores de desperdicio
	regionalFactors?: RegionalFactor[]; // Factores por región
	normativeReference?: string; // NEC, ACI, etc.
	isActive: boolean;
	isVerified: boolean;
	isFeatured: boolean;
	shareLevel: "private" | "organization" | "public";
	createdBy?: string;
	version: number;
	usageCount: number;
	averageRating: number;
	ratingCount: number;
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}

export interface MaterialOutput {
	materialName: string; // "Cemento", "Arena", "Ladrillos"
	unit: MaterialUnit;
	description: string;
	category: string; // "Cemento", "Agregados", "Piezas"
	isMain: boolean; // Material principal del cálculo
}

export interface MaterialParameter {
	id: string;
	description: string;
	dataType: ParameterDataType;
	scope: string; // Replace with appropriate type or import ParameterScope if defined elsewhere
	displayOrder: number;
	isRequired: boolean;
	defaultValue?: string;
	minValue?: number;
	maxValue?: number;
	unit?: MaterialUnit;
	allowedValues?: string[];
	helpText?: string;
	dependsOnParameters?: string[];
	materialCalculationTemplateId: string;
}

export interface WasteFactor {
	materialType: string; // "ceramicos", "ladrillos", "hormigon"
	minWaste: number; // % mínimo
	averageWaste: number; // % promedio
	maxWaste: number; // % máximo
	conditions: string[]; // ["clima_humedo", "obra_nueva"]
}

export interface RegionalFactor {
	region: string; // "costa", "sierra", "oriente"
	materialType: string;
	adjustmentFactor: number; // Factor multiplicador
	reason: string; // "disponibilidad", "transporte"
}
