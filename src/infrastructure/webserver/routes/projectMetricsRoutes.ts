// src/infrastructure/webserver/routes/projectMetricsRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getProjectMetricsController} from "../../config/service-factory";

const router = Router();

// Rutas para métricas de proyecto
router.get("/projects/:projectId/metrics", authenticate, (req, res) => {
	const projectMetricsController = getProjectMetricsController();
	return projectMetricsController.getProjectMetrics(req, res);
});

export default router;
