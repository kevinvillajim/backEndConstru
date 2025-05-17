import type {UserBehaviorPattern} from "../../domain/models/user/UserBehaviorPattern";
import type {UserRecommendation} from "../../domain/models/user/UserRecommendation";
import type {UserRecommendationRepository} from "../../domain/repositories/UserRecommendationRepository";

/**
 * Servicio para manejar recomendaciones personalizadas para usuarios
 */
export class UserRecommendationService {
	private userRecommendationRepository: UserRecommendationRepository;

	constructor(userRecommendationRepository: UserRecommendationRepository) {
		this.userRecommendationRepository = userRecommendationRepository;
	}

	/**
	 * Obtiene el patrón de comportamiento del usuario
	 * @param userId ID del usuario
	 * @param timeRange Rango de tiempo para el análisis (en días)
	 */
	async getUserBehaviorPattern(
		userId: string,
		timeRange?: number
	): Promise<UserBehaviorPattern> {
		return await this.userRecommendationRepository.getUserBehaviorPattern(
			userId,
			timeRange
		);
	}

	/**
	 * Obtiene las recomendaciones activas para el usuario
	 * @param userId ID del usuario
	 * @param status Filtrar por estado de recomendación
	 * @param limit Límite de resultados
	 */
	async getUserRecommendations(
		userId: string,
		status?: string,
		limit?: number
	): Promise<UserRecommendation[]> {
		return await this.userRecommendationRepository.getUserRecommendations(
			userId,
			status,
			limit
		);
	}

	/**
	 * Actualiza el estado de una recomendación
	 * @param recommendationId ID de la recomendación
	 * @param status Nuevo estado
	 */
	async updateRecommendationStatus(
		recommendationId: string,
		status: string
	): Promise<UserRecommendation> {
		return await this.userRecommendationRepository.updateRecommendationStatus(
			recommendationId,
			status
		);
	}

	/**
	 * Encuentra usuarios similares al usuario dado
	 * @param userId ID del usuario
	 * @param limit Límite de resultados
	 */
	async findSimilarUsers(
		userId: string,
		limit?: number
	): Promise<Array<{userId: string; similarityScore: number}>> {
		return await this.userRecommendationRepository.findSimilarUsers(
			userId,
			limit
		);
	}

	/**
	 * Registra una interacción del usuario con una recomendación
	 * @param userId ID del usuario
	 * @param recommendationId ID de la recomendación
	 * @param interactionType Tipo de interacción (view, click, convert, dismiss)
	 */
	async logRecommendationInteraction(
		userId: string,
		recommendationId: string,
		interactionType: string
	): Promise<void> {
		return await this.userRecommendationRepository.logRecommendationInteraction(
			userId,
			recommendationId,
			interactionType
		);
	}
}
