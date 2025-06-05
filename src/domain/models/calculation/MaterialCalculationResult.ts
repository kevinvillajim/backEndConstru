// src/domain/models/calculation/MaterialCalculationResult.ts
import type { MaterialUnit } from "./MaterialCalculationTemplate";

export interface MaterialCalculationResult {
	id: string;
	templateId: string;
	templateType: "official" | "user";
	userId: string;
	projectId?: string;
	inputParameters: Record<string, any>;
	materialQuantities: MaterialQuantity[];
	totalCost?: number;
	currency?: string;
	wasteIncluded: boolean;
	regionalFactorsApplied: boolean;
	notes?: string;
	isSaved: boolean;
	isShared: boolean;
	executionTime: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface MaterialQuantity {
	materialName: string;
	quantity: number;
	unit: MaterialUnit;
	category: string;
	unitCost?: number;
	totalCost?: number;
	wastePercentage: number;
	finalQuantity: number; // Incluyendo desperdicio
}
