import { MaterialQuantity } from "@domain/models/calculation/MaterialCalculationResult";
import { MaterialOutput, RegionalFactor, WasteFactor } from "../models/calculation/MaterialCalculationTemplate";

// src/domain/services/MaterialCalculationService.ts
export class MaterialCalculationService {
	async executeCalculation(
		formula: string,
		inputParameters: Record<string, any>,
		materialOutputs: MaterialOutput[],
		wasteFactors: WasteFactor[],
		includeWaste: boolean = true,
		regionalFactors?: RegionalFactor[]
	): Promise<MaterialCalculationExecutionResult> {
		try {
			// 1. Preparar contexto para la fórmula
			const context = {
				...inputParameters,
				Math,
				// Funciones auxiliares para materiales
				calculateWaste: (materialType: string, baseQuantity: number) => {
					const wasteFactor = wasteFactors.find(
						(wf) => wf.materialType === materialType
					);
					if (!wasteFactor || !includeWaste) return baseQuantity;

					const wastePercentage = wasteFactor.averageWaste;
					return baseQuantity * (1 + wastePercentage / 100);
				},
				applyRegionalFactor: (materialType: string, quantity: number) => {
					if (!regionalFactors) return quantity;

					const factor = regionalFactors.find(
						(rf) => rf.materialType === materialType
					);
					return factor ? quantity * factor.adjustmentFactor : quantity;
				},
			};

			// 2. Ejecutar fórmula JavaScript
			const func = new Function(...Object.keys(context), `return (${formula})`);
			const rawResult = func(...Object.values(context));

			// 3. Procesar resultados de materiales
			const materialQuantities: MaterialQuantity[] = [];

			for (const output of materialOutputs) {
				const baseQuantity = rawResult[output.materialName] || 0;

				// Aplicar factores de desperdicio
				const wasteFactor = wasteFactors.find(
					(wf) =>
						wf.materialType === output.category.toLowerCase() ||
						wf.materialType === output.materialName.toLowerCase()
				);

				const wastePercentage =
					wasteFactor && includeWaste ? wasteFactor.averageWaste : 0;
				let finalQuantity = baseQuantity;

				if (includeWaste && wastePercentage > 0) {
					finalQuantity = baseQuantity * (1 + wastePercentage / 100);
				}

				// Aplicar factores regionales
				if (regionalFactors) {
					const regionalFactor = regionalFactors.find(
						(rf) =>
							rf.materialType === output.category.toLowerCase() ||
							rf.materialType === output.materialName.toLowerCase()
					);

					if (regionalFactor) {
						finalQuantity *= regionalFactor.adjustmentFactor;
					}
				}

				materialQuantities.push({
					materialName: output.materialName,
					quantity: baseQuantity,
					unit: output.unit,
					category: output.category,
					wastePercentage,
					finalQuantity,
					unitCost: undefined, // Se puede agregar integración con precios
					totalCost: undefined,
				});
			}

			// 4. Calcular costo total si hay precios disponibles
			const totalCost = materialQuantities.reduce((total, material) => {
				return total + (material.totalCost || 0);
			}, 0);

			return {
				materialQuantities,
				totalCost: totalCost > 0 ? totalCost : undefined,
				additionalOutputs: rawResult,
				executionSuccessful: true,
			};
		} catch (error) {
			return {
				materialQuantities: [],
				additionalOutputs: {},
				executionSuccessful: false,
				errorMessage:
					error instanceof Error ? error.message : "Error en el cálculo",
			};
		}
	}
}

export interface MaterialCalculationExecutionResult {
	materialQuantities: MaterialQuantity[];
	totalCost?: number;
	additionalOutputs: Record<string, any>;
	executionSuccessful: boolean;
	errorMessage?: string;
}
