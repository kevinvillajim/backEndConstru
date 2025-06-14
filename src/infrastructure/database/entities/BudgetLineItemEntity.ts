// src/infrastructure/database/entities/BudgetLineItemEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import {CalculationBudgetEntity} from "./CalculationBudgetEntity";
import {MaterialEntity} from "./MaterialEntity";

export enum ItemType {
	MATERIAL = "material",
	LABOR = "labor",
	EQUIPMENT = "equipment",
	SUBCONTRACT = "subcontract",
	OTHER = "other",
}

export enum ItemSource {
	CALCULATION = "calculation",
	MANUAL = "manual",
	TEMPLATE = "template",
	IMPORTED = "imported",
}

export enum LaborType {
	GENERAL = "general",
	SPECIALIZED = "specialized",
	TECHNICAL = "technical",
	SUPERVISION = "supervision",
	SKILLED = "skilled",
	UNSKILLED = "unskilled",
}

@Entity("budget_line_items")
@Index("IDX_budget_line_item_budget", ["calculationBudgetId"])
@Index("IDX_budget_line_item_material", ["materialId"])
@Index("IDX_budget_line_item_type_source", ["itemType", "source"])
export class BudgetLineItemEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	description: string;

	@Column({type: "text", nullable: true})
	specifications: string;

	@Column({
		type: "enum",
		enum: ItemType,
		default: ItemType.MATERIAL,
	})
	itemType: ItemType;

	@Column({
		type: "enum",
		enum: ItemSource,
		default: ItemSource.MANUAL,
	})
	source: ItemSource;

	// ✅ AGREGADO: Campo laborType
	@Column({
		type: "enum",
		enum: LaborType,
		nullable: true,
		name: "labor_type",
	})
	laborType: LaborType;

	// Relaciones
	@Column({name: "calculation_budget_id"})
	calculationBudgetId: string;

	@ManyToOne(() => CalculationBudgetEntity, (budget) => budget.lineItems)
	@JoinColumn({name: "calculation_budget_id"})
	calculationBudget: CalculationBudgetEntity;

	@Column({name: "source_calculation_id", nullable: true})
	sourceCalculationId: string;

	@Column({name: "calculation_parameter_key", nullable: true})
	calculationParameterKey: string;

	@Column({name: "material_id", nullable: true})
	materialId: string;

	@ManyToOne(() => MaterialEntity, {nullable: true})
	@JoinColumn({name: "material_id"})
	material: MaterialEntity;

	// Cantidades y precios
	@Column({type: "decimal", precision: 10, scale: 4, default: 0})
	quantity: number;

	@Column({name: "unit_of_measure", default: "unidad"})
	unitOfMeasure: string;

	@Column({
		name: "unit_price",
		type: "decimal",
		precision: 10,
		scale: 4,
		default: 0,
	})
	unitPrice: number;

	@Column({
		name: "waste_percentage",
		type: "decimal",
		precision: 5,
		scale: 2,
		default: 0,
	})
	wastePercentage: number;

	@Column({
		name: "final_quantity",
		type: "decimal",
		precision: 10,
		scale: 4,
		default: 0,
	})
	finalQuantity: number;

	@Column({type: "decimal", precision: 12, scale: 2, default: 0})
	subtotal: number;

	// Categorización
	@Column({nullable: true})
	category: string;

	@Column({nullable: true})
	subcategory: string;

	@Column({nullable: true})
	chapter: string;

	@Column({name: "cost_code", nullable: true})
	costCode: string;

	// Factores de ajuste
	@Column({
		name: "regional_factor",
		type: "decimal",
		precision: 5,
		scale: 3,
		default: 1,
	})
	regionalFactor: number;

	@Column({
		name: "difficulty_factor",
		type: "decimal",
		precision: 5,
		scale: 3,
		default: 1,
	})
	difficultyFactor: number;

	// Referencias técnicas
	@Column({name: "nec_reference", nullable: true})
	necReference: string;

	// Información de precios
	@Column({name: "price_date", nullable: true})
	priceDate: Date;

	@Column({name: "price_source", nullable: true})
	priceSource: string;

	@Column({name: "price_validity_days", type: "int", default: 30})
	priceValidityDays: number;

	// Metadata adicional
	@Column({type: "json", nullable: true})
	metadata: Record<string, any>;

	// Configuración de visualización
	@Column({name: "display_order", type: "int", default: 0})
	displayOrder: number;

	@Column({name: "is_optional", default: false})
	isOptional: boolean;

	@Column({name: "is_alternate", default: false})
	isAlternate: boolean;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
