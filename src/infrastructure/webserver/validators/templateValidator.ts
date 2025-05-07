// src/infrastructure/webserver/validators/templateValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";
import {
	CalculationType,
	ProfessionType,
	TemplateSource,
} from "../../../domain/models/calculation/CalculationTemplate";
import {
	ParameterDataType,
	ParameterScope,
} from "../../../domain/models/calculation/CalculationParameter";

/**
 * Validador para solicitudes de creación/actualización de plantillas
 */
export const validateTemplateRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Esquema para los parámetros de la plantilla
	const parameterSchema = Joi.object({
		name: Joi.string().required().min(2).max(100).messages({
			"string.min": "El nombre del parámetro debe tener al menos 2 caracteres",
			"string.max":
				"El nombre del parámetro no puede exceder los 100 caracteres",
			"any.required": "El nombre del parámetro es obligatorio",
		}),
		description: Joi.string().required().min(10).max(500).messages({
			"string.min":
				"La descripción del parámetro debe tener al menos 10 caracteres",
			"string.max":
				"La descripción del parámetro no puede exceder los 500 caracteres",
			"any.required": "La descripción del parámetro es obligatoria",
		}),
		dataType: Joi.string()
			.valid(...Object.values(ParameterDataType))
			.required()
			.messages({
				"any.only": "El tipo de datos debe ser uno de los valores válidos",
				"any.required": "El tipo de datos es obligatorio",
			}),
		scope: Joi.string()
			.valid(...Object.values(ParameterScope))
			.required()
			.messages({
				"any.only": "El alcance debe ser uno de los valores válidos",
				"any.required": "El alcance es obligatorio",
			}),
		displayOrder: Joi.number().integer().min(0).required().messages({
			"number.base": "El orden de visualización debe ser un número",
			"number.integer": "El orden de visualización debe ser un número entero",
			"number.min": "El orden de visualización no puede ser negativo",
			"any.required": "El orden de visualización es obligatorio",
		}),
		isRequired: Joi.boolean().required().messages({
			"any.required": "Se debe especificar si el parámetro es requerido",
		}),
		defaultValue: Joi.string().allow(null, ""),
		minValue: Joi.number().allow(null),
		maxValue: Joi.number().allow(null),
		regexPattern: Joi.string().allow(null, ""),
		unitOfMeasure: Joi.string().allow(null, "").max(20).messages({
			"string.max": "La unidad de medida no puede exceder los 20 caracteres",
		}),
		allowedValues: Joi.string().allow(null, ""),
		helpText: Joi.string().allow(null, "").max(500).messages({
			"string.max": "El texto de ayuda no puede exceder los 500 caracteres",
		}),
		dependsOnParameters: Joi.array().items(Joi.string()),
		formula: Joi.string().allow(null, ""),
		calculationTemplateId: Joi.string().allow(null, ""),
	});

	// Esquema principal para la plantilla
	const schema = Joi.object({
		name: Joi.string().required().min(3).max(100).messages({
			"string.min": "El nombre debe tener al menos 3 caracteres",
			"string.max": "El nombre no puede exceder los 100 caracteres",
			"any.required": "El nombre es obligatorio",
		}),
		description: Joi.string().required().min(10).max(1000).messages({
			"string.min": "La descripción debe tener al menos 10 caracteres",
			"string.max": "La descripción no puede exceder los 1000 caracteres",
			"any.required": "La descripción es obligatoria",
		}),
		type: Joi.string()
			.valid(...Object.values(CalculationType))
			.required()
			.messages({
				"any.only": "El tipo debe ser uno de los valores válidos",
				"any.required": "El tipo es obligatorio",
			}),
		targetProfession: Joi.string()
			.valid(...Object.values(ProfessionType))
			.required()
			.messages({
				"any.only": "La profesión objetivo debe ser uno de los valores válidos",
				"any.required": "La profesión objetivo es obligatoria",
			}),
		formula: Joi.string().required().min(5).messages({
			"string.min": "La fórmula debe tener al menos 5 caracteres",
			"any.required": "La fórmula es obligatoria",
		}),
		necReference: Joi.string().allow(null, ""),
		isActive: Joi.boolean().default(true),
		version: Joi.number().integer().min(1).default(1).messages({
			"number.base": "La versión debe ser un número",
			"number.integer": "La versión debe ser un número entero",
			"number.min": "La versión mínima es 1",
		}),
		parentTemplateId: Joi.string().uuid().allow(null, "").messages({
			"string.uuid": "El ID de plantilla padre debe ser un UUID válido",
		}),
		source: Joi.string()
			.valid(...Object.values(TemplateSource))
			.default(TemplateSource.USER)
			.messages({
				"any.only": "La fuente debe ser uno de los valores válidos",
			}),
		tags: Joi.array().items(Joi.string()).allow(null),
		shareLevel: Joi.string()
			.valid("private", "organization", "public")
			.default("private")
			.messages({
				"any.only":
					"El nivel de compartición debe ser uno de los valores válidos",
			}),
		parameters: Joi.array().items(parameterSchema).min(2).required().messages({
			"array.min": "La plantilla debe tener al menos 2 parámetros",
			"any.required": "Los parámetros son obligatorios",
		}),
	});

	const {error} = schema.validate(req.body, {abortEarly: false});

	if (error) {
		res.status(400).json({
			success: false,
			message: "Error de validación",
			errors: error.details.map((detail) => ({
				field: detail.path.join("."),
				message: detail.message,
			})),
		});
		return;
	}

	next();
};
