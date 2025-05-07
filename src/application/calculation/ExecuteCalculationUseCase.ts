// src/application/calculation/ExecuteCalculationUseCase.ts
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {CalculationResultRepository} from "../../domain/repositories/CalculationResultRepository";
import {CalculationService} from "../../domain/services/CalculationService";
import {
	CalculationRequest,
	CalculationResponse,
	CreateCalculationResultDTO,
} from "../../domain/models/calculation/CalculationResult";

export class CalculationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CalculationError";
	}
}

export class ExecuteCalculationUseCase {
	constructor(
		private calculationTemplateRepository: CalculationTemplateRepository,
		private calculationResultRepository: CalculationResultRepository,
		private calculationService: CalculationService
	) {}

	/**
	 * Ejecuta un cálculo basado en la plantilla y parámetros proporcionados
	 */
	async execute(
		request: CalculationRequest,
		userId: string
	): Promise<CalculationResponse> {
		// 1. Buscar la plantilla con sus parámetros
		const template =
			await this.calculationTemplateRepository.findByIdWithParameters(
				request.templateId
			);

		if (!template) {
			throw new CalculationError(
				`Plantilla de cálculo no encontrada: ${request.templateId}`
			);
		}

		if (!template.isActive) {
			throw new CalculationError(
				`La plantilla ${template.name} no está activa`
			);
		}

		// 2. Ejecutar el cálculo
		const result = this.calculationService.executeCalculation(
			template,
			request.parameters
		);

		// 3. Incrementar el contador de uso de la plantilla
		await this.calculationTemplateRepository.updateUsageStats(template.id, {
			usageCount: template.usageCount + 1,
		});

		// 4. Guardar el resultado en la base de datos
		const calculationResult: CreateCalculationResultDTO = {
			calculationTemplateId: template.id,
			projectId: request.projectId,
			userId,
			inputParameters: request.parameters,
			results: result.results,
			isSaved: false, // Por defecto no se guarda permanentemente
			executionTimeMs: result.executionTimeMs,
			wasSuccessful: result.wasSuccessful,
			errorMessage: result.errorMessage,
			usedInProject: false,
			ledToMaterialOrder: false,
			ledToBudget: false,
		};

		const savedResult =
			await this.calculationResultRepository.create(calculationResult);

		// 5. Devolver la respuesta
		return {
			id: savedResult.id,
			templateId: template.id,
			templateName: template.name,
			templateVersion: template.version,
			results: result.results,
			executionTimeMs: result.executionTimeMs,
			wasSuccessful: result.wasSuccessful,
			errorMessage: result.errorMessage,
			timestamp: new Date(),
		};
	}
}
