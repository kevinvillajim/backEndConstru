// src/domain/repositories/MaterialCalculationResultRepository.ts

import { MaterialCalculationType } from "../models/calculation/MaterialCalculationTemplate";
import { MaterialCalculationResult } from "../models/calculation/MaterialCalculationResult";



export interface MaterialCalculationResultRepository {
	findById(id: string): Promise<MaterialCalculationResult | null>;
	findByUserId(
		userId: string,
		filters?: ResultFilters
	): Promise<MaterialCalculationResult[]>;
	findByProject(projectId: string): Promise<MaterialCalculationResult[]>;
	findSaved(userId: string): Promise<MaterialCalculationResult[]>;
	findShared(): Promise<MaterialCalculationResult[]>;
	create(
		result: Omit<MaterialCalculationResult, "id" | "createdAt" | "updatedAt">
	): Promise<MaterialCalculationResult>;
	update(
		id: string,
		data: Partial<MaterialCalculationResult>
	): Promise<MaterialCalculationResult | null>;
	delete(id: string): Promise<boolean>;
	toggleSaved(id: string, isSaved: boolean): Promise<boolean>;
	toggleShared(id: string, isShared: boolean): Promise<boolean>;
}

export interface ResultFilters {
	templateType?: "official" | "user";
	materialType?: MaterialCalculationType;
	dateFrom?: Date;
	dateTo?: Date;
	isSaved?: boolean;
	isShared?: boolean;
}
