// src/infrastructure/webserver/controllers/SupplierIntegrationController.ts
import {Request, Response} from "express";
import {handleError} from "../utils/errorHandler";
import {ImportMaterialsFromSupplierUseCase} from "../../../application/material/ImportMaterialsFromSupplierUseCase";
import {SupplierIntegrationService} from "../../../domain/services/SupplierIntegrationService";
import {ExampleSupplierAdapter} from "../../external/supplier/ExampleSupplierAdapter";
import {MaterialRepository} from "../../../domain/repositories/MaterialRepository";
import {CategoryRepository} from "../../../domain/repositories/CategoryRepository";
import {NotificationService} from "../../../domain/services/NotificationService";
import {RequestWithUser} from "../middlewares/authMiddleware";

export class SupplierIntegrationController {
	constructor(
		private materialRepository: MaterialRepository,
		private categoryRepository: CategoryRepository,
		private notificationService: NotificationService
	) {}

	/**
	 * Lista los proveedores disponibles para integración
	 */
	async listSuppliers(req: RequestWithUser, res: Response): Promise<void> {
		try {
			// En una implementación real, esto podría venir de una base de datos
			const suppliers = [
				{
					id: "example-supplier",
					name: "Proveedor Ejemplo S.A.",
					description:
						"Proveedor líder de materiales de construcción en Ecuador",
					logo: "https://examplesupplier.com/logo.png",
					isConnected: true,
				},
				// Otros proveedores
			];

			res.status(200).json({
				success: true,
				data: suppliers,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener proveedores",
			});
		}
	}

	/**
	 * Obtiene los productos de un proveedor
	 */
	async getSupplierProducts(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {supplierId} = req.params;
			const {page = 1, limit = 50, ...filters} = req.query;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Obtener adaptador para el proveedor (en una implementación real podría ser dinámico)
			const supplierService = this.getSupplierAdapter(supplierId);

			if (!supplierService) {
				res.status(404).json({
					success: false,
					message: "Proveedor no encontrado",
				});
				return;
			}

			// Testear conexión
			const isConnected = await supplierService.testConnection();
			if (!isConnected) {
				res.status(503).json({
					success: false,
					message: "No se pudo conectar con el proveedor",
				});
				return;
			}

			// Obtener productos del proveedor
			const products = await supplierService.fetchProducts(
				filters,
				Number(page),
				Number(limit)
			);

			res.status(200).json({
				success: true,
				data: products,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al obtener productos del proveedor",
			});
		}
	}

	/**
	 * Busca productos de un proveedor
	 */
	async searchSupplierProducts(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {supplierId} = req.params;
			const {q, page = 1, limit = 50} = req.query;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			if (!q) {
				res.status(400).json({
					success: false,
					message: "Término de búsqueda requerido",
				});
				return;
			}

			// Obtener adaptador para el proveedor
			const supplierService = this.getSupplierAdapter(supplierId);

			if (!supplierService) {
				res.status(404).json({
					success: false,
					message: "Proveedor no encontrado",
				});
				return;
			}

			// Buscar productos
			const products = await supplierService.searchProducts(
				q as string,
				Number(page),
				Number(limit)
			);

			res.status(200).json({
				success: true,
				data: products,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al buscar productos del proveedor",
			});
		}
	}

	/**
	 * Importa productos de un proveedor
	 */
	async importProducts(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {supplierId} = req.params;
			const {page = 1, limit = 50, ...filters} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Verificar permisos (solo admin y seller)
			if (req.user.role !== "admin" && req.user.role !== "seller") {
				res.status(403).json({
					success: false,
					message: "No tienes permisos para importar productos",
				});
				return;
			}

			// Obtener adaptador para el proveedor
			const supplierService = this.getSupplierAdapter(supplierId);

			if (!supplierService) {
				res.status(404).json({
					success: false,
					message: "Proveedor no encontrado",
				});
				return;
			}

			// Crear caso de uso
			const importUseCase = new ImportMaterialsFromSupplierUseCase(
				this.materialRepository,
				this.categoryRepository,
				supplierService,
				this.notificationService
			);

			// Ejecutar importación
			const result = await importUseCase.execute(
				req.user.id,
				filters,
				Number(page),
				Number(limit)
			);

			if (result.success) {
				res.status(200).json({
					success: true,
					message: "Importación completada",
					data: result,
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se encontraron productos para importar",
					data: result,
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al importar productos",
			});
		}
	}

	// Método auxiliar para obtener el adaptador de proveedor según el ID
	private getSupplierAdapter(
		supplierId: string
	): SupplierIntegrationService | null {
		// En una implementación real, esto podría ser más dinámico
		// y la configuración podría venir de una base de datos
		switch (supplierId) {
			case "example-supplier":
				return new ExampleSupplierAdapter(
					process.env.EXAMPLE_SUPPLIER_API_KEY || "demo-key",
					process.env.EXAMPLE_SUPPLIER_API_URL
				);
			default:
				return null;
		}
	}
}
