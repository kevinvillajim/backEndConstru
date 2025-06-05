// src/infrastructure/database/entities/MaterialCalculationTemplateEntity.ts
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
import {MaterialParameterEntity} from "./MaterialParameterEntity";
import {UserEntity} from "./UserEntity";

@Entity("material_calculation_templates")
export class MaterialCalculationTemplateEntity {
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

	@Column({type: "json", nullable: true})
	regionalFactors: any[];

	@Column({name: "normative_reference", nullable: true})
	normativeReference: string;

	@Column({name: "is_active", default: true})
	isActive: boolean;

	@Column({name: "is_verified", default: true})
	isVerified: boolean;

	@Column({name: "is_featured", default: false})
	isFeatured: boolean;

	@Column({
		name: "share_level",
		type: "enum",
		enum: ["public", "private", "organization"],
		default: "public",
	})
	shareLevel: string;

	@Column({name: "created_by", nullable: true})
	createdBy: string;

	@ManyToOne(() => UserEntity, {nullable: true})
	@JoinColumn({name: "created_by"})
	creator: UserEntity;

	@Column({default: 1})
	version: number;

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
		(parameter) => parameter.materialCalculationTemplate
	)
	parameters: MaterialParameterEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
