// src/domain/repositories/TemplateRatingRepository.ts
export interface TemplateRatingRepository {
	findByTemplateId(templateId: string): Promise<any[]>;
	findByUserId(userId: string): Promise<any[]>;
	createOrUpdate(rating: {
		templateId: string;
		userId: string;
		rating: number;
		comment?: string;
	}): Promise<any>;
	getAverageRating(
		templateId: string
	): Promise<{average: number; count: number}>;
	getUserRating(userId: string, templateId: string): Promise<any | null>;
}
