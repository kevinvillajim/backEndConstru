// src/infrastructure/webserver/routes/materialPropertyRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getMaterialPropertyController} from "../../config/service-factory";

const router = Router();

// Rutas para definiciones de propiedades
router.get("/categories/:categoryId/properties", (req, res) => {
	const controller = getMaterialPropertyController();
	return controller.getCategoryProperties(req, res);
});

router.post("/properties", authenticate, (req, res) => {
	const controller = getMaterialPropertyController();
	return controller.createPropertyDefinition(req, res);
});

router.put("/properties/:definitionId", authenticate, (req, res) => {
	const controller = getMaterialPropertyController();
	return controller.updatePropertyDefinition(req, res);
});

router.delete("/properties/:definitionId", authenticate, (req, res) => {
	const controller = getMaterialPropertyController();
	return controller.deletePropertyDefinition(req, res);
});

// Rutas para valores de propiedades
router.get("/materials/:materialId/properties", (req, res) => {
	const controller = getMaterialPropertyController();
	return controller.getMaterialProperties(req, res);
});

router.post("/materials/:materialId/properties", authenticate, (req, res) => {
	const controller = getMaterialPropertyController();
	return controller.setMaterialProperties(req, res);
});

router.delete("/materials/:materialId/properties", authenticate, (req, res) => {
	const controller = getMaterialPropertyController();
	return controller.clearMaterialProperties(req, res);
});

export default router;
