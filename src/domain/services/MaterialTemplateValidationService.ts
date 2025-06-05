// src/domain/services/MaterialTemplateValidationService.ts
import {ValidationResult} from "../models/common/ValidationResult";

export interface MaterialTemplateValidationService {
	validateTemplate(templateData: any): Promise<ValidationResult>;
	validateFormula(formula: string): ValidationResult;
	validateParameters(parameters: any[]): ValidationResult;
}
