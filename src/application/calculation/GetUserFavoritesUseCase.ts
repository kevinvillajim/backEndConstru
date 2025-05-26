import { CalculationTemplateRepository } from "../../domain/repositories/CalculationTemplateRepository";
import { UserFavoriteRepository } from "../../domain/repositories/UserFavoriteRepository";

// src/application/calculation/GetUserFavoritesUseCase.ts
export class GetUserFavoritesUseCase {
    constructor(
        private userFavoriteRepository: UserFavoriteRepository,
        private calculationTemplateRepository: CalculationTemplateRepository
    ) {}

    async execute(userId: string): Promise<any[]> {
        // Obtener IDs de plantillas favoritas
        const favoriteIds = await this.userFavoriteRepository.findByUserId(userId);

        // Obtener detalles de cada plantilla
        const favoriteTemplates = await Promise.all(
            favoriteIds.map((id) => this.calculationTemplateRepository.findById(id))
        );

        // Filtrar nulls y devolver solo plantillas válidas
        return favoriteTemplates.filter((template) => template !== null);
    }
}