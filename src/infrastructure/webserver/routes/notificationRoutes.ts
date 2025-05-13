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

// Rutas para gestionar preferencias de notificaciones
router.get("/preferences", authenticate, (req, res) => {
  const notificationController = getNotificationController();
  return notificationController.getNotificationPreferences(req, res);
});

router.put("/preferences", authenticate, (req, res) => {
  const notificationController = getNotificationController();
  return notificationController.updateNotificationPreferences(req, res);
});

// Rutas para gestionar dispositivos para notificaciones push
router.post("/devices", authenticate, (req, res) => {
  const notificationController = getNotificationController();
  return notificationController.registerDevice(req, res);
});

router.delete("/devices/:deviceToken", authenticate, (req, res) => {
  const notificationController = getNotificationController();
  return notificationController.unregisterDevice(req, res);
});

export default router;
