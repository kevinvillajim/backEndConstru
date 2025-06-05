// src/infrastructure/services/MaterialTemplateValidationServiceImpl.ts
import {MaterialTemplateValidationService} from "../../domain/services/MaterialTemplateValidationService";
import {ValidationResult} from "../../domain/models/common/ValidationResult";

export class MaterialTemplateValidationServiceImpl
	implements MaterialTemplateValidationService
{
	async validateTemplate(templateData: any): Promise<ValidationResult> {
		const errors: string[] = [];

		// Validar campos básicos
		if (!templateData.name || templateData.name.trim().length < 3) {
			errors.push("El nombre debe tener al menos 3 caracteres");
		}

		if (
			!templateData.description ||
			templateData.description.trim().length < 10
		) {
			errors.push("La descripción debe tener al menos 10 caracteres");
		}

		if (!templateData.formula || templateData.formula.trim().length < 10) {
			errors.push("La fórmula debe tener al menos 10 caracteres");
		}

		// Validar tipo de material
		const validTypes = [
			"masonry",
			"concrete",
			"finishes",
			"stairs",
			"electrical",
			"furniture",
			"mortar",
			"flooring",
		];
		if (!templateData.type || !validTypes.includes(templateData.type)) {
			errors.push("Tipo de material inválido");
		}

		// Validar fórmula
		const formulaValidation = this.validateFormula(templateData.formula);
		if (!formulaValidation.isValid) {
			errors.push(...formulaValidation.errors);
		}

		// Validar parámetros
		if (templateData.parameters) {
			const paramValidation = this.validateParameters(templateData.parameters);
			if (!paramValidation.isValid) {
				errors.push(...paramValidation.errors);
			}
		}

		// Validar material outputs
		if (
			!templateData.materialOutputs ||
			!Array.isArray(templateData.materialOutputs) ||
			templateData.materialOutputs.length === 0
		) {
			errors.push("Debe definir al menos un material de salida");
		}

		// Validar waste factors
		if (
			!templateData.wasteFactors ||
			!Array.isArray(templateData.wasteFactors) ||
			templateData.wasteFactors.length === 0
		) {
			errors.push("Debe definir al menos un factor de desperdicio");
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	validateFormula(formula: string): ValidationResult {
		const errors: string[] = [];

		if (!formula || formula.trim().length === 0) {
			errors.push("La fórmula es requerida");
			return {isValid: false, errors};
		}

		// Validar sintaxis básica de JavaScript
		try {
			// Intentar crear una función con la fórmula
			new Function("return (" + formula + ")");
		} catch (error) {
			errors.push("Sintaxis de fórmula inválida");
		}

		// Validar que no contenga código peligroso
		const dangerousPatterns = [
			/eval\s*\(/,
			/Function\s*\(/,
			/setTimeout\s*\(/,
			/setInterval\s*\(/,
			/require\s*\(/,
			/import\s*\(/,
			/process\./,
			/global\./,
			/window\./,
			/document\./,
		];

		for (const pattern of dangerousPatterns) {
			if (pattern.test(formula)) {
				errors.push("La fórmula contiene código no permitido");
				break;
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	validateParameters(parameters: any[]): ValidationResult {
		const errors: string[] = [];

		if (!Array.isArray(parameters)) {
			errors.push("Los parámetros deben ser un array");
			return {isValid: false, errors};
		}

		const validDataTypes = ["string", "number", "boolean", "enum", "array"];
		const validScopes = ["input", "output", "calculated"];

		parameters.forEach((param, index) => {
			if (!param.name || param.name.trim().length === 0) {
				errors.push(`Parámetro ${index + 1}: El nombre es requerido`);
			}

			if (!param.dataType || !validDataTypes.includes(param.dataType)) {
				errors.push(`Parámetro ${index + 1}: Tipo de dato inválido`);
			}

			if (!param.scope || !validScopes.includes(param.scope)) {
				errors.push(`Parámetro ${index + 1}: Scope inválido`);
			}

			if (
				param.dataType === "enum" &&
				(!param.allowedValues || !Array.isArray(param.allowedValues))
			) {
				errors.push(
					`Parámetro ${index + 1}: Los parámetros de tipo enum requieren valores permitidos`
				);
			}

			if (
				param.minValue !== undefined &&
				param.maxValue !== undefined &&
				param.minValue > param.maxValue
			) {
				errors.push(
					`Parámetro ${index + 1}: El valor mínimo no puede ser mayor que el máximo`
				);
			}
		});

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
