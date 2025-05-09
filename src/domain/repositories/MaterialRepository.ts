// src/domain/repositories/MaterialRepository.ts
import {Material} from "../models/material/Material";

export interface MaterialRepository {
	findById(id: string): Promise<Material | null>;
	findByName(name: string): Promise<Material[]>;
	findBySku(sku: string): Promise<Material | null>;
	findAll(
		filters?: any,
		pagination?: any
	): Promise<{materials: Material[]; total: number}>;
	create(material: Omit<Material, "id">): Promise<Material>;
	update(id: string, materialData: Partial<Material>): Promise<Material | null>;
	delete(id: string): Promise<boolean>;
	updateStock(id: string, quantity: number): Promise<boolean>;
	updateViewCount(id: string): Promise<boolean>;
}
