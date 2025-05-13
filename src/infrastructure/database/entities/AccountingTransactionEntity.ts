// src/infrastructure/database/entities/AccountingTransactionEntity.ts
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

export enum TransactionType {
	INCOME = "INCOME",
	EXPENSE = "EXPENSE",
	BUDGET = "BUDGET",
}

export enum TransactionStatus {
	PENDING = "PENDING",
	PROCESSED = "PROCESSED",
	ERROR = "ERROR",
}

@Entity("accounting_transactions")
export class AccountingTransactionEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "external_id", nullable: true})
	externalId: string;

	@Column({type: "date"})
	date: Date;

	@Column()
	description: string;

	@Column({type: "decimal", precision: 12, scale: 2})
	amount: number;

	@Column({
		type: "enum",
		enum: TransactionType,
	})
	type: TransactionType;

	@Column({
		type: "enum",
		enum: TransactionStatus,
		default: TransactionStatus.PENDING,
	})
	status: TransactionStatus;

	@Column({name: "entity_type"})
	entityType: string;

	@Column({name: "entity_id"})
	entityId: string;

	@Column({name: "account_code", nullable: true})
	accountCode: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({name: "accounting_system", nullable: true})
	accountingSystem: string;

	@Column({type: "json", nullable: true})
	metadata: Record<string, any>;

	@Column({name: "error_message", type: "text", nullable: true})
	errorMessage: string;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
