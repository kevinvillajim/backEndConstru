// src/domain/repositories/CalculationResultRepository.ts
import {
	CalculationResult,
	CreateCalculationResultDTO,
	SaveCalculationResultDTO,
} from "../models/calculation/CalculationResult";

export interface CalculationResultRepository {
	findById(id: string): Promise<CalculationResult | null>;
	findByUser(
		userId: string,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{results: CalculationResult[]; total: number}>;
	findByProject(projectId: string): Promise<CalculationResult[]>;
	findByTemplate(
		templateId: string,
		limit?: number
	): Promise<CalculationResult[]>;
	findSavedByUser(userId: string): Promise<CalculationResult[]>;
	create(result: CreateCalculationResultDTO): Promise<CalculationResult>;
	save(saveData: SaveCalculationResultDTO): Promise<CalculationResult | null>;
	delete(id: string): Promise<boolean>;
	getAverageExecutionTime(templateId: string): Promise<number | null>;
	countSuccessfulByTemplate(templateId: string): Promise<number>;
}
