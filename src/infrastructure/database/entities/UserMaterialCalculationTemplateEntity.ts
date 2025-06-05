// src/infrastructure/database/entities/UserMaterialCalculationTemplateEntity.ts
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
import { UserEntity } from "./UserEntity";
import { MaterialCalculationTemplateEntity } from "./MaterialCalculationTemplateEntity";
import { MaterialParameterEntity } from "./MaterialParameterEntity";

@Entity("user_material_calculation_templates")
export class UserMaterialCalculationTemplateEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column("text")
	description: string;

	@Column({
		type: "enum",
		enum: [
			"masonry",
			"concrete",
			"finishes",
			"stairs",
			"electrical",
			"furniture",
			"mortar",
			"flooring",
		],
	})
	type: string;

	@Column({name: "sub_category"})
	subCategory: string;

	@Column("longtext")
	formula: string;

	@Column({type: "json"})
	materialOutputs: any[];

	@Column({type: "json"})
	wasteFactors: any[];

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({name: "base_template_id", nullable: true})
	baseTemplateId: string;

	@ManyToOne(() => MaterialCalculationTemplateEntity, {nullable: true})
	@JoinColumn({name: "base_template_id"})
	baseTemplate: MaterialCalculationTemplateEntity;

	@Column({name: "is_public", default: false})
	isPublic: boolean;

	@Column({name: "is_active", default: true})
	isActive: boolean;

	@Column({name: "usage_count", default: 0})
	usageCount: number;

	@Column({
		name: "average_rating",
		type: "decimal",
		precision: 3,
		scale: 2,
		default: 0,
	})
	averageRating: number;

	@Column({name: "rating_count", default: 0})
	ratingCount: number;

	@Column({type: "simple-array", nullable: true})
	tags: string[];

	@OneToMany(
		() => MaterialParameterEntity,
		(parameter) => parameter.userMaterialCalculationTemplate
	)
	parameters: MaterialParameterEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
