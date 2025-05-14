// src/infrastructure/webserver/controllers/InvoiceController.ts
import { Request, Response } from "express";
import { RequestWithUser } from "../middlewares/authMiddleware";
import { handleError } from "../utils/errorHandler";
import { InvoiceRepository } from "../../../domain/repositories/InvoiceRepository";
import { SriServiceFactory } from "../../services/sri/SriServiceFactory";
import { SyncInvoiceWithSriUseCase } from "../../../application/invoice/SyncInvoiceWithSriUseCase";
import { SendInvoiceByEmailUseCase } from "../../../application/invoice/SendInvoiceByEmailUseCase";
import { UpdateInvoicePaymentUseCase, PaymentDetails } from "../../../application/invoice/UpdateInvoicePaymentUseCase";
import { PdfGenerationService } from "../../services/PdfGenerationService";

export class InvoiceController {
	constructor(
		private invoiceRepository: InvoiceRepository,
		private syncInvoiceWithSriUseCase: SyncInvoiceWithSriUseCase,
		private sendInvoiceByEmailUseCase: SendInvoiceByEmailUseCase,
		private updateInvoicePaymentUseCase: UpdateInvoicePaymentUseCase,
		private pdfGenerationService: PdfGenerationService
	) {}

	async getAllInvoices(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {
				page = 1,
				limit = 10,
				status,
				type,
				clientId,
				startDate,
				endDate,
			} = req.query;

			const filters: any = {};
			if (status) filters.status = status;
			if (type) filters.type = type;
			if (clientId) filters.clientId = clientId;

			if (startDate && endDate) {
				filters.issueDateRange = {
					start: new Date(startDate as string),
					end: new Date(endDate as string),
				};
			}

			const invoices = await this.invoiceRepository.findAll(
				parseInt(page as string),
				parseInt(limit as string),
				filters
			);

			res.status(200).json({
				success: true,
				data: invoices,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener facturas",
			});
		}
	}

	async getInvoice(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {invoiceId} = req.params;
			const invoice = await this.invoiceRepository.findById(invoiceId);

			if (!invoice) {
				res.status(404).json({
					success: false,
					message: "Factura no encontrada",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: invoice,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener factura",
			});
		}
	}

	async generatePdf(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {invoiceId} = req.params;
			const pdfBuffer =
				await this.pdfGenerationService.generateInvoicePdf(invoiceId);

			res.setHeader("Content-Type", "application/pdf");
			res.setHeader("Content-Disposition", `attachment; filename=Factura.pdf`);

			res.send(pdfBuffer);
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al generar PDF",
			});
		}
	}

	async syncWithSri(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {invoiceId} = req.params;
			const {config} = req.body;

			if (!config) {
				res.status(400).json({
					success: false,
					message: "Se requiere la configuración del SRI",
				});
				return;
			}

			try {
				// Intentar crear servicio SRI a través del factory
				const sriService = SriServiceFactory.createService(config);

				// Ejecutar caso de uso
				const result = await this.syncInvoiceWithSriUseCase.execute(
					invoiceId,
					req.user.id,
					sriService
				);

				res.status(200).json({
					success: true,
					message: "Factura sincronizada con el SRI",
					data: result,
				});
			} catch (factoryError) {
				// Si el servicio aún no está disponible
				res.status(503).json({
					success: false,
					 message: factoryError instanceof Error ? factoryError.message : "Error desconocido",
					inDevelopment: true,
				});
			}
		} catch (error) {
			 const typedError = handleError(error);
				res.status(400).json({
					success: false,
					message: typedError.message || "Error al sincronizar con SRI",
				});
		}
	}

	async sendInvoiceByEmail(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {invoiceId} = req.params;
			const {email, sriConfig} = req.body;

			let sriService = undefined;
			if (sriConfig) {
				try {
					sriService = SriServiceFactory.createService(sriConfig);
				} catch (factoryError) {
					// Continuar sin SRI si no está disponible
					console.warn(
						"Servicio SRI no disponible:",
						factoryError instanceof Error
							? factoryError.message
							: "Error desconocido"
					);
				}
			}

			const result = await this.sendInvoiceByEmailUseCase.execute(
				invoiceId,
				email || null,
				req.user.id,
				sriService
			);

			if (result) {
				res.status(200).json({
					success: true,
					message: "Factura enviada por email correctamente",
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudo enviar la factura por email",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al enviar factura por email",
			});
		}
	}

	async recordPayment(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {invoiceId} = req.params;
			const paymentDetails: PaymentDetails = req.body;

			// Validar datos de pago
			if (
				!paymentDetails.amount ||
				!paymentDetails.paymentMethod ||
				!paymentDetails.paymentDate
			) {
				res.status(400).json({
					success: false,
					message: "Datos de pago incompletos",
				});
				return;
			}

			const result = await this.updateInvoicePaymentUseCase.execute(
				invoiceId,
				paymentDetails,
				req.user.id
			);

			res.status(200).json({
				success: true,
				message: "Pago registrado correctamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al registrar pago",
			});
		}
	}

	async createInvoice(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const invoiceData = req.body;

			// Generar número de factura automáticamente si no se proporciona
			if (!invoiceData.invoiceNumber) {
				invoiceData.invoiceNumber =
					await this.invoiceRepository.generateInvoiceNumber();
			}

			// Establecer vendedor como el usuario actual si no se especifica
			if (!invoiceData.sellerId) {
				invoiceData.sellerId = req.user.id;
			}

			// Calcular totales si no se proporcionan
			if (!invoiceData.items || invoiceData.items.length === 0) {
				res.status(400).json({
					success: false,
					message: "La factura debe contener al menos un ítem",
				});
				return;
			}

			// Crear la factura
			const invoice = await this.invoiceRepository.create(invoiceData);

			res.status(201).json({
				success: true,
				message: "Factura creada correctamente",
				data: invoice,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al crear factura",
			});
		}
	}

	async updateInvoice(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {invoiceId} = req.params;
			const invoiceData = req.body;

			// Actualizar factura
			const updatedInvoice = await this.invoiceRepository.update(
				invoiceId,
				invoiceData
			);

			if (!updatedInvoice) {
				res.status(404).json({
					success: false,
					message: "Factura no encontrada",
				});
				return;
			}

			res.status(200).json({
				success: true,
				message: "Factura actualizada correctamente",
				data: updatedInvoice,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar factura",
			});
		}
	}

	async deleteInvoice(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {invoiceId} = req.params;
			const result = await this.invoiceRepository.delete(invoiceId);

			if (!result) {
				res.status(404).json({
					success: false,
					message: "Factura no encontrada",
				});
				return;
			}

			res.status(200).json({
				success: true,
				message: "Factura eliminada correctamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al eliminar factura",
			});
		}
	}
}