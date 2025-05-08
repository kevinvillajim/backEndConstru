// src/infrastructure/database/entities/RefreshTokenEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {UserEntity} from "./UserEntity";

@Entity("refresh_tokens")
export class RefreshTokenEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	token: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({name: "expires_at"})
	expiresAt: Date;

	@Column({default: false})
	revoked: boolean;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}
