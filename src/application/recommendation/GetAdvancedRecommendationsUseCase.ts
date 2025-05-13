// src/application/recommendation/GetAdvancedRecommendationsUseCase.ts
import {UserRepository} from "../../domain/repositories/UserRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {UserInteractionRepository} from "../../domain/repositories/UserInteractionRepository";
import {UserPatternAnalysisService} from "../../domain/services/UserPatternAnalysisService";
import {
	AdvancedRecommendationService,
	RecommendationResult,
} from "../../domain/services/AdvancedRecommendationService";
import {CalculationTemplate} from "../../domain/models/calculation/CalculationTemplate";
import {Material} from "../../domain/models/material/Material";

export class GetAdvancedRecommendationsUseCase {
	constructor(
		private userRepository: UserRepository,
		private calculationTemplateRepository: CalculationTemplateRepository,
		private userInteractionRepository: UserInteractionRepository,
		private userPatternAnalysisService: UserPatternAnalysisService,
		private advancedRecommendationService: AdvancedRecommendationService
	) {}

	/**
	 * Obtiene recomendaciones avanzadas de plantillas para un usuario
	 */
	async getTemplateRecommendations(
		userId: string,
		currentTemplateId?: string,
		projectId?: string,
		limit: number = 10
	): Promise<RecommendationResult<CalculationTemplate>[]> {
		// 1. Obtener información del usuario
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new Error(`Usuario no encontrado: ${userId}`);
		}

		// 2. Obtener plantillas disponibles
		const {templates: allTemplates} =
			await this.calculationTemplateRepository.findAll({
				isActive: true,
				isVerified: true,
			});

		// 3. Obtener historial de interacciones del usuario (últimos 30 días)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const userInteractions = await this.userInteractionRepository.findByUserId(
			userId,
			{
				startDate: thirtyDaysAgo,
			}
		);

		// 4. Analizar patrones de comportamiento del usuario
		const userPattern =
			await this.userPatternAnalysisService.analyzeUserPatterns(
				userId,
				userInteractions
			);

		// 5. Encontrar usuarios similares (simplificado)
		// En un sistema real, obtendríamos todos los patrones de usuarios
		// de una caché o servicio dedicado
		const similarUsers: Array<{userId: string; similarityScore: number}> = [];

		// 6. Generar recomendaciones avanzadas
		const recommendations =
			await this.advancedRecommendationService.generateTemplateRecommendations(
				user,
				userPattern,
				similarUsers,
				currentTemplateId,
				projectId,
				allTemplates
			);

		// 7. Limitar y devolver resultados
		return recommendations.slice(0, limit);
	}

	/**
	 * Obtiene recomendaciones avanzadas de materiales para un usuario
	 */
	async getMaterialRecommendations(
		userId: string,
		currentMaterials: string[] = [],
		projectId?: string,
		limit: number = 10
	): Promise<RecommendationResult<Material>[]> {
		// Implementación similar a getTemplateRecommendations pero para materiales
		// Omitido por brevedad

		return [];
	}
}
