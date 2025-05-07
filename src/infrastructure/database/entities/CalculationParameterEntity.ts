import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";

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

@Entity("calculation_parameters")
export class CalculationParameterEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text"})
	description: string;

	@Column({
		type: "enum",
		enum: ParameterDataType,
	})
	dataType: ParameterDataType;

	@Column({
		type: "enum",
		enum: ParameterScope,
		default: ParameterScope.INPUT,
	})
	scope: ParameterScope;

	@Column({name: "display_order", type: "int", default: 0})
	displayOrder: number; // Orden de visualización en la interfaz

	@Column({name: "is_required", default: true})
	isRequired: boolean;

	@Column({name: "default_value", type: "text", nullable: true})
	defaultValue: string; // Valor por defecto (serializado como JSON si es necesario)

	@Column({name: "min_value", type: "float", nullable: true})
	minValue: number; // Para validación de números

	@Column({name: "max_value", type: "float", nullable: true})
	maxValue: number; // Para validación de números

	@Column({name: "regex_pattern", nullable: true})
	regexPattern: string; // Para validación de strings

	@Column({name: "unit_of_measure", nullable: true})
	unitOfMeasure: string; // Unidad de medida (m, m², m³, kg, etc.)

	@Column({name: "allowed_values", type: "text", nullable: true})
	allowedValues: string; // Valores permitidos para enums (JSON array)

	@Column({name: "help_text", type: "text", nullable: true})
	helpText: string; // Texto de ayuda para el usuario

	@Column({name: "depends_on_parameters", type: "simple-array", nullable: true})
	dependsOnParameters: string[]; // IDs de parámetros de los que depende

	@Column({name: "formula", type: "text", nullable: true})
	formula: string; // Fórmula para cálculo automático (si scope es INTERNAL u OUTPUT)

	@Column({name: "calculation_template_id"})
	calculationTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity, (template) => template.parameters)
	@JoinColumn({name: "calculation_template_id"})
	calculationTemplate: CalculationTemplateEntity;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
