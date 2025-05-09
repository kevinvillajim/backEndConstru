// src/infrastructure/webserver/routes/calculationRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {validateCalculationRequest} from "../validators/calculationValidator";
import {validateTemplateRequest} from "../validators/templateValidator";
import {
	getCalculationController,
	getCalculationTemplateController,
} from "../../config/service-factory";

const router = Router();

// Routes for calculations
router.post(
	"/calculations/execute",
	authenticate,
	validateCalculationRequest,
	(req, res) => {
		const calculationController = getCalculationController();
		return calculationController.executeCalculation(req, res);
	}
);

router.post("/calculations/save", authenticate, (req, res) => {
	const calculationController = getCalculationController();
	return calculationController.saveCalculationResult(req, res);
});

router.get("/calculations/recommendations", authenticate, (req, res) => {
	const calculationController = getCalculationController();
	return calculationController.getRecommendations(req, res);
});

// Routes for calculation templates
router.post("/templates", authenticate, validateTemplateRequest, (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.createTemplate(req, res);
});

router.get("/templates", (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.getTemplates(req, res);
});

router.get("/templates/:id", (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.getTemplateById(req, res);
});

router.get("/templates/:id/preview", (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.previewTemplate(req, res);
});

router.put(
	"/templates/:id",
	authenticate,
	validateTemplateRequest,
	(req, res) => {
		const templateController = getCalculationTemplateController();
		return templateController.updateTemplate(req, res);
	}
);

router.delete("/templates/:id", authenticate, (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.deleteTemplate(req, res);
});

export default router;
