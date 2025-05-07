import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";
import {CalculationResultEntity} from "./CalculationResultEntity";

export enum FeedbackType {
	RATING = "rating",
	IMPROVEMENT_SUGGESTION = "improvement_suggestion",
	ERROR_REPORT = "error_report",
	COMMENT = "comment",
	PARAMETER_SUGGESTION = "parameter_suggestion",
}

@Entity("calculation_feedback")
export class CalculationFeedbackEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "calculation_template_id"})
	calculationTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity)
	@JoinColumn({name: "calculation_template_id"})
	calculationTemplate: CalculationTemplateEntity;

	@Column({name: "calculation_result_id", nullable: true})
	calculationResultId: string;

	@ManyToOne(() => CalculationResultEntity, {nullable: true})
	@JoinColumn({name: "calculation_result_id"})
	calculationResult: CalculationResultEntity;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({
		type: "enum",
		enum: FeedbackType,
	})
	type: FeedbackType;

	@Column({
		name: "rating",
		type: "decimal",
		precision: 3,
		scale: 2,
		nullable: true,
	})
	rating: number; // Para feedback tipo RATING (0-5)

	@Column({type: "text", nullable: true})
	comment: string; // Comentario o sugerencia

	@Column({type: "json", nullable: true})
	suggestionDetails: {
		formulaChange?: string;
		parameterChanges?: {
			paramId: string;
			suggestion: string;
		}[];
		newParameter?: {
			name: string;
			description?: string;
			type: string;
		};
	}; // Detalles específicos de la sugerencia

	@Column({name: "is_applied", default: false})
	isApplied: boolean; // Si la sugerencia fue aplicada a una nueva versión

	@Column({name: "applied_to_template_id", nullable: true})
	appliedToTemplateId: string; // ID de la plantilla que incorporó esta sugerencia

	@ManyToOne(() => CalculationTemplateEntity, {nullable: true})
	@JoinColumn({name: "applied_to_template_id"})
	appliedToTemplate: CalculationTemplateEntity;

	@Column({name: "is_reviewed", default: false})
	isReviewed: boolean; // Si un administrador revisó el feedback

	@Column({name: "reviewed_by", nullable: true})
	reviewedBy: string;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}
