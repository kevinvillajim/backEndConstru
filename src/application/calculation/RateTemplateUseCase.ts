// src/application/calculation/RateTemplateUseCase.ts
import {TemplateRatingRepository} from "../../domain/repositories/TemplateRatingRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";

export class RateTemplateUseCase {
	constructor(
		private templateRatingRepository: TemplateRatingRepository,
		private calculationTemplateRepository: CalculationTemplateRepository
	) {}

	async execute(data: {
		userId: string;
		templateId: string;
		rating: number;
		comment?: string;
	}): Promise<any> {
		// Validar rating
		if (data.rating < 1 || data.rating > 5) {
			throw new Error("La calificación debe estar entre 1 y 5");
		}

		// Verificar que la plantilla existe
		const template = await this.calculationTemplateRepository.findById(
			data.templateId
		);
		if (!template) {
			throw new Error("Plantilla no encontrada");
		}

		// Crear o actualizar rating
		const rating = await this.templateRatingRepository.createOrUpdate(data);

		// Actualizar estadísticas de la plantilla
		const stats = await this.templateRatingRepository.getAverageRating(
			data.templateId
		);
		await this.calculationTemplateRepository.updateUsageStats(data.templateId, {
			rating: stats.average,
		});

		return rating;
	}
}
