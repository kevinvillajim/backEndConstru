// src/domain/repositories/MaterialCalculationTemplateRepository.ts
import {MaterialCalculationTemplate} from "../models/calculation/MaterialCalculationTemplate";
import { MaterialCalculationType } from "../models/calculation/MaterialCalculationTemplate";
import { PaginationOptions } from "../models/common/PaginationOptions"; // Adjust the path as needed



export interface MaterialCalculationTemplateRepository {
	findById(id: string): Promise<MaterialCalculationTemplate | null>;
	findByType(
		type: MaterialCalculationType
	): Promise<MaterialCalculationTemplate[]>;
	findBySubCategory(
		subCategory: string
	): Promise<MaterialCalculationTemplate[]>;
	findFeatured(): Promise<MaterialCalculationTemplate[]>;
	findAll(
		filters?: MaterialTemplateFilters,
		pagination?: PaginationOptions
	): Promise<{
		templates: MaterialCalculationTemplate[];
		total: number;
	}>;
	create(
		template: Omit<
			MaterialCalculationTemplate,
			"id" | "createdAt" | "updatedAt"
		>
	): Promise<MaterialCalculationTemplate>;
	update(
		id: string,
		data: Partial<MaterialCalculationTemplate>
	): Promise<MaterialCalculationTemplate | null>;
	delete(id: string): Promise<boolean>;
	incrementUsage(id: string): Promise<boolean>;
	updateRating(id: string, rating: number): Promise<boolean>;
}

export interface MaterialTemplateFilters {
	type?: MaterialCalculationType;
	subCategory?: string;
	isActive?: boolean;
	isFeatured?: boolean;
	searchTerm?: string;
	tags?: string[];
	minRating?: number;
}
