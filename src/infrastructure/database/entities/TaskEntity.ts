import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	DeleteDateColumn,
	ManyToOne,
	OneToMany,
} from "typeorm";
import {PhaseEntity} from "./PhaseEntity";
import {UserEntity} from "./UserEntity";
import {MaterialRequestEntity} from "./MaterialRequestEntity";

enum TaskStatus {
	PENDING = "pending",
	IN_PROGRESS = "in_progress",
	COMPLETED = "completed",
	BLOCKED = "blocked",
}

@Entity("tasks")
export class TaskEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text", nullable: true})
	description: string;

	@Column({
		type: "enum",
		enum: TaskStatus,
		default: TaskStatus.PENDING,
	})
	status: TaskStatus;

	@Column({name: "start_date", type: "date", nullable: true})
	startDate: Date;

	@Column({name: "end_date", type: "date", nullable: true})
	endDate: Date;

	@Column({name: "phase_id"})
	phaseId: string;

	@ManyToOne(() => PhaseEntity, (phase) => phase.tasks)
	phase: PhaseEntity;

	@Column({name: "assigned_to", nullable: true})
	assignedTo: string;

	@ManyToOne(() => UserEntity, {nullable: true})
	assignee: UserEntity;

	@OneToMany(
		() => MaterialRequestEntity,
		(materialRequest) => materialRequest.task
	)
	materialRequests: MaterialRequestEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;

	@DeleteDateColumn({name: "deleted_at", nullable: true})
	deletedAt: Date;
}
