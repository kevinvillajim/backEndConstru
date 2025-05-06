import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	DeleteDateColumn,
	OneToMany,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {MaterialEntity} from "./MaterialEntity";

@Entity("categories")
export class CategoryEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text", nullable: true})
	description: string;

	@Column({name: "icon", nullable: true})
	icon: string;

	@Column({name: "image_url", nullable: true})
	imageUrl: string;

	@Column({name: "is_active", default: true})
	isActive: boolean;

	@Column({name: "parent_id", nullable: true})
	parentId: string;

	@ManyToOne(() => CategoryEntity, (category) => category.children, {
		nullable: true,
	})
	@JoinColumn({name: "parent_id"})
	parent: CategoryEntity;

	@OneToMany(() => CategoryEntity, (category) => category.parent)
	children: CategoryEntity[];

	@Column({name: "display_order", type: "int", default: 0})
	displayOrder: number;

	@OneToMany(() => MaterialEntity, (material) => material.category)
	materials: MaterialEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;

	@DeleteDateColumn({name: "deleted_at", nullable: true})
	deletedAt: Date;
}
