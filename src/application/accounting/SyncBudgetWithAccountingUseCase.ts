// src/application/accounting/SyncBudgetWithAccountingUseCase.ts
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {AccountingTransactionRepository} from "../../domain/repositories/AccountingTransactionRepository";
import {AccountingServiceFactory} from "../../infrastructure/services/accounting/AccountingServiceFactory";
import {
	AccountingService,
	AccountingSyncResult,
} from "../../domain/services/AccountingService";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {v4 as uuidv4} from "uuid";
import {NotificationService} from "../../domain/services/NotificationService";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";

export class SyncBudgetWithAccountingUseCase {
	constructor(
		private projectBudgetRepository: ProjectBudgetRepository,
		private accountingTransactionRepository: AccountingTransactionRepository,
		private userRepository: UserRepository,
		private notificationService: NotificationService
	) {}

	async execute(
		budgetId: string,
		userId: string,
		accountingSystem: string,
		config: any
	): Promise<AccountingSyncResult> {
		// 1. Obtener el presupuesto
		const budget = await this.projectBudgetRepository.findById(budgetId);
		if (!budget) {
			throw new Error(`Presupuesto no encontrado: ${budgetId}`);
		}

		// 2. Verificar si ya existe una transacción para este presupuesto
		const existingTransactions =
			await this.accountingTransactionRepository.findByEntityId(
				"budget",
				budgetId
			);
		if (existingTransactions.length > 0) {
			// Ya existe una sincronización, verificar si podemos actualizarla
			const mostRecentTransaction = existingTransactions[0];

			if (mostRecentTransaction.status === "PROCESSED") {
				return {
					success: false,
					message:
						"Este presupuesto ya ha sido procesado en el sistema contable y no puede modificarse",
				};
			}
		}

		// 3. Crear instancia del servicio contable
		try {
			const accountingService = AccountingServiceFactory.createService(
				accountingSystem as any,
				config
			);

			// 4. Probar conexión
			const connectionOk = await accountingService.testConnection();
			if (!connectionOk) {
				return {
					success: false,
					message:
						"No se pudo conectar con el sistema contable. Verifique las credenciales.",
				};
			}

			// 5. Sincronizar presupuesto
			const syncResult = await accountingService.syncBudget(budget);

			// 6. Registrar transacción en nuestra base de datos
			if (syncResult.success) {
				await this.accountingTransactionRepository.create({
					id: uuidv4(),
					externalId: syncResult.externalId,
					date: new Date(),
					description: `Sincronización de presupuesto: ${budget.name}`,
					amount: budget.total,
					type: "BUDGET",
					status: "PENDING",
					entityType: "budget",
					entityId: budgetId,
					metadata: {
						accountingSystem,
						syncDate: new Date().toISOString(),
					},
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				// 7. Enviar notificación al usuario
				await this.notificationService.sendToUser(userId, {
					title: "Presupuesto sincronizado",
					content: `El presupuesto "${budget.name}" ha sido sincronizado exitosamente con ${accountingService.name}.`,
					type: NotificationType.BUDGET_APPROVAL,
					priority: NotificationPriority.MEDIUM,
					actionUrl: `/budgets/${budgetId}`,
					actionText: "Ver presupuesto",
				});
			} else {
				// Registrar error si hubo uno
				await this.accountingTransactionRepository.create({
					id: uuidv4(),
					date: new Date(),
					description: `Error al sincronizar presupuesto: ${budget.name}`,
					amount: budget.total,
					type: "BUDGET",
					status: "ERROR",
					entityType: "budget",
					entityId: budgetId,
					metadata: {
						accountingSystem,
						syncDate: new Date().toISOString(),
						error: syncResult.message,
						errors: syncResult.errors,
					},
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				// Enviar notificación de error
				await this.notificationService.sendToUser(userId, {
					title: "Error de sincronización",
					content: `Ocurrió un error al sincronizar el presupuesto "${budget.name}" con ${accountingService.name}. ${syncResult.message}`,
					type: NotificationType.SYSTEM_ANNOUNCEMENT,
					priority: NotificationPriority.HIGH,
					actionUrl: `/budgets/${budgetId}`,
					actionText: "Ver presupuesto",
				});
			}

			return syncResult;
		} catch (error) {
			console.error("Error en sincronización contable:", error);

			// Enviar notificación de error
			await this.notificationService.sendToUser(userId, {
				title: "Error de sistema",
				content: `Ocurrió un error inesperado al sincronizar el presupuesto: ${error instanceof Error ? error.message : "Error desconocido"}`,
				type: NotificationType.SYSTEM_ANNOUNCEMENT,
				priority: NotificationPriority.HIGH,
			});

			return {
				success: false,
				message: "Error inesperado al sincronizar con el sistema contable",
				errors: [error instanceof Error ? error.message : "Error desconocido"],
			};
		}
	}
}
