// src/application/calculation/CreateCalculationTemplateUseCase.ts
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {CalculationParameterRepository} from "../../domain/repositories/CalculationParameterRepository";
import {
	CreateCalculationTemplateDTO,
	CalculationTemplate,
	TemplateSource,
} from "../../domain/models/calculation/CalculationTemplate";
import {TemplateValidationService} from "../../domain/services/TemplateValidationService";

export class TemplateValidationError extends Error {
	public errors: string[];

	constructor(message: string, errors: string[]) {
		super(message);
		this.name = "TemplateValidationError";
		this.errors = errors;
	}
}

export class CreateCalculationTemplateUseCase {
	constructor(
		private calculationTemplateRepository: CalculationTemplateRepository,
		private calculationParameterRepository: CalculationParameterRepository,
		private templateValidationService: TemplateValidationService
	) {}

	/**
	 * Crea una nueva plantilla de cálculo con sus parámetros
	 */
	async execute(
		templateData: CreateCalculationTemplateDTO,
		userId: string
	): Promise<CalculationTemplate> {
		// 1. Validar la plantilla y sus parámetros
		const validation =
			this.templateValidationService.validateTemplate(templateData);

		if (!validation.isValid) {
			throw new TemplateValidationError(
				"Error de validación en la plantilla de cálculo",
				validation.errors
			);
		}

		// 2. Preparar datos para la creación
		const now = new Date();

		// Determinar la fuente de la plantilla
		let source = TemplateSource.USER;
		if (templateData.source) {
			// Solo permitir SYSTEM o IMPROVED si el usuario tiene permisos de admin
			// (esta lógica debe estar en el controlador o middleware)
			source = templateData.source;
		}

		// Extraer parámetros para guardarlos separadamente
		const {parameters, ...templateFields} = templateData;

		// 3. Crear la plantilla base (sin parámetros)
		const template = await this.calculationTemplateRepository.create({
			...templateFields,
			source,
			createdBy: userId,
			// Estos campos NO se deben incluir en el DTO, son generados por el sistema
			// usageCount: 0, <-- Este no debe estar aquí, causa error
			// averageRating: 0, <-- Este no debe estar aquí, causa error
			// ratingCount: 0, <-- Este no debe estar aquí, causa error
		});

		// 4. Crear los parámetros asociados a la plantilla
		const parametersWithTemplateId = parameters.map((param) => ({
			...param,
			calculationTemplateId: template.id,
		}));

		await this.calculationParameterRepository.createMany(
			parametersWithTemplateId
		);

		// 5. Cargar la plantilla completa con parámetros
		const completeTemplate =
			await this.calculationTemplateRepository.findByIdWithParameters(
				template.id
			);

		if (!completeTemplate) {
			throw new Error("Error al recuperar la plantilla recién creada");
		}

		return completeTemplate;
	}
}
