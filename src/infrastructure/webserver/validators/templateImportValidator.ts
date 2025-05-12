// src/infrastructure/webserver/validators/templateImportValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";
import {
	CalculationType,
	ProfessionType,
} from "../../../domain/models/calculation/CalculationTemplate";
import {
	ParameterDataType,
	ParameterScope,
} from "../../../domain/models/calculation/CalculationParameter";

/**
 * Validador para solicitudes de importación de plantillas
 */
export const validateTemplateImport = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Esquema para los parámetros
	const parameterSchema = Joi.object({
		name: Joi.string().required(),
		description: Joi.string().required(),
		dataType: Joi.string()
			.valid(...Object.values(ParameterDataType))
			.required(),
		scope: Joi.string()
			.valid(...Object.values(ParameterScope))
			.required(),
		displayOrder: Joi.number().integer().min(0).required(),
		isRequired: Joi.boolean().required(),
		defaultValue: Joi.string().allow(null, ""),
		minValue: Joi.number().allow(null),
		maxValue: Joi.number().allow(null),
		regexPattern: Joi.string().allow(null, ""),
		unitOfMeasure: Joi.string().allow(null, ""),
		allowedValues: Joi.string().allow(null, ""),
		helpText: Joi.string().allow(null, ""),
		dependsOnParameters: Joi.array().items(Joi.string()).allow(null),
		formula: Joi.string().allow(null, ""),
	});

	// Esquema para los datos de la plantilla
	const templateDataSchema = Joi.object({
		name: Joi.string().required(),
		description: Joi.string().required(),
		type: Joi.string()
			.valid(...Object.values(CalculationType))
			.required(),
		targetProfession: Joi.string()
			.valid(...Object.values(ProfessionType))
			.required(),
		formula: Joi.string().required(),
		necReference: Joi.string().allow(null, ""),
		tags: Joi.array().items(Joi.string()).allow(null),
		version: Joi.number().integer().min(1),
		source: Joi.string().allow(null, ""),
		shareLevel: Joi.string()
			.valid("private", "organization", "public")
			.default("private"),
	});

	// Esquema principal
	const schema = Joi.object({
		templateData: templateDataSchema.required(),
		parameters: Joi.array().items(parameterSchema).min(2).required(),
		exportVersion: Joi.string().required(),
		exportDate: Joi.string().isoDate().required(),
	});

	// Esquema para importación múltiple
	const multipleSchema = Joi.object({
		exports: Joi.array().items(schema).min(1).required(),
	});

	// Determinar qué esquema usar según la ruta
	const isMultipleImport = req.path.includes("/import-multiple");
	const currentSchema = isMultipleImport ? multipleSchema : schema;

	const {error} = currentSchema.validate(req.body, {
		abortEarly: false,
		allowUnknown: true, // Permitir propiedades adicionales para flexibilidad
	});

	if (error) {
		res.status(400).json({
			success: false,
			message: "Error de validación en el formato de importación",
			errors: error.details.map((detail) => ({
				field: detail.path.join("."),
				message: detail.message,
			})),
		});
		return;
	}

	next();
};
