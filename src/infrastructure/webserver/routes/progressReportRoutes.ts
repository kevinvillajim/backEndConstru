// src/infrastructure/webserver/routes/progressReportRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getProgressReportController} from "../../config/service-factory";

const router = Router();

// Rutas para informes de progreso
router.get("/projects/:projectId/report", authenticate, (req, res) => {
	const progressReportController = getProgressReportController();
	return progressReportController.generateReport(req, res);
});

router.get(
	"/projects/:projectId/report/export/pdf",
	authenticate,
	(req, res) => {
		const progressReportController = getProgressReportController();
		return progressReportController.exportReportToPdf(req, res);
	}
);

export default router;
