import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	OneToMany,
} from "typeorm";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";
import {UserEntity} from "./UserEntity";
import {CalculationFeedbackEntity} from "./CalculationFeedbackEntity";

export enum ImprovementStatus {
	PROPOSED = "proposed",
	UNDER_REVIEW = "under_review",
	APPROVED = "approved",
	IMPLEMENTED = "implemented",
	REJECTED = "rejected",
}

@Entity("calculation_improvements")
export class CalculationImprovementEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "original_template_id"})
	originalTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity)
	@JoinColumn({name: "original_template_id"})
	originalTemplate: CalculationTemplateEntity;

	@Column({name: "improved_template_id", nullable: true})
	improvedTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity, {nullable: true})
	@JoinColumn({name: "improved_template_id"})
	improvedTemplate: CalculationTemplateEntity;

	@Column()
	title: string;

	@Column({type: "text"})
	description: string;

	@Column({type: "text"})
	proposedChanges: string;

	@Column({
		type: "enum",
		enum: ImprovementStatus,
		default: ImprovementStatus.PROPOSED,
	})
	status: ImprovementStatus;

	@Column({name: "proposed_by"})
	proposedBy: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "proposed_by"})
	proposer: UserEntity;

	@Column({name: "reviewed_by", nullable: true})
	reviewedBy: string;

	@ManyToOne(() => UserEntity, {nullable: true})
	@JoinColumn({name: "reviewed_by"})
	reviewer: UserEntity;

	@Column({name: "feedback_ids", type: "simple-array", nullable: true})
	feedbackIds: string[]; // IDs de los feedback que inspiraron esta mejora

	@OneToMany(
		() => CalculationFeedbackEntity,
		(feedback) => feedback.appliedToTemplate
	)
	relatedFeedback: CalculationFeedbackEntity[];

	@Column({name: "is_data_driven", default: false})
	isDataDriven: boolean; // Si se basa en análisis de datos de uso

	@Column({type: "json", nullable: true})
	dataAnalysis: {
		usagePatterns?: any;
		commonErrors?: any;
		successRate?: number;
		comparisonResults?: any;
	}; // Datos de análisis que respaldan la mejora

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
