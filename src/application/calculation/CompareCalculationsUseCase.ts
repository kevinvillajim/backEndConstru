// src/application/calculation/CompareCalculationsUseCase.ts
import {CalculationResultRepository} from "../../domain/repositories/CalculationResultRepository";
import {CalculationComparisonRepository} from "../../domain/repositories/CalculationComparisonRepository";

export class CompareCalculationsUseCase {
	constructor(
		private calculationResultRepository: CalculationResultRepository,
		private calculationComparisonRepository: CalculationComparisonRepository
	) {}

	async execute(
		calculationIds: string[],
		userId: string,
		saveName?: string
	): Promise<any> {
		if (calculationIds.length < 2 || calculationIds.length > 4) {
			throw new Error("Debe seleccionar entre 2 y 4 cálculos para comparar");
		}

		// Obtener todos los cálculos
		const calculations = await Promise.all(
			calculationIds.map((id) => this.calculationResultRepository.findById(id))
		);

		// Verificar que todos existen y pertenecen al usuario
		calculations.forEach((calc, index) => {
			if (!calc) {
				throw new Error(`Cálculo no encontrado: ${calculationIds[index]}`);
			}
			if (calc.userId !== userId) {
				throw new Error("No tienes acceso a todos los cálculos seleccionados");
			}
		});

		// Generar datos de comparación
		const comparisonData = this.generateComparisonData(calculations);

		// Guardar comparación si se solicita
		let savedComparison = null;
		if (saveName) {
			savedComparison = await this.calculationComparisonRepository.create({
				userId,
				name: saveName,
				calculationIds,
				comparisonData,
				isSaved: true,
			});
		}

		return {
			calculations,
			comparisonData,
			savedComparison,
		};
	}

	private generateComparisonData(calculations: any[]): any {
		const comparison = {
			summary: {
				totalCalculations: calculations.length,
				templates: [
					...new Set(calculations.map((c) => c.calculationTemplateId)),
				],
				dateRange: {
					earliest: Math.min(...calculations.map((c) => c.createdAt.getTime())),
					latest: Math.max(...calculations.map((c) => c.createdAt.getTime())),
				},
			},
			results: calculations.map((calc) => ({
				id: calc.id,
				name: calc.name || `Cálculo ${calc.id.slice(0, 8)}`,
				templateId: calc.calculationTemplateId,
				results: calc.results,
				inputParameters: calc.inputParameters,
				createdAt: calc.createdAt,
			})),
			analysis: this.analyzeResults(calculations),
		};

		return comparison;
	}

	private analyzeResults(calculations: any[]): any {
		return {
			parametersComparison: this.compareParameters(calculations),
			resultsComparison: this.compareResults(calculations),
			recommendations: this.generateRecommendations(calculations),
		};
	}

	private compareParameters(calculations: any[]): any {
		const allParams = calculations.map((c) => c.inputParameters);
		const commonParams = Object.keys(allParams[0] || {});

		return commonParams.map((param) => ({
			parameter: param,
			values: allParams.map((params) => params[param]),
			variance: this.calculateVariance(
				allParams.map((params) => params[param])
			),
		}));
	}

	private compareResults(calculations: any[]): any {
		const allResults = calculations.map((c) => c.results);
		const resultKeys = Object.keys(allResults[0] || {});

		return resultKeys.map((key) => ({
			result: key,
			values: allResults.map((results) => results[key]),
			statistics: this.calculateStatistics(
				allResults.map((results) => results[key])
			),
		}));
	}

	private generateRecommendations(calculations: any[]): string[] {
		const recommendations = [];

		if (calculations.length > 2) {
			recommendations.push(
				"Considera usar el promedio de los resultados para mayor precisión"
			);
		}

		recommendations.push(
			"Revisa los parámetros con mayor variación entre cálculos"
		);

		return recommendations;
	}

	private calculateVariance(values: number[]): number {
		if (!values.every((v) => typeof v === "number")) return 0;

		const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
		const variance =
			values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
			values.length;
		return variance;
	}

	private calculateStatistics(values: number[]): any {
		if (!values.every((v) => typeof v === "number")) {
			return {error: "Valores no numéricos"};
		}

		const sorted = [...values].sort((a, b) => a - b);
		const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

		return {
			min: Math.min(...values),
			max: Math.max(...values),
			mean,
			median: sorted[Math.floor(sorted.length / 2)],
			variance: this.calculateVariance(values),
		};
	}
}
