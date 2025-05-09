// src/infrastructure/webserver/validators/materialRequestValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

export const validateMaterialRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		taskId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de la tarea debe ser un UUID válido",
			"any.required": "El ID de la tarea es obligatorio",
		}),
		materialId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID del material debe ser un UUID válido",
			"any.required": "El ID del material es obligatorio",
		}),
		quantity: Joi.number().min(0.1).required().messages({
			"number.base": "La cantidad debe ser un número",
			"number.min": "La cantidad debe ser mayor a 0",
			"any.required": "La cantidad es obligatoria",
		}),
		notes: Joi.string().allow(null, "").max(500).messages({
			"string.max": "Las notas no pueden exceder los 500 caracteres",
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
