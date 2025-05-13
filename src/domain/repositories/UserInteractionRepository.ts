// src/domain/repositories/UserInteractionRepository.ts
import {UserInteraction} from "../models/user/UserInteraction";

export interface UserInteractionRepository {
	findByUserId(
		userId: string,
		options?: {
			limit?: number;
			startDate?: Date;
			endDate?: Date;
			types?: string[];
		}
	): Promise<UserInteraction[]>;

	findBySessionId(sessionId: string): Promise<UserInteraction[]>;

	findPopularMaterials(options?: {
		limit?: number;
		startDate?: Date;
		endDate?: Date;
		professionalType?: string;
	}): Promise<Array<{materialId: string; count: number}>>;

	findPopularTemplates(options?: {
		limit?: number;
		startDate?: Date;
		endDate?: Date;
		professionalType?: string;
	}): Promise<Array<{templateId: string; count: number}>>;

	create(interaction: Omit<UserInteraction, "id">): Promise<UserInteraction>;

	bulkCreate(
		interactions: Array<Omit<UserInteraction, "id">>
	): Promise<UserInteraction[]>;
}
