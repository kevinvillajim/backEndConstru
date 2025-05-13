// src/infrastructure/webserver/routes/enhancedProjectDashboardRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getEnhancedProjectDashboardController} from "../../config/service-factory";

const router = Router();

// Rutas para dashboard visual mejorado
router.get(
	"/projects/:projectId/enhanced-dashboard",
	authenticate,
	(req, res) => {
		const enhancedProjectDashboardController =
			getEnhancedProjectDashboardController();
		return enhancedProjectDashboardController.getEnhancedDashboard(req, res);
	}
);

// Ruta para obtener widget específico (carga optimizada)
router.get(
	"/projects/:projectId/dashboard-widget/:widgetType",
	authenticate,
	(req, res) => {
		const enhancedProjectDashboardController =
			getEnhancedProjectDashboardController();
		return enhancedProjectDashboardController.getDashboardWidget(req, res);
	}
);

export default router;
