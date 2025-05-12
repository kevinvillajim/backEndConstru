import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {MaterialEntity} from "./MaterialEntity";
import {MaterialPropertyDefinitionEntity} from "./MaterialPropertyDefinitionEntity";

@Entity("material_property_values")
export class MaterialPropertyValueEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "material_id"})
	materialId: string;

	@ManyToOne(() => MaterialEntity)
	@JoinColumn({name: "material_id"})
	material: MaterialEntity;

	@Column({name: "property_definition_id"})
	propertyDefinitionId: string;

	@ManyToOne(
		() => MaterialPropertyDefinitionEntity,
		(definition) => definition.values
	)
	@JoinColumn({name: "property_definition_id"})
	propertyDefinition: MaterialPropertyDefinitionEntity;

	@Column({name: "text_value", type: "text", nullable: true})
	textValue: string;

	@Column({
		name: "number_value",
		type: "decimal",
		precision: 18,
		scale: 6,
		nullable: true,
	})
	numberValue: number;

	@Column({name: "boolean_value", type: "boolean", nullable: true})
	booleanValue: boolean;

	@Column({name: "date_value", type: "datetime", nullable: true})
	dateValue: Date;

	@Column({name: "array_value", type: "simple-array", nullable: true})
	arrayValue: string[];

	@Column({name: "json_value", type: "json", nullable: true})
	jsonValue: any;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
