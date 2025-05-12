// src/domain/models/material/MaterialPropertyValue.ts
export interface MaterialPropertyValue {
	id: string;
	materialId: string;
	propertyDefinitionId: string;
	textValue?: string;
	numberValue?: number;
	booleanValue?: boolean;
	dateValue?: Date;
	arrayValue?: string[];
	jsonValue?: any;
	createdAt: Date;
	updatedAt: Date;
}
