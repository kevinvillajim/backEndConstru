// src/infrastructure/database/entities/TemplateSuggestionEntity.ts
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
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";

export enum SuggestionType {
	IMPROVEMENT = "improvement",
	CORRECTION = "correction",
	ADDITION = "addition",
	OTHER = "other",
}

export enum SuggestionPriority {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
}

export enum SuggestionStatus {
	PENDING = "pending",
	APPROVED = "approved",
	REJECTED = "rejected",
	IMPLEMENTED = "implemented",
}

@Entity("template_suggestions")
@Index("IDX_template_suggestions_template", ["templateId"])
@Index("IDX_template_suggestions_user", ["userId"])
@Index("IDX_template_suggestions_status", ["status"])
export class TemplateSuggestionEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "template_id"})
	templateId: string;

	@Column({name: "user_id"})
	userId: string;

	@Column({
		type: "enum",
		enum: SuggestionType,
		default: SuggestionType.IMPROVEMENT,
		name: "suggestion_type",
	})
	suggestionType: SuggestionType;

	@Column({length: 255})
	title: string;

	@Column({type: "text"})
	description: string;

	@Column({type: "text", nullable: true, name: "current_value"})
	currentValue: string;

	@Column({type: "text", nullable: true, name: "proposed_value"})
	proposedValue: string;

	@Column({type: "text", nullable: true})
	justification: string;

	@Column({
		type: "enum",
		enum: SuggestionPriority,
		default: SuggestionPriority.MEDIUM,
	})
	priority: SuggestionPriority;

	@Column({name: "affects_accuracy", default: false})
	affectsAccuracy: boolean;

	@Column({name: "affects_compliance", default: false})
	affectsCompliance: boolean;

	@Column({type: "json", nullable: true})
	references: any[];

	@Column({name: "contact_for_followup", default: false})
	contactForFollowup: boolean;

	@Column({
		type: "enum",
		enum: SuggestionStatus,
		default: SuggestionStatus.PENDING,
	})
	status: SuggestionStatus;

	@Column({name: "reviewed_by", nullable: true})
	reviewedBy: string;

	@Column({name: "reviewed_at", nullable: true})
	reviewedAt: Date;

	@ManyToOne(() => CalculationTemplateEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "template_id"})
	template: CalculationTemplateEntity;

	@ManyToOne(() => UserEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@ManyToOne(() => UserEntity, {nullable: true, onDelete: "SET NULL"})
	@JoinColumn({name: "reviewed_by"})
	reviewer: UserEntity;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
