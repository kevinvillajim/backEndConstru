// src/infrastructure/external/supplier/ExampleSupplierAdapter.ts
import axios from "axios";
import {
	SupplierIntegrationService,
	SupplierProduct,
} from "../../../domain/services/SupplierIntegrationService";

export class ExampleSupplierAdapter implements SupplierIntegrationService {
	private apiKey: string;
	private baseUrl: string;

	constructor(
		apiKey: string,
		baseUrl: string = "https://api.examplesupplier.com"
	) {
		this.apiKey = apiKey;
		this.baseUrl = baseUrl;
	}

	getSupplierName(): string {
		return "Proveedor Ejemplo S.A.";
	}

	getSupplierDescription(): string {
		return "Proveedor líder de materiales de construcción en Ecuador";
	}

	getSupplierLogo(): string {
		return "https://examplesupplier.com/logo.png";
	}

	async testConnection(): Promise<boolean> {
		try {
			const response = await axios.get(`${this.baseUrl}/api/ping`, {
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
				},
			});
			return response.status === 200;
		} catch (error) {
			console.error("Error connecting to supplier API:", error);
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
			// Construir parámetros de consulta
			const params: any = {
				page,
				limit,
				...filters,
			};

			const response = await axios.get(`${this.baseUrl}/api/products`, {
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
				},
				params,
			});

			// Mapear la respuesta al formato esperado
			const products = response.data.products.map(this.mapToSupplierProduct);

			return {
				products,
				totalProducts: response.data.total,
				currentPage: response.data.page,
				totalPages: response.data.totalPages,
			};
		} catch (error) {
			console.error("Error fetching products from supplier:", error);
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
				`${this.baseUrl}/api/products/${externalId}`,
				{
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						"Content-Type": "application/json",
					},
				}
			);

			return this.mapToSupplierProduct(response.data);
		} catch (error) {
			console.error(`Error fetching product details for ${externalId}:`, error);
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
		try {
			const response = await axios.get(`${this.baseUrl}/api/products/search`, {
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
				},
				params: {
					q: term,
					page,
					limit,
				},
			});

			// Mapear la respuesta al formato esperado
			const products = response.data.products.map(this.mapToSupplierProduct);

			return {
				products,
				totalProducts: response.data.total,
				currentPage: response.data.page,
				totalPages: response.data.totalPages,
			};
		} catch (error) {
			console.error(`Error searching products with term "${term}":`, error);
			return {
				products: [],
				totalProducts: 0,
				currentPage: page,
				totalPages: 0,
			};
		}
	}

	// Función auxiliar para mapear productos del proveedor al formato interno
	private mapToSupplierProduct(product: any): SupplierProduct {
		return {
			externalId: product.id.toString(),
			name: product.name,
			description: product.description,
			specifications: product.specifications || product.details,
			price: Number(product.price),
			wholesalePrice: product.wholesale_price
				? Number(product.wholesale_price)
				: undefined,
			wholesaleMinQuantity: product.wholesale_min_quantity,
			stock: product.stock_quantity || 0,
			sku: product.sku,
			barcode: product.barcode,
			imageUrls: product.images,
			brand: product.brand,
			model: product.model,
			categoryName: product.category,
			tags: product.tags,
			dimensions: {
				length: product.length,
				width: product.width,
				height: product.height,
				weight: product.weight,
				unit: product.dimension_unit,
			},
		};
	}
}
