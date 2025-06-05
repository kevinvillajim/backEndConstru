// src/application/calculation/material/CreateMaterialCalculationUseCase.ts

import {UserMaterialCalculationTemplateRepository} from "../../../domain/repositories/UserMaterialCalculationTemplateRepository";
import { MaterialCalculationTemplateRepository } from "../../../domain/repositories/MaterialCalculationTemplateRepository";
import {MaterialCalculationResultRepository} from "../../../domain/repositories/MaterialCalculationResultRepository";
import {MaterialCalculationService} from "../../../domain/services/MaterialCalculationService";
import {MaterialCalculationResult} from "../../../domain/models/calculation/MaterialCalculationResult";
import {MaterialCalculationTemplate, MaterialParameter} from "../../../domain/models/calculation/MaterialCalculationTemplate";
import {UserMaterialCalculationTemplate} from "../../../domain/models/calculation/UserMaterialCalculationTemplate";
import {ValidationResult} from "../../../domain/models/common/ValidationResult";
import {RegionalFactor} from "../../../domain/models/calculation/MaterialCalculationTemplate";



export class CreateMaterialCalculationUseCase {
	constructor(
		private materialTemplateRepository: MaterialCalculationTemplateRepository,
		private userTemplateRepository: UserMaterialCalculationTemplateRepository,
		private resultRepository: MaterialCalculationResultRepository,
		private calculationService: MaterialCalculationService
	) {}

	async execute(
		request: CreateMaterialCalculationRequest
	): Promise<MaterialCalculationResult> {
		// 1. Obtener template (oficial o de usuario)
		let template: MaterialCalculationTemplate | UserMaterialCalculationTemplate;

		if (request.templateType === "official") {
			template = await this.materialTemplateRepository.findById(
				request.templateId
			);
		} else {
			template = await this.userTemplateRepository.findById(request.templateId);
		}

		if (!template) {
			throw new Error("Template no encontrado");
		}

		// 2. Validar parámetros de entrada
		const validationResult = this.validateInputParameters(
			template.parameters,
			request.inputParameters
		);
		if (!validationResult.isValid) {
			throw new Error(
				`Parámetros inválidos: ${validationResult.errors.join(", ")}`
			);
		}

		// 3. Ejecutar cálculo
		const startTime = Date.now();
		const calculationResult = await this.calculationService.executeCalculation(
			template.formula,
			request.inputParameters,
			template.materialOutputs,
			template.wasteFactors,
			request.includeWaste,
			request.regionalFactors
		);
		const executionTime = Date.now() - startTime;

		// 4. Crear resultado
		const result = await this.resultRepository.create({
			templateId: request.templateId,
			templateType: request.templateType,
			userId: request.userId,
			projectId: request.projectId,
			inputParameters: request.inputParameters,
			materialQuantities: calculationResult.materialQuantities,
			totalCost: calculationResult.totalCost,
			currency: request.currency || "USD",
			wasteIncluded: request.includeWaste || true,
			regionalFactorsApplied: !!request.regionalFactors,
			notes: request.notes,
			isSaved: request.saveResult || false,
			isShared: false,
			executionTime,
		});

		// 5. Incrementar contador de uso del template
		if (request.templateType === "official") {
			await this.materialTemplateRepository.incrementUsage(request.templateId);
		} else {
			await this.userTemplateRepository.incrementUsage(request.templateId);
		}

		return result;
	}

	private validateInputParameters(
		parameters: MaterialParameter[],
		input: Record<string, any>
	): ValidationResult {
		// Lógica de validación específica para materiales
		const errors: string[] = [];

		for (const param of parameters.filter((p) => p.scope === "input")) {
			if (
				param.isRequired &&
				(input[param.name] === undefined || input[param.name] === null)
			) {
				errors.push(`Parámetro requerido: ${param.name}`);
				continue;
			}

			const value = input[param.name];
			if (value !== undefined) {
				// Validaciones específicas por tipo
				if (param.dataType === "number") {
					if (isNaN(Number(value))) {
						errors.push(`${param.name} debe ser un número`);
					} else {
						const numValue = Number(value);
						if (param.minValue !== undefined && numValue < param.minValue) {
							errors.push(
								`${param.name} debe ser mayor o igual a ${param.minValue}`
							);
						}
						if (param.maxValue !== undefined && numValue > param.maxValue) {
							errors.push(
								`${param.name} debe ser menor o igual a ${param.maxValue}`
							);
						}
					}
				}

				if (param.dataType === "enum" && param.allowedValues) {
					if (!param.allowedValues.includes(String(value))) {
						errors.push(
							`${param.name} debe ser uno de: ${param.allowedValues.join(", ")}`
						);
					}
				}
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}

export interface CreateMaterialCalculationRequest {
	templateId: string;
	templateType: "official" | "user";
	userId: string;
	projectId?: string;
	inputParameters: Record<string, any>;
	includeWaste?: boolean;
	regionalFactors?: RegionalFactor[];
	currency?: string;
	notes?: string;
	saveResult?: boolean;
}
