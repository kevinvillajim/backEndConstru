// src/infrastructure/webserver/routes/budgetRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getBudgetController} from "../../config/service-factory";

const router = Router();

// Ruta para generar presupuesto a partir de resultado de cálculo
router.post("/generate-from-calculation", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.generateFromCalculation(req, res);
});

// Otras rutas de presupuesto...
// router.get("/", authenticate, ...);
// router.get("/:id", authenticate, ...);
// router.put("/:id", authenticate, ...);
// router.delete("/:id", authenticate, ...);

export default router;
