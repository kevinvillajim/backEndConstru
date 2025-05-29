// src/infrastructure/database/entities/TemplateRankingEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
} from "typeorm";

export enum RankingPeriod {
	DAILY = "daily",
	WEEKLY = "weekly",
	MONTHLY = "monthly",
	YEARLY = "yearly",
}

export enum TemplateTypeRanking {
	PERSONAL = "personal",
	VERIFIED = "verified",
}

@Entity("template_rankings")
@Index("IDX_ranking_template", ["templateId", "templateType"])
@Index("IDX_ranking_period", ["period", "periodStart", "rankPosition"])
@Index("IDX_ranking_trend", ["period", "trendScore"])
@Index("IDX_ranking_period_active", ["period", "periodStart", "periodEnd"])
@Index(
	"IDX_ranking_unique_period",
	["templateId", "templateType", "period", "periodStart"],
	{unique: true}
)
export class TemplateRankingEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "template_id"})
	templateId: string;

	@Column({
		name: "template_type",
		type: "enum",
		enum: TemplateTypeRanking,
	})
	templateType: TemplateTypeRanking;

	@Column({
		type: "enum",
		enum: RankingPeriod,
	})
	period: RankingPeriod;

	@Column({name: "period_start", type: "date"})
	periodStart: Date;

	@Column({name: "period_end", type: "date"})
	periodEnd: Date;

	@Column({name: "usage_count", type: "int", default: 0})
	usageCount: number;

	@Column({name: "unique_users", type: "int", default: 0})
	uniqueUsers: number;

	@Column({
		name: "success_rate",
		type: "decimal",
		precision: 5,
		scale: 2,
		default: 0.0,
	})
	successRate: number;

	@Column({
		name: "average_execution_time",
		type: "decimal",
		precision: 10,
		scale: 2,
		default: 0.0,
	})
	averageExecutionTime: number;

	@Column({name: "rank_position", type: "int", default: 0})
	rankPosition: number;

	@Column({
		name: "trend_score",
		type: "decimal",
		precision: 10,
		scale: 4,
		default: 0.0,
	})
	trendScore: number;

	// Métricas adicionales para ranking
	@Column({
		name: "growth_rate",
		type: "decimal",
		precision: 5,
		scale: 2,
		default: 0.0,
	})
	growthRate: number; // % crecimiento vs período anterior

	@Column({
		name: "average_rating",
		type: "decimal",
		precision: 3,
		scale: 2,
		default: 0.0,
	})
	averageRating: number;

	@Column({name: "total_ratings", type: "int", default: 0})
	totalRatings: number;

	@Column({name: "favorite_count", type: "int", default: 0})
	favoriteCount: number;

	// Datos calculados para el score
	@Column({
		name: "weighted_score",
		type: "decimal",
		precision: 10,
		scale: 4,
		default: 0.0,
	})
	weightedScore: number;

	@Column({
		name: "velocity_score",
		type: "decimal",
		precision: 10,
		scale: 4,
		default: 0.0,
	})
	velocityScore: number; // Velocidad de adopción

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
