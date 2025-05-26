// src/infrastructure/webserver/validators/suggestionValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

export const validateSuggestionRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		suggestionType: Joi.string()
			.valid("improvement", "correction", "addition", "other")
			.default("improvement"),
		title: Joi.string().required().min(5).max(255).messages({
			"string.min": "El título debe tener al menos 5 caracteres",
			"string.max": "El título no puede exceder los 255 caracteres",
			"any.required": "El título es obligatorio",
		}),
		description: Joi.string().required().min(10).max(2000).messages({
			"string.min": "La descripción debe tener al menos 10 caracteres",
			"string.max": "La descripción no puede exceder los 2000 caracteres",
			"any.required": "La descripción es obligatoria",
		}),
		currentValue: Joi.string().allow(null, "").max(1000),
		proposedValue: Joi.string().allow(null, "").max(1000),
		justification: Joi.string().allow(null, "").max(1000),
		priority: Joi.string().valid("low", "medium", "high").default("medium"),
		affectsAccuracy: Joi.boolean().default(false),
		affectsCompliance: Joi.boolean().default(false),
		references: Joi.array().items(Joi.string()),
		contactForFollowup: Joi.boolean().default(false),
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

export const validateComparisonRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		calculationIds: Joi.array()
			.items(Joi.string().uuid())
			.min(2)
			.max(4)
			.required()
			.messages({
				"array.min": "Debe seleccionar al menos 2 cálculos",
				"array.max": "No puede comparar más de 4 cálculos",
				"any.required": "Los IDs de cálculos son obligatorios",
			}),
		saveName: Joi.string().min(3).max(100).messages({
			"string.min": "El nombre debe tener al menos 3 caracteres",
			"string.max": "El nombre no puede exceder los 100 caracteres",
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
