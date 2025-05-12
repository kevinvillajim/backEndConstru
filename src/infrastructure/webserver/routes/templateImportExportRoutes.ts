// src/infrastructure/webserver/routes/templateImportExportRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {validateTemplateImport} from "../validators/templateImportValidator";
import {getTemplateImportExportController} from "../../config/service-factory";

const router = Router();

// Rutas de exportación
router.get("/:templateId/export", authenticate, (req, res) => {
	const controller = getTemplateImportExportController();
	return controller.exportTemplate(req, res);
});

router.get("/export-multiple", authenticate, (req, res) => {
	const controller = getTemplateImportExportController();
	return controller.exportMultipleTemplates(req, res);
});

// Rutas de importación
router.post("/import", authenticate, validateTemplateImport, (req, res) => {
	const controller = getTemplateImportExportController();
	return controller.importTemplate(req, res);
});

router.post(
	"/import-multiple",
	authenticate,
	validateTemplateImport,
	(req, res) => {
		const controller = getTemplateImportExportController();
		return controller.importMultipleTemplates(req, res);
	}
);

export default router;
