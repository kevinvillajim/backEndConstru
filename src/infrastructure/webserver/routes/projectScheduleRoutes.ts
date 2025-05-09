// src/infrastructure/webserver/routes/projectScheduleRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {
	getProjectScheduleController,
	getTaskController,
	getPhaseController,
} from "../../config/service-factory";
import {
	validateTaskStatus,
	validateTaskAssignment,
	validatePhaseDates,
} from "../validators/projectScheduleValidator";

const router = Router();

// Generación de cronograma
router.post("/projects/:projectId/schedule", authenticate, (req, res) => {
	const projectScheduleController = getProjectScheduleController();
	return projectScheduleController.generateSchedule(req, res);
});

// Rutas para tareas
router.get("/tasks/:taskId", authenticate, (req, res) => {
	const taskController = getTaskController();
	return taskController.getTaskDetails(req, res);
});

router.patch(
	"/tasks/:taskId/progress",
	authenticate,
	validateTaskStatus,
	(req, res) => {
		const taskController = getTaskController();
		return taskController.updateTaskProgress(req, res);
	}
);

router.patch(
	"/tasks/:taskId/assign",
	authenticate,
	validateTaskAssignment,
	(req, res) => {
		const taskController = getTaskController();
		return taskController.assignTask(req, res);
	}
);

// Rutas para fases
router.get("/phases/:phaseId", authenticate, (req, res) => {
	const phaseController = getPhaseController();
	return phaseController.getPhaseDetails(req, res);
});

router.get("/phases/:phaseId/tasks", authenticate, (req, res) => {
	const phaseController = getPhaseController();
	return phaseController.getPhaseTasks(req, res);
});

router.patch(
	"/phases/:phaseId/dates",
	authenticate,
	validatePhaseDates,
	(req, res) => {
		const phaseController = getPhaseController();
		return phaseController.updatePhaseDates(req, res);
	}
);

export default router;
