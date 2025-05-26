// src/application/calculation/FavoriteTemplateUseCase.ts
import {UserFavoriteRepository} from "../../domain/repositories/UserFavoriteRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";

export class FavoriteTemplateUseCase {
	constructor(
		private userFavoriteRepository: UserFavoriteRepository,
		private calculationTemplateRepository: CalculationTemplateRepository
	) {}

	async execute(
		userId: string,
		templateId: string
	): Promise<{isFavorite: boolean}> {
		// Verificar que la plantilla existe
		const template =
			await this.calculationTemplateRepository.findById(templateId);
		if (!template) {
			throw new Error("Plantilla no encontrada");
		}

		// Toggle favorite
		const isFavorite = await this.userFavoriteRepository.isFavorite(
			userId,
			templateId
		);

		if (isFavorite) {
			await this.userFavoriteRepository.removeFavorite(userId, templateId);
			return {isFavorite: false};
		} else {
			await this.userFavoriteRepository.addFavorite(userId, templateId);
			return {isFavorite: true};
		}
	}
}
