// src/domain/services/AdvancedRecommendationService.ts
import {User, ProfessionalType} from "../models/user/User";
import {
	CalculationTemplate,
	ProfessionType,
} from "../models/calculation/CalculationTemplate";
import {UserBehaviorPattern} from "./UserPatternAnalysisService";
import {Material} from "../models/material/Material";
import {Category} from "../models/material/Category";
import { Project } from "../models/project/Project";

export enum RecommendationStrategy {
	CONTENT_BASED = "content_based",
	COLLABORATIVE_FILTERING = "collaborative_filtering",
	HYBRID = "hybrid",
	CONTEXT_AWARE = "context_aware",
	POPULARITY_BASED = "popularity_based",
}

export enum RecommendationReason {
	SIMILAR_PROJECT = "similar_project",
	NEXT_LOGICAL_STEP = "next_logical_step",
	FREQUENTLY_USED_TOGETHER = "frequently_used_together",
	IMPROVED_VERSION = "improved_version",
	POPULAR_IN_PROFESSION = "popular_in_profession",
	USER_HISTORY = "user_history",
	PERSONALIZED_FOR_YOU = "personalized_for_you",
	TRENDING_NOW = "trending_now",
	SIMILAR_USERS_LIKE = "similar_users_like",
	CONTEXT_RELEVANT = "context_relevant",
}

export type RecommendationResult<T> = {
	itemId: string;
	itemName: string;
	itemType: string;
	score: number;
	reason: RecommendationReason;
	description: string;
	strategy: RecommendationStrategy;
	metadata?: any;
};

export class AdvancedRecommendationService {
	/**
	 * Genera recomendaciones avanzadas de plantillas de cálculo
	 */
	async generateTemplateRecommendations(
		user: User,
		userPattern: UserBehaviorPattern,
		similarUsers: Array<{userId: string; similarityScore: number}>,
		currentTemplateId?: string,
		projectId?: string,
		allTemplates?: CalculationTemplate[],
		recentTemplateUsage?: Array<{templateId: string; usageCount: number}>
	): Promise<RecommendationResult<CalculationTemplate>[]> {
		const recommendations: RecommendationResult<CalculationTemplate>[] = [];

		if (!allTemplates || allTemplates.length === 0) {
			return recommendations;
		}

		// 1. Recomendaciones basadas en contenido (similitud con lo que el usuario ya usa)
		const contentBasedRecs = this.getContentBasedTemplateRecommendations(
			user,
			userPattern,
			currentTemplateId,
			allTemplates,
			recentTemplateUsage || []
		);
		recommendations.push(...contentBasedRecs);

		// 2. Recomendaciones de filtrado colaborativo (basadas en usuarios similares)
		if (similarUsers.length > 0) {
			const collaborativeRecs = this.getCollaborativeTemplateRecommendations(
				similarUsers,
				allTemplates,
				currentTemplateId,
				recentTemplateUsage || []
			);
			recommendations.push(...collaborativeRecs);
		}

		// 3. Recomendaciones basadas en popularidad
		const popularityRecs = this.getPopularityBasedTemplateRecommendations(
			user,
			allTemplates,
			currentTemplateId
		);
		recommendations.push(...popularityRecs);

		// 4. Recomendaciones contextuales (basadas en el proyecto actual)
		if (projectId) {
			const contextualRecs = this.getContextAwareTemplateRecommendations(
				projectId,
				allTemplates,
				currentTemplateId
			);
			recommendations.push(...contextualRecs);
		}

		// Ordenar por puntuación y remover duplicados
		const uniqueRecommendations =
			this.getUniqueRecommendations(recommendations);
		return uniqueRecommendations.slice(0, 10);
	}

	/**
	 * Genera recomendaciones avanzadas de materiales
	 */
	async generateMaterialRecommendations(
		user: User,
		userPattern: UserBehaviorPattern,
		similarUsers: Array<{userId: string; similarityScore: number}>,
		currentMaterials: string[],
		projectId?: string,
		allMaterials?: Material[]
	): Promise<RecommendationResult<Material>[]> {
		const recommendations: RecommendationResult<Material>[] = [];

		if (!allMaterials || allMaterials.length === 0) {
			return recommendations;
		}

		// 1. Recomendaciones basadas en contenido
		const contentBasedRecs = this.getContentBasedMaterialRecommendations(
			user,
			userPattern,
			currentMaterials,
			allMaterials
		);
		recommendations.push(...contentBasedRecs);

		// 2. Recomendaciones de filtrado colaborativo
		if (similarUsers.length > 0) {
			const collaborativeRecs = this.getCollaborativeMaterialRecommendations(
				similarUsers,
				allMaterials,
				currentMaterials
			);
			recommendations.push(...collaborativeRecs);
		}

		// 3. Recomendaciones basadas en popularidad
		const popularityRecs = this.getPopularityBasedMaterialRecommendations(
			user,
			allMaterials,
			currentMaterials
		);
		recommendations.push(...popularityRecs);

		// 4. Recomendaciones contextuales
		if (projectId) {
			const contextualRecs = this.getContextAwareMaterialRecommendations(
				projectId,
				allMaterials,
				currentMaterials
			);
			recommendations.push(...contextualRecs);
		}

		// Ordenar por puntuación y remover duplicados
		const uniqueRecommendations =
			this.getUniqueRecommendations(recommendations);
		return uniqueRecommendations.slice(0, 10);
	}

	// Métodos privados para generar recomendaciones específicas

	private getContentBasedTemplateRecommendations(
		user: User,
		userPattern: UserBehaviorPattern,
		currentTemplateId?: string,
		allTemplates?: CalculationTemplate[],
		recentUsage?: Array<{templateId: string; usageCount: number}>
	): RecommendationResult<CalculationTemplate>[] {
		const recommendations: RecommendationResult<CalculationTemplate>[] = [];

		if (!allTemplates || allTemplates.length === 0) {
			return recommendations;
		}

		// Implementación de recomendaciones basadas en contenido
		// Lógica que encuentra plantillas similares a las que el usuario ya usa frecuentemente

		// Ejemplo de implementación básica:
		if (currentTemplateId && recentUsage && recentUsage.length > 0) {
			// Obtener la plantilla actual
			const currentTemplate = allTemplates.find(
				(t) => t.id === currentTemplateId
			);

			if (currentTemplate) {
				// Encontrar plantillas similares basadas en tipo y etiquetas
				const similarTemplates = allTemplates.filter(
					(t) =>
						t.id !== currentTemplateId &&
						t.isActive &&
						t.isVerified &&
						(t.type === currentTemplate.type ||
							(t.tags &&
								currentTemplate.tags &&
								t.tags.some((tag) => currentTemplate.tags?.includes(tag))))
				);

				// Calcular puntuación basada en similitud
				similarTemplates.forEach((template) => {
					let score = 0.5; // Puntuación base

					// Aumentar puntuación si el tipo coincide
					if (template.type === currentTemplate.type) {
						score += 0.2;
					}

					// Aumentar puntuación por etiquetas coincidentes
					if (template.tags && currentTemplate.tags) {
						const commonTags = template.tags.filter((tag) =>
							currentTemplate.tags?.includes(tag)
						);
						score += commonTags.length * 0.05;
					}

					// Limitar puntuación máxima a 0.95
					score = Math.min(score, 0.95);

					recommendations.push({
						itemId: template.id,
						itemName: template.name,
						itemType: "template",
						score,
						reason: RecommendationReason.PERSONALIZED_FOR_YOU,
						description: `Basado en tu uso de ${currentTemplate.name}`,
						strategy: RecommendationStrategy.CONTENT_BASED,
					});
				});
			}
		}

		return recommendations;
	}

	private getCollaborativeTemplateRecommendations(
		similarUsers: Array<{userId: string; similarityScore: number}>,
		allTemplates?: CalculationTemplate[],
		currentTemplateId?: string,
		recentUsage?: Array<{templateId: string; usageCount: number}>
	): RecommendationResult<CalculationTemplate>[] {
		const recommendations: RecommendationResult<CalculationTemplate>[] = [];

		// Implementación de recomendaciones basadas en filtrado colaborativo
		// Este sería un placeholder para la lógica real que usaría datos de usuarios similares

		return recommendations;
	}

	private getPopularityBasedTemplateRecommendations(
		user: User,
		allTemplates?: CalculationTemplate[],
		currentTemplateId?: string
	): RecommendationResult<CalculationTemplate>[] {
		const recommendations: RecommendationResult<CalculationTemplate>[] = [];

		if (!allTemplates || allTemplates.length === 0) {
			return recommendations;
		}

		// Obtener las plantillas más populares para el tipo profesional del usuario
		if (user.professionalType) {
			// Mapear ProfessionalType a ProfessionType
			const professionType = this.mapProfessionalToProfessionType(
				user.professionalType
			);

			const popularTemplates = allTemplates
				.filter(
					(t) =>
						(t.targetProfession === professionType ||
							t.targetProfession === ProfessionType.ALL) &&
						t.isActive &&
						t.isVerified &&
						t.usageCount > 10 &&
						(!currentTemplateId || t.id !== currentTemplateId)
				)
				.sort((a, b) => b.usageCount - a.usageCount)
				.slice(0, 5);

			const maxUsageCount =
				popularTemplates.length > 0
					? Math.max(...popularTemplates.map((t) => t.usageCount))
					: 1;

			popularTemplates.forEach((template) => {
				const score = 0.5 + 0.4 * (template.usageCount / maxUsageCount);

				recommendations.push({
					itemId: template.id,
					itemName: template.name,
					itemType: "template",
					score,
					reason: RecommendationReason.TRENDING_NOW,
					description: `Popular entre profesionales como tú`,
					strategy: RecommendationStrategy.POPULARITY_BASED,
				});
			});
		}

		return recommendations;
	}

	private getContextAwareTemplateRecommendations(
		projectId: string,
		allTemplates?: CalculationTemplate[],
		currentTemplateId?: string
	): RecommendationResult<CalculationTemplate>[] {
		// Implementación de recomendaciones contextuales
		// Por ahora un placeholder

		return [];
	}

	private getContentBasedMaterialRecommendations(
		user: User,
		userPattern: UserBehaviorPattern,
		currentMaterials: string[],
		allMaterials?: Material[]
	): RecommendationResult<Material>[] {
		// Implementación similar a la de plantillas pero para materiales

		return [];
	}

	private getCollaborativeMaterialRecommendations(
		similarUsers: Array<{userId: string; similarityScore: number}>,
		allMaterials?: Material[],
		currentMaterials?: string[]
	): RecommendationResult<Material>[] {
		// Implementación para recomendaciones colaborativas de materiales

		return [];
	}

	private getPopularityBasedMaterialRecommendations(
		user: User,
		allMaterials?: Material[],
		currentMaterials?: string[]
	): RecommendationResult<Material>[] {
		// Implementación para recomendaciones por popularidad de materiales

		return [];
	}

	private getContextAwareMaterialRecommendations(
		projectId: string,
		allMaterials?: Material[],
		currentMaterials?: string[]
	): RecommendationResult<Material>[] {
		// Implementación para recomendaciones contextuales de materiales

		return [];
	}

	private getUniqueRecommendations<T>(
		recommendations: RecommendationResult<T>[]
	): RecommendationResult<T>[] {
		// Eliminar duplicados y ordenar por puntuación
		const uniqueMap = new Map<string, RecommendationResult<T>>();

		recommendations.forEach((rec) => {
			const existingRec = uniqueMap.get(rec.itemId);

			if (!existingRec || existingRec.score < rec.score) {
				uniqueMap.set(rec.itemId, rec);
			}
		});

		return Array.from(uniqueMap.values()).sort((a, b) => b.score - a.score);
	}

	/**
	 * Mapea un ProfessionalType a un ProfessionType equivalente
	 */
	private mapProfessionalToProfessionType(
		professionalType: ProfessionalType
	): ProfessionType {
		// Mapa de correspondencia entre ProfessionalType y ProfessionType
		const typeMap: Record<ProfessionalType, ProfessionType> = {
			[ProfessionalType.ARCHITECT]: ProfessionType.ARCHITECT,
			[ProfessionalType.CIVIL_ENGINEER]: ProfessionType.CIVIL_ENGINEER,
			[ProfessionalType.CONSTRUCTOR]: ProfessionType.CONSTRUCTION_WORKER,
			[ProfessionalType.CONTRACTOR]: ProfessionType.CONTRACTOR,
			[ProfessionalType.ELECTRICIAN]: ProfessionType.ELECTRICIAN,
			[ProfessionalType.PLUMBER]: ProfessionType.PLUMBER,
			[ProfessionalType.DESIGNER]: ProfessionType.ARCHITECT, // Mapeado a arquitecto como aproximación
			[ProfessionalType.OTHER]: ProfessionType.ALL,
		};

		return typeMap[professionalType] || ProfessionType.ALL;
	}
}
