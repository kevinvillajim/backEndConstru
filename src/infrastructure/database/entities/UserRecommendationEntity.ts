import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {MaterialEntity} from "./MaterialEntity";
import {CategoryEntity} from "./CategoryEntity";

export enum RecommendationType {
	MATERIAL = "material",
	CATEGORY = "category",
	PROJECT_TYPE = "project_type",
	SUPPLIER = "supplier",
}

export enum RecommendationStatus {
	PENDING = "pending",
	VIEWED = "viewed",
	CLICKED = "clicked",
	CONVERTED = "converted",
	DISMISSED = "dismissed",
}

@Entity("user_recommendations")
export class UserRecommendationEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({
		type: "enum",
		enum: RecommendationType,
	})
	type: RecommendationType;

	@Column({name: "material_id", nullable: true})
	materialId: string;

	@ManyToOne(() => MaterialEntity, {nullable: true})
	@JoinColumn({name: "material_id"})
	material: MaterialEntity;

	@Column({name: "category_id", nullable: true})
	categoryId: string;

	@ManyToOne(() => CategoryEntity, {nullable: true})
	@JoinColumn({name: "category_id"})
	category: CategoryEntity;

	@Column({name: "project_type", nullable: true})
	projectType: string;

	@Column({name: "supplier_id", nullable: true})
	supplierId: string;

	@ManyToOne(() => UserEntity, {nullable: true})
	@JoinColumn({name: "supplier_id"})
	supplier: UserEntity;

	@Column({
		type: "decimal",
		precision: 5,
		scale: 4,
		comment: "Puntuación de relevancia (0-1)",
	})
	score: number;

	@Column({type: "text", nullable: true})
	reason: string;

	@Column({
		type: "enum",
		enum: RecommendationStatus,
		default: RecommendationStatus.PENDING,
	})
	status: RecommendationStatus;

	@Column({name: "expires_at", type: "datetime", nullable: true})
	expiresAt: Date;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
