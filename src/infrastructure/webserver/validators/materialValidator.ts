// src/infrastructure/webserver/validators/materialValidator.ts
import {Request, Response, NextFunction} from "express";
import Joi from "joi";

export const validateMaterial = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		name: Joi.string().required().min(3).max(100).messages({
			"string.min": "El nombre debe tener al menos 3 caracteres",
			"string.max": "El nombre no puede exceder los 100 caracteres",
			"any.required": "El nombre es obligatorio",
		}),
		description: Joi.string().allow(null, "").max(1000).messages({
			"string.max": "La descripción no puede exceder los 1000 caracteres",
		}),
		specifications: Joi.string().allow(null, "").max(1000).messages({
			"string.max":
				"Las especificaciones no pueden exceder los 1000 caracteres",
		}),
		price: Joi.number().required().min(0).messages({
			"number.base": "El precio debe ser un número",
			"number.min": "El precio no puede ser negativo",
			"any.required": "El precio es obligatorio",
		}),
		wholesalePrice: Joi.number().min(0).allow(null),
		wholesaleMinQuantity: Joi.number().integer().min(1).allow(null),
		stock: Joi.number().integer().min(0).default(0),
		minStock: Joi.number().integer().min(0).default(0),
		unitOfMeasure: Joi.string().required().messages({
			"any.required": "La unidad de medida es obligatoria",
		}),
		brand: Joi.string().allow(null, ""),
		model: Joi.string().allow(null, ""),
		sku: Joi.string().allow(null, ""),
		barcode: Joi.string().allow(null, ""),
		imageUrls: Joi.array().items(Joi.string().uri()),
		isFeatured: Joi.boolean().default(false),
		dimensions: Joi.object({
			length: Joi.number().min(0).allow(null),
			width: Joi.number().min(0).allow(null),
			height: Joi.number().min(0).allow(null),
			weight: Joi.number().min(0).allow(null),
			unit: Joi.string().allow(null, ""),
		}).allow(null),
		categoryId: Joi.string().uuid().required().messages({
			"string.uuid": "El ID de categoría debe ser un UUID válido",
			"any.required": "La categoría es obligatoria",
		}),
		tags: Joi.array().items(Joi.string()),
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

export const validateStockUpdate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		quantity: Joi.number().integer().required().messages({
			"number.base": "La cantidad debe ser un número entero",
			"any.required": "La cantidad es obligatoria",
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

export const validateBulkPriceUpdate = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const schema = Joi.object({
		categoryId: Joi.string().uuid(),
		sellerId: Joi.string().uuid(),
		tags: Joi.array().items(Joi.string()),
		priceChangePercentage: Joi.number().required().messages({
			"number.base": "El porcentaje de cambio debe ser un número",
			"any.required": "El porcentaje de cambio es obligatorio",
		}),
		reason: Joi.string()
			.required()
			.valid(
				"supplier_update",
				"market_fluctuation",
				"promotion",
				"seasonal_change",
				"inflation_adjustment",
				"bulk_discount",
				"other"
			)
			.messages({
				"any.required": "La razón del cambio es obligatoria",
				"any.only": "Razón de cambio inválida",
			}),
		notes: Joi.string().max(500),
		minPrice: Joi.number().min(0),
		maxPrice: Joi.number().min(0),
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