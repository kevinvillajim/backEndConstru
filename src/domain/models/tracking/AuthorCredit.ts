// src/domain/models/tracking/AuthorCredit.ts
export interface CreateAuthorCreditDTO {
	verifiedTemplateId: string;
	originalPersonalTemplateId: string;
	originalAuthorId: string;
	creditType:
		| "full_author"
		| "contributor"
		| "inspiration"
		| "collaborator"
		| "reviewer";
	creditText: string;
	customAttribution?: string;
	isVisible?: boolean;
	visibility?: "public" | "restricted" | "private";
	contributionDescription?: string;
	contributionPercentage?: number;
	originalCreationDate?: Date;
	promotionDate?: Date;
	promotionRequestId?: string;
	metricsAtPromotion?: any;
	pointsAwarded?: number;
	badgeEarned?: string;
	recognitionLevel?: "bronze" | "silver" | "gold" | "platinum";
	displayOrder?: number;
	showAuthorContact?: boolean;
	showOriginalDate?: boolean;
}

export interface UpdateAuthorCreditDTO {
	creditText?: string;
	customAttribution?: string;
	isVisible?: boolean;
	visibility?: "public" | "restricted" | "private";
	contributionDescription?: string;
	contributionPercentage?: number;
	pointsAwarded?: number;
	badgeEarned?: string;
	recognitionLevel?: "bronze" | "silver" | "gold" | "platinum";
	displayOrder?: number;
	showAuthorContact?: boolean;
	showOriginalDate?: boolean;
	approvedBy?: string;
	approvedAt?: Date;
	approvalNotes?: string;
}

export interface AuthorCreditData {
	id: string;
	verifiedTemplateId: string;
	originalPersonalTemplateId: string;
	originalAuthorId: string;
	creditType:
		| "full_author"
		| "contributor"
		| "inspiration"
		| "collaborator"
		| "reviewer";
	creditText: string;
	customAttribution?: string;
	isVisible: boolean;
	visibility: "public" | "restricted" | "private";
	contributionDescription?: string;
	contributionPercentage?: number;
	originalCreationDate?: Date;
	promotionDate?: Date;
	promotionRequestId?: string;
	metricsAtPromotion?: any;
	pointsAwarded: number;
	badgeEarned?: string;
	recognitionLevel?: "bronze" | "silver" | "gold" | "platinum";
	displayOrder: number;
	showAuthorContact: boolean;
	showOriginalDate: boolean;
	approvedBy?: string;
	approvedAt?: Date;
	approvalNotes?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuthorStats {
	authorId: string;
	totalCredits: number;
	visibleCredits: number;
	creditsByType: Record<string, number>;
	totalPointsAwarded: number;
	badgesEarned: string[];
	highestRecognition?: string;
	contributedTemplates: Array<{
		verifiedTemplateId: string;
		templateName: string;
		creditType: string;
		promotionDate?: Date;
		pointsAwarded: number;
	}>;
	recentActivity: number;
	averageContributionPercentage: number;
}
