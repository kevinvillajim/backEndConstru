// src/infrastructure/webserver/validators/budgetValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";
import {BudgetStatus} from "../../../domain/models/project/ProjectBudget";

export const validateBudgetStatusUpdate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		status: Joi.string()
			.valid(...Object.values(BudgetStatus))
			.required()
			.messages({
				"any.only": "El estado debe ser uno de los valores válidos",
				"any.required": "El estado es obligatorio",
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
