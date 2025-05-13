// src/domain/models/user/UserInteraction.ts
import {InteractionType} from "../../../infrastructure/database/entities/UserInteractionEntity";

export interface UserInteraction {
	id: string;
	userId: string;
	type: InteractionType;
	materialId?: string;
	categoryId?: string;
	projectId?: string;
	searchQuery?: string;
	metadata?: {
		page?: string;
		section?: string;
		duration?: number;
		rating?: number;
		reviewText?: string;
		deviceType?: string;
		browser?: string;
		os?: string;
		referrer?: string;
	};
	sessionId?: string;
	ipAddress?: string;
	userAgent?: string;
	createdAt: Date;
}
