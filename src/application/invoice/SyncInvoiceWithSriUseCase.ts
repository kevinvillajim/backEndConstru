// src/application/invoice/SyncInvoiceWithSriUseCase.ts
import {InvoiceRepository} from "../../domain/repositories/InvoiceRepository";
import {SriService, SriAuthorization} from "../../domain/services/SriService";
import {NotificationService} from "../../domain/services/NotificationService";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";
import { InvoiceStatus } from "@infrastructure/database/entities/InvoiceEntity";

export class SyncInvoiceWithSriUseCase {
	constructor(
		private invoiceRepository: InvoiceRepository,
		private userRepository: UserRepository,
		private notificationService: NotificationService
	) {}

	async execute(
		invoiceId: string,
		userId: string,
		sriService: SriService
	): Promise<SriAuthorization> {
		// 1. Obtener la factura
		const invoice = await this.invoiceRepository.findById(invoiceId);
		if (!invoice) {
			throw new Error(`Factura no encontrada: ${invoiceId}`);
		}

		// 2. Verificar si ya está autorizada
		if (invoice.sriAuthorization) {
			return {
				authorizationNumber: invoice.sriAuthorization,
				authorizationDate: invoice.issueDate,
				accessKey: invoice.sriAccessKey || "",
				electronicDocumentUrl: invoice.electronicInvoiceUrl,
				status: "AUTHORIZED",
			};
		}

		// 3. Probar conexión
		const connectionOk = await sriService.testConnection();
		if (!connectionOk) {
			throw new Error(
				"No se pudo conectar con el SRI. Verifique sus credenciales."
			);
		}

		// 4. Generar factura electrónica
		try {
			const sriAuthorization =
				await sriService.generateElectronicInvoice(invoiceId);

			// 5. Actualizar factura con autorización SRI
			if (sriAuthorization.status === "AUTHORIZED") {
				await this.invoiceRepository.update(invoiceId, {
					sriAuthorization: sriAuthorization.authorizationNumber,
					sriAccessKey: sriAuthorization.accessKey,
					electronicInvoiceUrl: sriAuthorization.electronicDocumentUrl,
					status: InvoiceStatus.ISSUED,
				});

				// 6. Enviar notificación al usuario
				await this.notificationService.sendToUser(userId, {
					title: "Factura autorizada por SRI",
					content: `La factura ${invoice.invoiceNumber} ha sido autorizada por el SRI.`,
					type: NotificationType.SYSTEM_ANNOUNCEMENT,
					priority: NotificationPriority.MEDIUM,
					actionUrl: `/invoices/${invoiceId}`,
					actionText: "Ver factura",
				});
			} else {
				// Enviar notificación de error
				await this.notificationService.sendToUser(userId, {
					title: "Error de autorización SRI",
					content: `Error al autorizar la factura ${invoice.invoiceNumber}: ${sriAuthorization.errorMessage}`,
					type: NotificationType.SYSTEM_ANNOUNCEMENT,
					priority: NotificationPriority.HIGH,
					actionUrl: `/invoices/${invoiceId}`,
					actionText: "Ver factura",
				});
			}

			return sriAuthorization;
		} catch (error) {
			console.error("Error en sincronización SRI:", error);

			// Notificar error
			await this.notificationService.sendToUser(userId, {
				title: "Error de sistema",
				content: `Ocurrió un error inesperado al sincronizar la factura con el SRI: ${
					error instanceof Error ? error.message : "Error desconocido"
				}`,
				type: NotificationType.SYSTEM_ANNOUNCEMENT,
				priority: NotificationPriority.HIGH,
			});

			throw error;
		}
	}
}
