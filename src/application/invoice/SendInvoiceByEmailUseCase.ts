// src/application/invoice/SendInvoiceByEmailUseCase.ts
import {InvoiceRepository} from "../../domain/repositories/InvoiceRepository";
import {EmailService} from "../../domain/services/EmailService";
import {SriService} from "../../domain/services/SriService";
import {NotificationService} from "../../domain/services/NotificationService";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";
import {PdfGenerationService} from "../../infrastructure/services/PdfGenerationService";
import { InvoiceStatus } from "@infrastructure/database/entities/InvoiceEntity";

export interface EmailAttachment {
	filename: string;
	content: string | Buffer;
	contentType?: string;
}

export class SendInvoiceByEmailUseCase {
	constructor(
		private invoiceRepository: InvoiceRepository,
		private userRepository: UserRepository,
		private emailService: EmailService,
		private pdfGenerationService: PdfGenerationService,
		private notificationService: NotificationService
	) {}

	async execute(
		invoiceId: string,
		recipientEmail: string | null,
		senderId: string,
		sriService?: SriService
	): Promise<boolean> {
		// 1. Obtener la factura
		const invoice = await this.invoiceRepository.findById(invoiceId);
		if (!invoice) {
			throw new Error(`Factura no encontrada: ${invoiceId}`);
		}

		// 2. Si no se proporciona email, usar el del cliente
		if (!recipientEmail) {
			const client = await this.userRepository.findById(invoice.clientId);
			if (!client || !client.email) {
				throw new Error(
					"No se encontró email del destinatario para esta factura"
				);
			}
			recipientEmail = client.email;
		}

		// 3. Generar PDF de la factura
		const pdfBuffer =
			await this.pdfGenerationService.generateInvoicePdf(invoiceId);

		// 4. Si tenemos integración SRI y factura autorizada, obtenerla
		let electronicInvoicePdf: Buffer | null = null;
		if (sriService && invoice.sriAuthorization) {
			try {
				const xmlDocument = await sriService.getElectronicInvoiceDocument(
					invoice.sriAuthorization
				);
				electronicInvoicePdf =
					await this.pdfGenerationService.generatePdfFromXml(xmlDocument);
			} catch (error) {
				console.error("Error al obtener documento electrónico:", error);
				// Continuar sin factura electrónica
			}
		}

		// 5. Preparar adjuntos
		const attachments: EmailAttachment[] = [
			{
				filename: `Factura_${invoice.invoiceNumber}.pdf`,
				content: pdfBuffer,
			},
		];

		if (electronicInvoicePdf) {
			attachments.push({
				filename: `Factura_Electronica_${invoice.invoiceNumber}.pdf`,
				content: electronicInvoicePdf,
			});
		}

		// 6. Enviar email
		try {
			const client = await this.userRepository.findById(invoice.clientId);
			const html = `<p>Estimado/a ${client ? `${client.firstName} ${client.lastName}` : "Cliente"}:</p>`;

			const result = await this.emailService.sendEmail({
				to: recipientEmail,
				subject: `Factura ${invoice.invoiceNumber}`,
				html: `
          <h1>Factura ${invoice.invoiceNumber}</h1>
          <p>Estimado/a ${client?.name || "Cliente"}:</p>
          <p>Adjunto encontrará la factura ${invoice.invoiceNumber} por un monto de $${invoice.total.toFixed(2)}.</p>
          <p>Fecha de emisión: ${invoice.issueDate.toLocaleDateString()}</p>
          <p>Fecha de vencimiento: ${invoice.dueDate.toLocaleDateString()}</p>
          ${invoice.sriAuthorization ? `<p>Número de Autorización SRI: ${invoice.sriAuthorization}</p>` : ""}
          <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
          <p>Atentamente,</p>
          <p>${seller?.name || "El equipo de ventas"}</p>
          <p>CONSTRU App</p>
        `,
				attachments,
			});

			// 7. Actualizar estado si se envió exitosamente
			if (result) {
				await this.invoiceRepository.update(invoiceId, {
					status: InvoiceStatus.SENT,
				});

				// Enviar notificación al remitente
				await this.notificationService.sendToUser(senderId, {
					title: "Factura enviada",
					content: `La factura ${invoice.invoiceNumber} ha sido enviada a ${recipientEmail}.`,
					type: NotificationType.SYSTEM_ANNOUNCEMENT,
					priority: NotificationPriority.LOW,
					actionUrl: `/invoices/${invoiceId}`,
					actionText: "Ver factura",
				});
			}

			return result;
		} catch (error) {
			console.error("Error al enviar email de factura:", error);

			// Notificar error
			await this.notificationService.sendToUser(senderId, {
				title: "Error al enviar factura",
				content: `No se pudo enviar la factura ${invoice.invoiceNumber} por email: ${
					error instanceof Error ? error.message : "Error desconocido"
				}`,
				type: NotificationType.SYSTEM_ANNOUNCEMENT,
				priority: NotificationPriority.MEDIUM,
			});

			return false;
		}
	}
}
