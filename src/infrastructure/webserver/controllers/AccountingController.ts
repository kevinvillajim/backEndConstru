// src/infrastructure/webserver/controllers/AccountingController.ts
import {Request, Response} from "express";
import {SyncBudgetWithAccountingUseCase} from "../../../application/accounting/SyncBudgetWithAccountingUseCase";
import {AccountingServiceFactory} from "../../services/accounting/AccountingServiceFactory";
import {User} from "../../../domain/models/user/User";
import {handleError} from "../utils/errorHandler";
import {AccountingTransactionRepository} from "../../../domain/repositories/AccountingTransactionRepository";

interface RequestWithUser extends Request {
	user?: User;
}

export class AccountingController {
	constructor(
		private syncBudgetWithAccountingUseCase: SyncBudgetWithAccountingUseCase,
		private accountingTransactionRepository: AccountingTransactionRepository
	) {}

	/**
	 * Obtiene los sistemas contables soportados
	 */
	getSupportedSystems(req: RequestWithUser, res: Response): void {
		try {
			const systems = AccountingServiceFactory.getSupportedSystems();

			res.status(200).json({
				success: true,
				data: systems,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener sistemas contables",
			});
		}
	}

	/**
	 * Sincroniza un presupuesto con un sistema contable
	 */
	async syncBudget(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {budgetId} = req.params;
			const {system, config} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar parámetros
			if (!system || !config) {
				res.status(400).json({
					success: false,
					message: "Se requiere el sistema contable y su configuración",
				});
				return;
			}

			// Ejecutar caso de uso
			const result = await this.syncBudgetWithAccountingUseCase.execute(
				budgetId,
				req.user.id,
				system,
				config
			);

			if (result.success) {
				res.status(200).json({
					success: true,
					message: "Presupuesto sincronizado correctamente",
					data: result,
				});
			} else {
				res.status(400).json({
					success: false,
					message: result.message || "Error en la sincronización",
					errors: result.errors,
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al sincronizar con sistema contable",
			});
		}
	}

	/**
	 * Obtiene el historial de sincronizaciones de un presupuesto
	 */
	async getSyncHistory(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {budgetId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const transactions =
				await this.accountingTransactionRepository.findByEntityId(
					"budget",
					budgetId
				);

			res.status(200).json({
				success: true,
				data: transactions,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message ||
					"Error al obtener historial de sincronizaciones",
			});
		}
	}
}
