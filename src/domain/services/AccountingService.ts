// src/domain/services/AccountingService.ts
import {ProjectBudget} from "../models/project/ProjectBudget";

export interface AccountingTransaction {
	id?: string;
	externalId?: string;
	date: Date;
	description: string;
	amount: number;
	type: "INCOME" | "EXPENSE" | "BUDGET";
	status: "PENDING" | "PROCESSED" | "ERROR";
	entityType: string;
	entityId: string;
	accountCode?: string;
	metadata?: Record<string, any>;
	createdAt: Date;
	updatedAt: Date;
}

export interface AccountingSyncResult {
	success: boolean;
	transactionId?: string;
	externalId?: string;
	message?: string;
	errors?: string[];
}

export interface AccountingServiceConfig {
	apiKey?: string;
	apiUrl?: string;
	username?: string;
	password?: string;
	companyId?: string;
	certificatePath?: string;
	certificatePassword?: string;
	[key: string]: any;
}

export interface AccountingService {
	/**
	 * Nombre del servicio contable
	 */
	readonly name: string;

	/**
	 * Verifica si las credenciales y configuración son válidas
	 */
	testConnection(): Promise<boolean>;

	/**
	 * Sincroniza un presupuesto con el sistema contable
	 */
	syncBudget(budget: ProjectBudget): Promise<AccountingSyncResult>;

	/**
	 * Obtiene una transacción por su ID externo
	 */
	getTransactionByExternalId(
		externalId: string
	): Promise<AccountingTransaction | null>;

	/**
	 * Marca una transacción como procesada en el sistema contable
	 */
	markTransactionAsProcessed(transactionId: string): Promise<boolean>;
}
