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

@Entity("user_template_usage")
export class UserTemplateUsageEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({name: "calculation_template_id"})
	calculationTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity)
	@JoinColumn({name: "calculation_template_id"})
	calculationTemplate: CalculationTemplateEntity;

	@Column({name: "project_id", nullable: true})
	projectId: string;

	@ManyToOne(() => ProjectEntity, {nullable: true})
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	@Column({name: "usage_count", type: "int", default: 1})
	usageCount: number; // Número de veces que el usuario ha usado esta plantilla

	@Column({name: "last_used_at"})
	lastUsedAt: Date; // Última vez que se usó

	@Column({name: "first_used_at"})
	firstUsedAt: Date; // Primera vez que se usó

	@Column({name: "is_favorite", default: false})
	isFavorite: boolean; // Si el usuario ha marcado esta plantilla como favorita

	@Column({name: "average_completion_time_ms", type: "int", nullable: true})
	averageCompletionTimeMs: number; // Tiempo promedio de llenado del formulario

	@Column({name: "average_calculation_time_ms", type: "int", nullable: true})
	averageCalculationTimeMs: number; // Tiempo promedio de ejecución del cálculo

	@Column({
		name: "user_rating",
		type: "decimal",
		precision: 3,
		scale: 2,
		nullable: true,
	})
	userRating: number; // Calificación dada por este usuario (0-5)

	@Column({name: "has_provided_feedback", default: false})
	hasProvidedFeedback: boolean; // Si el usuario ha proporcionado feedback

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}
