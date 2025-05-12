// src/infrastructure/webserver/routes/supplierIntegrationRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getSupplierIntegrationController} from "../../config/service-factory";

const router = Router();

// Rutas para integraciones con proveedores
router.get("/suppliers", authenticate, (req, res) => {
	const controller = getSupplierIntegrationController();
	return controller.listSuppliers(req, res);
});

router.get("/suppliers/:supplierId/products", authenticate, (req, res) => {
	const controller = getSupplierIntegrationController();
	return controller.getSupplierProducts(req, res);
});

router.get("/suppliers/:supplierId/search", authenticate, (req, res) => {
	const controller = getSupplierIntegrationController();
	return controller.searchSupplierProducts(req, res);
});

router.post("/suppliers/:supplierId/import", authenticate, (req, res) => {
	const controller = getSupplierIntegrationController();
	return controller.importProducts(req, res);
});

export default router;
