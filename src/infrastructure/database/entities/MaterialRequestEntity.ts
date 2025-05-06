import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	DeleteDateColumn,
	ManyToOne,
} from "typeorm";
import {TaskEntity} from "./TaskEntity";
import {MaterialEntity} from "./MaterialEntity";
import {UserEntity} from "./UserEntity";

enum MaterialRequestStatus {
	PENDING = "pending",
	APPROVED = "approved",
	DELIVERED = "delivered",
	REJECTED = "rejected",
}

@Entity("material_requests")
export class MaterialRequestEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({type: "int"})
	quantity: number;

	@Column({
		type: "enum",
		enum: MaterialRequestStatus,
		default: MaterialRequestStatus.PENDING,
	})
	status: MaterialRequestStatus;

	@Column({name: "task_id"})
	taskId: string;

	@ManyToOne(() => TaskEntity, (task) => task.materialRequests)
	task: TaskEntity;

	@Column({name: "material_id"})
	materialId: string;

	@ManyToOne(() => MaterialEntity, (material) => material.materialRequests)
	material: MaterialEntity;

	@Column({name: "requester_id"})
	requesterId: string;

	@ManyToOne(() => UserEntity)
	requester: UserEntity;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;

	@DeleteDateColumn({name: "deleted_at", nullable: true})
	deletedAt: Date;
}
