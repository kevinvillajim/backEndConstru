// src/infrastructure/webserver/validators/projectScheduleValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";
import {TaskStatus} from "../../../domain/models/project/Task";

export const validateTaskStatus = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		status: Joi.string()
			.valid(...Object.values(TaskStatus))
			.required()
			.messages({
				"any.only": "El estado debe ser uno de los valores válidos",
				"any.required": "El estado es obligatorio",
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

export const validateTaskAssignment = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		assigneeId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID del usuario asignado debe ser un UUID válido",
			"any.required": "El ID del usuario asignado es obligatorio",
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

export const validatePhaseDates = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		startDate: Joi.date().iso().required().messages({
			"date.base": "La fecha de inicio debe ser una fecha válida",
			"date.format": "La fecha de inicio debe estar en formato ISO",
			"any.required": "La fecha de inicio es obligatoria",
		}),
		endDate: Joi.date().iso().min(Joi.ref("startDate")).required().messages({
			"date.base": "La fecha de fin debe ser una fecha válida",
			"date.format": "La fecha de fin debe estar en formato ISO",
			"date.min": "La fecha de fin debe ser posterior a la fecha de inicio",
			"any.required": "La fecha de fin es obligatoria",
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
