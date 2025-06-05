// src/domain/repositories/MaterialTemplateUsageLogRepository.ts
export interface UsageStatsByTemplate {
	templateId: string;
	templateType: "official" | "user";
	materialType: string;
	subCategory: string;
	usageCount: number;
	uniqueUsers: number;
	uniqueProjects: number;
	successRate: number;
	averageExecutionTime: number;
	averageMaterialsCount: number;
	totalCostCalculated: number;
}

export interface MaterialTemplateUsageLogRepository {
	create(usageLog: Omit<any, "id" | "createdAt">): Promise<any>;
	getUsageStatsByPeriod(
		periodStart: Date,
		periodEnd: Date
	): Promise<UsageStatsByTemplate[]>;
	findByTemplateId(templateId: string): Promise<any[]>;
	findByUserId(userId: string): Promise<any[]>;
	delete(id: string): Promise<boolean>;
}
