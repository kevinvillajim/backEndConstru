// src/infrastructure/webserver/routes/projectDashboardRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getProjectDashboardController} from "../../config/service-factory";

const router = Router();

// Rutas para dashboard de proyecto
router.get("/projects/:projectId/dashboard", authenticate, (req, res) => {
	const projectDashboardController = getProjectDashboardController();
	return projectDashboardController.getProjectDashboard(req, res);
});

export default router;
