// src/domain/models/material/MaterialPropertyDefinition.ts
export enum PropertyType {
	TEXT = "text",
	NUMBER = "number",
	BOOLEAN = "boolean",
	DATE = "date",
	SELECT = "select",
	MULTISELECT = "multiselect",
	COLOR = "color",
	DIMENSION = "dimension",
}

export interface MaterialPropertyDefinition {
	id: string;
	name: string;
	description?: string;
	propertyType: PropertyType;
	isRequired: boolean;
	isFilterable: boolean;
	isVisibleInList: boolean;
	displayOrder: number;
	options?: {
		values?: string[];
		min?: number;
		max?: number;
		step?: number;
		unit?: string;
		default?: any;
	};
	categoryId: string;
	createdAt: Date;
	updatedAt: Date;
}
