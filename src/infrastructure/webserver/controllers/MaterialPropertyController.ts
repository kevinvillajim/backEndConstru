// src/infrastructure/webserver/controllers/MaterialPropertyController.ts
import {Request, Response} from "express";
import {ManageMaterialPropertiesUseCase} from "../../../application/material/ManageMaterialPropertiesUseCase";
import {handleError} from "../utils/errorHandler";
import {RequestWithUser} from "../middlewares/authMiddleware";

export class MaterialPropertyController {
	constructor(
		private manageMaterialPropertiesUseCase: ManageMaterialPropertiesUseCase
	) {}

	/**
	 * Obtiene las definiciones de propiedades de una categoría
	 */
	async getCategoryProperties(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {categoryId} = req.params;

			const properties =
				await this.manageMaterialPropertiesUseCase.getPropertyDefinitions(
					categoryId
				);

			res.status(200).json({
				success: true,
				data: properties,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al obtener propiedades de la categoría",
			});
		}
	}

	/**
	 * Crea una nueva definición de propiedad
	 */
	async createPropertyDefinition(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar permisos (solo admin)
			if (req.user.role !== "admin") {
				res.status(403).json({
					success: false,
					message: "No tienes permisos para crear definiciones de propiedades",
				});
				return;
			}

			const definitionData = req.body;

			const property =
				await this.manageMaterialPropertiesUseCase.createPropertyDefinition({
					...definitionData,
				});

			res.status(201).json({
				success: true,
				message: "Definición de propiedad creada",
				data: property,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al crear definición de propiedad",
			});
		}
	}

	/**
	 * Actualiza una definición de propiedad
	 */
	async updatePropertyDefinition(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {definitionId} = req.params;
			const updateData = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar permisos (solo admin)
			if (req.user.role !== "admin") {
				res.status(403).json({
					success: false,
					message:
						"No tienes permisos para actualizar definiciones de propiedades",
				});
				return;
			}

			const property =
				await this.manageMaterialPropertiesUseCase.updatePropertyDefinition(
					definitionId,
					updateData
				);

			res.status(200).json({
				success: true,
				message: "Definición de propiedad actualizada",
				data: property,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al actualizar definición de propiedad",
			});
		}
	}

	/**
	 * Elimina una definición de propiedad
	 */
	async deletePropertyDefinition(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {definitionId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar permisos (solo admin)
			if (req.user.role !== "admin") {
				res.status(403).json({
					success: false,
					message:
						"No tienes permisos para eliminar definiciones de propiedades",
				});
				return;
			}

			const success =
				await this.manageMaterialPropertiesUseCase.deletePropertyDefinition(
					definitionId
				);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Definición de propiedad eliminada",
				});
			} else {
				res.status(404).json({
					success: false,
					message: "Definición de propiedad no encontrada",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al eliminar definición de propiedad",
			});
		}
	}

	/**
	 * Obtiene las propiedades de un material
	 */
	async getMaterialProperties(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {materialId} = req.params;

			const properties =
				await this.manageMaterialPropertiesUseCase.getMaterialProperties(
					materialId
				);

			res.status(200).json({
				success: true,
				data: properties,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al obtener propiedades del material",
			});
		}
	}

	/**
	 * Establece las propiedades de un material
	 */
	async setMaterialProperties(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {materialId} = req.params;
			const {properties} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar que se proporcionaron propiedades
			if (!properties || !Array.isArray(properties)) {
				res.status(400).json({
					success: false,
					message: "Se debe proporcionar un array de propiedades",
				});
				return;
			}

			await this.manageMaterialPropertiesUseCase.setMaterialProperties(
				materialId,
				properties
			);

			res.status(200).json({
				success: true,
				message: "Propiedades del material actualizadas",
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al establecer propiedades del material",
			});
		}
	}

	/**
	 * Elimina todas las propiedades de un material
	 */
	async clearMaterialProperties(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {materialId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const success =
				await this.manageMaterialPropertiesUseCase.clearMaterialProperties(
					materialId
				);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Propiedades del material eliminadas",
				});
			} else {
				res.status(404).json({
					success: false,
					message: "Material no encontrado",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al eliminar propiedades del material",
			});
		}
	}
}
