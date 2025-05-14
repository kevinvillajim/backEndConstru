// src/infrastructure/webserver/routes/invoiceRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getInvoiceController} from "../../config/service-factory";

const router = Router();

// Obtener todas las facturas con filtros opcionales
router.get("/", authenticate, (req, res) => {
	const invoiceController = getInvoiceController();
	return invoiceController.getAllInvoices(req, res);
});

// Crear nueva factura
router.post("/", authenticate, (req, res) => {
	const invoiceController = getInvoiceController();
	return invoiceController.createInvoice(req, res);
});

// Obtener factura por ID
router.get("/:invoiceId", authenticate, (req, res) => {
	const invoiceController = getInvoiceController();
	return invoiceController.getInvoice(req, res);
});

// Actualizar factura
router.put("/:invoiceId", authenticate, (req, res) => {
	const invoiceController = getInvoiceController();
	return invoiceController.updateInvoice(req, res);
});

// Eliminar factura (soft delete)
router.delete("/:invoiceId", authenticate, (req, res) => {
	const invoiceController = getInvoiceController();
	return invoiceController.deleteInvoice(req, res);
});

// Generar PDF de factura
router.get("/:invoiceId/pdf", authenticate, (req, res) => {
	const invoiceController = getInvoiceController();
	return invoiceController.generatePdf(req, res);
});

// Sincronizar con SRI
router.post("/:invoiceId/sri", authenticate, (req, res) => {
	const invoiceController = getInvoiceController();
	return invoiceController.syncWithSri(req, res);
});

// Enviar factura por email
router.post("/:invoiceId/email", authenticate, (req, res) => {
	const invoiceController = getInvoiceController();
	return invoiceController.sendInvoiceByEmail(req, res);
});

// Registrar pago
router.post("/:invoiceId/payment", authenticate, (req, res) => {
	const invoiceController = getInvoiceController();
	return invoiceController.recordPayment(req, res);
});

export default router;
