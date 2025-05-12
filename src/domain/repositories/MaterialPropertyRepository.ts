// src/domain/repositories/MaterialPropertyRepository.ts
import {MaterialPropertyDefinition} from "../models/material/MaterialPropertyDefinition";
import {MaterialPropertyValue} from "../models/material/MaterialPropertyValue";

export interface MaterialPropertyRepository {
	// Para definiciones de propiedades
	findPropertyDefinitionsByCategory(
		categoryId: string
	): Promise<MaterialPropertyDefinition[]>;
	createPropertyDefinition(
		definition: Omit<MaterialPropertyDefinition, "id">
	): Promise<MaterialPropertyDefinition>;
	updatePropertyDefinition(
		id: string,
		data: Partial<MaterialPropertyDefinition>
	): Promise<MaterialPropertyDefinition>;
	deletePropertyDefinition(id: string): Promise<boolean>;

	// Para valores de propiedades
	findPropertyValuesByMaterial(
		materialId: string
	): Promise<MaterialPropertyValue[]>;
	setPropertyValue(
		value: Omit<MaterialPropertyValue, "id" | "createdAt" | "updatedAt">
	): Promise<MaterialPropertyValue>;
	deletePropertyValue(id: string): Promise<boolean>;
	deletePropertyValuesByMaterial(materialId: string): Promise<boolean>;
}
