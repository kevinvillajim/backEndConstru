// src/domain/repositories/MaterialRepository.ts
import { MaterialEntity } from '../../infrastructure/database/entities/MaterialEntity';

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
}

export interface MaterialRepository {
  // Métodos básicos CRUD
  findById(id: string): Promise<MaterialEntity | null>;
  findAll(): Promise<MaterialEntity[]>;
  findByFilters(filters: MaterialFilters): Promise<MaterialEntity[]>;
  findByType(type: string): Promise<MaterialEntity[]>;
  findByName(name: string): Promise<MaterialEntity[]>;
  
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
  findByPriceRange(minPrice: number, maxPrice: number): Promise<MaterialEntity[]>;
  
  // Operaciones CRUD
  save(material: MaterialEntity): Promise<MaterialEntity>;
  saveMany(materials: MaterialEntity[]): Promise<MaterialEntity[]>;
  update(id: string, updates: Partial<MaterialEntity>): Promise<MaterialEntity | null>;
  delete(id: string): Promise<boolean>;
  
  // Operaciones de inventario
  updateInventory(id: string, quantity: number, source?: string): Promise<boolean>;
  updatePrice(id: string, price: number, source?: string): Promise<boolean>;
  bulkUpdateInventory(updates: { id: string; quantity: number }[]): Promise<number>;
  bulkUpdatePrices(updates: { id: string; price: number }[]): Promise<number>;
  
  // Métodos de análisis
  getInventoryReport(): Promise<any>;
  getPriceHistory(materialId: string, days?: number): Promise<any[]>;
  getUsageStatistics(materialId: string, dateRange?: { start: Date; end: Date }): Promise<any>;
  getLowStockAlerts(): Promise<MaterialEntity[]>;
  
  // Búsqueda avanzada
  search(searchTerm: string): Promise<MaterialEntity[]>;
  findSimilar(materialId: string): Promise<MaterialEntity[]>;
  findAlternatives(materialId: string): Promise<MaterialEntity[]>;
}

export interface MaterialFilters {
	isActive?: boolean;
	type?: string;
	supplierCode?: string;
	isInStock?: boolean;
	isLowStock?: boolean;
	needsPriceUpdate?: boolean;
	needsInventoryUpdate?: boolean;
	minQuantity?: number;
	maxPrice?: number;
  }