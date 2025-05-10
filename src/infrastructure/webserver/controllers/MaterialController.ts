// src/infrastructure/webserver/controllers/MaterialController.ts
import {Request, Response} from "express";
import {MaterialRepository} from "../../../domain/repositories/MaterialRepository";
import {handleError} from "../utils/errorHandler";
import {User} from "../../../domain/models/user/User";

interface RequestWithUser extends Request {
	user?: User;
}

export class MaterialController {
	constructor(private materialRepository: MaterialRepository) {}

	/**
	 * Obtiene todos los materiales con filtros opcionales
	 */
	async getMaterials(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {
				categoryId,
				sellerId,
				isActive,
				isFeatured,
				searchTerm,
				minPrice,
				maxPrice,
				page = 1,
				limit = 10,
				sortBy,
				sortOrder,
			} = req.query;

			const filters: any = {};

			if (categoryId) filters.categoryId = categoryId;
			if (sellerId) filters.sellerId = sellerId;
			if (isActive !== undefined) filters.isActive = isActive === "true";
			if (isFeatured !== undefined) filters.isFeatured = isFeatured === "true";
			if (searchTerm) filters.searchTerm = searchTerm;
			if (minPrice) filters.minPrice = parseFloat(minPrice as string);
			if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);

			const pagination = {
				page: parseInt(page as string, 10),
				limit: parseInt(limit as string, 10),
				sortBy: sortBy as string,
				sortOrder: ((sortOrder as string) || "ASC").toUpperCase() as
					| "ASC"
					| "DESC",
			};

			const {materials, total} = await this.materialRepository.findAll(
				filters,
				pagination
			);

			res.status(200).json({
				success: true,
				data: {
					materials,
					pagination: {
						total,
						page: pagination.page,
						limit: pagination.limit,
						pages: Math.ceil(total / pagination.limit),
					},
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener materiales",
			});
		}
	}

	/**
	 * Obtiene un material por su ID
	 */
	async getMaterialById(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;

			const material = await this.materialRepository.findById(id);

			if (!material) {
				res.status(404).json({
					success: false,
					message: "Material no encontrado",
				});
				return;
			}

			// Incrementar contador de vistas
			await this.materialRepository.updateViewCount(id);

			res.status(200).json({
				success: true,
				data: material,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener el material",
			});
		}
	}

	/**
	 * Crea un nuevo material
	 */
	async createMaterial(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const materialData = req.body;

			// Asignar el usuario actual como vendedor
			materialData.sellerId = req.user.id;

			// Establecer valores por defecto
			materialData.viewCount = 0;
			materialData.orderCount = 0;
			materialData.rating = 0;
			materialData.ratingCount = 0;
			materialData.isActive = true;

			const material = await this.materialRepository.create(materialData);

			res.status(201).json({
				success: true,
				message: "Material creado exitosamente",
				data: material,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al crear el material",
			});
		}
	}

	/**
	 * Actualiza un material existente
	 */
	async updateMaterial(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const updateData = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar que el material existe
			const material = await this.materialRepository.findById(id);

			if (!material) {
				res.status(404).json({
					success: false,
					message: "Material no encontrado",
				});
				return;
			}

			// Verificar que el usuario es el vendedor o un administrador
			if (material.sellerId !== req.user.id && req.user.role !== "admin") {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para modificar este material",
				});
				return;
			}

			// Actualizar el material
			const updatedMaterial = await this.materialRepository.update(
				id,
				updateData
			);

			res.status(200).json({
				success: true,
				message: "Material actualizado exitosamente",
				data: updatedMaterial,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar el material",
			});
		}
	}

	/**
	 * Elimina un material (soft delete)
	 */
	async deleteMaterial(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar que el material existe
			const material = await this.materialRepository.findById(id);

			if (!material) {
				res.status(404).json({
					success: false,
					message: "Material no encontrado",
				});
				return;
			}

			// Verificar que el usuario es el vendedor o un administrador
			if (material.sellerId !== req.user.id && req.user.role !== "admin") {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para eliminar este material",
				});
				return;
			}

			// Eliminar el material (soft delete)
			const deleted = await this.materialRepository.delete(id);

			if (deleted) {
				res.status(200).json({
					success: true,
					message: "Material eliminado exitosamente",
				});
			} else {
				res.status(500).json({
					success: false,
					message: "Error al eliminar el material",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al eliminar el material",
			});
		}
	}

	/**
	 * Actualiza el stock de un material
	 */
	async updateStock(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const {quantity} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar que se proporcionó una cantidad
			if (quantity === undefined) {
				res.status(400).json({
					success: false,
					message: "La cantidad es requerida",
				});
				return;
			}

			// Verificar que el material existe
			const material = await this.materialRepository.findById(id);

			if (!material) {
				res.status(404).json({
					success: false,
					message: "Material no encontrado",
				});
				return;
			}

			// Verificar que el usuario es el vendedor o un administrador
			if (material.sellerId !== req.user.id && req.user.role !== "admin") {
				res.status(403).json({
					success: false,
					message:
						"No tienes permiso para actualizar el stock de este material",
				});
				return;
			}

			// Actualizar el stock
			const success = await this.materialRepository.updateStock(
				id,
				parseInt(quantity as string, 10)
			);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Stock actualizado exitosamente",
				});
			} else {
				res.status(500).json({
					success: false,
					message: "Error al actualizar el stock",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar el stock",
			});
		}
	}
}
