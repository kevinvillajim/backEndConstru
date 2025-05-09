// src/infrastructure/webserver/validators/projectScheduleValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

export const validateScheduleGenerationRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		projectId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de proyecto debe ser un UUID válido",
			"any.required": "El ID de proyecto es obligatorio",
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
