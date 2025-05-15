// src/infrastructure/webserver/controllers/MaterialController.ts
import {Request, Response} from "express";
import {MaterialRepository} from "../../../domain/repositories/MaterialRepository";
import {handleError} from "../utils/errorHandler";
import { UserRole } from "../../../domain/models/user/User";
import {RequestWithUser} from "../middlewares/authMiddleware";
import { BulkUpdateMaterialPricesUseCase } from "@application/material/BulkUpdateMaterialPricesUseCase";
import { MaterialPriceHistoryEntity, PriceChangeReason } from "@infrastructure/database/entities/MaterialPriceHistoryEntity";
import { NotificationServiceImpl } from "@infrastructure/services/NotificationServiceImpl";
import { AppDataSource } from "@infrastructure/database/data-source";
import {getNotificationService} from "../../config/service-factory";
import { parse } from "path";

export class MaterialController {
	private compareMaterialPricesUseCase: any;

	constructor(
		private materialRepository: MaterialRepository,
		compareMaterialPricesUseCase?: any
	) {
		// Si se proporciona el caso de uso para comparación, lo usamos, si no, es null
		this.compareMaterialPricesUseCase = compareMaterialPricesUseCase || null;
	}

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

			const parsedQuantity = parseInt(quantity as string, 10);
			if (isNaN(parsedQuantity) || parsedQuantity < 0) {
				res.status(400).json({
					success: false,
					message: "La cantidad debe ser un número positivo",
				});
				return;
			}

			// Actualizar el stock
			const success = await this.materialRepository.updateStock(
				id,
				parsedQuantity
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

	async bulkUpdatePrices(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {
				categoryId,
				sellerId,
				tags,
				priceChangePercentage,
				reason,
				notes,
				minPrice,
				maxPrice,
			} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Sólo administradores o vendedores pueden actualizar precios masivamente
			if (req.user.role !== "admin" && req.user.role !== "seller") {
				res.status(403).json({
					success: false,
					message: "No tienes permisos para actualizar precios masivamente",
				});
				return;
			}

			// Validar que se proporcionó un porcentaje de cambio
			if (priceChangePercentage === undefined) {
				res.status(400).json({
					success: false,
					message: "El porcentaje de cambio de precio es requerido",
				});
				return;
			}

			// Validar que se proporcionó una razón válida
			if (
				!reason ||
				!Object.values(PriceChangeReason).includes(reason as PriceChangeReason)
			) {
				res.status(400).json({
					success: false,
					message: "Razón de cambio de precio inválida",
				});
				return;
			}

			// Ejecutar el caso de uso
			const bulkUpdateUseCase = new BulkUpdateMaterialPricesUseCase(
				this.materialRepository,
				getNotificationService()
			);
			const result = await bulkUpdateUseCase.execute(
				{
					categoryId,
					sellerId: sellerId || req.user.id, // Por defecto, solo actualiza los propios
					tags,
					priceChangePercentage: Number(priceChangePercentage),
					reason: reason as PriceChangeReason,
					notes,
					minPrice: minPrice ? Number(minPrice) : undefined,
					maxPrice: maxPrice ? Number(maxPrice) : undefined,
				},
				req.user.id
			);

			if (result.success) {
				res.status(200).json({
					success: true,
					message: `Precios actualizados exitosamente para ${result.updatedCount} materiales`,
					data: result,
				});
			} else {
				res.status(404).json({
					success: false,
					message: "No se encontraron materiales que cumplan con los criterios",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al actualizar precios masivamente",
			});
		}
	}

	/**
	 * Obtiene el historial de precios de un material
	 */
	async getPriceHistory(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;

			// Verificar que el material existe
			const material = await this.materialRepository.findById(id);

			if (!material) {
				res.status(404).json({
					success: false,
					message: "Material no encontrado",
				});
				return;
			}

			// Obtener historial de precios
			const priceHistoryRepository = AppDataSource.getRepository(
				MaterialPriceHistoryEntity
			);
			const priceHistory = await priceHistoryRepository.find({
				where: {materialId: id},
				order: {effectiveDate: "DESC"},
			});

			res.status(200).json({
				success: true,
				data: priceHistory,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener historial de precios",
			});
		}
	}

	/**
	 * Compara precios de un material entre diferentes proveedores
	 * Solo accesible para administradores
	 */
	async comparePrices(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {materialId} = req.params;
			const {projectLocation} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar que el usuario es admin
			if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
        success: false,
        message: "Solo los administradores pueden acceder a esta funcionalidad",
    });
    return;
}

			const comparison = await this.compareMaterialPricesUseCase.execute(
				materialId,
				req.user.id,
				projectLocation
			);

			res.status(200).json({
				success: true,
				data: comparison,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al comparar precios",
			});
		}
	}
}
