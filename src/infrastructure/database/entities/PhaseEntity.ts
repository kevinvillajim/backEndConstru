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
import {ProjectEntity} from "./ProjectEntity";
import {TaskEntity} from "./TaskEntity";

@Entity("phases")
export class PhaseEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text", nullable: true})
	description: string;

	@Column({name: "start_date", type: "date"})
	startDate: Date;

	@Column({name: "end_date", type: "date", nullable: true})
	endDate: Date;

	@Column({
		name: "completion_percentage",
		type: "decimal",
		precision: 5,
		scale: 2,
		default: 0,
	})
	completionPercentage: number;

	@Column({name: "project_id"})
	projectId: string;

	@ManyToOne(() => ProjectEntity, (project) => project.phases)
	project: ProjectEntity;

	@OneToMany(() => TaskEntity, (task) => task.phase)
	tasks: TaskEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;

	@DeleteDateColumn({name: "deleted_at", nullable: true})
	deletedAt: Date;
}
