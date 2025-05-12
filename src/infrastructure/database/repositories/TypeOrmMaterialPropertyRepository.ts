// src/infrastructure/database/repositories/TypeOrmMaterialPropertyRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {MaterialPropertyRepository} from "../../../domain/repositories/MaterialPropertyRepository";
import {MaterialPropertyDefinition} from "../../../domain/models/material/MaterialPropertyDefinition";
import {MaterialPropertyValue} from "../../../domain/models/material/MaterialPropertyValue";
import {MaterialPropertyDefinitionEntity} from "../entities/MaterialPropertyDefinitionEntity";
import {MaterialPropertyValueEntity} from "../entities/MaterialPropertyValueEntity";

export class TypeOrmMaterialPropertyRepository implements MaterialPropertyRepository {
	private definitionRepository: Repository<MaterialPropertyDefinitionEntity>;
	private valueRepository: Repository<MaterialPropertyValueEntity>;

	constructor() {
		this.definitionRepository = AppDataSource.getRepository(
			MaterialPropertyDefinitionEntity
		);
		this.valueRepository = AppDataSource.getRepository(
			MaterialPropertyValueEntity
		);
	}

	// Métodos para definiciones de propiedades
	async findPropertyDefinitionsByCategory(
		categoryId: string
	): Promise<MaterialPropertyDefinition[]> {
		const definitions = await this.definitionRepository.find({
			where: {categoryId},
			order: {displayOrder: "ASC"},
		});

		return definitions.map((def) => this.toDefinitionModel(def));
	}

	async createPropertyDefinition(
		definition: Omit<MaterialPropertyDefinition, "id">
	): Promise<MaterialPropertyDefinition> {
		const entity = this.definitionRepository.create(definition as any);
		const savedEntity = await this.definitionRepository.save(entity);

		return this.toDefinitionModel(savedEntity);
	}

	async updatePropertyDefinition(
		id: string,
		data: Partial<MaterialPropertyDefinition>
	): Promise<MaterialPropertyDefinition> {
		await this.definitionRepository.update(id, data);
		const updated = await this.definitionRepository.findOne({where: {id}});

		if (!updated) {
			throw new Error("Definición de propiedad no encontrada");
		}

		return this.toDefinitionModel(updated);
	}

	async deletePropertyDefinition(id: string): Promise<boolean> {
		const result = await this.definitionRepository.delete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	// Métodos para valores de propiedades
	async findPropertyValuesByMaterial(
		materialId: string
	): Promise<MaterialPropertyValue[]> {
		const values = await this.valueRepository.find({
			where: {materialId},
			relations: ["propertyDefinition"],
		});

		return values.map((val) => this.toValueModel(val));
	}

	async setPropertyValue(
		value: Omit<MaterialPropertyValue, "id" | "createdAt" | "updatedAt">
	): Promise<MaterialPropertyValue> {
		// Verificar si ya existe un valor para esta propiedad y este material
		let existingValue = await this.valueRepository.findOne({
			where: {
				materialId: value.materialId,
				propertyDefinitionId: value.propertyDefinitionId,
			},
		});

		if (existingValue) {
			// Actualizar valor existente
			Object.assign(existingValue, value);
			const updated = await this.valueRepository.save(existingValue);
			return this.toValueModel(updated);
		} else {
			// Crear nuevo valor
			const entity = this.valueRepository.create(value as any);
			const saved = await this.valueRepository.save(entity);
			return this.toValueModel(saved);
		}
	}

	async deletePropertyValue(id: string): Promise<boolean> {
		const result = await this.valueRepository.delete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	async deletePropertyValuesByMaterial(materialId: string): Promise<boolean> {
		const result = await this.valueRepository.delete({materialId});
		return result.affected !== undefined && result.affected > 0;
	}

	// Métodos de conversión
	private toDefinitionModel(
		entity: MaterialPropertyDefinitionEntity
	): MaterialPropertyDefinition {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			propertyType: entity.propertyType,
			isRequired: entity.isRequired,
			isFilterable: entity.isFilterable,
			isVisibleInList: entity.isVisibleInList,
			displayOrder: entity.displayOrder,
			options: entity.options,
			categoryId: entity.categoryId,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	private toValueModel(
		entity: MaterialPropertyValueEntity
	): MaterialPropertyValue {
		return {
			id: entity.id,
			materialId: entity.materialId,
			propertyDefinitionId: entity.propertyDefinitionId,
			textValue: entity.textValue,
			numberValue: entity.numberValue,
			booleanValue: entity.booleanValue,
			dateValue: entity.dateValue,
			arrayValue: entity.arrayValue,
			jsonValue: entity.jsonValue,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
