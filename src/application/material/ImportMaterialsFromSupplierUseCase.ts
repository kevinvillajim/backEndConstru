// src/application/material/ImportMaterialsFromSupplierUseCase.ts
import {MaterialRepository} from "../../domain/repositories/MaterialRepository";
import {CategoryRepository} from "../../domain/repositories/CategoryRepository";
import {SupplierIntegrationService} from "../../domain/services/SupplierIntegrationService";
import {NotificationService} from "../../domain/services/NotificationService";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";

export class ImportMaterialsFromSupplierUseCase {
	constructor(
		private materialRepository: MaterialRepository,
		private categoryRepository: CategoryRepository,
		private supplierService: SupplierIntegrationService,
		private notificationService: NotificationService
	) {}

	async execute(
		userId: string,
		filters?: any,
		page: number = 1,
		limit: number = 50
	): Promise<{
		success: boolean;
		importedCount: number;
		skippedCount: number;
		failedCount: number;
		totalAvailable: number;
	}> {
		try {
			// 1. Obtener productos del proveedor
			const supplierProducts = await this.supplierService.fetchProducts(
				filters,
				page,
				limit
			);

			if (supplierProducts.products.length === 0) {
				return {
					success: false,
					importedCount: 0,
					skippedCount: 0,
					failedCount: 0,
					totalAvailable: 0,
				};
			}

			// Contadores para el resultado
			let importedCount = 0;
			let skippedCount = 0;
			let failedCount = 0;

			// 2. Procesar cada producto
			for (const product of supplierProducts.products) {
				try {
					// Verificar si el producto ya existe por SKU
					let existingMaterial = null;
					if (product.sku) {
						existingMaterial = await this.materialRepository.findBySku(
							product.sku
						);
					}

					// Si ya existe, actualizar precios y stock
					if (existingMaterial) {
						await this.materialRepository.update(existingMaterial.id, {
							price: product.price,
							wholesalePrice: product.wholesalePrice,
							wholesaleMinQuantity: product.wholesaleMinQuantity,
							stock: product.stock,
							updatedAt: new Date(),
						});

						// Guardar historial de precio (SIN supplierName y con priceChangePercentage opcional)
						await this.materialRepository.saveHistoricalPrice({
							materialId: existingMaterial.id,
							price: product.price,
							wholesalePrice: product.wholesalePrice,
							wholesaleMinQuantity: product.wholesaleMinQuantity,
							effectiveDate: new Date(),
							reason: "supplier_update",
							notes: `Actualización automática desde ${this.supplierService.getSupplierName()}`,
							recordedBy: userId,
							priceChangePercentage: 0, // Calcular la diferencia real si es necesario
							isPromotion: false,
						});

						skippedCount++;
						continue;
					}

					// Buscar o crear categoría si es necesario
					let categoryId = product.categoryId;
					if (!categoryId && product.categoryName) {
						// Buscar categoría por nombre
						const category = await this.categoryRepository.findByName(
							product.categoryName
						);
						if (category) {
							categoryId = category.id;
						} else {
							// Crear nueva categoría
							const newCategory = await this.categoryRepository.create({
								name: product.categoryName,
								description: `Categoría importada desde ${this.supplierService.getSupplierName()}`,
								isActive: true,
								displayOrder: 0,
								createdAt: new Date(),
								updatedAt: new Date(),
							});
							categoryId = newCategory.id;
						}
					}

					// Si no se pudo determinar una categoría, usar una por defecto
					if (!categoryId) {
						const defaultCategory =
							await this.categoryRepository.findByName("Sin categoría");
						if (defaultCategory) {
							categoryId = defaultCategory.id;
						} else {
							// Crear categoría por defecto
							const newCategory = await this.categoryRepository.create({
								name: "Sin categoría",
								description: "Categoría por defecto para productos importados",
								isActive: true,
								displayOrder: 0,
								createdAt: new Date(),
								updatedAt: new Date(),
							});
							categoryId = newCategory.id;
						}
					}

					// Crear el nuevo material
					const newMaterial = await this.materialRepository.create({
						name: product.name,
						description: product.description || "",
						specifications: product.specifications || "",
						price: product.price,
						currentPrice: product.price,
						unitCost: product.price,
						wholesalePrice: product.wholesalePrice,
						wholesaleMinQuantity: product.wholesaleMinQuantity,
						stock: product.stock,
						availableQuantity: product.stock,
						minStock: 5,
						unitOfMeasure: "unidad",
						brand: product.brand || "",
						model: product.model || "",
						sku: product.sku || null,
						barcode: product.barcode || null,
						externalId: product.externalId || null,
						supplierCode: product.supplierCode || null,
						lastPriceUpdate: new Date(),
						lastInventoryUpdate: new Date(),
						imageUrls: product.imageUrls || [],
						isFeatured: false,
						isActive: true,
						dimensions: product.dimensions || {},
						type: product.type || "standard",
						supplierInfo: {
							supplierId: null,
							supplierName: this.supplierService.getSupplierName(),
							minimumOrder: product.minimumOrder || 1,
							deliveryTime: product.deliveryTime || 7,
							qualityRating: product.qualityRating || 0
						},
						categoryId: categoryId!,
						sellerId: userId,
						tags: product.tags || [],
						rating: 0,
						ratingCount: 0,
						viewCount: 0,
						orderCount: 0,
						deletedAt: null,
						category: null,
						seller: null,
						materialRequests: [],
						availableStock: product.stock,
						currentPriceValue: product.price,

						// Añadir los métodos faltantes
						getSupplierInfo: function() {
							return this.supplierInfo || {
								supplierId: null,
								supplierName: null,
								minimumOrder: 1,
								deliveryTime: 7,
								qualityRating: 0
							};
						},

						updateInventory: function(newQuantity: number, source: string = 'manual') {
							this.availableQuantity = newQuantity;
							this.stock = newQuantity;
							this.lastInventoryUpdate = new Date();
						},

						updatePrice: function(newPrice: number, source: string = 'manual') {
							this.currentPrice = newPrice;
							if (!this.price || newPrice !== this.price) {
								this.price = newPrice;
							}
							this.lastPriceUpdate = new Date();
						},

						// Métodos existentes...
						isAvailable: function(requiredQuantity: number = 1): boolean { 
							return this.availableStock >= requiredQuantity && this.isActive;
						},
						needsRestock: function(): boolean {
							return this.stock <= 5;
						},
						reduceStock: function(quantity: number) { return true; },
						increaseStock: function(quantity: number) { },
						getTotalInventoryValue: function() { return this.stock * this.price; },
						needsPriceUpdate: function() { return false; },
						needsInventoryUpdate: function() { return false; }
					});

					// Guardar historial de precio inicial (SIN supplierName)
					await this.materialRepository.saveHistoricalPrice({
						materialId: newMaterial.id,
						price: product.price,
						wholesalePrice: product.wholesalePrice,
						wholesaleMinQuantity: product.wholesaleMinQuantity,
						effectiveDate: new Date(),
						reason: "supplier_update",
						notes: `Importación inicial desde ${this.supplierService.getSupplierName()}`,
						recordedBy: userId,
						priceChangePercentage: 0,
						isPromotion: false,
					});

					importedCount++;
				} catch (error) {
					console.error(`Error importing product ${product.name}:`, error);
					failedCount++;
				}
			}

			// 3. Notificar al usuario sobre la importación
			await this.notificationService.sendToUser(userId, {
				title: "Importación de materiales completada",
				content: `Se importaron ${importedCount} materiales, se actualizaron ${skippedCount} y fallaron ${failedCount}.`,
				type: NotificationType.MATERIAL_IMPORT,
				priority: NotificationPriority.MEDIUM,
				relatedEntityType: "material",
				actionUrl: "/materials",
				actionText: "Ver materiales",
			});

			return {
				success: true,
				importedCount,
				skippedCount,
				failedCount,
				totalAvailable: supplierProducts.totalProducts,
			};
		} catch (error) {
			console.error("Error during import process:", error);
			throw new Error("Error en el proceso de importación de materiales");
		}
	}
}
