// src/domain/repositories/MaterialRepository.ts
import {MaterialEntity} from "../../infrastructure/database/entities/MaterialEntity";

export interface MaterialFilters {
	type?: string;
	supplierCode?: string;
	isActive?: boolean;
	isInStock?: boolean;
	isLowStock?: boolean;
	needsPriceUpdate?: boolean;
	needsInventoryUpdate?: boolean;
	minQuantity?: number;
	maxPrice?: number;
	categoryId?: string;
	sellerId?: string;
	isFeatured?: boolean;
	searchTerm?: string;
	minPrice?: number;
	tags?: string[];
}

export interface PaginationOptions {
	page: number;
	limit: number;
	sortBy?: string;
	sortOrder?: "ASC" | "DESC";
}

export interface PaginatedResult<T> {
	materials: T[];
	total: number;
}

export interface MaterialRepository {
	// Métodos básicos CRUD
	findById(id: string): Promise<MaterialEntity | null>;
	findAll(): Promise<MaterialEntity[]>;
	findAll(
		filters?: MaterialFilters,
		pagination?: PaginationOptions
	): Promise<PaginatedResult<MaterialEntity>>;
	findByFilters(filters: MaterialFilters): Promise<MaterialEntity[]>;
	findByType(type: string): Promise<MaterialEntity[]>;
	findByName(name: string): Promise<MaterialEntity[]>;
	findBySku(sku: string): Promise<MaterialEntity | null>;

	// Métodos para integraciones externas
	findByExternalId(externalId: string): Promise<MaterialEntity | null>;
	findBySupplierCode(supplierCode: string): Promise<MaterialEntity[]>;
	findBySupplierId(supplierId: string): Promise<MaterialEntity[]>;

	// Métodos de inventario
	findInStock(): Promise<MaterialEntity[]>;
	findLowStock(): Promise<MaterialEntity[]>;
	findOutOfStock(): Promise<MaterialEntity[]>;
	findNeedingInventoryUpdate(): Promise<MaterialEntity[]>;

	// Métodos de precios
	findNeedingPriceUpdate(): Promise<MaterialEntity[]>;
	findByPriceRange(
		minPrice: number,
		maxPrice: number
	): Promise<MaterialEntity[]>;

	// Operaciones CRUD
	create(
		material: Omit<MaterialEntity, "id" | "createdAt" | "updatedAt">
	): Promise<MaterialEntity>;
	save(material: MaterialEntity): Promise<MaterialEntity>;
	saveMany(materials: MaterialEntity[]): Promise<MaterialEntity[]>;
	update(
		id: string,
		updates: Partial<MaterialEntity>
	): Promise<MaterialEntity | null>;
	delete(id: string): Promise<boolean>;

	// Operaciones de inventario
	updateInventory(
		id: string,
		quantity: number,
		source?: string
	): Promise<boolean>;
	updateStock(id: string, quantityChange: number): Promise<boolean>;
	updatePrice(id: string, price: number, source?: string): Promise<boolean>;
	bulkUpdateInventory(
		updates: {id: string; quantity: number}[]
	): Promise<number>;
	bulkUpdatePrices(updates: {id: string; price: number}[]): Promise<number>;

	// Métodos de análisis y estadísticas
	getInventoryReport(): Promise<any>;
	getPriceHistory(materialId: string, days?: number): Promise<any[]>;
	getUsageStatistics(
		materialId: string,
		dateRange?: {start: Date; end: Date}
	): Promise<any>;
	getLowStockAlerts(): Promise<MaterialEntity[]>;
	updateViewCount(id: string): Promise<boolean>;

	// Búsqueda avanzada
	search(searchTerm: string): Promise<MaterialEntity[]>;
	findSimilar(materialId: string): Promise<MaterialEntity[]>;
	findAlternatives(materialId: string): Promise<MaterialEntity[]>;

	// Historial de precios
	saveHistoricalPrice(priceData: {
		materialId: string;
		price: number;
		wholesalePrice?: number;
		wholesaleMinQuantity?: number;
		effectiveDate: Date;
		reason: any; // PriceChangeReason from entities
		notes?: string;
		recordedBy: string;
		priceChangePercentage: number;
		isPromotion: boolean;
	}): Promise<boolean>;
}
