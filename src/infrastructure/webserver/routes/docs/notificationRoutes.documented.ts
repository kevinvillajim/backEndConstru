// src/infrastructure/webserver/routes/notificationRoutes.documented.ts
import {Router} from "express";
import {authenticate} from "../../middlewares/authMiddleware";
import {getNotificationController} from "../../../config/service-factory";

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Obtener notificaciones
 *     description: Obtiene todas las notificaciones del usuario actual
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filtrar solo por no leídas
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Resultados por página
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *     responses:
 *       200:
 *         description: Notificaciones obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       400:
 *         description: Error al obtener notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.getUserNotifications(req, res);
});

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Marcar como leída
 *     description: Marca una notificación como leída
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación marcada como leída exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notificación marcada como leída
 *       400:
 *         description: Error al marcar notificación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch("/:notificationId/read", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.markAsRead(req, res);
});

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Marcar todas como leídas
 *     description: Marca todas las notificaciones del usuario como leídas
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificaciones marcadas como leídas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Todas las notificaciones marcadas como leídas
 *       400:
 *         description: Error al marcar notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch("/mark-all-read", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.markAllAsRead(req, res);
});

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Eliminar notificación
 *     description: Elimina una notificación
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notificación eliminada
 *       400:
 *         description: Error al eliminar notificación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete("/:notificationId", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.deleteNotification(req, res);
});

/**
 * @swagger
 * /api/notifications/delete-all:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Eliminar todas
 *     description: Elimina todas las notificaciones del usuario
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificaciones eliminadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Todas las notificaciones eliminadas
 *       400:
 *         description: Error al eliminar notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete("/delete-all", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.deleteAllNotifications(req, res);
});

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Obtener preferencias
 *     description: Obtiene las preferencias de notificación del usuario
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferencias obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                     push:
 *                       type: boolean
 *                     sms:
 *                       type: boolean
 *                     projectUpdates:
 *                       type: boolean
 *                     materialRecommendations:
 *                       type: boolean
 *                     pricingAlerts:
 *                       type: boolean
 *                     weeklyReports:
 *                       type: boolean
 *       400:
 *         description: Error al obtener preferencias
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/preferences", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.getNotificationPreferences(req, res);
});

/**
 * @swagger
 * /api/notifications/preferences:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Actualizar preferencias
 *     description: Actualiza las preferencias de notificación del usuario
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: boolean
 *               push:
 *                 type: boolean
 *               sms:
 *                 type: boolean
 *               projectUpdates:
 *                 type: boolean
 *               materialRecommendations:
 *                 type: boolean
 *               pricingAlerts:
 *                 type: boolean
 *               weeklyReports:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferencias actualizadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Preferencias de notificación actualizadas
 *       400:
 *         description: Error al actualizar preferencias
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch("/preferences", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.updateNotificationPreferences(req, res);
});

/**
 * @swagger
 * /api/notifications/devices:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Registrar dispositivo
 *     description: Registra un dispositivo para notificaciones push
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceToken
 *             properties:
 *               deviceToken:
 *                 type: string
 *                 description: Token del dispositivo
 *     responses:
 *       200:
 *         description: Dispositivo registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dispositivo registrado correctamente
 *       400:
 *         description: Token no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/devices", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.registerDevice(req, res);
});

/**
 * @swagger
 * /api/notifications/devices/{deviceToken}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Eliminar dispositivo
 *     description: Elimina el registro de un dispositivo
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Token del dispositivo
 *     responses:
 *       200:
 *         description: Dispositivo eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dispositivo eliminado correctamente
 *       400:
 *         description: Error al eliminar dispositivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete("/devices/:deviceToken", authenticate, (req, res) => {
	const notificationController = getNotificationController();
	return notificationController.unregisterDevice(req, res);
});

export default router;
