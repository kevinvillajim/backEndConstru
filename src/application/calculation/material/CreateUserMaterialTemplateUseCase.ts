import { MaterialCalculationType, MaterialOutput, MaterialParameter, WasteFactor } from "../../../domain/models/calculation/MaterialCalculationTemplate";
import {UserMaterialCalculationTemplate} from "../../../domain/models/calculation/UserMaterialCalculationTemplate";
import { UserMaterialCalculationTemplateRepository } from "../../../domain/repositories/UserMaterialCalculationTemplateRepository";

// src/application/calculation/material/CreateUserMaterialTemplateUseCase.ts
export class CreateUserMaterialTemplateUseCase {
	constructor(
		private userTemplateRepository: UserMaterialCalculationTemplateRepository,
		private templateValidationService: MaterialTemplateValidationService
	) {}

	async execute(
		request: CreateUserMaterialTemplateRequest
	): Promise<UserMaterialCalculationTemplate> {
		// 1. Validar datos del template
		const validationResult =
			await this.templateValidationService.validateTemplate({
				name: request.name,
				formula: request.formula,
				parameters: request.parameters,
				materialOutputs: request.materialOutputs,
				wasteFactors: request.wasteFactors,
			});

		if (!validationResult.isValid) {
			throw new Error(
				`Template inválido: ${validationResult.errors.join(", ")}`
			);
		}

		// 2. Verificar que el nombre no esté duplicado para el usuario
		const existingTemplates = await this.userTemplateRepository.findByUserId(
			request.userId
		);
		const nameExists = existingTemplates.some(
			(t) => t.name.toLowerCase() === request.name.toLowerCase() && t.isActive
		);

		if (nameExists) {
			throw new Error("Ya tienes un template con ese nombre");
		}

		// 3. Crear template
		const template = await this.userTemplateRepository.create({
			name: request.name,
			description: request.description,
			type: request.type,
			subCategory: request.subCategory,
			formula: request.formula,
			materialOutputs: request.materialOutputs,
			parameters: request.parameters,
			wasteFactors: request.wasteFactors,
			userId: request.userId,
			baseTemplateId: request.baseTemplateId,
			isPublic: request.isPublic || false,
			isActive: true,
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: request.tags || [],
		});

		return template;
	}
}

export interface CreateUserMaterialTemplateRequest {
	name: string;
	description: string;
	type: MaterialCalculationType;
	subCategory: string;
	formula: string;
	materialOutputs: MaterialOutput[];
	parameters: MaterialParameter[];
	wasteFactors: WasteFactor[];
	userId: string;
	baseTemplateId?: string;
	isPublic?: boolean;
	tags?: string[];
}
