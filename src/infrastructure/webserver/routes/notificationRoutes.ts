// src/infrastructure/webserver/routes/notificationRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getNotificationController} from "../../config/service-factory";

const router = Router();

// Rutas para notificaciones
router.get("/", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.getUserNotifications(req, res);
});

router.patch("/:notificationId/read", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.markAsRead(req, res);
});

router.patch("/mark-all-read", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.markAllAsRead(req, res);
});

router.delete("/:notificationId", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.deleteNotification(req, res);
});

router.delete("/", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.deleteAllNotifications(req, res);
});

// Ruta para testing: enviar una notificación
router.post("/test", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.testSendNotification(req, res);
});

export default router;
