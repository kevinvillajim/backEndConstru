import { MaterialCalculationType } from "../../../domain/models/calculation/MaterialCalculationTemplate";
import { MaterialCalculationTemplateRepository } from "../../../domain/repositories/MaterialCalculationTemplateRepository";
import { UserMaterialCalculationTemplateRepository } from "../../../domain/repositories/UserMaterialCalculationTemplateRepository";
import {MaterialTemplateUsageLogRepository} from "../../../domain/repositories/MaterialTemplateUsageLogRepository";

// src/application/calculation/material/TrackMaterialTemplateUsageUseCase.ts
export class TrackMaterialTemplateUsageUseCase {
	constructor(
		private usageLogRepository: MaterialTemplateUsageLogRepository,
		private materialTemplateRepository: MaterialCalculationTemplateRepository,
		private userTemplateRepository: UserMaterialCalculationTemplateRepository
	) {}

	async execute(request: TrackMaterialUsageRequest): Promise<void> {
		// 1. Obtener información del template
		let templateInfo: {
			type: MaterialCalculationType;
			subCategory: string;
		} | null = null;

		if (request.templateType === "official") {
			const template = await this.materialTemplateRepository.findById(
				request.templateId
			);
			if (template) {
				templateInfo = {type: template.type, subCategory: template.subCategory};
			}
		} else {
			const template = await this.userTemplateRepository.findById(
				request.templateId
			);
			if (template) {
				templateInfo = {type: template.type, subCategory: template.subCategory};
			}
		}

		if (!templateInfo) {
			console.warn(
				`Template no encontrado para tracking: ${request.templateId}`
			);
			return;
		}

		// 2. Registrar uso
		await this.usageLogRepository.create({
			templateId: request.templateId,
			templateType: request.templateType,
			materialType: templateInfo.type,
			subCategory: templateInfo.subCategory,
			userId: request.userId,
			projectId: request.projectId,
			calculationResultId: request.calculationResultId,
			usageDate: new Date(),
			executionTimeMs: request.executionTimeMs,
			wasSuccessful: request.wasSuccessful,
			totalMaterialsCalculated: request.totalMaterialsCalculated,
			wasteIncluded: request.wasteIncluded,
			regionalFactorsApplied: request.regionalFactorsApplied,
			totalCost: request.totalCost,
			ipAddress: request.ipAddress,
			userAgent: request.userAgent,
		});
	}
}

export interface TrackMaterialUsageRequest {
	templateId: string;
	templateType: "official" | "user";
	userId: string;
	projectId?: string;
	calculationResultId: string;
	executionTimeMs: number;
	wasSuccessful: boolean;
	totalMaterialsCalculated: number;
	wasteIncluded: boolean;
	regionalFactorsApplied: boolean;
	totalCost?: number;
	ipAddress?: string;
	userAgent?: string;
}
