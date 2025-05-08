// src/infrastructure/webserver/validators/authValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

/**
 * Validator for login requests
 */
export const validateLoginRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		email: Joi.string().email().required().messages({
			"string.email": "El correo electrónico debe tener un formato válido",
			"any.required": "El correo electrónico es obligatorio",
		}),
		password: Joi.string().required().messages({
			"any.required": "La contraseña es obligatoria",
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
 * Validator for registration requests
 */
export const validateRegisterRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		firstName: Joi.string().trim().min(2).max(50).required().messages({
			"string.min": "El nombre debe tener al menos 2 caracteres",
			"string.max": "El nombre no puede exceder los 50 caracteres",
			"any.required": "El nombre es obligatorio",
		}),
		lastName: Joi.string().trim().min(2).max(50).required().messages({
			"string.min": "El apellido debe tener al menos 2 caracteres",
			"string.max": "El apellido no puede exceder los 50 caracteres",
			"any.required": "El apellido es obligatorio",
		}),
		email: Joi.string().email().required().messages({
			"string.email": "El correo electrónico debe tener un formato válido",
			"any.required": "El correo electrónico es obligatorio",
		}),
		password: Joi.string().min(8).required().messages({
			"string.min": "La contraseña debe tener al menos 8 caracteres",
			"any.required": "La contraseña es obligatoria",
		}),
		professionalType: Joi.string().allow(null, "").messages({
			"string.base": "El tipo profesional debe ser un texto",
		}),
		referralCode: Joi.string().allow(null, "").messages({
			"string.base": "El código de referencia debe ser un texto",
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
 * Validator for password reset requests
 */
export const validatePasswordResetRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		password: Joi.string().min(8).required().messages({
			"string.min": "La contraseña debe tener al menos 8 caracteres",
			"any.required": "La contraseña es obligatoria",
		}),
		confirmPassword: Joi.string()
			.valid(Joi.ref("password"))
			.required()
			.messages({
				"any.only": "Las contraseñas no coinciden",
				"any.required": "La confirmación de contraseña es obligatoria",
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
 * Validator for forgot password requests
 */
export const validateForgotPasswordRequest = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		email: Joi.string().email().required().messages({
			"string.email": "El correo electrónico debe tener un formato válido",
			"any.required": "El correo electrónico es obligatorio",
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
