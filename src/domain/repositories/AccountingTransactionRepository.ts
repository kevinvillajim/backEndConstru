// src/domain/repositories/AccountingTransactionRepository.ts
import {AccountingTransaction} from "../services/AccountingService";

export interface AccountingTransactionRepository {
	findById(id: string): Promise<AccountingTransaction | null>;
	findByExternalId(externalId: string): Promise<AccountingTransaction | null>;
	findByEntityId(
		entityType: string,
		entityId: string
	): Promise<AccountingTransaction[]>;
	findPendingTransactions(): Promise<AccountingTransaction[]>;
	create(transaction: AccountingTransaction): Promise<AccountingTransaction>;
	update(
		id: string,
		data: Partial<AccountingTransaction>
	): Promise<AccountingTransaction | null>;
	delete(id: string): Promise<boolean>;
}
