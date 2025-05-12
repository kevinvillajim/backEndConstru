// src/infrastructure/database/entities/MaterialPropertyDefinitionEntity.ts
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
import {CategoryEntity} from "./CategoryEntity";
import {MaterialPropertyValueEntity} from "./MaterialPropertyValueEntity";

export enum PropertyType {
	TEXT = "text",
	NUMBER = "number",
	BOOLEAN = "boolean",
	DATE = "date",
	SELECT = "select",
	MULTISELECT = "multiselect",
	COLOR = "color",
	DIMENSION = "dimension",
}

@Entity("material_property_definitions")
export class MaterialPropertyDefinitionEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text", nullable: true})
	description: string;

	@Column({
		type: "enum",
		enum: PropertyType,
		default: PropertyType.TEXT,
	})
	propertyType: PropertyType;

	@Column({name: "is_required", default: false})
	isRequired: boolean;

	@Column({name: "is_filterable", default: false})
	isFilterable: boolean;

	@Column({name: "is_visible_in_list", default: true})
	isVisibleInList: boolean;

	@Column({name: "display_order", default: 0})
	displayOrder: number;

	@Column({type: "json", nullable: true})
	options: {
		values?: string[];
		min?: number;
		max?: number;
		step?: number;
		unit?: string;
		default?: any;
	};

	@Column({name: "category_id"})
	categoryId: string;

	@ManyToOne(() => CategoryEntity)
	@JoinColumn({name: "category_id"})
	category: CategoryEntity;

	@OneToMany(
		() => MaterialPropertyValueEntity,
		(value) => value.propertyDefinition
	)
	values: MaterialPropertyValueEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
