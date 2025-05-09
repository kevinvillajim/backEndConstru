// src/infrastructure/webserver/routes/budgetRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getBudgetController} from "../../config/service-factory";
import {validateBudgetStatusUpdate} from "../validators/budgetValidator";

const router = Router();

// Ruta para generar presupuesto a partir de resultado de cálculo
router.post("/generate-from-calculation", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.generateFromCalculation(req, res);
});

// Obtener presupuestos de un proyecto
router.get("/project/:projectId", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.getProjectBudgets(req, res);
});

// Obtener detalles de un presupuesto específico
router.get("/:budgetId", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.getBudgetDetails(req, res);
});

// Crear nueva versión de un presupuesto
router.post("/:budgetId/versions", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.createVersion(req, res);
});

// Actualizar estado de un presupuesto
router.patch(
	"/:budgetId/status",
	authenticate,
	validateBudgetStatusUpdate,
	(req, res) => {
		const budgetController = getBudgetController();
		return budgetController.updateStatus(req, res);
	}
);

router.post("/compare", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.compareBudgetVersions(req, res);
});

// Ruta para añadir costos de mano de obra e indirectos
router.post("/:budgetId/costs", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.addLaborAndIndirectCosts(req, res);
});

// Ruta para exportar presupuesto a PDF
router.get("/:budgetId/export/pdf", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.exportBudgetToPdf(req, res);
});

export default router;
