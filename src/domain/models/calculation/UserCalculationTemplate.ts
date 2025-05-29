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
	regexPattern?: string;
	allowedValues?: string[];
	defaultValue?: any;
	placeholder?: string;
	helpText?: string;
	typicalRange?: string;
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
	contributors?: Array<{
		id: string;
		name: string;
		contributionType: string;
	}>;
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
	contributors?: Array<{
		id: string;
		name: string;
		contributionType: string;
	}>;
	userId: string;
};

// FIX: Especificar el tipo base para Partial y corregir Omit
export type UpdateUserCalculationTemplateDTO = Partial<
	Omit<CreateUserCalculationTemplateDTO, "userId" | "sourceType">
>;

export type DuplicateTemplateDTO = {
	originalTemplateId: string;
	customName?: string;
	customDescription?: string;
	userId: string;
};

export type CreateFromResultDTO = {
	sourceCalculationResultId: string;
	name: string;
	description?: string;
	category: string;
	targetProfessions: string[];
	userId: string;
};

export type ShareTemplateDTO = {
	templateId: string;
	userIds: string[];
	message?: string;
};

export interface UserTemplateFilters {
	status?: UserTemplateStatus[];
	categories?: string[];
	targetProfessions?: string[];
	difficulty?: UserTemplateDifficulty[];
	isPublic?: boolean;
	tags?: string[];
	searchTerm?: string;
	sourceType?: UserTemplateSourceType[];
	isFavorite?: boolean;
}

export interface UserTemplateStats {
	total: number;
	active: number;
	draft: number;
	archived: number;
	favorites: number;
	public: number;
	private: number;
	byCategory: Record<string, number>;
	byDifficulty: Record<UserTemplateDifficulty, number>;
	bySourceType: Record<UserTemplateSourceType, number>;
	recentActivity: {
		createdThisWeek: number;
		updatedThisWeek: number;
		usedThisWeek: number;
	};
}

export interface UserTemplateListResponse {
	templates: UserCalculationTemplate[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
	stats: UserTemplateStats;
}

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
