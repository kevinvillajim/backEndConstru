// src/infrastructure/webserver/routes/projectPredictionRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getProjectPredictionController} from "../../config/service-factory";

const router = Router();

// Rutas para predicciones de retrasos en proyectos
router.get("/projects/:projectId/predictions", authenticate, (req, res) => {
	const projectPredictionController = getProjectPredictionController();
	return projectPredictionController.predictDelays(req, res);
});

router.get(
	"/projects/:projectId/predictions/history",
	authenticate,
	(req, res) => {
		const projectPredictionController = getProjectPredictionController();
		return projectPredictionController.getPredictionHistory(req, res);
	}
);

export default router;
