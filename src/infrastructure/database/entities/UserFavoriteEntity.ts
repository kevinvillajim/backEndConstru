// src/infrastructure/database/entities/UserFavoriteEntity.ts
import {
	Entity,
	PrimaryColumn,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";

@Entity("user_favorites")
@Index("IDX_user_favorites_user", ["userId"])
@Index("IDX_user_favorites_template", ["templateId"])
export class UserFavoriteEntity {
	@PrimaryColumn({name: "user_id"})
	userId: string;

	@PrimaryColumn({name: "template_id"})
	templateId: string;

	@ManyToOne(() => UserEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@ManyToOne(() => CalculationTemplateEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "template_id"})
	template: CalculationTemplateEntity;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}