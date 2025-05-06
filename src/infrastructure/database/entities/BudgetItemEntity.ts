import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {ProjectBudgetEntity} from "./ProjectBudgetEntity";
import {MaterialEntity} from "./MaterialEntity";

@Entity("budget_items")
export class BudgetItemEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	description: string;

	@Column({type: "decimal", precision: 10, scale: 2})
	quantity: number;

	@Column({name: "unit_of_measure"})
	unitOfMeasure: string;

	@Column({name: "unit_price", type: "decimal", precision: 10, scale: 2})
	unitPrice: number;

	@Column({type: "decimal", precision: 12, scale: 2})
	subtotal: number;

	@Column({
		name: "category",
		nullable: true,
		comment: "Categoría del ítem (materiales, mano de obra, etc.)",
	})
	category: string;

	@Column({name: "budget_id"})
	budgetId: string;

	@ManyToOne(() => ProjectBudgetEntity, (budget) => budget.items)
	@JoinColumn({name: "budget_id"})
	budget: ProjectBudgetEntity;

	@Column({name: "material_id", nullable: true})
	materialId: string;

	@ManyToOne(() => MaterialEntity, {nullable: true})
	@JoinColumn({name: "material_id"})
	material: MaterialEntity;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
