// src/infrastructure/database/entities/UserTemplateUsageLogEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {UserCalculationTemplateEntity} from "./UserCalculationTemplateEntity";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";
import {CalculationResultEntity} from "./CalculationResultEntity";
import {ProjectEntity} from "./ProjectEntity";

export enum TemplateType {
	PERSONAL = "personal",
	VERIFIED = "verified",
}

@Entity("user_template_usage_logs")
@Index("IDX_usage_log_template", ["templateId", "templateType"])
@Index("IDX_usage_log_user", ["userId"])
@Index("IDX_usage_log_date", ["usageDate"])
@Index("IDX_usage_log_period", ["templateId", "templateType", "usageDate"])
@Index("IDX_usage_log_project", ["projectId"])
export class UserTemplateUsageLogEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "template_id"})
	templateId: string;

	@Column({
		name: "template_type",
		type: "enum",
		enum: TemplateType,
	})
	templateType: TemplateType;

	// Relaciones polimórficas - no podemos usar @ManyToOne aquí
	// pero mantenemos las referencias para queries

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({name: "project_id", nullable: true})
	projectId: string;

	@ManyToOne(() => ProjectEntity, {nullable: true, onDelete: "SET NULL"})
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	@Column({name: "calculation_result_id"})
	calculationResultId: string;

	@ManyToOne(() => CalculationResultEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "calculation_result_id"})
	calculationResult: CalculationResultEntity;

	@Column({
		name: "usage_date",
		type: "timestamp",
		default: () => "CURRENT_TIMESTAMP",
	})
	usageDate: Date;

	@Column({name: "execution_time_ms", type: "int"})
	executionTimeMs: number;

	@Column({name: "was_successful", default: true})
	wasSuccessful: boolean;

	@Column({name: "ip_address", length: 45, nullable: true})
	ipAddress: string;

	@Column({name: "user_agent", type: "text", nullable: true})
	userAgent: string;

	// Campos adicionales para analytics
	@Column({name: "input_parameters", type: "json", nullable: true})
	inputParameters: Record<string, any>;

	@Column({name: "output_results", type: "json", nullable: true})
	outputResults: Record<string, any>;

	@Column({name: "error_message", type: "text", nullable: true})
	errorMessage: string;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}
