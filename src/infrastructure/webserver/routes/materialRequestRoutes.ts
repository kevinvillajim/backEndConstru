// src/infrastructure/webserver/routes/materialRequestRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getMaterialRequestController} from "../../config/service-factory";
import {validateMaterialRequest} from "../validators/materialRequestValidator";

const router = Router();

// Rutas para solicitudes de materiales
router.post("/", authenticate, validateMaterialRequest, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.createRequest(req, res);
});

router.post("/:requestId/approve", authenticate, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.approveRequest(req, res);
});

router.post("/:requestId/reject", authenticate, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.rejectRequest(req, res);
});

router.post("/:requestId/deliver", authenticate, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.confirmDelivery(req, res);
});

router.get("/project/:projectId", authenticate, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.getProjectRequests(req, res);
});

export default router;
