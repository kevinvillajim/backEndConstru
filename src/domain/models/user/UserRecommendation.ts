import {
	RecommendationType,
	RecommendationStatus,
} from "../../../infrastructure/database/entities/UserRecommendationEntity";

/**
 * Modelo que representa una recomendación para un usuario
 */
export interface UserRecommendation {
	id: string;
	userId: string;
	type: RecommendationType;
	materialId?: string;
	categoryId?: string;
	projectType?: string;
	supplierId?: string;
	score: number;
	reason?: string;
	status: RecommendationStatus;
	expiresAt?: Date;

	// Campos adicionales para UI
	name?: string;
	thumbnailUrl?: string;

	// Relaciones (opcional, dependiendo del caso de uso)
	material?: any;
	category?: any;
	supplier?: any;

	createdAt: Date;
	updatedAt: Date;
}
