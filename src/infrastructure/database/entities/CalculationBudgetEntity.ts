// src/infrastructure/database/entities/CalculationBudgetEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	OneToMany,
	JoinColumn,
	Index,
} from "typeorm";
import {ProjectEntity} from "./ProjectEntity";
import {UserEntity} from "./UserEntity";
import {CalculationResultEntity} from "./CalculationResultEntity";
import {BudgetTemplateEntity} from "./BudgetTemplateEntity";
import {BudgetLineItemEntity} from "./BudgetLineItemEntity";

export enum CalculationBudgetStatus {
	DRAFT = "draft",
	REVIEW = "review",
	APPROVED = "approved",
	REVISED = "revised",
	FINAL = "final",
	ARCHIVED = "archived",
}

export enum BudgetType {
	MATERIALS_ONLY = "materials_only",
	COMPLETE_PROJECT = "complete_project",
	LABOR_MATERIALS = "labor_materials",
	PROFESSIONAL_ESTIMATE = "professional_estimate",
}

@Entity("calculation_budgets")
@Index("IDX_calc_budget_project_status", ["projectId", "status"])
@Index("IDX_calc_budget_template", ["budgetTemplateId"])
@Index("IDX_calc_budget_user_created", ["userId", "createdAt"])
export class CalculationBudgetEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text", nullable: true})
	description: string;

	@Column({
		type: "enum",
		enum: CalculationBudgetStatus,
		default: CalculationBudgetStatus.DRAFT,
	})
	status: CalculationBudgetStatus;

	@Column({
		type: "enum",
		enum: BudgetType,
		default: BudgetType.MATERIALS_ONLY,
	})
	budgetType: BudgetType;

	@Column({name: "version", type: "int", default: 1})
	version: number;

	@Column({name: "parent_budget_id", nullable: true})
	parentBudgetId: string;

	// Relaciones con entidades principales
	@Column({name: "project_id"})
	projectId: string;

	@ManyToOne(() => ProjectEntity)
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	// ✅ AGREGADO: Campo projectType
	@Column({name: "project_type", default: "construction"})
	projectType: string;

	// ✅ AGREGADO: Campo customFields
	@Column({name: "custom_fields", type: "json", nullable: true})
	customFields: Record<string, any>;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({name: "calculation_result_id", nullable: true})
	calculationResultId: string;

	@ManyToOne(() => CalculationResultEntity, {nullable: true})
	@JoinColumn({name: "calculation_result_id"})
	calculationResult: CalculationResultEntity;

	@Column({name: "budget_template_id", nullable: true})
	budgetTemplateId: string;

	@ManyToOne(() => BudgetTemplateEntity, {nullable: true})
	@JoinColumn({name: "budget_template_id"})
	budgetTemplate: BudgetTemplateEntity;

	// Totales calculados
	@Column({
		name: "materials_subtotal",
		type: "decimal",
		precision: 12,
		scale: 2,
		default: 0,
	})
	materialsSubtotal: number;

	@Column({
		name: "labor_subtotal",
		type: "decimal",
		precision: 12,
		scale: 2,
		default: 0,
	})
	laborSubtotal: number;

	@Column({
		name: "professional_costs_total",
		type: "decimal",
		precision: 12,
		scale: 2,
		default: 0,
	})
	professionalCostsTotal: number;

	@Column({
		name: "indirect_costs",
		type: "decimal",
		precision: 12,
		scale: 2,
		default: 0,
	})
	indirectCosts: number;

	@Column({
		name: "contingency_percentage",
		type: "decimal",
		precision: 5,
		scale: 2,
		default: 5,
	})
	contingencyPercentage: number;

	@Column({
		name: "contingency_amount",
		type: "decimal",
		precision: 12,
		scale: 2,
		default: 0,
	})
	contingencyAmount: number;

	@Column({
		name: "subtotal",
		type: "decimal",
		precision: 12,
		scale: 2,
		default: 0,
	})
	subtotal: number;

	@Column({
		name: "tax_percentage",
		type: "decimal",
		precision: 5,
		scale: 2,
		default: 15,
	})
	taxPercentage: number;

	@Column({
		name: "tax_amount",
		type: "decimal",
		precision: 12,
		scale: 2,
		default: 0,
	})
	taxAmount: number;

	@Column({name: "total", type: "decimal", precision: 12, scale: 2, default: 0})
	total: number;

	// Configuración regional y personalización
	@Column({name: "geographical_zone", default: "costa"})
	geographicalZone: string;

	@Column({name: "currency", default: "USD"})
	currency: string;

	@Column({
		name: "exchange_rate",
		type: "decimal",
		precision: 10,
		scale: 4,
		default: 1,
	})
	exchangeRate: number;

	// Metadata de personalización
	@Column({type: "json", nullable: true})
	customization: {
		companyName?: string;
		companyLogo?: string;
		professionalName?: string;
		professionalTitle?: string;
		professionalRegistration?: string;
		clientInfo?: any;
		headerImage?: string;
		footerText?: string;
		colors?: {
			primary?: string;
			secondary?: string;
		};
	};

	// Configuración de exportación
	@Column({type: "json", nullable: true})
	exportSettings: {
		includeCalculationDetails?: boolean;
		includeMaterialSpecs?: boolean;
		includeNECReferences?: boolean;
		showPriceBreakdown?: boolean;
		showLaborDetails?: boolean;
		language?: "es" | "en";
	};

	// Tracking y auditoría
	@Column({name: "last_calculated_at", nullable: true})
	lastCalculatedAt: Date;

	@Column({name: "is_template_budget", default: false})
	isTemplateBudget: boolean;

	@Column({name: "approved_by", nullable: true})
	approvedBy: string;

	@Column({name: "approved_at", nullable: true})
	approvedAt: Date;

	// Relaciones
	@OneToMany(() => BudgetLineItemEntity, (item) => item.calculationBudget)
	lineItems: BudgetLineItemEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
