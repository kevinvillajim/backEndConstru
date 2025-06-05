// src/infrastructure/database/entities/MaterialCalculationResultEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { UserEntity } from "./UserEntity"; // Ensure this path is correct

@Entity("material_calculation_results")
export class MaterialCalculationResultEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "template_id"})
	templateId: string;

	@Column({
		name: "template_type",
		type: "enum",
		enum: ["official", "user"],
	})
	templateType: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({name: "project_id", nullable: true})
	projectId: string;

	@Column({name: "input_parameters", type: "json"})
	inputParameters: any;

	@Column({name: "material_quantities", type: "json"})
	materialQuantities: any[];

	@Column({
		name: "total_cost",
		type: "decimal",
		precision: 12,
		scale: 2,
		nullable: true,
	})
	totalCost: number;

	@Column({nullable: true})
	currency: string;

	@Column({name: "waste_included", default: true})
	wasteIncluded: boolean;

	@Column({name: "regional_factors_applied", default: false})
	regionalFactorsApplied: boolean;

	@Column({type: "text", nullable: true})
	notes: string;

	@Column({name: "is_saved", default: false})
	isSaved: boolean;

	@Column({name: "is_shared", default: false})
	isShared: boolean;

	@Column({name: "execution_time", type: "int"})
	executionTime: number;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
