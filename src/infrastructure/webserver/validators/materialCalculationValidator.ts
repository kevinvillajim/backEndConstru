// src/infrastructure/webserver/validators/materialCalculationValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

export const validateMaterialCalculation = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		templateId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID del template debe ser un UUID válido",
			"any.required": "El ID del template es obligatorio",
		}),
		templateType: Joi.string().valid("official", "user").required().messages({
			"any.only": 'El tipo de template debe ser "official" o "user"',
			"any.required": "El tipo de template es obligatorio",
		}),
		inputParameters: Joi.object().required().messages({
			"any.required": "Los parámetros de entrada son obligatorios",
		}),
		projectId: Joi.string().uuid().allow(null, "").messages({
			"string.uuid": "El ID del proyecto debe ser un UUID válido",
		}),
		includeWaste: Joi.boolean().default(true),
		regionalFactors: Joi.array()
			.items(
				Joi.object({
					region: Joi.string().required(),
					materialType: Joi.string().required(),
					adjustmentFactor: Joi.number().min(0.1).max(5).required(),
					reason: Joi.string().required(),
				})
			)
			.allow(null),
		currency: Joi.string().length(3).default("USD").messages({
			"string.length": "La moneda debe ser un código de 3 caracteres",
		}),
		notes: Joi.string().max(1000).allow(null, "").messages({
			"string.max": "Las notas no pueden exceder los 1000 caracteres",
		}),
		saveResult: Joi.boolean().default(false),
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

export const validateUserMaterialTemplate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const materialTypes = [
		"masonry",
		"concrete",
		"finishes",
		"stairs",
		"electrical",
		"furniture",
		"mortar",
		"flooring",
	];
	const dataTypes = ["string", "number", "boolean", "enum", "array"];
	const scopes = ["input", "output", "calculated"];
	const units = ["m2", "m3", "ml", "units", "kg", "bags", "sheets"];

	const parameterSchema = Joi.object({
		name: Joi.string().required().min(2).max(100),
		description: Joi.string().required().max(500),
		dataType: Joi.string()
			.valid(...dataTypes)
			.required(),
		scope: Joi.string()
			.valid(...scopes)
			.required(),
		displayOrder: Joi.number().integer().min(1).required(),
		isRequired: Joi.boolean().required(),
		defaultValue: Joi.string().allow(null, ""),
		minValue: Joi.number().allow(null),
		maxValue: Joi.number().allow(null),
		unit: Joi.string()
			.valid(...units)
			.allow(null),
		allowedValues: Joi.array().items(Joi.string()).allow(null),
		helpText: Joi.string().max(300).allow(null, ""),
		dependsOnParameters: Joi.array().items(Joi.string()).allow(null),
	});

	const materialOutputSchema = Joi.object({
		materialName: Joi.string().required().min(2).max(100),
		unit: Joi.string()
			.valid(...units)
			.required(),
		description: Joi.string().required().max(300),
		category: Joi.string().required().max(50),
		isMain: Joi.boolean().default(false),
	});

	const wasteFactorSchema = Joi.object({
		materialType: Joi.string().required(),
		minWaste: Joi.number().min(0).max(100).required(),
		averageWaste: Joi.number().min(0).max(100).required(),
		maxWaste: Joi.number().min(0).max(100).required(),
		conditions: Joi.array().items(Joi.string()).default([]),
	});

	const schema = Joi.object({
		name: Joi.string().required().min(3).max(150).messages({
			"string.min": "El nombre debe tener al menos 3 caracteres",
			"string.max": "El nombre no puede exceder los 150 caracteres",
			"any.required": "El nombre es obligatorio",
		}),
		description: Joi.string().required().min(10).max(2000).messages({
			"string.min": "La descripción debe tener al menos 10 caracteres",
			"string.max": "La descripción no puede exceder los 2000 caracteres",
			"any.required": "La descripción es obligatoria",
		}),
		type: Joi.string()
			.valid(...materialTypes)
			.required()
			.messages({
				"any.only": `El tipo debe ser uno de: ${materialTypes.join(", ")}`,
				"any.required": "El tipo de material es obligatorio",
			}),
		subCategory: Joi.string().required().max(100).messages({
			"any.required": "La subcategoría es obligatoria",
			"string.max": "La subcategoría no puede exceder los 100 caracteres",
		}),
		formula: Joi.string().required().min(10).messages({
			"string.min": "La fórmula debe tener al menos 10 caracteres",
			"any.required": "La fórmula es obligatoria",
		}),
		materialOutputs: Joi.array()
			.items(materialOutputSchema)
			.min(1)
			.required()
			.messages({
				"array.min": "Debe definir al menos un material de salida",
				"any.required": "Los materiales de salida son obligatorios",
			}),
		parameters: Joi.array().items(parameterSchema).min(1).required().messages({
			"array.min": "Debe definir al menos un parámetro",
			"any.required": "Los parámetros son obligatorios",
		}),
		wasteFactors: Joi.array()
			.items(wasteFactorSchema)
			.min(1)
			.required()
			.messages({
				"array.min": "Debe definir al menos un factor de desperdicio",
				"any.required": "Los factores de desperdicio son obligatorios",
			}),
		baseTemplateId: Joi.string().uuid().allow(null).messages({
			"string.uuid": "El ID del template base debe ser un UUID válido",
		}),
		isPublic: Joi.boolean().default(false),
		tags: Joi.array().items(Joi.string().max(30)).max(10).messages({
			"array.max": "No puede tener más de 10 etiquetas",
			"string.max": "Cada etiqueta no puede exceder los 30 caracteres",
		}),
	});

	const {error} = schema.validate(req.body, {abortEarly: false});

	if (error) {
		res.status(400).json({
			success: false,
			message: "Error de validación del template",
			errors: error.details.map((detail) => ({
				field: detail.path.join("."),
				message: detail.message,
			})),
		});
		return;
	}

	// Validaciones adicionales
	const {materialOutputs, wasteFactors} = req.body;

	// Verificar que al menos un material output sea principal
	const hasMainOutput = materialOutputs.some((output: any) => output.isMain);
	if (!hasMainOutput) {
		res.status(400).json({
			success: false,
			message: "Debe marcar al menos un material como principal",
		});
		return;
	}

	// Verificar coherencia en waste factors
	for (const factor of wasteFactors) {
		if (
			factor.minWaste > factor.averageWaste ||
			factor.averageWaste > factor.maxWaste
		) {
			res.status(400).json({
				success: false,
				message:
					"Los porcentajes de desperdicio deben estar en orden: mínimo ≤ promedio ≤ máximo",
			});
			return;
		}
	}

	next();
};
