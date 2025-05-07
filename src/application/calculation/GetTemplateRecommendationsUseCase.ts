// src/application/calculation/GetTemplateRecommendationsUseCase.ts
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {CalculationResultRepository} from "../../domain/repositories/CalculationResultRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {
	RecommendationService,
	TemplateRecommendation,
} from "../../domain/services/RecommendationService";

export class GetTemplateRecommendationsUseCase {
	constructor(
		private calculationTemplateRepository: CalculationTemplateRepository,
		private calculationResultRepository: CalculationResultRepository,
		private userRepository: UserRepository,
		private recommendationService: RecommendationService
	) {}

	/**
	 * Obtiene recomendaciones de plantillas para un usuario específico
	 */
	async execute(
		userId: string,
		currentTemplateId?: string,
		projectId?: string,
		limit: number = 5
	): Promise<TemplateRecommendation[]> {
		// 1. Obtener información del usuario
		const user = await this.userRepository.findById(userId);

		if (!user) {
			throw new Error(`Usuario no encontrado: ${userId}`);
		}

		// 2. Obtener plantillas disponibles (activas y verificadas)
		const {templates: allTemplates} =
			await this.calculationTemplateRepository.findAll({
				isActive: true,
				isVerified: true,
			});

		// 3. Obtener resultados recientes del usuario
		let recentResults = [];
		if (projectId) {
			// Si hay un proyecto, obtener resultados del proyecto
			recentResults =
				await this.calculationResultRepository.findByProject(projectId);
		} else {
			// Si no hay proyecto, obtener los resultados recientes generales
			const {results} = await this.calculationResultRepository.findByUser(
				userId,
				{
					page: 1,
					limit: 10,
					sortBy: "createdAt",
					sortOrder: "DESC",
				}
			);
			recentResults = results;
		}

		// 4. Simular historial de uso (esto normalmente vendría de una tabla específica)
		// En una implementación real, tendríamos un repositorio dedicado para el historial de uso
		const templateIds = new Set(
			recentResults.map((r) => r.calculationTemplateId)
		);
		const userUsageHistory = Array.from(templateIds).map((templateId) => {
			const count = recentResults.filter(
				(r) => r.calculationTemplateId === templateId
			).length;
			return {templateId, usageCount: count};
		});

		// 5. Generar recomendaciones
		const recommendations =
			await this.recommendationService.generateRecommendations(
				user,
				currentTemplateId,
				projectId,
				recentResults,
				allTemplates,
				userUsageHistory
			);

		// 6. Limitar el número de recomendaciones si es necesario
		return recommendations.slice(0, limit);
	}
}
