// src/infrastructure/database/repositories/TypeOrmAccountingTransactionRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {AccountingTransactionRepository} from "../../../domain/repositories/AccountingTransactionRepository";
import {AccountingTransaction} from "../../../domain/services/AccountingService";
import {
	AccountingTransactionEntity,
	TransactionStatus,
	TransactionType,
} from "../entities/AccountingTransactionEntity";

export class TypeOrmAccountingTransactionRepository
	implements AccountingTransactionRepository
{
	private repository: Repository<AccountingTransactionEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(AccountingTransactionEntity);
	}

	async findById(id: string): Promise<AccountingTransaction | null> {
		const transaction = await this.repository.findOne({
			where: {id},
		});

		return transaction ? this.toDomainModel(transaction) : null;
	}

	async findByExternalId(
		externalId: string
	): Promise<AccountingTransaction | null> {
		const transaction = await this.repository.findOne({
			where: {externalId},
		});

		return transaction ? this.toDomainModel(transaction) : null;
	}

	async findByEntityId(
		entityType: string,
		entityId: string
	): Promise<AccountingTransaction[]> {
		const transactions = await this.repository.find({
			where: {entityType, entityId},
			order: {createdAt: "DESC"},
		});

		return transactions.map((transaction) => this.toDomainModel(transaction));
	}

	async findPendingTransactions(): Promise<AccountingTransaction[]> {
		const transactions = await this.repository.find({
			where: {status: TransactionStatus.PENDING},
			order: {createdAt: "ASC"},
		});

		return transactions.map((transaction) => this.toDomainModel(transaction));
	}

	async create(
		transactionData: AccountingTransaction
	): Promise<AccountingTransaction> {
		const entity = new AccountingTransactionEntity();
		// Copiar propiedades excluyendo 'id'
		Object.assign(entity, {
			externalId: transactionData.externalId,
			date: transactionData.date,
			description: transactionData.description,
			amount: transactionData.amount,
			type: transactionData.type,
			status: transactionData.status,
			entityType: transactionData.entityType,
			entityId: transactionData.entityId,
			accountCode: transactionData.accountCode,
			metadata: transactionData.metadata,
		});

		const savedTransaction = await this.repository.save(entity);
		return this.toDomainModel(savedTransaction);
	}

	async update(
		id: string,
		data: Partial<AccountingTransaction>
	): Promise<AccountingTransaction | null> {
		const transaction = await this.repository.findOne({
			where: {id},
		});

		if (!transaction) return null;

		Object.assign(transaction, data);
		const updatedTransaction = await this.repository.save(transaction);
		return this.toDomainModel(updatedTransaction);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	// Métodos de conversión
	private toDomainModel(
		entity: AccountingTransactionEntity
	): AccountingTransaction {
		return {
			externalId: entity.externalId,
			date: entity.date,
			description: entity.description,
			amount: entity.amount,
			type: entity.type as "INCOME" | "EXPENSE" | "BUDGET",
			status: entity.status as "PENDING" | "PROCESSED" | "ERROR",
			entityType: entity.entityType,
			entityId: entity.entityId,
			accountCode: entity.accountCode,
			metadata: entity.metadata,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
