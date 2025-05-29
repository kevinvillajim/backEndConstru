// src/domain/models/calculation/UserCalculationTemplate.ts
export enum UserTemplateSourceType {
	CREATED = "created",
	COPIED = "copied",
	FROM_RESULT = "from_result",
}

export enum UserTemplateStatus {
	DRAFT = "draft",
	ACTIVE = "active",
	ARCHIVED = "archived",
}

export enum UserTemplateDifficulty {
	BASIC = "basic",
	INTERMEDIATE = "intermediate",
	ADVANCED = "advanced",
}

export interface UserTemplateParameter {
	id?: string;
	name: string;
	label: string;
	type: "number" | "text" | "select" | "boolean";
	scope: "input" | "internal" | "output";
	required: boolean;
	displayOrder: number;
	unit?: string;
	minValue?: number;
	maxValue?: number;
	allowedValues?: string[];
	defaultValue?: any;
	helpText?: string;
	dependsOnParameters?: string[];
	formula?: string;
}

export type UserCalculationTemplate = {
	id: string;
	name: string;
	description: string;
	longDescription?: string;
	sourceType: UserTemplateSourceType;
	originalTemplateId?: string;
	sourceCalculationResultId?: string;
	category: string;
	subcategory?: string;
	targetProfessions: string[];
	difficulty: UserTemplateDifficulty;
	estimatedTime?: string;
	necReference?: string;
	tags: string[];
	parameters: UserTemplateParameter[];
	formula: string;
	isPublic: boolean;
	isActive: boolean;
	version: string;
	status: UserTemplateStatus;
	requirements?: string[];
	applicationCases?: string[];
	limitations?: string[];
	sharedWith?: string[];
	author: {
		id: string;
		name: string;
		email: string;
	};
	usageCount: number;
	totalRatings: number;
	averageRating: number;
	isFavorite: boolean;
	isNew?: boolean;
	createdAt: Date;
	lastModified: Date;
};

export type CreateUserCalculationTemplateDTO = {
	name: string;
	description: string;
	longDescription?: string;
	sourceType: UserTemplateSourceType;
	originalTemplateId?: string;
	sourceCalculationResultId?: string;
	category: string;
	subcategory?: string;
	targetProfessions: string[];
	difficulty: UserTemplateDifficulty;
	estimatedTime?: string;
	necReference?: string;
	tags: string[];
	parameters: UserTemplateParameter[];
	formula: string;
	isPublic: boolean;
	version: string;
	requirements?: string[];
	applicationCases?: string[];
	limitations?: string[];
	sharedWith?: string[];
	userId: string;
};

export type UpdateUserCalculationTemplateDTO = Partial
	Omit<CreateUserCalculationTemplateDTO, "userId" | "sourceType">;

export type TemplateFormData = {
	name: string;
	description: string;
	longDescription?: string;
	category: string;
	subcategory?: string;
	targetProfessions: string[];
	difficulty: UserTemplateDifficulty;
	estimatedTime?: string;
	necReference?: string;
	tags: string[];
	parameters: UserTemplateParameter[];
	formula: string;
	isPublic: boolean;
	requirements?: string[];
	applicationCases?: string[];
	limitations?: string[];
};