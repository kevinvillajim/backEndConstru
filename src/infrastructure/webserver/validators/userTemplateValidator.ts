// src/infrastructure/webserver/validators/userTemplateValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";
import {
	UserTemplateStatus,
	UserTemplateDifficulty,
	UserTemplateSourceType,
} from "../../../domain/models/calculation/UserCalculationTemplate";

/**
 * Validador para crear plantilla de usuario
 */
export const validateCreateUserTemplate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const parameterSchema = Joi.object({
		id: Joi.string().uuid().optional(),
		name: Joi.string().required().min(1).max(100).messages({
			"string.min": "El nombre del parámetro no puede estar vacío",
			"string.max": "El nombre del parámetro no puede exceder 100 caracteres",
			"any.required": "El nombre del parámetro es obligatorio",
		}),
		label: Joi.string().required().min(1).max(255).messages({
			"string.min": "La etiqueta del parámetro no puede estar vacía",
			"string.max": "La etiqueta del parámetro no puede exceder 255 caracteres",
			"any.required": "La etiqueta del parámetro es obligatoria",
		}),
		type: Joi.string()
			.valid("number", "text", "select", "boolean")
			.required()
			.messages({
				"any.only":
					"El tipo de parámetro debe ser: number, text, select, o boolean",
				"any.required": "El tipo de parámetro es obligatorio",
			}),
		scope: Joi.string()
			.valid("input", "internal", "output")
			.required()
			.messages({
				"any.only":
					"El alcance del parámetro debe ser: input, internal, o output",
				"any.required": "El alcance del parámetro es obligatorio",
			}),
		required: Joi.boolean().default(false),
		displayOrder: Joi.number().integer().min(0).default(0),
		unit: Joi.string().max(20).optional(),
		minValue: Joi.number().optional(),
		maxValue: Joi.number().optional(),
		regexPattern: Joi.string().optional(),
		allowedValues: Joi.array().items(Joi.string()).optional(),
		defaultValue: Joi.any().optional(),
		placeholder: Joi.string().max(255).optional(),
		helpText: Joi.string().max(1000).optional(),
		typicalRange: Joi.string().max(100).optional(),
		dependsOnParameters: Joi.array().items(Joi.string()).optional(),
		formula: Joi.string().max(5000).optional(),
	});

	const schema = Joi.object({
		name: Joi.string().required().min(3).max(255).messages({
			"string.min": "El nombre debe tener al menos 3 caracteres",
			"string.max": "El nombre no puede exceder 255 caracteres",
			"any.required": "El nombre es obligatorio",
		}),
		description: Joi.string().required().min(10).max(2000).messages({
			"string.min": "La descripción debe tener al menos 10 caracteres",
			"string.max": "La descripción no puede exceder 2000 caracteres",
			"any.required": "La descripción es obligatoria",
		}),
		longDescription: Joi.string().max(5000).optional(),
		category: Joi.string().required().min(1).max(50).messages({
			"string.min": "La categoría no puede estar vacía",
			"string.max": "La categoría no puede exceder 50 caracteres",
			"any.required": "La categoría es obligatoria",
		}),
		subcategory: Joi.string().max(50).optional(),
		targetProfessions: Joi.array()
			.items(Joi.string())
			.min(1)
			.required()
			.messages({
				"array.min": "Debe especificar al menos una profesión objetivo",
				"any.required": "Las profesiones objetivo son obligatorias",
			}),
		difficulty: Joi.string()
			.valid(...Object.values(UserTemplateDifficulty))
			.default(UserTemplateDifficulty.BASIC)
			.messages({
				"any.only": `La dificultad debe ser: ${Object.values(UserTemplateDifficulty).join(", ")}`,
			}),
		estimatedTime: Joi.string().max(50).optional(),
		necReference: Joi.string().max(255).optional(),
		tags: Joi.array().items(Joi.string().max(50)).default([]),
		parameters: Joi.array().items(parameterSchema).min(1).required().messages({
			"array.min": "Debe definir al menos un parámetro",
			"any.required": "Los parámetros son obligatorios",
		}),
		formula: Joi.string().required().min(1).max(50000).messages({
			"string.min": "La fórmula no puede estar vacía",
			"string.max": "La fórmula no puede exceder 50000 caracteres",
			"any.required": "La fórmula es obligatoria",
		}),
		isPublic: Joi.boolean().default(false),
		requirements: Joi.array().items(Joi.string().max(255)).optional(),
		applicationCases: Joi.array().items(Joi.string().max(255)).optional(),
		limitations: Joi.array().items(Joi.string().max(255)).optional(),
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

/**
 * Validador para actualizar plantilla de usuario
 */
export const validateUpdateUserTemplate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Reutilizar el schema de creación pero hacer todos los campos opcionales
	const parameterSchema = Joi.object({
		id: Joi.string().uuid().optional(),
		name: Joi.string().min(1).max(100).optional(),
		label: Joi.string().min(1).max(255).optional(),
		type: Joi.string().valid("number", "text", "select", "boolean").optional(),
		scope: Joi.string().valid("input", "internal", "output").optional(),
		required: Joi.boolean().optional(),
		displayOrder: Joi.number().integer().min(0).optional(),
		unit: Joi.string().max(20).optional(),
		minValue: Joi.number().optional(),
		maxValue: Joi.number().optional(),
		regexPattern: Joi.string().optional(),
		allowedValues: Joi.array().items(Joi.string()).optional(),
		defaultValue: Joi.any().optional(),
		placeholder: Joi.string().max(255).optional(),
		helpText: Joi.string().max(1000).optional(),
		typicalRange: Joi.string().max(100).optional(),
		dependsOnParameters: Joi.array().items(Joi.string()).optional(),
		formula: Joi.string().max(5000).optional(),
	});

	const schema = Joi.object({
		name: Joi.string().min(3).max(255).optional(),
		description: Joi.string().min(10).max(2000).optional(),
		longDescription: Joi.string().max(5000).optional(),
		category: Joi.string().min(1).max(50).optional(),
		subcategory: Joi.string().max(50).optional(),
		targetProfessions: Joi.array().items(Joi.string()).min(1).optional(),
		difficulty: Joi.string()
			.valid(...Object.values(UserTemplateDifficulty))
			.optional(),
		estimatedTime: Joi.string().max(50).optional(),
		necReference: Joi.string().max(255).optional(),
		tags: Joi.array().items(Joi.string().max(50)).optional(),
		parameters: Joi.array().items(parameterSchema).min(1).optional(),
		formula: Joi.string().min(1).max(50000).optional(),
		isPublic: Joi.boolean().optional(),
		requirements: Joi.array().items(Joi.string().max(255)).optional(),
		applicationCases: Joi.array().items(Joi.string().max(255)).optional(),
		limitations: Joi.array().items(Joi.string().max(255)).optional(),
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

/**
 * Validador para duplicar plantilla oficial
 */
export const validateDuplicateTemplate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		customName: Joi.string().min(3).max(255).optional().messages({
			"string.min": "El nombre personalizado debe tener al menos 3 caracteres",
			"string.max": "El nombre personalizado no puede exceder 255 caracteres",
		}),
		customDescription: Joi.string().min(10).max(2000).optional().messages({
			"string.min":
				"La descripción personalizada debe tener al menos 10 caracteres",
			"string.max":
				"La descripción personalizada no puede exceder 2000 caracteres",
		}),
	});

	// Validar ID de plantilla oficial en params
	const paramsSchema = Joi.object({
		officialId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la plantilla oficial debe ser un UUID válido",
			"any.required": "El ID de la plantilla oficial es obligatorio",
		}),
	});

	const bodyValidation = schema.validate(req.body, {abortEarly: false});
	const paramsValidation = paramsSchema.validate(req.params, {
		abortEarly: false,
	});

	const errors = [];
	if (bodyValidation.error) {
		errors.push(...bodyValidation.error.details);
	}
	if (paramsValidation.error) {
		errors.push(...paramsValidation.error.details);
	}

	if (errors.length > 0) {
		res.status(400).json({
			success: false,
			message: "Error de validación",
			errors: errors.map((detail) => ({
				field: detail.path.join("."),
				message: detail.message,
			})),
		});
		return;
	}

	next();
};

/**
 * Validador para crear plantilla desde resultado
 */
export const validateCreateFromResult = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		calculationResultId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID del resultado debe ser un UUID válido",
			"any.required": "El ID del resultado es obligatorio",
		}),
		name: Joi.string().required().min(3).max(255).messages({
			"string.min": "El nombre debe tener al menos 3 caracteres",
			"string.max": "El nombre no puede exceder 255 caracteres",
			"any.required": "El nombre es obligatorio",
		}),
		description: Joi.string().min(10).max(2000).optional().messages({
			"string.min": "La descripción debe tener al menos 10 caracteres",
			"string.max": "La descripción no puede exceder 2000 caracteres",
		}),
		category: Joi.string().required().min(1).max(50).messages({
			"string.min": "La categoría no puede estar vacía",
			"string.max": "La categoría no puede exceder 50 caracteres",
			"any.required": "La categoría es obligatoria",
		}),
		targetProfessions: Joi.array()
			.items(Joi.string())
			.min(1)
			.required()
			.messages({
				"array.min": "Debe especificar al menos una profesión objetivo",
				"any.required": "Las profesiones objetivo son obligatorias",
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

/**
 * Validador para cambiar estado de plantilla
 */
export const validateChangeStatus = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		status: Joi.string()
			.valid(...Object.values(UserTemplateStatus))
			.required()
			.messages({
				"any.only": `El estado debe ser: ${Object.values(UserTemplateStatus).join(", ")}`,
				"any.required": "El estado es obligatorio",
			}),
	});

	const paramsSchema = Joi.object({
		id: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la plantilla debe ser un UUID válido",
			"any.required": "El ID de la plantilla es obligatorio",
		}),
	});

	const bodyValidation = schema.validate(req.body, {abortEarly: false});
	const paramsValidation = paramsSchema.validate(req.params, {
		abortEarly: false,
	});

	const errors = [];
	if (bodyValidation.error) {
		errors.push(...bodyValidation.error.details);
	}
	if (paramsValidation.error) {
		errors.push(...paramsValidation.error.details);
	}

	if (errors.length > 0) {
		res.status(400).json({
			success: false,
			message: "Error de validación",
			errors: errors.map((detail) => ({
				field: detail.path.join("."),
				message: detail.message,
			})),
		});
		return;
	}

	next();
};

/**
 * Validador para compartir plantilla
 */
export const validateShareTemplate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		userIds: Joi.array()
			.items(Joi.string().uuid())
			.min(1)
			.max(50)
			.required()
			.messages({
				"array.min": "Debe especificar al menos un usuario",
				"array.max": "No se puede compartir con más de 50 usuarios a la vez",
				"any.required": "Los IDs de usuarios son obligatorios",
				"string.uuid": "Cada ID de usuario debe ser un UUID válido",
			}),
		message: Joi.string().max(500).optional().messages({
			"string.max": "El mensaje no puede exceder 500 caracteres",
		}),
	});

	const paramsSchema = Joi.object({
		id: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la plantilla debe ser un UUID válido",
			"any.required": "El ID de la plantilla es obligatorio",
		}),
	});

	const bodyValidation = schema.validate(req.body, {abortEarly: false});
	const paramsValidation = paramsSchema.validate(req.params, {
		abortEarly: false,
	});

	const errors = [];
	if (bodyValidation.error) {
		errors.push(...bodyValidation.error.details);
	}
	if (paramsValidation.error) {
		errors.push(...paramsValidation.error.details);
	}

	if (errors.length > 0) {
		res.status(400).json({
			success: false,
			message: "Error de validación",
			errors: errors.map((detail) => ({
				field: detail.path.join("."),
				message: detail.message,
			})),
		});
		return;
	}

	next();
};

/**
 * Validador para parámetros de ID en rutas
 */
export const validateTemplateId = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		id: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la plantilla debe ser un UUID válido",
			"any.required": "El ID de la plantilla es obligatorio",
		}),
	});

	const {error} = schema.validate(req.params, {abortEarly: false});

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

/**
 * Validador para parámetros de consulta en listado
 */
export const validateQueryParams = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		page: Joi.number().integer().min(1).default(1),
		limit: Joi.number().integer().min(1).max(100).default(10),
		sortBy: Joi.string()
			.valid("name", "createdAt", "updatedAt", "usageCount", "averageRating")
			.optional(),
		sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
		status: Joi.alternatives()
			.try(
				Joi.string().valid(...Object.values(UserTemplateStatus)),
				Joi.array().items(
					Joi.string().valid(...Object.values(UserTemplateStatus))
				)
			)
			.optional(),
		categories: Joi.alternatives()
			.try(Joi.string(), Joi.array().items(Joi.string()))
			.optional(),
		targetProfessions: Joi.alternatives()
			.try(Joi.string(), Joi.array().items(Joi.string()))
			.optional(),
		difficulty: Joi.alternatives()
			.try(
				Joi.string().valid(...Object.values(UserTemplateDifficulty)),
				Joi.array().items(
					Joi.string().valid(...Object.values(UserTemplateDifficulty))
				)
			)
			.optional(),
		isPublic: Joi.boolean().optional(),
		tags: Joi.alternatives()
			.try(Joi.string(), Joi.array().items(Joi.string()))
			.optional(),
		searchTerm: Joi.string().max(100).optional(),
		sourceType: Joi.alternatives()
			.try(
				Joi.string().valid(...Object.values(UserTemplateSourceType)),
				Joi.array().items(
					Joi.string().valid(...Object.values(UserTemplateSourceType))
				)
			)
			.optional(),
		isFavorite: Joi.boolean().optional(),
		excludeUserId: Joi.string().uuid().optional(),
	}).unknown(true); // Permitir otros parámetros de consulta

	const {error, value} = schema.validate(req.query, {abortEarly: false});

	if (error) {
		res.status(400).json({
			success: false,
			message: "Parámetros de consulta inválidos",
			errors: error.details.map((detail) => ({
				field: detail.path.join("."),
				message: detail.message,
			})),
		});
		return;
	}

	// Asignar valores validados de vuelta a req.query
	req.query = value;
	next();
};
