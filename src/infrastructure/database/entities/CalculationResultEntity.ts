import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {ProjectEntity} from "./ProjectEntity";
import {UserEntity} from "./UserEntity";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";

@Entity("calculation_results")
export class CalculationResultEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

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

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({type: "json"})
	inputParameters: {
		[key: string]: any;
	};

	@Column({type: "json"})
	results: {
		[key: string]: any;
	};

	@Column({name: "is_saved", default: false})
	isSaved: boolean; // Si el usuario guardó el resultado

	@Column({name: "name", nullable: true})
	name: string; // Nombre asignado por el usuario

	@Column({type: "text", nullable: true})
	notes: string; // Notas adicionales

	@Column({name: "execution_time_ms", type: "int", nullable: true})
	executionTimeMs: number; // Tiempo de ejecución para análisis de rendimiento

	@Column({name: "was_successful", default: true})
	wasSuccessful: boolean; // Si el cálculo se completó exitosamente

	@Column({name: "error_message", type: "text", nullable: true})
	errorMessage: string; // Mensaje de error si falló

	@Column({name: "used_in_project", default: false})
	usedInProject: boolean; // Si el resultado se utilizó en un proyecto real

	@Column({name: "led_to_material_order", default: false})
	ledToMaterialOrder: boolean; // Si generó un pedido de materiales

	@Column({name: "led_to_budget", default: false})
	ledToBudget: boolean; // Si generó un presupuesto

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
