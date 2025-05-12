// src/domain/services/SupplierIntegrationService.ts
export interface SupplierProduct {
	externalId: string;
	name: string;
	description?: string;
	specifications?: string;
	price: number;
	wholesalePrice?: number;
	wholesaleMinQuantity?: number;
	stock: number;
	sku?: string;
	barcode?: string;
	imageUrls?: string[];
	brand?: string;
	model?: string;
	categoryName?: string;
	categoryId?: string;
	tags?: string[];
	dimensions?: {
		length?: number;
		width?: number;
		height?: number;
		weight?: number;
		unit?: string;
	};
}

export interface SupplierIntegrationService {
	getSupplierName(): string;
	getSupplierDescription(): string;
	getSupplierLogo(): string;
	testConnection(): Promise<boolean>;
	fetchProducts(
		filters?: any,
		page?: number,
		limit?: number
	): Promise<{
		products: SupplierProduct[];
		totalProducts: number;
		currentPage: number;
		totalPages: number;
	}>;
	fetchProductDetails(externalId: string): Promise<SupplierProduct | null>;
	searchProducts(
		term: string,
		page?: number,
		limit?: number
	): Promise<{
		products: SupplierProduct[];
		totalProducts: number;
		currentPage: number;
		totalPages: number;
	}>;
}
