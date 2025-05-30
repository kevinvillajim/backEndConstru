// src/infrastructure/webserver/validators/promotionValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

/**
 * Validador para crear solicitud de promoción
 */
export const validateCreatePromotionRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		personalTemplateId: Joi.string().uuid().required().messages({
			"string.uuid": "personalTemplateId debe ser un UUID válido",
			"any.required": "personalTemplateId es obligatorio",
		}),
		reason: Joi.string().min(10).max(500).required().messages({
			"string.min": "La razón debe tener al menos 10 caracteres",
			"string.max": "La razón no puede exceder 500 caracteres",
			"any.required": "La razón es obligatoria",
		}),
		detailedJustification: Joi.string().min(20).max(2000).optional().messages({
			"string.min":
				"La justificación detallada debe tener al menos 20 caracteres",
			"string.max":
				"La justificación detallada no puede exceder 2000 caracteres",
		}),
		priority: Joi.string()
			.valid("low", "medium", "high", "urgent")
			.default("medium")
			.messages({
				"any.only": "priority debe ser 'low', 'medium', 'high' o 'urgent'",
			}),
		estimatedImpact: Joi.object({
			potentialUsers: Joi.number().integer().min(1).optional().messages({
				"number.base": "potentialUsers debe ser un número",
				"number.integer": "potentialUsers debe ser un número entero",
				"number.min": "potentialUsers debe ser mayor a 0",
			}),
			industryBenefit: Joi.string().max(1000).optional().messages({
				"string.max": "industryBenefit no puede exceder 1000 caracteres",
			}),
			technicalComplexity: Joi.string()
				.valid("low", "medium", "high")
				.optional()
				.messages({
					"any.only": "technicalComplexity debe ser 'low', 'medium' o 'high'",
				}),
			maintenanceRequirement: Joi.string()
				.valid("low", "medium", "high")
				.optional()
				.messages({
					"any.only":
						"maintenanceRequirement debe ser 'low', 'medium' o 'high'",
				}),
		}).optional(),
		creditToAuthor: Joi.boolean().default(true).messages({
			"boolean.base": "creditToAuthor debe ser un booleano",
		}),
	});

	const {error, value} = schema.validate(req.body, {abortEarly: false});

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

	req.body = value;
	next();
};

/**
 * Validador para revisar solicitud de promoción
 */
export const validateReviewPromotionRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Validar parámetros de la URL
	const paramsSchema = Joi.object({
		id: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la solicitud debe ser un UUID válido",
			"any.required": "El ID de la solicitud es obligatorio",
		}),
	});

	// Validar body
	const bodySchema = Joi.object({
		action: Joi.string()
			.valid("approve", "reject", "request_changes")
			.required()
			.messages({
				"any.only": "action debe ser 'approve', 'reject' o 'request_changes'",
				"any.required": "action es obligatorio",
			}),
		reviewComments: Joi.string().min(10).max(2000).required().messages({
			"string.min":
				"Los comentarios de revisión deben tener al menos 10 caracteres",
			"string.max":
				"Los comentarios de revisión no pueden exceder 2000 caracteres",
			"any.required": "Los comentarios de revisión son obligatorios",
		}),
		priority: Joi.string()
			.valid("low", "medium", "high", "urgent")
			.optional()
			.messages({
				"any.only": "priority debe ser 'low', 'medium', 'high' o 'urgent'",
			}),
	});

	const paramsValidation = paramsSchema.validate(req.params, {
		abortEarly: false,
	});
	const bodyValidation = bodySchema.validate(req.body, {abortEarly: false});

	const errors = [];
	if (paramsValidation.error) {
		errors.push(...paramsValidation.error.details);
	}
	if (bodyValidation.error) {
		errors.push(...bodyValidation.error.details);
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
 * Validador para promover plantilla a verificada
 */
export const validatePromoteTemplate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Validar parámetros de la URL
	const paramsSchema = Joi.object({
		requestId: Joi.string().uuid().required().messages({
			"string.uuid": "El requestId debe ser un UUID válido",
			"any.required": "El requestId es obligatorio",
		}),
	});

	// Validar body
	const bodySchema = Joi.object({
		implementationNotes: Joi.string().max(2000).optional().messages({
			"string.max":
				"Las notas de implementación no pueden exceder 2000 caracteres",
		}),
		customizations: Joi.object({
			name: Joi.string().max(255).optional().messages({
				"string.max": "El nombre personalizado no puede exceder 255 caracteres",
			}),
			description: Joi.string().max(2000).optional().messages({
				"string.max":
					"La descripción personalizada no puede exceder 2000 caracteres",
			}),
			necReference: Joi.string().max(255).optional().messages({
				"string.max": "La referencia NEC no puede exceder 255 caracteres",
			}),
			tags: Joi.array()
				.items(Joi.string().max(50))
				.max(20)
				.optional()
				.messages({
					"array.max": "Máximo 20 tags permitidos",
					"string.max": "Cada tag no puede exceder 50 caracteres",
				}),
		}).optional(),
	});

	const paramsValidation = paramsSchema.validate(req.params, {
		abortEarly: false,
	});
	const bodyValidation = bodySchema.validate(req.body, {abortEarly: false});

	const errors = [];
	if (paramsValidation.error) {
		errors.push(...paramsValidation.error.details);
	}
	if (bodyValidation.error) {
		errors.push(...bodyValidation.error.details);
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
 * Validador para parámetros de consulta de solicitudes de promoción
 */
export const validatePromotionRequestQuery = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		status: Joi.alternatives()
			.try(
				Joi.string().valid(
					"pending",
					"under_review",
					"approved",
					"rejected",
					"implemented"
				),
				Joi.array().items(
					Joi.string().valid(
						"pending",
						"under_review",
						"approved",
						"rejected",
						"implemented"
					)
				)
			)
			.optional()
			.messages({
				"any.only":
					"status debe ser 'pending', 'under_review', 'approved', 'rejected' o 'implemented'",
			}),
		priority: Joi.alternatives()
			.try(
				Joi.string().valid("low", "medium", "high", "urgent"),
				Joi.array().items(Joi.string().valid("low", "medium", "high", "urgent"))
			)
			.optional()
			.messages({
				"any.only": "priority debe ser 'low', 'medium', 'high' o 'urgent'",
			}),
		requestedBy: Joi.string().uuid().optional().messages({
			"string.uuid": "requestedBy debe ser un UUID válido",
		}),
		originalAuthorId: Joi.string().uuid().optional().messages({
			"string.uuid": "originalAuthorId debe ser un UUID válido",
		}),
		page: Joi.number().integer().min(1).default(1).messages({
			"number.base": "page debe ser un número",
			"number.integer": "page debe ser un número entero",
			"number.min": "page debe ser mayor a 0",
		}),
		limit: Joi.number().integer().min(1).max(100).default(10).messages({
			"number.base": "limit debe ser un número",
			"number.integer": "limit debe ser un número entero",
			"number.min": "limit debe ser mayor a 0",
			"number.max": "limit debe ser menor o igual a 100",
		}),
	}).unknown(true); // Permitir otros parámetros

	const {error, value} = schema.validate(req.query, {abortEarly: false});

	if (error) {
		res.status(400).json({
			success: false,
			message: "Error de validación en parámetros de consulta",
			errors: error.details.map((detail) => ({
				field: detail.path.join("."),
				message: detail.message,
			})),
		});
		return;
	}

	req.query = value;
	next();
};

/**
 * Validador para ID de solicitud en parámetros de URL
 */
export const validatePromotionRequestId = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		id: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la solicitud debe ser un UUID válido",
			"any.required": "El ID de la solicitud es obligatorio",
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
 * Validador para parámetros de estadísticas globales
 */
export const validateGlobalStatsQuery = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		period: Joi.string()
			.valid("day", "week", "month", "year")
			.default("month")
			.messages({
				"any.only": "period debe ser 'day', 'week', 'month' o 'year'",
			}),
		includeDetails: Joi.boolean().default(true).messages({
			"boolean.base": "includeDetails debe ser un booleano",
		}),
	});

	const {error, value} = schema.validate(req.query, {abortEarly: false});

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

	req.query = value;
	next();
};
