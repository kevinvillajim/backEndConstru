// src/infrastructure/webserver/validators/userMaterialTemplateValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

export const validateUserMaterialTemplate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		name: Joi.string().required().min(3).max(150),
		description: Joi.string().required().min(10).max(2000),
		type: Joi.string()
			.valid(
				"masonry",
				"concrete",
				"finishes",
				"stairs",
				"electrical",
				"furniture",
				"mortar",
				"flooring"
			)
			.required(),
		subCategory: Joi.string().required().max(100),
		formula: Joi.string().required().min(10),
		materialOutputs: Joi.array().items(Joi.object()).min(1).required(),
		parameters: Joi.array().items(Joi.object()).min(1).required(),
		wasteFactors: Joi.array().items(Joi.object()).min(1).required(),
		isPublic: Joi.boolean().default(false),
		tags: Joi.array().items(Joi.string().max(30)).max(10),
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