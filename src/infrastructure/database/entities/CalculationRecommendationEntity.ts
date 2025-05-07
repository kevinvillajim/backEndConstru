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
import {ProjectEntity} from "./ProjectEntity";

export enum RecommendationReason {
	SIMILAR_PROJECT = "similar_project",
	NEXT_LOGICAL_STEP = "next_logical_step",
	FREQUENTLY_USED_TOGETHER = "frequently_used_together",
	IMPROVED_VERSION = "improved_version",
	POPULAR_IN_PROFESSION = "popular_in_profession",
	USER_HISTORY = "user_history",
}

@Entity("calculation_recommendations")
export class CalculationRecommendationEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({name: "project_id", nullable: true})
	projectId: string;

	@ManyToOne(() => ProjectEntity, {nullable: true})
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	@Column({name: "recommended_template_id"})
	recommendedTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity)
	@JoinColumn({name: "recommended_template_id"})
	recommendedTemplate: CalculationTemplateEntity;

	@Column({name: "trigger_template_id", nullable: true})
	triggerTemplateId: string; // Plantilla que desencadenó la recomendación

	@ManyToOne(() => CalculationTemplateEntity, {nullable: true})
	@JoinColumn({name: "trigger_template_id"})
	triggerTemplate: CalculationTemplateEntity;

	@Column({
		type: "enum",
		enum: RecommendationReason,
	})
	reason: RecommendationReason;

	@Column({type: "decimal", precision: 5, scale: 4})
	score: number; // Puntuación de relevancia (0-1)

	@Column({name: "is_clicked", default: false})
	isClicked: boolean; // Si el usuario hizo clic en la recomendación

	@Column({name: "is_used", default: false})
	isUsed: boolean; // Si el usuario usó la plantilla recomendada

	@Column({name: "displayed_at"})
	displayedAt: Date;

	@Column({name: "clicked_at", nullable: true})
	clickedAt: Date;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}
