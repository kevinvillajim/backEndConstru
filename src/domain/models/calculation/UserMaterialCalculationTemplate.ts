// src/domain/models/calculation/UserMaterialCalculationTemplate.ts
import type {MaterialCalculationType, MaterialOutput, MaterialParameter, WasteFactor} from "./MaterialCalculationTemplate"

export interface UserMaterialCalculationTemplate {
	id: string;
	name: string;
	description: string;
	type: MaterialCalculationType;
	subCategory: string;
	formula: string;
	materialOutputs: MaterialOutput[];
	parameters: MaterialParameter[];
	wasteFactors: WasteFactor[];
	userId: string;
	baseTemplateId?: string; // Si deriva de template oficial
	isPublic: boolean;
	isActive: boolean;
	usageCount: number;
	averageRating: number;
	ratingCount: number;
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}
