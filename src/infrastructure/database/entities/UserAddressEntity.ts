// Crear un nuevo archivo: src/infrastructure/database/entities/UserAddressEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	JoinColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from "typeorm";
import {UserEntity} from "./UserEntity";

@Entity("user_addresses")
export class UserAddressEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column()
	street: string;

	@Column()
	number: string;

	@Column()
	city: string;

	@Column()
	province: string;

	@Column()
	postalCode: string;

	@Column()
	country: string;

	@Column({nullable: true})
	reference: string;

	@Column({name: "is_main", default: false})
	isMain: boolean;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
