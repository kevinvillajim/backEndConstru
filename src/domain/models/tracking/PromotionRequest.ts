// src/domain/models/tracking/PromotionRequest.ts
export enum PromotionRequestStatus {
	PENDING = "pending",
	UNDER_REVIEW = "under_review",
	APPROVED = "approved",
	REJECTED = "rejected",
	IMPLEMENTED = "implemented",
}

export interface CreatePromotionRequestDTO {
	personalTemplateId: string;
	requestedBy: string;
	originalAuthorId: string;
	reason: string;
	detailedJustification?: string;
	priority: "low" | "medium" | "high" | "urgent";
	metrics: {
		totalUsage: number;
		uniqueUsers: number;
		successRate: number;
		averageRating: number;
		rankingPosition: number;
		trendScore: number;
		growthRate: number;
		userFeedback: string[];
		technicalAssessment?: string;
	};
	estimatedImpact?: {
		potentialUsers: number;
		industryBenefit: string;
		technicalComplexity: "low" | "medium" | "high";
		maintenanceRequirement: "low" | "medium" | "high";
	};
	creditToAuthor?: boolean;
	qualityScore?: number;
}

export interface UpdatePromotionRequestDTO {
	reason?: string;
	detailedJustification?: string;
	priority?: "low" | "medium" | "high" | "urgent";
	metrics?: any;
	estimatedImpact?: any;
	status?: PromotionRequestStatus;
	reviewedBy?: string;
	reviewedAt?: Date;
	reviewComments?: string;
	verifiedTemplateId?: string;
	implementationNotes?: string;
}

export interface PromotionRequestData {
	id: string;
	personalTemplateId: string;
	requestedBy: string;
	originalAuthorId: string;
	reason: string;
	detailedJustification?: string;
	priority: "low" | "medium" | "high" | "urgent";
	metrics: any;
	estimatedImpact?: any;
	creditToAuthor: boolean;
	qualityScore?: number;
	status: PromotionRequestStatus;
	reviewedBy?: string;
	reviewedAt?: Date;
	reviewComments?: string;
	verifiedTemplateId?: string;
	implementationNotes?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface PromotionRequestFilters {
	status?: PromotionRequestStatus[];
	priority?: string[];
	requestedBy?: string;
	originalAuthorId?: string;
	reviewedBy?: string;
	dateFrom?: Date;
	dateTo?: Date;
	minQualityScore?: number;
	personalTemplateId?: string;
}
