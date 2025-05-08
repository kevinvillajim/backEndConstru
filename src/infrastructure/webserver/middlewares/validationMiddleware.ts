// src/infrastructure/webserver/middlewares/validationMiddleware.ts
import {Request, Response, NextFunction} from "express";
import {validate, ValidationError} from "class-validator";
import {plainToClass} from "class-transformer";

export function validateDTO(dtoClass: any) {
	return async (req: Request, res: Response, next: NextFunction) => {
		// Convertir el cuerpo de la solicitud a la clase DTO
		const dtoObject = plainToClass(dtoClass, req.body);

		// Validar el objeto contra las reglas definidas en el DTO
		const errors = await validate(dtoObject);

		if (errors.length > 0) {
			// Formatear los errores para la respuesta
			const formattedErrors = errors.map((error: ValidationError) => {
				const constraints = error.constraints
					? Object.values(error.constraints)
					: ["Error de validación"];
				return {
					field: error.property,
					message: constraints[0], // Tomar el primer mensaje de error
				};
			});

			res.status(400).json({
				success: false,
				message: "Error de validación",
				errors: formattedErrors,
			});
			return;
		}

		// Si la validación es exitosa, continuar
		next();
	};
}
