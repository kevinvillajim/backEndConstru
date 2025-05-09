// src/domain/models/project/Project.ts
export enum ProjectStatus {
	PLANNING = "planning",
	IN_PROGRESS = "in_progress",
	ON_HOLD = "on_hold",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
}

export enum ProjectType {
	RESIDENTIAL = "residential",
	COMMERCIAL = "commercial",
	INDUSTRIAL = "industrial",
	INFRASTRUCTURE = "infrastructure",
	REMODELING = "remodeling",
	MAINTENANCE = "maintenance",
	OTHER = "other",
}

export interface Project {
	id: string;
	name: string;
	description?: string;
	status: ProjectStatus;
	type?: ProjectType;
	clientName?: string;
	clientEmail?: string;
	clientPhone?: string;
	startDate: Date;
	endDate?: Date;
	estimatedCompletionDate?: Date;
	completionPercentage: number;
	totalArea?: number;
	constructionArea?: number;
	floors?: number;
	location?: {
		latitude: number;
		longitude: number;
		address: string;
		city: string;
		province: string;
		country: string;
	};
	isActive: boolean;
	permits?: {
		name: string;
		number: string;
		issuedBy: string;
		issuedDate: Date;
		expiryDate?: Date;
		status: string;
	}[];
	tags?: string[];
	estimatedBudget?: number;
	currentCost?: number;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}
