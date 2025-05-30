// src/infrastructure/webserver/validators/analyticsValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

/**
 * Validador para parámetros de analytics de plantillas
 */
export const validateAnalyticsParams = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Validar parámetros de la URL
	const paramsSchema = Joi.object({
		id: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la plantilla debe ser un UUID válido",
			"any.required": "El ID de la plantilla es obligatorio",
		}),
	});

	// Validar query parameters
	const querySchema = Joi.object({
		templateType: Joi.string()
			.valid("personal", "verified")
			.default("personal")
			.messages({
				"any.only": "templateType debe ser 'personal' o 'verified'",
			}),
		period: Joi.string()
			.valid("day", "week", "month", "year")
			.default("month")
			.messages({
				"any.only": "period debe ser 'day', 'week', 'month' o 'year'",
			}),
	});

	const paramsValidation = paramsSchema.validate(req.params, {
		abortEarly: false,
	});
	const queryValidation = querySchema.validate(req.query, {abortEarly: false});

	const errors = [];
	if (paramsValidation.error) {
		errors.push(...paramsValidation.error.details);
	}
	if (queryValidation.error) {
		errors.push(...queryValidation.error.details);
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

	// Asignar valores validados
	req.query = queryValidation.value;
	next();
};

/**
 * Validador para parámetros de trending templates
 */
export const validateTrendingParams = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		period: Joi.string()
			.valid("daily", "weekly", "monthly", "yearly")
			.default("weekly")
			.messages({
				"any.only": "period debe ser 'daily', 'weekly', 'monthly' o 'yearly'",
			}),
		templateType: Joi.string()
			.valid("personal", "verified")
			.optional()
			.messages({
				"any.only": "templateType debe ser 'personal' o 'verified'",
			}),
		limit: Joi.number().integer().min(1).max(50).default(10).messages({
			"number.base": "limit debe ser un número",
			"number.integer": "limit debe ser un número entero",
			"number.min": "limit debe ser mayor a 0",
			"number.max": "limit debe ser menor o igual a 50",
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

/**
 * Validador para tracking manual de uso
 */
export const validateTrackingUsage = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Validar parámetros de la URL
	const paramsSchema = Joi.object({
		id: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la plantilla debe ser un UUID válido",
			"any.required": "El ID de la plantilla es obligatorio",
		}),
	});

	// Validar body
	const bodySchema = Joi.object({
		templateType: Joi.string()
			.valid("personal", "verified")
			.required()
			.messages({
				"any.only": "templateType debe ser 'personal' o 'verified'",
				"any.required": "templateType es obligatorio",
			}),
		calculationResultId: Joi.string().uuid().required().messages({
			"string.uuid": "calculationResultId debe ser un UUID válido",
			"any.required": "calculationResultId es obligatorio",
		}),
		projectId: Joi.string().uuid().optional().messages({
			"string.uuid": "projectId debe ser un UUID válido",
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
 * Validador para tracking en lote
 */
export const validateBatchTracking = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const usageSchema = Joi.object({
		templateId: Joi.string().uuid().required().messages({
			"string.uuid": "templateId debe ser un UUID válido",
			"any.required": "templateId es obligatorio",
		}),
		templateType: Joi.string()
			.valid("personal", "verified")
			.required()
			.messages({
				"any.only": "templateType debe ser 'personal' o 'verified'",
				"any.required": "templateType es obligatorio",
			}),
		calculationResultId: Joi.string().uuid().required().messages({
			"string.uuid": "calculationResultId debe ser un UUID válido",
			"any.required": "calculationResultId es obligatorio",
		}),
		projectId: Joi.string().uuid().optional().messages({
			"string.uuid": "projectId debe ser un UUID válido",
		}),
	});

	const schema = Joi.object({
		usages: Joi.array().items(usageSchema).min(1).max(100).required().messages({
			"array.min": "Se requiere al menos un uso",
			"array.max": "Máximo 100 usos por lote",
			"any.required": "usages es obligatorio",
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
 * Validador para consulta de estadísticas de uso
 */
export const validateUsageStatsParams = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Validar parámetros de la URL
	const paramsSchema = Joi.object({
		id: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la plantilla debe ser un UUID válido",
			"any.required": "El ID de la plantilla es obligatorio",
		}),
	});

	// Validar query parameters
	const querySchema = Joi.object({
		templateType: Joi.string()
			.valid("personal", "verified")
			.default("personal")
			.messages({
				"any.only": "templateType debe ser 'personal' o 'verified'",
			}),
	});

	const paramsValidation = paramsSchema.validate(req.params, {
		abortEarly: false,
	});
	const queryValidation = querySchema.validate(req.query, {abortEarly: false});

	const errors = [];
	if (paramsValidation.error) {
		errors.push(...paramsValidation.error.details);
	}
	if (queryValidation.error) {
		errors.push(...queryValidation.error.details);
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

	req.query = queryValidation.value;
	next();
};

/**
 * Validador para consulta de plantillas más usadas
 */
export const validateMostUsedParams = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		templateType: Joi.string()
			.valid("personal", "verified")
			.optional()
			.messages({
				"any.only": "templateType debe ser 'personal' o 'verified'",
			}),
		period: Joi.string().valid("day", "week", "month").optional().messages({
			"any.only": "period debe ser 'day', 'week' o 'month'",
		}),
		limit: Joi.number().integer().min(1).max(50).default(10).messages({
			"number.base": "limit debe ser un número",
			"number.integer": "limit debe ser un número entero",
			"number.min": "limit debe ser mayor a 0",
			"number.max": "limit debe ser menor o igual a 50",
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

/**
 * Validador para ID de plantilla en parámetros de URL
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
 * Validador para ID de usuario en parámetros de URL
 */
export const validateUserId = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		userId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID del usuario debe ser un UUID válido",
			"any.required": "El ID del usuario es obligatorio",
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
 * Validador para estadísticas globales
 */
export const validateGlobalStatsParams = (
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