// src/infrastructure/database/entities/MaterialTemplateUsageLogEntity.ts
import { MaterialCalculationType } from "../../../domain/models/calculation/MaterialCalculationTemplate";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { MaterialCalculationResultEntity } from "./MaterialCalculationResultEntity";
import { UserEntity } from "./UserEntity";

@Entity("material_template_usage_logs")
export class MaterialTemplateUsageLogEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "template_id"})
	templateId: string;

	@Column({
		name: "template_type",
		type: "enum",
		enum: ["official", "user"],
	})
	templateType: string;

	@Column({
		name: "material_type",
		type: "enum",
		enum: Object.values(MaterialCalculationType),
	})
	materialType: string;

	@Column({name: "sub_category"})
	subCategory: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({name: "project_id", nullable: true})
	projectId: string;

	@Column({name: "calculation_result_id"})
	calculationResultId: string;

	@ManyToOne(() => MaterialCalculationResultEntity)
	@JoinColumn({name: "calculation_result_id"})
	calculationResult: MaterialCalculationResultEntity;

	@Column({name: "usage_date", type: "datetime"})
	usageDate: Date;

	@Column({name: "execution_time_ms", type: "int"})
	executionTimeMs: number;

	@Column({name: "was_successful", default: true})
	wasSuccessful: boolean;

	@Column({name: "total_materials_calculated", type: "int"})
	totalMaterialsCalculated: number;

	@Column({name: "waste_included", default: true})
	wasteIncluded: boolean;

	@Column({name: "regional_factors_applied", default: false})
	regionalFactorsApplied: boolean;

	@Column({
		name: "total_cost",
		type: "decimal",
		precision: 12,
		scale: 2,
		nullable: true,
	})
	totalCost: number;

	@Column({name: "ip_address", length: 45, nullable: true})
	ipAddress: string;

	@Column({name: "user_agent", type: "text", nullable: true})
	userAgent: string;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}
