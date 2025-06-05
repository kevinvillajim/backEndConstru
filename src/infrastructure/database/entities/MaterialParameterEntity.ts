// src/infrastructure/database/entities/MaterialParameterEntity.ts
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
import {MaterialCalculationTemplateEntity} from "./MaterialCalculationTemplateEntity";
import {UserMaterialCalculationTemplateEntity} from "./UserMaterialCalculationTemplateEntity";

@Entity("material_parameters")
export class MaterialParameterEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column("text")
	description: string;

	@Column({
		type: "enum",
		enum: ["string", "number", "boolean", "enum", "array"],
	})
	dataType: string;

	@Column({
		type: "enum",
		enum: ["input", "output", "calculated"],
	})
	scope: string;

	@Column({name: "display_order"})
	displayOrder: number;

	@Column({name: "is_required"})
	isRequired: boolean;

	@Column({name: "default_value", nullable: true})
	defaultValue: string;

	@Column({name: "min_value", type: "float", nullable: true})
	minValue: number;

	@Column({name: "max_value", type: "float", nullable: true})
	maxValue: number;

	@Column({
		type: "enum",
		enum: ["m2", "m3", "ml", "units", "kg", "bags", "sheets"],
		nullable: true,
	})
	unit: string;

	@Column({type: "simple-array", nullable: true})
	allowedValues: string[];

	@Column({name: "help_text", type: "text", nullable: true})
	helpText: string;

	@Column({name: "depends_on_parameters", type: "simple-array", nullable: true})
	dependsOnParameters: string[];

	// Relaciones con templates oficiales
	@Column({name: "material_calculation_template_id", nullable: true})
	materialCalculationTemplateId: string;

	@ManyToOne(
		() => MaterialCalculationTemplateEntity,
		(template) => template.parameters,
		{nullable: true}
	)
	@JoinColumn({name: "material_calculation_template_id"})
	materialCalculationTemplate: MaterialCalculationTemplateEntity;

	// Relaciones con templates de usuario
	@Column({name: "user_material_calculation_template_id", nullable: true})
	userMaterialCalculationTemplateId: string;

	@ManyToOne(
		() => UserMaterialCalculationTemplateEntity,
		(template) => template.parameters,
		{nullable: true}
	)
	@JoinColumn({name: "user_material_calculation_template_id"})
	userMaterialCalculationTemplate: UserMaterialCalculationTemplateEntity;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
