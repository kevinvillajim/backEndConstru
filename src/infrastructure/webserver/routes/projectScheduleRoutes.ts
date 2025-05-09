// src/infrastructure/webserver/routes/projectScheduleRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getProjectScheduleController} from "../../config/service-factory";

const router = Router();

// Ruta para generar cronograma de proyecto
router.post("/projects/:projectId/schedule", authenticate, (req, res) => {
	const projectScheduleController = getProjectScheduleController();
	return projectScheduleController.generateSchedule(req, res);
});

export default router;
