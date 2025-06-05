// src/application/calculation/material/SearchMaterialTemplatesUseCase.ts
import {MaterialCalculationTemplate} from "../../../domain/models/calculation/MaterialCalculationTemplate";
import {
	MaterialCalculationTemplateRepository,
	MaterialTemplateFilters,
} from "../../../domain/repositories/MaterialCalculationTemplateRepository";

export class SearchMaterialTemplatesUseCase {
	constructor(
		private materialTemplateRepository: MaterialCalculationTemplateRepository
	) {}

	async execute(filters: MaterialTemplateFilters): Promise<{
		templates: MaterialCalculationTemplate[];
		total: number;
	}> {
		return this.materialTemplateRepository.findAll(filters);
	}
}
