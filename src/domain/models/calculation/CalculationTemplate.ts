// src/domain/models/calculation/CalculationTemplate.ts
import {
	CalculationParameter,
	CreateCalculationParameterDTO,
} from "./CalculationParameter";

export enum CalculationType {
	AREA_VOLUME = "area_volume",
	STRUCTURAL = "structural",
	MATERIAL_ESTIMATION = "material_estimation",
	BUDGET = "budget",
	INSTALLATION = "installation",
	DESIGN = "design",
	USER_DEFINED = "user_defined", // Nueva categoría para fórmulas personalizadas
	ARCHITECTURE = "architecture",
	HVAC = "HVAC",
	FIRE_SAFETY = "fire_safety",
	EFFICIENCY = "efficiency",
	FOUNDATION = "foundation",
	ELECTRICAL = "electrical",
	TELECOMMUNICATIONS = "telecommunications",
}

export enum ProfessionType {
	ARCHITECT = "architect",
	CIVIL_ENGINEER = "civil_engineer",
	CONSTRUCTION_WORKER = "construction_worker",
	PLUMBER = "plumber",
	ELECTRICIAN = "electrician",
	CONTRACTOR = "contractor",
	ALL = "all",
	SAFETY_ENGINEER = "safety_engineer",
	MECHANICAL_ENGINEER = "mechanical_engineer",
	ELECTRICAL_ENGINEER = "electrical_engineer",
	TELECOMMUNICATIONS_ENGINEER = "telecommunications_engineer",
}

export enum TemplateSource {
	SYSTEM = "system",
	USER = "user",
	COMMUNITY = "community",
	IMPROVED = "improved",
}

export type CalculationTemplate = {
	id: string;
	name: string;
	description: string;
	type: CalculationType;
	targetProfession: ProfessionType;
	formula: string; // Fórmula matemática o código JavaScript
	necReference?: string; // Referencia a la NEC (Norma Ecuatoriana de Construcción)
	isActive: boolean;
	version: number;
	parentTemplateId?: string; // Para versiones mejoradas, referencia al original
	source: TemplateSource;
	createdBy?: string; // Usuario que creó esta plantilla
	isVerified: boolean; // Si ha sido verificado por un administrador
	verifiedBy?: string; // Admin que verificó la plantilla
	verifiedAt?: Date;
	isFeatured: boolean; // Si aparece destacado en la app
	usageCount: number; // Contador de usos
	averageRating: number; // Calificación promedio (0-5)
	ratingCount: number; // Número de calificaciones recibidas
	tags?: string[]; // Etiquetas para búsqueda y categorización
	shareLevel: "private" | "organization" | "public";
	parameters?: CalculationParameter[]; // Parámetros del cálculo
	createdAt: Date;
	updatedAt: Date;
};

export type CreateCalculationTemplateDTO = {
	name: string;
	description: string;
	type: CalculationType;
	targetProfession: ProfessionType;
	formula: string;
	necReference?: string;
	isActive: boolean;
	version: number;
	parentTemplateId?: string;
	source: TemplateSource;
	createdBy?: string;
	isVerified: boolean;
	verifiedBy?: string;
	verifiedAt?: Date;
	isFeatured: boolean;
	tags?: string[];
	shareLevel: "private" | "organization" | "public";
	parameters: CreateCalculationParameterDTO[];
};

export type UpdateCalculationTemplateDTO = Partial<
	Omit<CalculationTemplate, "id" | "createdAt" | "updatedAt">
>;
