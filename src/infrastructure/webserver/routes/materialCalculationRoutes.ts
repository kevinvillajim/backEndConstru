// src/infrastructure/webserver/routes/materialCalculationRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {validateMaterialCalculation} from "../validators/materialCalculationValidator";
import {
	getMaterialCalculationTemplateController,
	getMaterialCalculationController,
	getMaterialTrendingController,
} from "../../config/service-factory";

const router = Router();

// Templates de materiales (públicos)
router.get("/templates", (req, res) => {
	const controller = getMaterialCalculationTemplateController();
	return controller.getTemplates(req, res);
});

router.get("/templates/featured", (req, res) => {
	const controller = getMaterialCalculationTemplateController();
	return controller.getFeaturedTemplates(req, res);
});

router.get("/templates/by-type/:type", (req, res) => {
	const controller = getMaterialCalculationTemplateController();
	return controller.getTemplatesByType(req, res);
});

router.get("/templates/:id", (req, res) => {
	const controller = getMaterialCalculationTemplateController();
	return controller.getTemplateById(req, res);
});

router.get("/templates/:id/preview", (req, res) => {
	const controller = getMaterialCalculationTemplateController();
	return controller.getTemplatePreview(req, res);
});

// Ejecución de cálculos (requiere autenticación)
router.post(
	"/execute",
	authenticate,
	validateMaterialCalculation,
	(req, res) => {
		const controller = getMaterialCalculationController();
		return controller.executeCalculation(req, res);
	}
);

// Gestión de resultados
router.get("/results", authenticate, (req, res) => {
	const controller = getMaterialCalculationController();
	return controller.getUserResults(req, res);
});

router.get("/results/:id", authenticate, (req, res) => {
	const controller = getMaterialCalculationController();
	return controller.getResultById(req, res);
});

router.put("/results/:id/save", authenticate, (req, res) => {
	const controller = getMaterialCalculationController();
	return controller.toggleSaveResult(req, res);
});

router.put("/results/:id/share", authenticate, (req, res) => {
	const controller = getMaterialCalculationController();
	return controller.toggleShareResult(req, res);
});

// Trending y analytics
router.get("/trending", (req, res) => {
	const controller = getMaterialTrendingController();
	return controller.getTrending(req, res);
});

router.get("/analytics/overview", (req, res) => {
	const controller = getMaterialTrendingController();
	return controller.getAnalyticsOverview(req, res);
});

router.get("/analytics/by-type", (req, res) => {
	const controller = getMaterialTrendingController();
	return controller.getAnalyticsByType(req, res);
});

export default router;
