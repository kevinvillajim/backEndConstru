// src/domain/repositories/CalculationTemplateRepository.ts
import {
	CalculationTemplate,
	CreateCalculationTemplateDTO,
	UpdateCalculationTemplateDTO,
	CalculationType,
	ProfessionType,
} from "../models/calculation/CalculationTemplate";

export interface CalculationTemplateRepository {
	findById(id: string): Promise<CalculationTemplate | null>;
	findByIdWithParameters(id: string): Promise<CalculationTemplate | null>;
	findAll(
		filters?: {
			types?: CalculationType[];
			targetProfessions?: ProfessionType[];
			isActive?: boolean;
			isVerified?: boolean;
			isFeatured?: boolean;
			shareLevel?: "private" | "organization" | "public";
			createdBy?: string;
			tags?: string[];
			searchTerm?: string;
		},
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{templates: CalculationTemplate[]; total: number}>;
	findByUser(
		userId: string,
		includePublic?: boolean
	): Promise<CalculationTemplate[]>;
	findFeatured(): Promise<CalculationTemplate[]>;
	create(template: CreateCalculationTemplateDTO): Promise<CalculationTemplate>;
	update(
		id: string,
		templateData: UpdateCalculationTemplateDTO
	): Promise<CalculationTemplate | null>;
	updateUsageStats(
		id: string,
		{usageCount, rating}: {usageCount?: number; rating?: number}
	): Promise<void>;
	delete(id: string): Promise<boolean>;
	countByType(): Promise<Record<CalculationType, number>>;
	countByProfession(): Promise<Record<ProfessionType, number>>;
}
