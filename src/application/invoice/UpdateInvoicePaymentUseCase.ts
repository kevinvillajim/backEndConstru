// src/application/invoice/UpdateInvoicePaymentUseCase.ts
import {InvoiceRepository} from "../../domain/repositories/InvoiceRepository";
import {NotificationService} from "../../domain/services/NotificationService";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";
import {InvoiceStatus, PaymentMethod} from "../../infrastructure/database/entities/InvoiceEntity";
import {AccountingTransactionRepository} from "../../domain/repositories/AccountingTransactionRepository";
import {
	TransactionType,
	TransactionStatus,
} from "../../infrastructure/database/entities/AccountingTransactionEntity";
import {v4 as uuidv4} from "uuid";

export interface PaymentDetails {
	amount: number;
	paymentMethod: PaymentMethod;
	paymentDate: Date;
	paymentReference?: string;
	notes?: string;
}

export class UpdateInvoicePaymentUseCase {
	constructor(
		private invoiceRepository: InvoiceRepository,
		private userRepository: UserRepository,
		private accountingTransactionRepository: AccountingTransactionRepository,
		private notificationService: NotificationService
	) {}

	async execute(
		invoiceId: string,
		paymentDetails: PaymentDetails,
		userId: string
	): Promise<boolean> {
		// 1. Obtener la factura
		const invoice = await this.invoiceRepository.findById(invoiceId);
		if (!invoice) {
			throw new Error(`Factura no encontrada: ${invoiceId}`);
		}

		// 2. Validar monto del pago
		if (
			paymentDetails.amount <= 0 ||
			paymentDetails.amount > invoice.amountDue
		) {
			throw new Error(
				`Monto de pago inválido. Monto máximo: ${invoice.amountDue}`
			);
		}

		// 3. Actualizar información de pago
		const newAmountPaid = invoice.amountPaid + paymentDetails.amount;
		const newAmountDue = invoice.total - newAmountPaid;

		// Determinar nuevo estado según monto pagado
		let newStatus = invoice.status;
		if (newAmountPaid >= invoice.total) {
			newStatus = InvoiceStatus.PAID;
		} else if (newAmountPaid > 0) {
			newStatus = InvoiceStatus.PARTIAL;
		}

		// Actualizar factura
		await this.invoiceRepository.update(invoiceId, {
			amountPaid: newAmountPaid,
			amountDue: newAmountDue,
			status: newStatus,
			paymentMethod: paymentDetails.paymentMethod,
			paymentReference: paymentDetails.paymentReference,
			paymentDate: paymentDetails.paymentDate,
			notes: paymentDetails.notes
				? invoice.notes
					? `${invoice.notes}\n\n${paymentDetails.notes}`
					: paymentDetails.notes
				: invoice.notes,
		});

		// 4. Registrar transacción contable
		await this.accountingTransactionRepository.create({
			id: uuidv4(),
			date: paymentDetails.paymentDate,
			description: `Pago de factura: ${invoice.invoiceNumber}`,
			amount: paymentDetails.amount,
			type: TransactionType.INCOME,
			status: TransactionStatus.PENDING,
			entityType: "invoice",
			entityId: invoiceId,
			metadata: {
				paymentMethod: paymentDetails.paymentMethod,
				paymentReference: paymentDetails.paymentReference,
				invoiceNumber: invoice.invoiceNumber,
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// 5. Enviar notificaciones
		// Al registrador del pago
		await this.notificationService.sendToUser(userId, {
			title: "Pago registrado",
			content: `Se ha registrado un pago de $${paymentDetails.amount.toFixed(2)} para la factura ${invoice.invoiceNumber}.`,
			type: NotificationType.SYSTEM_ANNOUNCEMENT,
			priority: NotificationPriority.MEDIUM,
			actionUrl: `/invoices/${invoiceId}`,
			actionText: "Ver factura",
		});

		// Al cliente si la factura está pagada completamente
		if (newStatus = InvoiceStatus.PAID) {
			await this.notificationService.sendToUser(invoice.clientId, {
				title: "Factura pagada",
				content: `Su factura ${invoice.invoiceNumber} ha sido completamente pagada. Gracias por su pago.`,
				type: NotificationType.SYSTEM_ANNOUNCEMENT,
				priority: NotificationPriority.LOW,
				actionUrl: `/invoices/${invoiceId}`,
				actionText: "Ver factura",
			});
		}

		return true;
	}
}
