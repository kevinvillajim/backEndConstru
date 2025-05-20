// src/domain/services/UserPatternAnalysisService.ts
import {UserInteraction} from "../models/user/UserInteraction";

export interface UserBehaviorPattern {
	userId: string;
	frequentMaterials: Array<{materialId: string; frequency: number}>;
	frequentCategories: Array<{categoryId: string; frequency: number}>;
	searchPatterns: Array<{term: string; frequency: number}>;
	preferredCalculationTypes: Array<{type: string; frequency: number}>;
	sessionMetrics: {
		averageDuration: number;
		averageActionsPerSession: number;
		mostActiveTimeOfDay: string;
	};
	projectPreferences: {
		preferredProjectTypes: string[];
		averageProjectDuration: number;
		averageBudgetRange: {min: number; max: number};
	};
}

export class UserPatternAnalysisService {
	/**
	 * Analiza las interacciones del usuario para identificar patrones de comportamiento
	 */
	async analyzeUserPatterns(
		userId: string,
		interactions: UserInteraction[],
		timeRange?: {start: Date; end: Date}
	): Promise<UserBehaviorPattern> {
		// Implementación que analiza patrones del usuario basado en sus interacciones
		// y genera un modelo de comportamiento detallado
		const behaviorPattern: UserBehaviorPattern = {
			userId,
			frequentMaterials: [],
			frequentCategories: [],
			searchPatterns: [],
			preferredCalculationTypes: [],
			sessionMetrics: {
				averageDuration: 0,
				averageActionsPerSession: 0,
				mostActiveTimeOfDay: "morning",
			},
			projectPreferences: {
				preferredProjectTypes: [],
				averageProjectDuration: 0,
				averageBudgetRange: {min: 0, max: 0},
			},
		};

		// Si hay interacciones para analizar
		if (interactions.length > 0) {
			// Analizar materiales frecuentes
			const materialCounts = new Map<string, number>();
			// Analizar categorías frecuentes
			const categoryCounts = new Map<string, number>();
			// Analizar búsquedas
			const searchTerms = new Map<string, number>();
			// Análisis de plantillas usadas
			const calculationTypes = new Map<string, number>();

			// Datos de sesión
			const sessionDurations: number[] = [];
			const actionsPerSession = new Map<string, number>();
			const timeOfDayActivity: {[key: string]: number} = {
				morning: 0, // 6am-12pm
				afternoon: 0, // 12pm-6pm
				evening: 0, // 6pm-10pm
				night: 0, // 10pm-6am
			};

			// Agrupar interacciones por sesión
			const sessionInteractions = new Map<string, UserInteraction[]>();

			// Procesar todas las interacciones
			interactions.forEach((interaction) => {
				// Filtrar por rango de tiempo si se proporciona
				if (timeRange) {
					const interactionDate = new Date(interaction.createdAt);
					if (
						interactionDate < timeRange.start ||
						interactionDate > timeRange.end
					) {
						return;
					}
				}

				// Agrupar por sesión
				if (interaction.sessionId) {
					if (!sessionInteractions.has(interaction.sessionId)) {
						sessionInteractions.set(interaction.sessionId, []);
					}
					sessionInteractions.get(interaction.sessionId)?.push(interaction);
				}

				// Contar materiales
				if (interaction.materialId) {
					materialCounts.set(
						interaction.materialId,
						(materialCounts.get(interaction.materialId) || 0) + 1
					);
				}

				// Contar categorías
				if (interaction.categoryId) {
					categoryCounts.set(
						interaction.categoryId,
						(categoryCounts.get(interaction.categoryId) || 0) + 1
					);
				}

				// Contar términos de búsqueda
				if (interaction.type === "search" && interaction.searchQuery) {
					searchTerms.set(
						interaction.searchQuery,
						(searchTerms.get(interaction.searchQuery) || 0) + 1
					);
				}

				// Analizar hora del día
				const interactionDate = new Date(interaction.createdAt);
				const hour = interactionDate.getHours();

				if (hour >= 6 && hour < 12) {
					timeOfDayActivity.morning += 1;
				} else if (hour >= 12 && hour < 18) {
					timeOfDayActivity.afternoon += 1;
				} else if (hour >= 18 && hour < 22) {
					timeOfDayActivity.evening += 1;
				} else {
					timeOfDayActivity.night += 1;
				}
			});

			// Analizar sesiones
			sessionInteractions.forEach((sessionData, sessionId) => {
				if (sessionData.length > 0) {
					const firstAction = new Date(sessionData[0].createdAt).getTime();
					const lastAction = new Date(
						sessionData[sessionData.length - 1].createdAt
					).getTime();
					const duration = (lastAction - firstAction) / 1000 / 60; // en minutos

					sessionDurations.push(duration);
					actionsPerSession.set(sessionId, sessionData.length);
				}
			});

			// Determinar tiempo de día más activo
			let mostActiveTime = "morning";
			let maxActivity = 0;

			Object.keys(timeOfDayActivity).forEach((time) => {
				if (timeOfDayActivity[time] > maxActivity) {
					maxActivity = timeOfDayActivity[time];
					mostActiveTime = time;
				}
			});

			// Calcular métricas de sesión
			const avgDuration =
				sessionDurations.length > 0
					? sessionDurations.reduce((sum, duration) => sum + duration, 0) /
						sessionDurations.length
					: 0;

			const actionsArray = Array.from(actionsPerSession.values());
			const avgActions =
				actionsArray.length > 0
					? actionsArray.reduce((sum, count) => sum + count, 0) /
						actionsArray.length
					: 0;

			// Construir patrones de comportamiento
			behaviorPattern.frequentMaterials = Array.from(materialCounts.entries())
				.map(([materialId, frequency]) => ({materialId, frequency}))
				.sort((a, b) => b.frequency - a.frequency)
				.slice(0, 10);

			behaviorPattern.frequentCategories = Array.from(categoryCounts.entries())
				.map(([categoryId, frequency]) => ({categoryId, frequency}))
				.sort((a, b) => b.frequency - a.frequency)
				.slice(0, 5);

			behaviorPattern.searchPatterns = Array.from(searchTerms.entries())
				.map(([term, frequency]) => ({term, frequency}))
				.sort((a, b) => b.frequency - a.frequency)
				.slice(0, 10);

			behaviorPattern.sessionMetrics = {
				averageDuration: avgDuration,
				averageActionsPerSession: avgActions,
				mostActiveTimeOfDay: mostActiveTime,
			};
		}

		return behaviorPattern;
	}

	/**
	 * Identifica similitudes entre usuarios para recomendaciones colaborativas
	 */
	async findSimilarUsers(
		userId: string,
		allPatterns: UserBehaviorPattern[] = []
	): Promise<Array<{userId: string; similarityScore: number}>> {
		// Implementación que encuentra usuarios con patrones similares
		// Para usarse en filtrado colaborativo
		const userPattern = allPatterns.find(
			(pattern) => pattern.userId === userId
		);
		if (!userPattern || allPatterns.length <= 1) {
			return [];
		}

		const similarUsers = allPatterns
			.filter((pattern) => pattern.userId !== userId)
			.map((pattern) => {
				// Calcular similitud basada en diferentes factores
				let similarityScore = 0;

				// Similitud de materiales frecuentes
				const userMaterials = new Set(
					userPattern.frequentMaterials.map((m) => m.materialId)
				);
				const otherMaterials = new Set(
					pattern.frequentMaterials.map((m) => m.materialId)
				);
				const commonMaterials = new Set(
					[...userMaterials].filter((materialId) =>
						otherMaterials.has(materialId)
					)
				);

				similarityScore +=
					(commonMaterials.size / Math.max(userMaterials.size, 1)) * 0.4;

				// Similitud de categorías frecuentes
				const userCategories = new Set(
					userPattern.frequentCategories.map((c) => c.categoryId)
				);
				const otherCategories = new Set(
					pattern.frequentCategories.map((c) => c.categoryId)
				);
				const commonCategories = new Set(
					[...userCategories].filter((categoryId) =>
						otherCategories.has(categoryId)
					)
				);

				similarityScore +=
					(commonCategories.size / Math.max(userCategories.size, 1)) * 0.3;

				// Similitud en patrones de búsqueda
				const userSearches = new Set(
					userPattern.searchPatterns.map((s) => s.term)
				);
				const otherSearches = new Set(
					pattern.searchPatterns.map((s) => s.term)
				);
				const commonSearches = new Set(
					[...userSearches].filter((term) => otherSearches.has(term))
				);

				similarityScore +=
					(commonSearches.size / Math.max(userSearches.size, 1)) * 0.2;

				// Similitud en horarios de actividad
				if (
					userPattern.sessionMetrics.mostActiveTimeOfDay ===
					pattern.sessionMetrics.mostActiveTimeOfDay
				) {
					similarityScore += 0.1;
				}

				return {
					userId: pattern.userId,
					similarityScore,
				};
			})
			.sort((a, b) => b.similarityScore - a.similarityScore);

		return similarUsers;
	}
}
