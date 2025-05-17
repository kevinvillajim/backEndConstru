import type {UserBehaviorPattern} from "../models/user/UserBehaviorPattern";
import type {UserRecommendation} from "../models/user/UserRecommendation";

/**
 * Puerto (interfaz) para el repositorio de recomendaciones de usuario
 */
export interface UserRecommendationRepository {
	/**
	 * Obtiene el patrón de comportamiento del usuario
	 * @param userId ID del usuario
	 * @param timeRange Rango de tiempo para el análisis (en días)
	 */
	getUserBehaviorPattern(
		userId: string,
		timeRange?: number
	): Promise<UserBehaviorPattern>;

	/**
	 * Obtiene las recomendaciones activas para el usuario
	 * @param userId ID del usuario
	 * @param status Filtrar por estado de recomendación
	 * @param limit Límite de resultados
	 */
	getUserRecommendations(
		userId: string,
		status?: string,
		limit?: number
	): Promise<UserRecommendation[]>;

	/**
	 * Actualiza el estado de una recomendación
	 * @param recommendationId ID de la recomendación
	 * @param status Nuevo estado
	 */
	updateRecommendationStatus(
		recommendationId: string,
		status: string
	): Promise<UserRecommendation>;

	/**
	 * Encuentra usuarios similares al usuario dado
	 * @param userId ID del usuario
	 * @param limit Límite de resultados
	 */
	findSimilarUsers(
		userId: string,
		limit?: number
	): Promise<Array<{userId: string; similarityScore: number}>>;

	/**
	 * Registra una interacción del usuario con una recomendación
	 * @param userId ID del usuario
	 * @param recommendationId ID de la recomendación
	 * @param interactionType Tipo de interacción (view, click, convert, dismiss)
	 */
	logRecommendationInteraction(
		userId: string,
		recommendationId: string,
		interactionType: string
	): Promise<void>;
}
