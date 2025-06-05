// src/infrastructure/database/entities/MaterialTemplateRankingEntity.ts
import { MaterialCalculationType } from "../../../domain/models/calculation/MaterialCalculationTemplate";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";

@Entity("material_template_rankings")
export class MaterialTemplateRankingEntity {
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

	@Column({
		type: "enum",
		enum: ["daily", "weekly", "monthly", "yearly"],
	})
	period: string;

	@Column({name: "period_start", type: "date"})
	periodStart: Date;

	@Column({name: "period_end", type: "date"})
	periodEnd: Date;

	@Column({name: "usage_count", default: 0})
	usageCount: number;

	@Column({name: "unique_users", default: 0})
	uniqueUsers: number;

	@Column({name: "unique_projects", default: 0})
	uniqueProjects: number;

	@Column({
		name: "success_rate",
		type: "decimal",
		precision: 5,
		scale: 2,
		default: 0,
	})
	successRate: number;

	@Column({
		name: "average_execution_time",
		type: "decimal",
		precision: 10,
		scale: 2,
		default: 0,
	})
	averageExecutionTime: number;

	@Column({
		name: "average_materials_count",
		type: "decimal",
		precision: 8,
		scale: 2,
		default: 0,
	})
	averageMaterialsCount: number;

	@Column({
		name: "total_cost_calculated",
		type: "decimal",
		precision: 15,
		scale: 2,
		default: 0,
	})
	totalCostCalculated: number;

	@Column({name: "rank_position", default: 0})
	rankPosition: number;

	@Column({
		name: "trend_score",
		type: "decimal",
		precision: 10,
		scale: 4,
		default: 0,
	})
	trendScore: number;

	@Column({
		name: "growth_rate",
		type: "decimal",
		precision: 8,
		scale: 4,
		default: 0,
	})
	growthRate: number; // % crecimiento vs período anterior

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
