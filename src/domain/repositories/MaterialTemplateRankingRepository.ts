// src/domain/repositories/MaterialTemplateRankingRepository.ts
export interface MaterialTemplateRankingRepository {
	findByPeriod(
		period: "daily" | "weekly" | "monthly" | "yearly",
		materialType?: string,
		limit?: number
	): Promise<any[]>;
	upsert(ranking: Omit<any, "id" | "createdAt" | "updatedAt">): Promise<any>;
	findByTemplateId(templateId: string): Promise<any[]>;
	delete(id: string): Promise<boolean>;
}
