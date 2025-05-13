// src/domain/services/RecommendationService.ts
import {
	CalculationTemplate,
	ProfessionType,
} from "../models/calculation/CalculationTemplate";
import {CalculationResult} from "../models/calculation/CalculationResult";
import {User} from "../models/user/User";

export enum RecommendationReason {
	SIMILAR_PROJECT = "similar_project",
	NEXT_LOGICAL_STEP = "next_logical_step",
	FREQUENTLY_USED_TOGETHER = "frequently_used_together",
	IMPROVED_VERSION = "improved_version",
	POPULAR_IN_PROFESSION = "popular_in_profession",
	USER_HISTORY = "user_history",
}

export type TemplateRecommendation = {
	templateId: string;
	templateName: string;
	score: number;
	reason: RecommendationReason;
	description: string;
};

export class RecommendationService {
	/**
	 * Genera recomendaciones de plantillas basadas en el historial del usuario,
	 * el cálculo actual y tendencias generales
	 */
	async generateRecommendations(
		user: User,
		currentTemplateId?: string,
		projectId?: string,
		recentResults?: CalculationResult[],
		allTemplates?: CalculationTemplate[],
		userUsageHistory?: {templateId: string; usageCount: number}[]
	): Promise<TemplateRecommendation[]> {
		const recommendations: TemplateRecommendation[] = [];

		// Si no hay datos suficientes, dar recomendaciones básicas
		if (!allTemplates || allTemplates.length === 0) {
			return recommendations;
		}

		// 1. Recomendar versiones mejoradas de plantillas usadas
		if (currentTemplateId) {
			const currentTemplate = allTemplates.find(
				(t) => t.id === currentTemplateId
			);

			if (currentTemplate) {
				// Buscar versiones mejoradas (versión más alta con el mismo parentTemplateId)
				const improvedVersions = allTemplates.filter(
					(t) =>
						t.parentTemplateId === currentTemplate.id &&
						t.version > currentTemplate.version &&
						t.isVerified // Solo recomendar versiones verificadas
				);

				if (improvedVersions.length > 0) {
					// Ordenar por versión descendente y tomar la más reciente
					const latestVersion = improvedVersions.sort(
						(a, b) => b.version - a.version
					)[0];

					recommendations.push({
						templateId: latestVersion.id,
						templateName: latestVersion.name,
						score: 0.95, // Alta prioridad
						reason: RecommendationReason.IMPROVED_VERSION,
						description: `Versión mejorada de ${currentTemplate.name} (v${latestVersion.version})`,
					});
				}
			}
		}

		// 2. Recomendar plantillas frecuentemente usadas juntas
		if (currentTemplateId && userUsageHistory && userUsageHistory.length > 0) {
			// Lógica simplificada - se podría mejorar con análisis de datos más complejos
			const relatedTemplates = allTemplates.filter(
				(t) =>
					t.id !== currentTemplateId &&
					t.isActive &&
					t.isVerified &&
					userUsageHistory.some((h) => h.templateId === t.id)
			);

			// Tomar las 2 más usadas
			const mostUsed = relatedTemplates
				.map((t) => ({
					template: t,
					usageCount:
						userUsageHistory.find((h) => h.templateId === t.id)?.usageCount ||
						0,
				}))
				.sort((a, b) => b.usageCount - a.usageCount)
				.slice(0, 2);

			mostUsed.forEach((item) => {
				recommendations.push({
					templateId: item.template.id,
					templateName: item.template.name,
					score:
						0.8 *
						(item.usageCount /
							Math.max(...userUsageHistory.map((h) => h.usageCount))),
					reason: RecommendationReason.FREQUENTLY_USED_TOGETHER,
					description: `Usualmente utilizado junto con el cálculo actual`,
				});
			});
		}

		// 3. Recomendar por profesión del usuario
		if (user.professionalType) {
			const professionType = user.professionalType as unknown as ProfessionType;

			const popularInProfession = allTemplates
				.filter(
					(t) =>
						(t.targetProfession === professionType ||
							t.targetProfession === ProfessionType.ALL) &&
						t.isActive &&
						t.isVerified &&
						t.usageCount > 10 && // Mínimo de popularidad
						(!currentTemplateId || t.id !== currentTemplateId) &&
						// No recomendar si ya está en la lista
						!recommendations.some((r) => r.templateId === t.id)
				)
				.sort((a, b) => b.usageCount - a.usageCount) // Ordenar por popularidad
				.slice(0, 3); // Tomar los 3 más populares

			popularInProfession.forEach((template) => {
				recommendations.push({
					templateId: template.id,
					templateName: template.name,
					score:
						0.7 *
						(template.usageCount /
							Math.max(...popularInProfession.map((t) => t.usageCount))),
					reason: RecommendationReason.POPULAR_IN_PROFESSION,
					description: `Popular entre ${this.getProfessionName(professionType)}`,
				});
			});
		}

		// 4. Recomendar siguientes pasos lógicos basados en el proyecto (si aplica)
		if (projectId && recentResults && recentResults.length > 0) {
			// Ejemplo simplificado de relaciones entre tipos de cálculos
			const relationshipMap: Record<string, string[]> = {
				area_volume: ["material_estimation", "structural"],
				material_estimation: ["budget"],
				structural: ["material_estimation", "budget"],
				budget: ["installation"],
				installation: ["budget"],
			};

			// Identificar el tipo del cálculo actual o reciente
			const recentTemplates = recentResults
				.map((r) => allTemplates.find((t) => t.id === r.calculationTemplateId))
				.filter(Boolean) as CalculationTemplate[];

			if (recentTemplates.length > 0) {
				const lastTemplateType = recentTemplates[0].type;

				// Obtener tipos de cálculos recomendados como siguiente paso
				const nextStepTypes = relationshipMap[lastTemplateType] || [];

				if (nextStepTypes.length > 0) {
					const nextStepTemplates = allTemplates.filter(
						(t) =>
							nextStepTypes.includes(t.type) &&
							t.isActive &&
							t.isVerified &&
							(!currentTemplateId || t.id !== currentTemplateId) &&
							// No recomendar si ya está en la lista
							!recommendations.some((r) => r.templateId === t.id)
					);

					// Tomar el más popular de cada tipo
					const topByType: CalculationTemplate[] = [];
					nextStepTypes.forEach((type) => {
						const typeTemplates = nextStepTemplates.filter(
							(t) => t.type === type
						);
						if (typeTemplates.length > 0) {
							const top = typeTemplates.sort(
								(a, b) => b.usageCount - a.usageCount
							)[0];
							topByType.push(top);
						}
					});

					topByType.forEach((template) => {
						recommendations.push({
							templateId: template.id,
							templateName: template.name,
							score: 0.85,
							reason: RecommendationReason.NEXT_LOGICAL_STEP,
							description: `Siguiente paso recomendado después de ${recentTemplates[0].name}`,
						});
					});
				}
			}
		}

		// Ordenar recomendaciones por puntuación y limitar a 5
		return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
	}

	/**
	 * Traduce el tipo de profesión a un nombre amigable
	 */
	private getProfessionName(profession: ProfessionType): string {
		const names: Record<ProfessionType, string> = {
			[ProfessionType.ARCHITECT]: "Arquitectos",
			[ProfessionType.CIVIL_ENGINEER]: "Ingenieros Civiles",
			[ProfessionType.CONSTRUCTION_WORKER]: "Trabajadores de Construcción",
			[ProfessionType.PLUMBER]: "Plomeros",
			[ProfessionType.ELECTRICIAN]: "Electricistas",
			[ProfessionType.CONTRACTOR]: "Contratistas",
			[ProfessionType.ALL]: "Todos los profesionales",
			[ProfessionType.SAFETY_ENGINEER]: "",
			[ProfessionType.MECHANICAL_ENGINEER]: "",
			[ProfessionType.ELECTRICAL_ENGINEER]: "",
			[ProfessionType.TELECOMMUNICATIONS_ENGINEER]: ""
		};

		return names[profession] || "Profesionales";
	}
}
