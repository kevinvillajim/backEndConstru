// src/domain/models/tracking/UsageLog.ts
export interface CreateUsageLogDTO {
	templateId: string;
	templateType: "personal" | "verified";
	userId: string;
	projectId?: string;
	calculationResultId: string;
	usageDate?: Date;
	executionTimeMs: number;
	wasSuccessful: boolean;
	ipAddress?: string;
	userAgent?: string;
	inputParameters?: Record<string, any>;
	outputResults?: Record<string, any>;
	errorMessage?: string;
}

export interface UsageAnalytics {
	templateId: string;
	templateType: "personal" | "verified";
	period: {
		start: Date;
		end: Date;
		type: "day" | "week" | "month" | "year";
	};
	metrics: {
		totalUsage: number;
		uniqueUsers: number;
		successRate: number;
		averageExecutionTime: number;
		totalErrors: number;
	};
	periodData: Array<{
		date: string;
		count: number;
		uniqueUsers: number;
	}>;
	trends: {
		growth: number;
		trend: "growing" | "declining" | "stable";
	};
}

export interface TemplateUsageStats {
	templateId: string;
	templateType: "personal" | "verified";
	totalUsage: number;
	uniqueUsers: number;
	recentUsage: number;
	averageExecutionTime: number;
	successRate: number;
	lastUsed: Date | null;
	trending: number;
}
