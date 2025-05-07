// src/infrastructure/webserver/routes/calculationRoutes.ts
import {Router} from "express";
import {CalculationController} from "../controllers/CalculationController";
import {CalculationTemplateController} from "../controllers/CalculationTemplateController";
import {authenticate} from "../middlewares/authMiddleware";
import {validateCalculationRequest} from "../validators/calculationValidator";
import {validateTemplateRequest} from "../validators/templateValidator";
import {container} from "../../config/container";

const router = Router();

// Obtener instancias de los controladores desde el contenedor de dependencias
const calculationController = container.resolve<CalculationController>(
	"CalculationController"
);
const templateController = container.resolve<CalculationTemplateController>(
	"CalculationTemplateController"
);

// Rutas para cálculos
router.post(
	"/calculations/execute",
	authenticate,
	validateCalculationRequest,
	(req, res) => calculationController.executeCalculation(req, res)
);

router.post("/calculations/save", authenticate, (req, res) =>
	calculationController.saveCalculationResult(req, res)
);

router.get("/calculations/recommendations", authenticate, (req, res) =>
	calculationController.getRecommendations(req, res)
);

// Rutas para plantillas de cálculo
router.post("/templates", authenticate, validateTemplateRequest, (req, res) =>
	templateController.createTemplate(req, res)
);

router.get("/templates", (req, res) =>
	templateController.getTemplates(req, res)
);

router.get("/templates/:id", (req, res) =>
	templateController.getTemplateById(req, res)
);

router.get("/templates/:id/preview", (req, res) =>
	templateController.previewTemplate(req, res)
);

router.put(
	"/templates/:id",
	authenticate,
	validateTemplateRequest,
	(req, res) => templateController.updateTemplate(req, res)
);

router.delete("/templates/:id", authenticate, (req, res) =>
	templateController.deleteTemplate(req, res)
);

export default router;
