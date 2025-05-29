// src/infrastructure/database/entities/PromotionRequestEntity.ts
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
import {UserEntity} from "./UserEntity";
import {UserCalculationTemplateEntity} from "./UserCalculationTemplateEntity";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";

export enum PromotionRequestStatus {
	PENDING = "pending",
	UNDER_REVIEW = "under_review",
	APPROVED = "approved",
	REJECTED = "rejected",
	IMPLEMENTED = "implemented",
}

export enum PromotionPriority {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	URGENT = "urgent",
}

@Entity("promotion_requests")
@Index("IDX_promotion_status", ["status"])
@Index("IDX_promotion_author", ["originalAuthorId"])
@Index("IDX_promotion_requested", ["createdAt"])
@Index("IDX_promotion_priority", ["priority", "status"])
@Index("IDX_promotion_template", ["personalTemplateId"])
export class PromotionRequestEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "personal_template_id"})
	personalTemplateId: string;

	@ManyToOne(() => UserCalculationTemplateEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "personal_template_id"})
	personalTemplate: UserCalculationTemplateEntity;

	@Column({name: "requested_by"})
	requestedBy: string;

	@ManyToOne(() => UserEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "requested_by"})
	requester: UserEntity;

	@Column({name: "original_author_id"})
	originalAuthorId: string;

	@ManyToOne(() => UserEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "original_author_id"})
	originalAuthor: UserEntity;

	@Column({type: "text"})
	reason: string;

	@Column({name: "detailed_justification", type: "text", nullable: true})
	detailedJustification: string;

	// Métricas que justifican la promoción
	@Column({type: "json"})
	metrics: {
		totalUsage: number;
		uniqueUsers: number;
		successRate: number;
		averageRating: number;
		rankingPosition: number;
		trendScore: number;
		growthRate: number;
		userFeedback: string[];
		technicalAssessment?: string;
	};

	@Column({
		type: "enum",
		enum: PromotionRequestStatus,
		default: PromotionRequestStatus.PENDING,
	})
	status: PromotionRequestStatus;

	@Column({
		type: "enum",
		enum: PromotionPriority,
		default: PromotionPriority.MEDIUM,
	})
	priority: PromotionPriority;

	@Column({name: "reviewed_by", nullable: true})
	reviewedBy: string;

	@ManyToOne(() => UserEntity, {nullable: true, onDelete: "SET NULL"})
	@JoinColumn({name: "reviewed_by"})
	reviewer: UserEntity;

	@Column({name: "reviewed_at", type: "timestamp", nullable: true})
	reviewedAt: Date;

	@Column({name: "review_comments", type: "text", nullable: true})
	reviewComments: string;

	@Column({name: "verified_template_id", nullable: true})
	verifiedTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity, {
		nullable: true,
		onDelete: "SET NULL",
	})
	@JoinColumn({name: "verified_template_id"})
	verifiedTemplate: CalculationTemplateEntity;

	@Column({name: "credit_to_author", default: true})
	creditToAuthor: boolean;

	@Column({name: "estimated_impact", type: "json", nullable: true})
	estimatedImpact: {
		potentialUsers: number;
		industryBenefit: string;
		technicalComplexity: "low" | "medium" | "high";
		maintenanceRequirement: "low" | "medium" | "high";
	};

	// Workflow de aprobación
	@Column({name: "approval_workflow", type: "json", nullable: true})
	approvalWorkflow: Array<{
		step: number;
		approver: string;
		status: "pending" | "approved" | "rejected";
		comments?: string;
		timestamp?: Date;
	}>;

	@Column({name: "implementation_notes", type: "text", nullable: true})
	implementationNotes: string;

	@Column({
		name: "quality_score",
		type: "decimal",
		precision: 3,
		scale: 2,
		nullable: true,
	})
	qualityScore: number; // Score de calidad técnica (0-10)

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
