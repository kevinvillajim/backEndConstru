// src/infrastructure/webserver/routes/userMaterialTemplateRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {validateUserMaterialTemplate} from "../validators/materialCalculationValidator";
import {getUserMaterialTemplateController} from "../../config/service-factory";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// CRUD de templates personales
router.post("/", validateUserMaterialTemplate, (req, res) => {
	const controller = getUserMaterialTemplateController();
	return controller.createTemplate(req, res);
});

router.get("/", (req, res) => {
	const controller = getUserMaterialTemplateController();
	return controller.getUserTemplates(req, res);
});

router.get("/public", (req, res) => {
	const controller = getUserMaterialTemplateController();
	return controller.getPublicTemplates(req, res);
});

router.get("/:id", (req, res) => {
	const controller = getUserMaterialTemplateController();
	return controller.getTemplateById(req, res);
});

router.put("/:id", validateUserMaterialTemplate, (req, res) => {
	const controller = getUserMaterialTemplateController();
	return controller.updateTemplate(req, res);
});

router.delete("/:id", (req, res) => {
	const controller = getUserMaterialTemplateController();
	return controller.deleteTemplate(req, res);
});

// Gestión de privacidad
router.put("/:id/toggle-public", (req, res) => {
	const controller = getUserMaterialTemplateController();
	return controller.togglePublic(req, res);
});

// Duplicar template oficial
router.post("/duplicate/:officialTemplateId", (req, res) => {
	const controller = getUserMaterialTemplateController();
	return controller.duplicateOfficialTemplate(req, res);
});

// Stats del usuario
router.get("/stats/usage", (req, res) => {
	const controller = getUserMaterialTemplateController();
	return controller.getUserStats(req, res);
});

export default router;
