// src/application/material/BulkUpdateMaterialPricesUseCase.ts
import {
	MaterialRepository,
	MaterialFilters,
} from "../../domain/repositories/MaterialRepository";
import {NotificationService} from "../../domain/services/NotificationService";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";
import {PriceChangeReason} from "../../infrastructure/database/entities/MaterialPriceHistoryEntity";

export interface PriceUpdateRule {
	categoryId?: string;
	sellerId?: string;
	tags?: string[];
	priceChangePercentage: number;
	reason: PriceChangeReason;
	notes?: string;
	minPrice?: number;
	maxPrice?: number;
}

export class BulkUpdateMaterialPricesUseCase {
	constructor(
		private materialRepository: MaterialRepository,
		private notificationService: NotificationService
	) {}

	async execute(
		updateRule: PriceUpdateRule,
		userId: string
	): Promise<{
		success: boolean;
		updatedCount: number;
		materials: {id: string; name: string; oldPrice: number; newPrice: number}[];
	}> {
		// 1. Buscar materiales que cumplan con los criterios
		const filters: MaterialFilters = {};

		if (updateRule.categoryId) filters.categoryId = updateRule.categoryId;
		if (updateRule.sellerId) filters.sellerId = updateRule.sellerId;
		if (updateRule.tags && updateRule.tags.length > 0)
			filters.tags = updateRule.tags;
		if (updateRule.minPrice) filters.minPrice = updateRule.minPrice;
		if (updateRule.maxPrice) filters.maxPrice = updateRule.maxPrice;

		// Call findAll with filters and get the result
		const result = await this.materialRepository.findAll(filters);

		// Handle both possible return types (array or paginated result)
		const materials = Array.isArray(result) ? result : result.materials;

		if (materials.length === 0) {
			return {success: false, updatedCount: 0, materials: []};
		}

		// 2. Actualizar precios y guardar historial
		const updatedMaterials = [];

		for (const material of materials) {
			const oldPrice = Number(material.price);
			const newPrice = oldPrice * (1 + updateRule.priceChangePercentage / 100);

			// Aplicar también a precios al por mayor si existen
			let newWholesalePrice = material.wholesalePrice;
			if (newWholesalePrice) {
				newWholesalePrice =
					Number(newWholesalePrice) *
					(1 + updateRule.priceChangePercentage / 100);
			}

			// Actualizar el material
			await this.materialRepository.update(material.id, {
				price: newPrice,
				wholesalePrice: newWholesalePrice,
				updatedAt: new Date(),
			});

			// Guardar en historial mediante actualización
			await this.materialRepository.saveHistoricalPrice({
				materialId: material.id,
				price: newPrice,
				wholesalePrice: newWholesalePrice,
				wholesaleMinQuantity: material.wholesaleMinQuantity,
				effectiveDate: new Date(),
				reason: updateRule.reason,
				notes: updateRule.notes,
				recordedBy: userId,
				priceChangePercentage: updateRule.priceChangePercentage,
				isPromotion: updateRule.reason === PriceChangeReason.PROMOTION,
			});

			updatedMaterials.push({
				id: material.id,
				name: material.name,
				oldPrice,
				newPrice,
			});
		}

		// 3. Notificar al usuario sobre la actualización exitosa
		if (updatedMaterials.length > 0) {
			await this.notificationService.sendToUser(userId, {
				title: "Actualización masiva de precios",
				content: `Se actualizaron los precios de ${updatedMaterials.length} materiales con un cambio del ${updateRule.priceChangePercentage}%.`,
				type: NotificationType.PRICE_UPDATE,
				priority: NotificationPriority.MEDIUM,
				relatedEntityType: "material",
				actionUrl: "/materials",
				actionText: "Ver materiales",
			});
		}

		return {
			success: true,
			updatedCount: updatedMaterials.length,
			materials: updatedMaterials,
		};
	}
}
