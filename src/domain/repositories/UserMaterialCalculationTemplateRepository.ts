// src/domain/repositories/UserMaterialCalculationTemplateRepository.ts
import { MaterialCalculationType } from '@domain/models/calculation/MaterialCalculationTemplate';
import { UserMaterialCalculationTemplate } from '../models/calculation/UserMaterialCalculationTemplate';
import { MaterialTemplateFilters } from './MaterialCalculationTemplateRepository';


export interface UserMaterialCalculationTemplateRepository {
	findById(id: string): Promise<UserMaterialCalculationTemplate | null>;
	findByUserId(userId: string): Promise<UserMaterialCalculationTemplate[]>;
	findPublic(
		filters?: MaterialTemplateFilters
	): Promise<UserMaterialCalculationTemplate[]>;
	findByType(
		type: MaterialCalculationType,
		userId?: string
	): Promise<UserMaterialCalculationTemplate[]>;
	create(
		template: Omit<
			UserMaterialCalculationTemplate,
			"id" | "createdAt" | "updatedAt"
		>
	): Promise<UserMaterialCalculationTemplate>;
	update(
		id: string,
		data: Partial<UserMaterialCalculationTemplate>
	): Promise<UserMaterialCalculationTemplate | null>;
	delete(id: string): Promise<boolean>;
	togglePublic(id: string, isPublic: boolean): Promise<boolean>;
	incrementUsage(id: string): Promise<boolean>;
}
