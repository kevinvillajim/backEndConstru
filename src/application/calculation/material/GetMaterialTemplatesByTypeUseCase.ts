// src/application/calculation/material/GetMaterialTemplatesByTypeUseCase.ts
import {
	MaterialCalculationType,
	MaterialCalculationTemplate,
} from "../../../domain/models/calculation/MaterialCalculationTemplate";
import {MaterialCalculationTemplateRepository} from "../../../domain/repositories/MaterialCalculationTemplateRepository";

export class GetMaterialTemplatesByTypeUseCase {
	constructor(
		private materialTemplateRepository: MaterialCalculationTemplateRepository
	) {}

	async execute(
		type: MaterialCalculationType
	): Promise<MaterialCalculationTemplate[]> {
		return this.materialTemplateRepository.findByType(type);
	}
}
