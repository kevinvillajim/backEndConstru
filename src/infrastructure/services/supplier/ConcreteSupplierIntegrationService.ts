// src/infrastructure/services/supplier/ConcreteSupplierIntegrationService.ts
import {
	SupplierIntegrationService,
	SupplierProduct,
} from "../../../domain/services/SupplierIntegrationService";
import axios from "axios";

/**
 * Implementación concreta para un proveedor específico
 * Se pueden crear múltiples implementaciones para diferentes proveedores
 */
export class ConcreteSupplierIntegrationService
	implements SupplierIntegrationService
{
	private apiKey: string;
	private apiUrl: string;

	constructor(config: {apiKey: string; apiUrl: string}) {
		this.apiKey = config.apiKey;
		this.apiUrl = config.apiUrl;
	}

	getSupplierName(): string {
		return "Proveedor de Construcción XYZ";
	}

	getSupplierDescription(): string {
		return "Proveedor líder de materiales de construcción en Ecuador";
	}

	getSupplierLogo(): string {
		return "https://example.com/logo.png";
	}

	async testConnection(): Promise<boolean> {
		try {
			const response = await axios.get(`${this.apiUrl}/health`, {
				headers: {Authorization: `Bearer ${this.apiKey}`},
			});
			return response.status === 200;
		} catch (error) {
			return false;
		}
	}

	async fetchProducts(
		filters?: any,
		page: number = 1,
		limit: number = 50
	): Promise<{
		products: SupplierProduct[];
		totalProducts: number;
		currentPage: number;
		totalPages: number;
	}> {
		try {
			const response = await axios.get(`${this.apiUrl}/products`, {
				headers: {Authorization: `Bearer ${this.apiKey}`},
				params: {
					...filters,
					page,
					limit,
				},
			});

			return {
				products: this.mapToSupplierProducts(response.data.products),
				totalProducts: response.data.total,
				currentPage: response.data.page,
				totalPages: response.data.pages,
			};
		} catch (error) {
			console.error("Error fetching products:", error);
			return {
				products: [],
				totalProducts: 0,
				currentPage: page,
				totalPages: 0,
			};
		}
	}

	async fetchProductDetails(
		externalId: string
	): Promise<SupplierProduct | null> {
		try {
			const response = await axios.get(
				`${this.apiUrl}/products/${externalId}`,
				{
					headers: {Authorization: `Bearer ${this.apiKey}`},
				}
			);

			return this.mapToSupplierProduct(response.data);
		} catch (error) {
			console.error(`Error fetching product ${externalId}:`, error);
			return null;
		}
	}

	async searchProducts(
		term: string,
		page: number = 1,
		limit: number = 50
	): Promise<{
		products: SupplierProduct[];
		totalProducts: number;
		currentPage: number;
		totalPages: number;
	}> {
		return this.fetchProducts({search: term}, page, limit);
	}

	// Método auxiliar para mapear respuesta de la API a nuestro modelo
	private mapToSupplierProducts(apiProducts: any[]): SupplierProduct[] {
		return apiProducts.map(this.mapToSupplierProduct);
	}

	private mapToSupplierProduct(apiProduct: any): SupplierProduct {
		return {
			externalId: apiProduct.id.toString(),
			name: apiProduct.name,
			description: apiProduct.description,
			specifications: apiProduct.specifications,
			price: apiProduct.price,
			wholesalePrice: apiProduct.wholesale_price,
			wholesaleMinQuantity: apiProduct.wholesale_min_quantity,
			stock: apiProduct.stock_quantity,
			sku: apiProduct.sku,
			barcode: apiProduct.barcode,
			imageUrls: apiProduct.images,
			brand: apiProduct.brand,
			model: apiProduct.model,
			categoryName: apiProduct.category_name,
			categoryId: apiProduct.category_id,
			tags: apiProduct.tags,
			dimensions: {
				length: apiProduct.length,
				width: apiProduct.width,
				height: apiProduct.height,
				weight: apiProduct.weight,
				unit: apiProduct.dimension_unit,
			},
		};
	}
}
