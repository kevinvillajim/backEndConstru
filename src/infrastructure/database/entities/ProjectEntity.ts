import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	DeleteDateColumn,
	ManyToOne,
	OneToMany,
	JoinColumn,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {PhaseEntity} from "./PhaseEntity";
import {ProjectDocumentEntity} from "./ProjectDocumentEntity";
import {ProjectBudgetEntity} from "./ProjectBudgetEntity";
import {ProjectTeamMemberEntity} from "./ProjectTeamMemberEntity";

export enum ProjectStatus {
	PLANNING = "planning",
	IN_PROGRESS = "in_progress",
	ON_HOLD = "on_hold",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
}

export enum ProjectType {
	RESIDENTIAL = "residential",
	COMMERCIAL = "commercial",
	INDUSTRIAL = "industrial",
	INFRASTRUCTURE = "infrastructure",
	REMODELING = "remodeling",
	MAINTENANCE = "maintenance",
	OTHER = "other",
}

@Entity("projects")
export class ProjectEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text", nullable: true})
	description: string;

	@Column({
		type: "enum",
		enum: ProjectStatus,
		default: ProjectStatus.PLANNING,
	})
	status: ProjectStatus;

	@Column({
		type: "enum",
		enum: ProjectType,
		nullable: true,
	})
	type: ProjectType;

	@Column({name: "client_name", nullable: true})
	clientName: string;

	@Column({name: "client_email", nullable: true})
	clientEmail: string;

	@Column({name: "client_phone", nullable: true})
	clientPhone: string;

	@Column({name: "start_date", type: "date"})
	startDate: Date;

	@Column({name: "end_date", type: "date", nullable: true})
	endDate: Date;

	@Column({name: "estimated_completion_date", type: "date", nullable: true})
	estimatedCompletionDate: Date;

	@Column({
		name: "completion_percentage",
		type: "decimal",
		precision: 5,
		scale: 2,
		default: 0,
	})
	completionPercentage: number;

	@Column({
		name: "total_area",
		type: "decimal",
		precision: 10,
		scale: 2,
		nullable: true,
		comment: "Área total en metros cuadrados",
	})
	totalArea: number;

	@Column({
		name: "construction_area",
		type: "decimal",
		precision: 10,
		scale: 2,
		nullable: true,
		comment: "Área de construcción en metros cuadrados",
	})
	constructionArea: number;

	@Column({
		name: "floors",
		type: "int",
		nullable: true,
		comment: "Número de pisos",
	})
	floors: number;

	@Column({type: "json", nullable: true, comment: "Coordenadas de ubicación"})
	location: {
		latitude: number;
		longitude: number;
		address: string;
		city: string;
		province: string;
		country: string;
	};

	@Column({name: "is_active", default: true})
	isActive: boolean;

	@Column({type: "json", nullable: true, comment: "Permisos y licencias"})
	permits: {
		name: string;
		number: string;
		issuedBy: string;
		issuedDate: Date;
		expiryDate?: Date;
		status: string;
	}[];

	@Column({
		type: "json",
		nullable: true,
		comment: "Etiquetas para categorización",
	})
	tags: string[];

	@Column({
		type: "decimal",
		precision: 12,
		scale: 2,
		nullable: true,
		comment: "Presupuesto total estimado",
	})
	estimatedBudget: number;

	@Column({
		type: "decimal",
		precision: 12,
		scale: 2,
		nullable: true,
		comment: "Costo total actual",
	})
	currentCost: number;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@OneToMany(() => PhaseEntity, (phase) => phase.project)
	phases: PhaseEntity[];

	@OneToMany(() => ProjectDocumentEntity, (document) => document.project)
	documents: ProjectDocumentEntity[];

	@OneToMany(() => ProjectBudgetEntity, (budget) => budget.project)
	budgets: ProjectBudgetEntity[];

	@OneToMany(() => ProjectTeamMemberEntity, (member) => member.project)
	teamMembers: ProjectTeamMemberEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;

	@DeleteDateColumn({name: "deleted_at", nullable: true})
	deletedAt: Date;
}
