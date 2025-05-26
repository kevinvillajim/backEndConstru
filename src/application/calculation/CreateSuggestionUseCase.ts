// src/application/calculation/CreateSuggestionUseCase.ts
import {TemplateSuggestionRepository} from "../../domain/repositories/TemplateSuggestionRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";

export class CreateSuggestionUseCase {
	constructor(
		private templateSuggestionRepository: TemplateSuggestionRepository,
		private calculationTemplateRepository: CalculationTemplateRepository
	) {}

	async execute(suggestionData: any, userId: string): Promise<any> {
		// Verificar que la plantilla existe
		const template = await this.calculationTemplateRepository.findById(
			suggestionData.templateId
		);
		if (!template) {
			throw new Error("Plantilla no encontrada");
		}

		// Solo se pueden sugerir cambios a plantillas públicas o verificadas
		if (template.shareLevel === "private" && template.createdBy !== userId) {
			throw new Error("No puedes sugerir cambios a esta plantilla");
		}

		const suggestion = await this.templateSuggestionRepository.create({
			...suggestionData,
			userId,
			status: "pending",
		});

		return suggestion;
	}
}
