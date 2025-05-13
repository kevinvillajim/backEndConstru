// src/infrastructure/webserver/routes/accountingRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getAccountingController} from "../../config/service-factory";

const router = Router();

// Obtener sistemas contables soportados
router.get("/systems", authenticate, (req, res) => {
	const accountingController = getAccountingController();
	return accountingController.getSupportedSystems(req, res);
});

// Sincronizar presupuesto con sistema contable
router.post("/budgets/:budgetId/sync", authenticate, (req, res) => {
	const accountingController = getAccountingController();
	return accountingController.syncBudget(req, res);
});

// Obtener historial de sincronizaciones
router.get("/budgets/:budgetId/sync-history", authenticate, (req, res) => {
	const accountingController = getAccountingController();
	return accountingController.getSyncHistory(req, res);
});

export default router;
