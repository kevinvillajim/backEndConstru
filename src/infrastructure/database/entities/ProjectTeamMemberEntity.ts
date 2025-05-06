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

export enum TeamMemberRole {
	PROJECT_MANAGER = "project_manager",
	ARCHITECT = "architect",
	ENGINEER = "engineer",
	FOREMAN = "foreman",
	WORKER = "worker",
	SPECIALIST = "specialist",
	OTHER = "other",
}

@Entity("project_team_members")
export class ProjectTeamMemberEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({
		type: "enum",
		enum: TeamMemberRole,
		default: TeamMemberRole.WORKER,
	})
	role: TeamMemberRole;

	@Column({type: "text", nullable: true})
	responsibilities: string;

	@Column({
		name: "hourly_rate",
		type: "decimal",
		precision: 10,
		scale: 2,
		nullable: true,
	})
	hourlyRate: number;

	@Column({name: "allocated_hours", type: "int", nullable: true})
	allocatedHours: number;

	@Column({name: "start_date", type: "date", nullable: true})
	startDate: Date;

	@Column({name: "end_date", type: "date", nullable: true})
	endDate: Date;

	@Column({name: "project_id"})
	projectId: string;

	@ManyToOne(() => ProjectEntity, (project) => project.teamMembers)
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
