// src/infrastructure/webserver/controllers/NotificationController.ts
import {Request, Response} from "express";
import {NotificationService} from "../../../domain/services/NotificationService";
import { handleError } from "../utils/errorHandler";
import {
	getPushNotificationService,
} from "../../config/service-factory";
import {RequestWithUser} from "../middlewares/authMiddleware";

export class NotificationController {
	constructor(private notificationService: NotificationService) {}

	/**
	 * Obtiene todas las notificaciones del usuario actual
	 */
	async getUserNotifications(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {unreadOnly, page, limit, type} = req.query;

			const result = await this.notificationService.getUserNotifications(
				req.user.id,
				{
					unreadOnly: unreadOnly === "true",
					page: page ? parseInt(page as string) : undefined,
					limit: limit ? parseInt(limit as string) : undefined,
					type: type as any,
				}
			);

			res.status(200).json({
				success: true,
				data: {
					notifications: result.notifications,
					pagination: {
						total: result.total,
						page: parseInt(page as string) || 1,
						limit: parseInt(limit as string) || 20,
						pages: Math.ceil(result.total / (parseInt(limit as string) || 20)),
					},
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener notificaciones",
			});
		}
	}

	/**
	 * Marca una notificación como leída
	 */
	async markAsRead(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {notificationId} = req.params;

			const success = await this.notificationService.markAsRead(
				notificationId,
				req.user.id
			);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Notificación marcada como leída",
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudo marcar la notificación como leída",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al marcar notificación como leída",
			});
		}
	}

	/**
	 * Marca todas las notificaciones del usuario como leídas
	 */
	async markAllAsRead(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Asumir que NotificationService tiene un método markAllAsRead
			// Si no existe, se puede implementar en el repositorio
			const success = await this.notificationService["markAllAsRead"](
				req.user.id
			);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Todas las notificaciones marcadas como leídas",
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudieron marcar todas las notificaciones como leídas",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al marcar notificaciones como leídas",
			});
		}
	}

	/**
	 * Elimina una notificación
	 */
	async deleteNotification(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {notificationId} = req.params;

			const success = await this.notificationService.deleteNotification(
				notificationId,
				req.user.id
			);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Notificación eliminada",
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudo eliminar la notificación",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al eliminar notificación",
			});
		}
	}

	/**
	 * Elimina todas las notificaciones del usuario
	 */
	async deleteAllNotifications(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const success = await this.notificationService.deleteAllUserNotifications(
				req.user.id
			);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Todas las notificaciones eliminadas",
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudieron eliminar todas las notificaciones",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al eliminar notificaciones",
			});
		}
	}

	/**
	 * (Solo para testing) Envía una notificación al usuario actual
	 */
	async testSendNotification(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {title, content, type, priority, actionUrl, actionText, icon} =
				req.body;

			if (!title || !content || !type) {
				res.status(400).json({
					success: false,
					message: "Título, contenido y tipo son obligatorios",
				});
				return;
			}

			const result = await this.notificationService.sendToUser(req.user.id, {
				title,
				content,
				type,
				priority,
				actionUrl,
				actionText,
				icon,
				sendEmail: req.body.sendEmail === true,
				sendPush: req.body.sendPush === true,
				sendSms: req.body.sendSms === true,
			});

			if (result.success) {
				res.status(201).json({
					success: true,
					message: "Notificación enviada exitosamente",
					data: result,
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudo enviar la notificación",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al enviar notificación",
			});
		}
	}

	/**
	 * Obtiene las preferencias de notificación del usuario
	 */
	/**
	 * Obtiene las preferencias de notificación del usuario
	 */
	async getNotificationPreferences(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const preferences =
				await this.notificationService.getUserNotificationPreferences(
					req.user.id
				);

			res.status(200).json({
				success: true,
				data: preferences,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al obtener preferencias de notificación",
			});
		}
	}

	/**
	 * Actualiza las preferencias de notificación del usuario
	 */
	async updateNotificationPreferences(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {
				email,
				push,
				sms,
				projectUpdates,
				materialRecommendations,
				pricingAlerts,
				weeklyReports,
			} = req.body;

			const success =
				await this.notificationService.updateUserNotificationPreferences(
					req.user.id,
					{
						email,
						push,
						sms,
						projectUpdates,
						materialRecommendations,
						pricingAlerts,
						weeklyReports,
					}
				);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Preferencias de notificación actualizadas",
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudieron actualizar las preferencias de notificación",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message ||
					"Error al actualizar preferencias de notificación",
			});
		}
	}

	/**
	 * Registra un dispositivo para notificaciones push
	 */
	async registerDevice(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {deviceToken} = req.body;

			if (!deviceToken) {
				res.status(400).json({
					success: false,
					message: "Token de dispositivo requerido",
				});
				return;
			}

			const pushService = getPushNotificationService();
			const success = await pushService.registerDevice(
				req.user.id,
				deviceToken
			);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Dispositivo registrado correctamente",
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudo registrar el dispositivo",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al registrar dispositivo",
			});
		}
	}

	/**
	 * Elimina el registro de un dispositivo
	 */
	async unregisterDevice(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {deviceToken} = req.params;

			const pushService = getPushNotificationService();
			const success = await pushService.unregisterDevice(
				req.user.id,
				deviceToken
			);

			if (success) {
				res.status(200).json({
					success: true,
					message: "Dispositivo eliminado correctamente",
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudo eliminar el dispositivo",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al eliminar dispositivo",
			});
		}
	}
}
