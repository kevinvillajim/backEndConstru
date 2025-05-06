import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {MaterialEntity} from "./MaterialEntity";
import {CategoryEntity} from "./CategoryEntity";
import {ProjectEntity} from "./ProjectEntity";

export enum InteractionType {
	VIEW = "view",
	SEARCH = "search",
	CLICK = "click",
	FAVORITE = "favorite",
	ADD_TO_CART = "add_to_cart",
	PURCHASE = "purchase",
	RATE = "rate",
	REVIEW = "review",
	SHARE = "share",
	DOWNLOAD = "download",
}

@Entity("user_interactions")
export class UserInteractionEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({
		type: "enum",
		enum: InteractionType,
	})
	type: InteractionType;

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

	@Column({name: "project_id", nullable: true})
	projectId: string;

	@ManyToOne(() => ProjectEntity, {nullable: true})
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	@Column({name: "search_query", nullable: true})
	searchQuery: string;

	@Column({type: "json", nullable: true})
	metadata: {
		page?: string;
		section?: string;
		duration?: number;
		rating?: number;
		reviewText?: string;
		deviceType?: string;
		browser?: string;
		os?: string;
		referrer?: string;
	};

	@Column({name: "session_id", nullable: true})
	sessionId: string;

	@Column({name: "ip_address", nullable: true})
	ipAddress: string;

	@Column({name: "user_agent", type: "text", nullable: true})
	userAgent: string;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}
