// src/infrastructure/webserver/validators/calculationValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

/**
 * Validador para solicitudes de ejecución de cálculos
 */
export const validateCalculationRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		templateId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de plantilla debe ser un UUID válido",
			"any.required": "El ID de plantilla es obligatorio",
		}),
		projectId: Joi.string().uuid().allow(null, "").messages({
			"string.uuid": "El ID de proyecto debe ser un UUID válido",
		}),
		parameters: Joi.object().required().messages({
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

/**
 * Validador para solicitudes de guardado de resultados
 */
export const validateSaveResultRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		id: Joi.string().uuid().required().messages({
			"string.uuid": "El ID del resultado debe ser un UUID válido",
			"any.required": "El ID del resultado es obligatorio",
		}),
		name: Joi.string().required().min(3).max(100).messages({
			"string.min": "El nombre debe tener al menos 3 caracteres",
			"string.max": "El nombre no puede exceder los 100 caracteres",
			"any.required": "El nombre es obligatorio",
		}),
		notes: Joi.string().allow(null, "").max(500).messages({
			"string.max": "Las notas no pueden exceder los 500 caracteres",
		}),
		usedInProject: Joi.boolean().allow(null),
		projectId: Joi.string().uuid().allow(null, "").messages({
			"string.uuid": "El ID de proyecto debe ser un UUID válido",
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
