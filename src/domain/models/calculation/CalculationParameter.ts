// src/domain/models/calculation/CalculationParameter.ts
export enum ParameterDataType {
	STRING = "string",
	NUMBER = "number",
	BOOLEAN = "boolean",
	DATE = "date",
	ENUM = "enum",
	OBJECT = "object",
	ARRAY = "array",
}

export enum ParameterScope {
	INPUT = "input", // Parámetro que el usuario debe ingresar
	INTERNAL = "internal", // Parámetro utilizado en cálculos intermedios
	OUTPUT = "output", // Resultado final para mostrar al usuario
}

export type CalculationParameter = {
	id: string;
	name: string;
	description: string;
	dataType: ParameterDataType;
	scope: ParameterScope;
	displayOrder: number; // Orden de visualización en la interfaz
	isRequired: boolean;
	defaultValue?: string; // Valor por defecto (serializado como JSON si es necesario)
	minValue?: number; // Para validación de números
	maxValue?: number; // Para validación de números
	regexPattern?: string; // Para validación de strings
	unitOfMeasure?: string; // Unidad de medida (m, m², m³, kg, etc.)
	allowedValues?: string; // Valores permitidos para enums (JSON array)
	helpText?: string; // Texto de ayuda para el usuario
	dependsOnParameters?: string[]; // IDs de parámetros de los que depende
	formula?: string; // Fórmula para cálculo automático (si scope es INTERNAL u OUTPUT)
	calculationTemplateId: string;
	createdAt: Date;
	updatedAt: Date;
};

export type CreateCalculationParameterDTO = Omit<
	CalculationParameter,
	"id" | "createdAt" | "updatedAt"
>;

export type UpdateCalculationParameterDTO = Partial<
	Omit<
		CalculationParameter,
		"id" | "calculationTemplateId" | "createdAt" | "updatedAt"
	>
>;
