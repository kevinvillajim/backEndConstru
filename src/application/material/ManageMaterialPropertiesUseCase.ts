// src/application/material/ManageMaterialPropertiesUseCase.ts
import {MaterialRepository} from "../../domain/repositories/MaterialRepository";
import {MaterialPropertyRepository} from "../../domain/repositories/MaterialPropertyRepository";
import {
	MaterialPropertyDefinition,
	PropertyType,
} from "../../domain/models/material/MaterialPropertyDefinition";

export class ManageMaterialPropertiesUseCase {
	constructor(
		private materialRepository: MaterialRepository,
		private propertyRepository: MaterialPropertyRepository
	) {}

	/**
	 * Obtiene las definiciones de propiedades de una categoría
	 */
	async getPropertyDefinitions(
		categoryId: string
	): Promise<MaterialPropertyDefinition[]> {
		return this.propertyRepository.findPropertyDefinitionsByCategory(
			categoryId
		);
	}

	/**
	 * Crea una nueva definición de propiedad para una categoría
	 */
	async createPropertyDefinition(
		definition: Omit<
			MaterialPropertyDefinition,
			"id" | "createdAt" | "updatedAt"
		>
	): Promise<MaterialPropertyDefinition> {
		// Validar que el tipo de propiedad sea válido
		if (!Object.values(PropertyType).includes(definition.propertyType)) {
			throw new Error("Tipo de propiedad inválido");
		}

		// Validar que las opciones sean coherentes con el tipo
		this.validatePropertyOptions(definition.propertyType, definition.options);

		const definitionWithDates = {
			...definition,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		return this.propertyRepository.createPropertyDefinition(definitionWithDates);
	}

	/**
	 * Actualiza una definición de propiedad
	 */
	async updatePropertyDefinition(
		id: string,
		data: Partial<MaterialPropertyDefinition>
	): Promise<MaterialPropertyDefinition> {
		// Si se actualiza el tipo, validar que las opciones sean coherentes
		if (data.propertyType && data.options) {
			this.validatePropertyOptions(data.propertyType, data.options);
		}

		return this.propertyRepository.updatePropertyDefinition(id, data);
	}

	/**
	 * Elimina una definición de propiedad
	 */
	async deletePropertyDefinition(id: string): Promise<boolean> {
		return this.propertyRepository.deletePropertyDefinition(id);
	}

	/**
	 * Asigna valores de propiedades a un material
	 */
	async setMaterialProperties(
		materialId: string,
		properties: Array<{
			propertyDefinitionId: string;
			value: any;
		}>
	): Promise<boolean> {
		// Verificar que el material existe
		const material = await this.materialRepository.findById(materialId);
		if (!material) {
			throw new Error("Material no encontrado");
		}

		// Obtener las definiciones de propiedades para validar los valores
		const definitionIds = properties.map((p) => p.propertyDefinitionId);
		const definitions = await Promise.all(
			definitionIds.map((id) => this.getPropertyDefinition(id))
		);

		// Procesar cada propiedad
		for (let i = 0; i < properties.length; i++) {
			const property = properties[i];
			const definition = definitions[i];

			if (!definition) {
				throw new Error(
					`Definición de propiedad no encontrada: ${property.propertyDefinitionId}`
				);
			}

			// Validar el valor según el tipo de propiedad
			const validatedValue = this.validateAndFormatPropertyValue(
				definition.propertyType,
				property.value,
				definition.options
			);

			// Crear el objeto de valor de propiedad
			const propertyValue: any = {
				materialId,
				propertyDefinitionId: property.propertyDefinitionId,
			};

			// Asignar el valor al campo correspondiente según el tipo
			switch (definition.propertyType) {
				case PropertyType.TEXT:
				case PropertyType.COLOR:
				case PropertyType.SELECT:
					propertyValue.textValue = validatedValue;
					break;
				case PropertyType.NUMBER:
					propertyValue.numberValue = validatedValue;
					break;
				case PropertyType.BOOLEAN:
					propertyValue.booleanValue = validatedValue;
					break;
				case PropertyType.DATE:
					propertyValue.dateValue = validatedValue;
					break;
				case PropertyType.MULTISELECT:
					propertyValue.arrayValue = validatedValue;
					break;
				case PropertyType.DIMENSION:
					propertyValue.jsonValue = validatedValue;
					break;
			}

			// Guardar el valor
			await this.propertyRepository.setPropertyValue(propertyValue);
		}

		return true;
	}

	/**
	 * Obtiene los valores de propiedades de un material
	 */
	async getMaterialProperties(materialId: string): Promise<
		Array<{
			definition: MaterialPropertyDefinition;
			value: any;
		}>
	> {
		// Verificar que el material existe
		const material = await this.materialRepository.findById(materialId);
		if (!material) {
			throw new Error("Material no encontrado");
		}

		// Obtener los valores de propiedades
		const propertyValues =
			await this.propertyRepository.findPropertyValuesByMaterial(materialId);

		// Obtener las definiciones
		const definitionIds = [
			...new Set(propertyValues.map((v) => v.propertyDefinitionId)),
		];
		const definitions = await Promise.all(
			definitionIds.map((id) => this.getPropertyDefinition(id))
		);

		const definitionsMap = definitions.reduce(
			(map, def) => {
				if (def) map[def.id] = def;
				return map;
			},
			{} as Record<string, MaterialPropertyDefinition>
		);

		// Formatear los resultados
		return propertyValues.map((value) => {
			const definition = definitionsMap[value.propertyDefinitionId];

			// Obtener el valor según el tipo
			let formattedValue: any;
			switch (definition.propertyType) {
				case PropertyType.TEXT:
				case PropertyType.COLOR:
				case PropertyType.SELECT:
					formattedValue = value.textValue;
					break;
				case PropertyType.NUMBER:
					formattedValue = value.numberValue;
					break;
				case PropertyType.BOOLEAN:
					formattedValue = value.booleanValue;
					break;
				case PropertyType.DATE:
					formattedValue = value.dateValue;
					break;
				case PropertyType.MULTISELECT:
					formattedValue = value.arrayValue;
					break;
				case PropertyType.DIMENSION:
					formattedValue = value.jsonValue;
					break;
			}

			return {
				definition,
				value: formattedValue,
			};
		});
	}

	/**
	 * Elimina los valores de propiedades de un material
	 */
	async clearMaterialProperties(materialId: string): Promise<boolean> {
		return this.propertyRepository.deletePropertyValuesByMaterial(materialId);
	}

	// Métodos auxiliares privados
	private async getPropertyDefinition(
		id: string
	): Promise<MaterialPropertyDefinition | null> {
		// En una implementación real, esto podría estar en el repositorio
		const defs =
			await this.propertyRepository.findPropertyDefinitionsByCategory("any");
		return defs.find((d) => d.id === id) || null;
	}

	private validatePropertyOptions(type: PropertyType, options?: any): void {
		if (!options) return;

		switch (type) {
			case PropertyType.SELECT:
			case PropertyType.MULTISELECT:
				if (
					!options.values ||
					!Array.isArray(options.values) ||
					options.values.length === 0
				) {
					throw new Error(
						`Las propiedades de tipo ${type} requieren un array de valores válido`
					);
				}
				break;
			case PropertyType.NUMBER:
				if (
					options.min !== undefined &&
					options.max !== undefined &&
					options.min > options.max
				) {
					throw new Error("El valor mínimo no puede ser mayor que el máximo");
				}
				break;
			case PropertyType.DIMENSION:
				// Validación específica para dimensiones
				break;
		}
	}

	private validateAndFormatPropertyValue(
		type: PropertyType,
		value: any,
		options?: any
	): any {
		if (value === null || value === undefined) {
			return null;
		}

		switch (type) {
			case PropertyType.TEXT:
			case PropertyType.COLOR:
				return String(value);

			case PropertyType.NUMBER:
				const num = Number(value);
				if (isNaN(num)) {
					throw new Error("Valor numérico inválido");
				}
				if (options) {
					if (options.min !== undefined && num < options.min) {
						throw new Error(`El valor debe ser mayor o igual a ${options.min}`);
					}
					if (options.max !== undefined && num > options.max) {
						throw new Error(`El valor debe ser menor o igual a ${options.max}`);
					}
				}
				return num;

			case PropertyType.BOOLEAN:
				return Boolean(value);

			case PropertyType.DATE:
				const date = new Date(value);
				if (isNaN(date.getTime())) {
					throw new Error("Fecha inválida");
				}
				return date;

			case PropertyType.SELECT:
				if (options && options.values && !options.values.includes(value)) {
					throw new Error(
						`Valor inválido. Debe ser uno de: ${options.values.join(", ")}`
					);
				}
				return String(value);

			case PropertyType.MULTISELECT:
				if (!Array.isArray(value)) {
					throw new Error("Debe ser un array de valores");
				}
				if (options && options.values) {
					for (const val of value) {
						if (!options.values.includes(val)) {
							throw new Error(
								`Valor inválido: ${val}. Debe ser uno de: ${options.values.join(", ")}`
							);
						}
					}
				}
				return value.map(String);

			case PropertyType.DIMENSION:
				// Validación para objeto de dimensiones
				if (typeof value !== "object") {
					throw new Error("Las dimensiones deben ser un objeto");
				}
				return value;
		}
	}
}
