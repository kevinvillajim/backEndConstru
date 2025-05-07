// src/application/calculation/SaveCalculationResultUseCase.ts
import {CalculationResultRepository} from "../../domain/repositories/CalculationResultRepository";
import {
	CalculationResult,
	SaveCalculationResultDTO,
} from "../../domain/models/calculation/CalculationResult";

export class SaveCalculationResultUseCase {
	constructor(
		private calculationResultRepository: CalculationResultRepository
	) {}

	/**
	 * Guarda permanentemente un resultado de cálculo y le asigna un nombre
	 */
	async execute(
		saveData: SaveCalculationResultDTO,
		userId: string
	): Promise<CalculationResult> {
		// 1. Buscar el resultado
		const result = await this.calculationResultRepository.findById(saveData.id);

		if (!result) {
			throw new Error(`Resultado de cálculo no encontrado: ${saveData.id}`);
		}

		// 2. Verificar que el resultado pertenece al usuario
		if (result.userId !== userId) {
			throw new Error("No tienes permiso para guardar este resultado");
		}

		// 3. Guardar el resultado con los nuevos datos
		const savedResult = await this.calculationResultRepository.save({
			...saveData,
			// Asegurar que estos campos estén definidos
			usedInProject:
				saveData.usedInProject !== undefined
					? saveData.usedInProject
					: result.usedInProject,
			projectId: saveData.projectId || result.projectId,
		});

		if (!savedResult) {
			throw new Error("Error al guardar el resultado del cálculo");
		}

		return savedResult;
	}
}
