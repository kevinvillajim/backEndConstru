import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	OneToMany,
} from "typeorm";
import {ProjectEntity} from "./ProjectEntity";
import {BudgetItemEntity} from "./BudgetItemEntity";

export enum BudgetStatus {
	DRAFT = "draft",
	APPROVED = "approved",
	REVISED = "revised",
	EXECUTED = "executed",
}

@Entity("project_budgets")
export class ProjectBudgetEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text", nullable: true})
	description: string;

	@Column({
		type: "enum",
		enum: BudgetStatus,
		default: BudgetStatus.DRAFT,
	})
	status: BudgetStatus;

	@Column({name: "version", type: "int", default: 1})
	version: number;

	@Column({type: "decimal", precision: 12, scale: 2})
	subtotal: number;

	@Column({type: "decimal", precision: 5, scale: 2, default: 12})
	taxPercentage: number;

	@Column({type: "decimal", precision: 12, scale: 2})
	tax: number;

	@Column({type: "decimal", precision: 12, scale: 2})
	total: number;

	@Column({name: "project_id"})
	projectId: string;

	@ManyToOne(() => ProjectEntity, (project) => project.budgets)
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	@OneToMany(() => BudgetItemEntity, (item) => item.budget)
	items: BudgetItemEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
