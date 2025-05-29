// src/domain/models/tracking/TemplateRanking.ts
export interface CreateRankingDTO {
	templateId: string;
	templateType: "personal" | "verified";
	period: "daily" | "weekly" | "monthly" | "yearly";
	periodStart: Date;
	periodEnd: Date;
	usageCount: number;
	uniqueUsers: number;
	successRate: number;
	averageExecutionTime: number;
	rankPosition?: number;
	trendScore?: number;
	growthRate?: number;
	averageRating?: number;
	totalRatings?: number;
	favoriteCount?: number;
	weightedScore?: number;
	velocityScore?: number;
}

export interface UpdateRankingDTO {
	usageCount?: number;
	uniqueUsers?: number;
	successRate?: number;
	averageExecutionTime?: number;
	rankPosition?: number;
	trendScore?: number;
	growthRate?: number;
	averageRating?: number;
	totalRatings?: number;
	favoriteCount?: number;
	weightedScore?: number;
	velocityScore?: number;
}

export interface RankingData {
	templateId: string;
	templateType: "personal" | "verified";
	period: "daily" | "weekly" | "monthly" | "yearly";
	periodStart: Date;
	periodEnd: Date;
	usageCount: number;
	uniqueUsers: number;
	successRate: number;
	averageExecutionTime: number;
	rankPosition: number;
	trendScore: number;
	growthRate: number;
	averageRating: number;
	totalRatings: number;
	favoriteCount: number;
	weightedScore: number;
	velocityScore: number;
}

export interface TrendingTemplate {
	templateId: string;
	templateType: "personal" | "verified";
	rankPosition: number;
	trendScore: number;
	usageCount: number;
	uniqueUsers: number;
	successRate: number;
	growthRate: number;
	averageRating: number;
	period: {
		type: "daily" | "weekly" | "monthly" | "yearly";
		start: Date;
		end: Date;
	};
}
