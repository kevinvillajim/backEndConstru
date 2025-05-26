// src/infrastructure/database/entities/TrendingCalculationEntity.ts
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
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";

export enum TrendingPeriod {
	DAILY = "daily",
	WEEKLY = "weekly",
	MONTHLY = "monthly",
}

@Entity("trending_calculations")
@Index("IDX_trending_calculations_period", ["period"])
@Index("IDX_trending_calculations_period_rank", ["period", "rankPosition"])
@Index("IDX_trending_calculations_template", ["templateId"])
export class TrendingCalculationEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "template_id"})
	templateId: string;

	@Column({
		type: "enum",
		enum: TrendingPeriod,
		default: TrendingPeriod.WEEKLY,
	})
	period: TrendingPeriod;

	@Column({name: "usage_count", default: 0})
	usageCount: number;

	@Column({
		type: "decimal",
		precision: 10,
		scale: 4,
		default: 0,
		name: "trend_score",
	})
	trendScore: number;

	@Column({name: "rank_position", nullable: true})
	rankPosition: number;

	@Column({name: "period_start"})
	periodStart: Date;

	@Column({name: "period_end"})
	periodEnd: Date;

	@ManyToOne(() => CalculationTemplateEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "template_id"})
	template: CalculationTemplateEntity;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
