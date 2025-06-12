// src/domain/models/calculation/CalculationResult.ts
export type CalculationResult = {
	id: string;
	calculationTemplateId: string;
	projectId?: string;
	userId: string;
	inputParameters: Record<string, any>; // Parámetros de entrada en formato JSON
	results: Record<string, any>; // Resultados del cálculo en formato JSON
	isSaved: boolean; // Si el usuario guardó el resultado
	name?: string; // Nombre asignado por el usuario
	notes?: string; // Notas adicionales
	executionTimeMs?: number; // Tiempo de ejecución para análisis de rendimiento
	wasSuccessful: boolean; // Si el cálculo se completó exitosamente
	errorMessage?: string; // Mensaje de error si falló
	usedInProject: boolean; // Si el resultado se utilizó en un proyecto real
	ledToMaterialOrder: boolean; // Si generó un pedido de materiales
	ledToBudget: boolean; // Si generó un presupuesto
	createdAt: Date;
	updatedAt: Date;
};

export type CreateCalculationResultDTO = Omit<
	CalculationResult,
	"id" | "createdAt" | "updatedAt"
>;

export type SaveCalculationResultDTO = {
	id: string;
	name: string;
	notes?: string;
	usedInProject?: boolean;
	projectId?: string;
};

export type CalculationRequest = {
	templateId: string;
	projectId?: string;
	parameters: Record<string, any>;
};

export type CalculationResponse = {
	id: string;
	templateId: string;
	templateName: string;
	templateVersion: number;
	results: Record<string, any>;
	executionTimeMs: number;
	wasSuccessful: boolean;
	errorMessage?: string;
	timestamp: Date;
};