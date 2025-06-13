// src/infrastructure/services/NotificationServiceImpl.ts
import {
	NotificationService,
	NotificationOptions,
	NotificationResult,
} from "../../domain/services/NotificationService";
import {NotificationRepository} from "../../domain/repositories/NotificationRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import { WebSocketService } from "../websocket/WebSocketService";
import {EmailService} from "../../domain/services/EmailService";
import {PushNotificationService} from "../../domain/services/PushNotificationService";
import {
	NotificationPriority,
	NotificationType,
} from "../database/entities/NotificationEntity";
import {v4 as uuidv4} from "uuid";

export class NotificationServiceImpl implements NotificationService {
	constructor(
		private notificationRepository: NotificationRepository,
		private userRepository: UserRepository,
		private projectRepository: ProjectRepository,
		private emailService: EmailService,
		private pushNotificationService: PushNotificationService
	) {}

	/**
	 * Envía una notificación a un usuario específico
	 */
	async sendToUser(
		userId: string,
		options: NotificationOptions
	): Promise<NotificationResult> {
		try {
			// 1. Verificar que el usuario existe
			const user = await this.userRepository.findById(userId);
			if (!user) {
				throw new Error(`Usuario no encontrado: ${userId}`);
			}

			// 2. Crear la notificación en la base de datos
			const notification = {
				id: uuidv4(),
				userId,
				title: options.title,
				content: options.content,
				type: options.type,
				priority:
					(options.priority as NotificationPriority) ||
					NotificationPriority.MEDIUM,
				actionUrl: options.actionUrl,
				actionText: options.actionText,
				relatedEntityType: options.relatedEntityType,
				relatedEntityId: options.relatedEntityId,
				icon: options.icon,
				expiresAt: options.expiresAt,
				isRead: false,
				emailSent: false,
				pushSent: false,
				smsSent: false,
				createdAt: new Date(),
			};

			// Guardar en base de datos
			const savedNotification =
				await this.notificationRepository.create(notification);

			// 3. Enviar notificación en tiempo real por WebSocket
			WebSocketService.getInstance().sendNotificationToUser(userId, {
				userId,
				type: options.type,
				priority:
					(options.priority as NotificationPriority) ||
					NotificationPriority.MEDIUM,
				title: options.title,
				content: options.content,
				actionUrl: options.actionUrl,
				actionText: options.actionText,
				relatedEntityType: options.relatedEntityType,
				relatedEntityId: options.relatedEntityId,
				icon: options.icon,
			});

			// 4. Verificar preferencias del usuario y enviar por canales adicionales
			const userPreferences = user.preferences?.notifications;

			// Enviar por email si está habilitado en las preferencias del usuario
			const shouldSendEmail =
				userPreferences?.email &&
				(options.sendEmail ||
					options.priority === NotificationPriority.HIGH ||
					options.priority === NotificationPriority.CRITICAL);

			if (shouldSendEmail) {
				try {
					await this.emailService.sendNotificationEmail(user.email, {
						title: options.title,
						content: options.content,
						actionUrl: options.actionUrl,
						actionText: options.actionText,
					});
					savedNotification.emailSent = true;
					await this.notificationRepository.update(savedNotification.id, {
						emailSent: true,
					});
				} catch (error) {
					console.error(
						`Error sending email notification to ${user.email}:`,
						error
					);
				}
			}

			// Enviar notificación push si está habilitado en las preferencias
			const shouldSendPush =
				userPreferences?.push &&
				(options.sendPush ||
					options.priority === NotificationPriority.HIGH ||
					options.priority === NotificationPriority.CRITICAL);

			if (shouldSendPush) {
				try {
					await this.pushNotificationService.sendToUser(userId, {
						userId,
						title: options.title,
						body: options.content,
						icon: options.icon,
						data: {
							type: options.type,
							relatedEntityType: options.relatedEntityType,
							relatedEntityId: options.relatedEntityId,
						},
						action:
							options.actionUrl && options.actionText
								? {url: options.actionUrl, text: options.actionText}
								: undefined,
					});
					savedNotification.pushSent = true;
					await this.notificationRepository.update(savedNotification.id, {
						pushSent: true,
					});
				} catch (error) {
					console.error(
						`Error sending push notification to user ${userId}:`,
						error
					);
				}
			}

			// Enviar SMS si está habilitado en las preferencias
			const shouldSendSMS =
				userPreferences?.sms &&
				(options.sendSms || options.priority === NotificationPriority.CRITICAL);

			if (shouldSendSMS) {
				// TODO: Implementar envío de SMS con un servicio real
				// Por ahora, solo actualizamos el estado
				console.log(`[SMS] Would send SMS to user ${userId}: ${options.title}`);
				savedNotification.smsSent = true;
				await this.notificationRepository.update(savedNotification.id, {
					smsSent: true,
				});
			}

			return {
				...savedNotification,
				priority: savedNotification.priority as unknown as NotificationPriority,
				success: true,
			};
		} catch (error) {
			console.error(`Error al enviar notificación a usuario ${userId}:`, error);
			return {
				id: uuidv4(),
				userId,
				title: options.title,
				content: options.content,
				type: options.type,
				priority:
					(options.priority as NotificationPriority) ||
					NotificationPriority.MEDIUM,
				isRead: false,
				createdAt: new Date(),
				success: false,
			};
		}
	}

	/**
	 * Envía una notificación a varios usuarios
	 */
	async sendToUsers(
		userIds: string[],
		options: NotificationOptions
	): Promise<NotificationResult[]> {
		const results: NotificationResult[] = [];

		for (const userId of userIds) {
			const result = await this.sendToUser(userId, options);
			results.push(result);
		}

		return results;
	}

	/**
	 * Envía una notificación a todos los usuarios de un proyecto
	 */
	async sendToProjectMembers(
		projectId: string,
		options: NotificationOptions
	): Promise<NotificationResult[]> {
		try {
			// 1. Obtener el proyecto
			const project = await this.projectRepository.findById(projectId);
			if (!project) {
				throw new Error(`Proyecto no encontrado: ${projectId}`);
			}

			// 2. Encontrar miembros del proyecto
			// Asumiendo que hay una forma de obtener todos los miembros del proyecto
			const memberUserIds: string[] = [
				project.userId, // Dueño del proyecto
				// Aquí deberías agregar otros miembros del equipo del proyecto
			];

			// 3. Enviar notificación a todos los miembros
			return this.sendToUsers(memberUserIds, options);
		} catch (error) {
			console.error(
				`Error al enviar notificación a miembros del proyecto ${projectId}:`,
				error
			);
			return [];
		}
	}

	/**
	 * Envía una notificación a todos los usuarios con un rol específico
	 */
	async sendToUsersByRole(
		role: string,
		options: NotificationOptions
	): Promise<NotificationResult[]> {
		try {
			// Obtener todos los usuarios con el rol especificado
			// Esto requeriría un método en el UserRepository para buscar por rol
			// const users = await this.userRepository.findByRole(role);
			// const userIds = users.map(user => user.id);

			// Por ahora, simularemos esta funcionalidad
			const userIds: string[] = []; // Aquí deberían ir los IDs de los usuarios con ese rol

			return this.sendToUsers(userIds, options);
		} catch (error) {
			console.error(
				`Error al enviar notificación a usuarios con rol ${role}:`,
				error
			);
			return [];
		}
	}

	async getNotifications(userId: string, filters?: any): Promise<any> {
		return await this.getUserNotifications(userId, filters);
	}

	/**
	 * Crea una notificación básica (alias para sendToUser)
	 */
	async createNotification(
		options: NotificationOptions & {userId: string}
	): Promise<NotificationResult> {
		return await this.sendToUser(options.userId, options);
	}

	/**
	 * Marca todas las notificaciones de un usuario como leídas
	 */
	async markAllAsRead(userId: string): Promise<boolean> {
		try {
			// Obtener todas las notificaciones no leídas del usuario
			const notifications = await this.notificationRepository.findByUser(
				userId,
				{isRead: false},
				{page: 1, limit: 1000}
			);

			// Marcar todas como leídas
			for (const notification of notifications.notifications) {
				await this.notificationRepository.update(notification.id, {
					isRead: true,
					readAt: new Date(),
				});
			}

			return true;
		} catch (error) {
			console.error(
				`Error marking all notifications as read for user ${userId}:`,
				error
			);
			return false;
		}
	}

	/**
	 * Crea una alerta meteorológica
	 */
	async createWeatherAlert(
		userId: string,
		weatherData: {
			condition: string;
			severity: "low" | "medium" | "high" | "critical";
			message: string;
			location?: string;
		}
	): Promise<NotificationResult> {
		return await this.sendToUser(userId, {
			title: "🌦️ Alerta Meteorológica",
			content: `${weatherData.condition}: ${weatherData.message}${weatherData.location ? ` en ${weatherData.location}` : ""}`,
			type: "weather_alert" as NotificationType,
			priority: weatherData.severity as NotificationPriority,
			sendEmail:
				weatherData.severity === "high" || weatherData.severity === "critical",
			sendPush: true,
			icon: "weather-alert",
			relatedEntityType: "weather",
			relatedEntityId: `weather-${Date.now()}`,
		});
	}

	/**
	 * Crea una alerta de cronograma
	 */
	async createScheduleAlert(
		userId: string,
		scheduleData: {
			scheduleId: string;
			activityName: string;
			alertType: "delay" | "completion" | "conflict" | "update";
			message: string;
			severity?: "low" | "medium" | "high";
		}
	): Promise<NotificationResult> {
		const severity = scheduleData.severity || "medium";
		const icons = {
			delay: "clock-alert",
			completion: "check-circle",
			conflict: "alert-triangle",
			update: "calendar",
		};

		return await this.sendToUser(userId, {
			title: `📅 Alerta de Cronograma - ${scheduleData.activityName}`,
			content: scheduleData.message,
			type: "schedule_alert" as NotificationType,
			priority: severity as NotificationPriority,
			sendEmail: severity === "high",
			sendPush: true,
			icon: icons[scheduleData.alertType],
			relatedEntityType: "schedule",
			relatedEntityId: scheduleData.scheduleId,
			actionUrl: `/schedules/${scheduleData.scheduleId}`,
			actionText: "Ver Cronograma",
		});
	}

	/**
	 * Crea una alerta de recursos
	 */
	async createResourceAlert(
		userId: string,
		resourceData: {
			resourceType: "workforce" | "equipment" | "material";
			resourceName: string;
			alertType: "shortage" | "conflict" | "availability" | "maintenance";
			message: string;
			severity?: "low" | "medium" | "high";
			projectId?: string;
		}
	): Promise<NotificationResult> {
		const severity = resourceData.severity || "medium";
		const icons = {
			workforce: "users",
			equipment: "tool",
			material: "package",
		};

		return await this.sendToUser(userId, {
			title: `🔧 Alerta de Recursos - ${resourceData.resourceName}`,
			content: resourceData.message,
			type: "resource_alert" as NotificationType,
			priority: severity as NotificationPriority,
			sendEmail: severity === "high",
			sendPush: true,
			icon: icons[resourceData.resourceType],
			relatedEntityType: "resource",
			relatedEntityId: `${resourceData.resourceType}-${resourceData.resourceName}`,
			actionUrl: resourceData.projectId
				? `/projects/${resourceData.projectId}/resources`
				: "/resources",
			actionText: "Gestionar Recursos",
		});
	}

	/**
	 * Marca una notificación como leída
	 */
	async markAsRead(notificationId: string, userId: string): Promise<boolean> {
		try {
			// Verificar que la notificación pertenece al usuario
			const notification =
				await this.notificationRepository.findById(notificationId);

			if (!notification) {
				throw new Error(`Notificación no encontrada: ${notificationId}`);
			}

			if (notification.userId !== userId) {
				throw new Error("No tienes permiso para acceder a esta notificación");
			}

			// Marcar como leída
			await this.notificationRepository.update(notificationId, {
				isRead: true,
				readAt: new Date(),
			});

			return true;
		} catch (error) {
			console.error(
				`Error al marcar notificación ${notificationId} como leída:`,
				error
			);
			return false;
		}
	}

	/**
	 * Obtiene todas las notificaciones de un usuario
	 */
	async getUserNotifications(
		userId: string,
		options?: {
			unreadOnly?: boolean;
			page?: number;
			limit?: number;
			type?: NotificationType;
		}
	): Promise<{notifications: any[]; total: number}> {
		try {
			const page = options?.page || 1;
			const limit = options?.limit || 20;

			// Construir filtros
			const filters: any = {userId};

			if (options?.unreadOnly) {
				filters.isRead = false;
			}

			if (options?.type) {
				filters.type = options.type;
			}

			// Obtener notificaciones
			return await this.notificationRepository.findByUser(userId, filters, {
				page,
				limit,
				sortBy: "createdAt",
				sortOrder: "DESC",
			});
		} catch (error) {
			console.error(
				`Error al obtener notificaciones del usuario ${userId}:`,
				error
			);
			return {notifications: [], total: 0};
		}
	}

	/**
	 * Elimina una notificación
	 */
	async deleteNotification(
		notificationId: string,
		userId: string
	): Promise<boolean> {
		try {
			// Verificar que la notificación pertenece al usuario
			const notification =
				await this.notificationRepository.findById(notificationId);

			if (!notification) {
				throw new Error(`Notificación no encontrada: ${notificationId}`);
			}

			if (notification.userId !== userId) {
				throw new Error("No tienes permiso para eliminar esta notificación");
			}

			// Eliminar la notificación
			return await this.notificationRepository.delete(notificationId);
		} catch (error) {
			console.error(`Error al eliminar notificación ${notificationId}:`, error);
			return false;
		}
	}

	/**
	 * Elimina todas las notificaciones de un usuario
	 */
	async deleteAllUserNotifications(userId: string): Promise<boolean> {
		try {
			return await this.notificationRepository.deleteByUser(userId);
		} catch (error) {
			console.error(
				`Error al eliminar todas las notificaciones del usuario ${userId}:`,
				error
			);
			return false;
		}
	}

	/**
	 * Actualiza las preferencias de notificación de un usuario
	 */
	async updateUserNotificationPreferences(
		userId: string,
		preferences: {
			email?: boolean;
			push?: boolean;
			sms?: boolean;
			projectUpdates?: boolean;
			materialRecommendations?: boolean;
			pricingAlerts?: boolean;
			weeklyReports?: boolean;
		}
	): Promise<boolean> {
		try {
			// 1. Obtener el usuario actual
			const user = await this.userRepository.findById(userId);
			if (!user) {
				throw new Error(`Usuario no encontrado: ${userId}`);
			}

			// 2. Preparar el objeto de preferencias actualizado
			const currentPreferences = user.preferences || {
				notifications: {email: true, push: true, sms: false},
				projectUpdates: true,
				materialRecommendations: true,
				pricingAlerts: true,
				weeklyReports: true,
				languagePreference: "es",
			};

			// 3. Actualizar las preferencias de notificaciones
			if (preferences.email !== undefined) {
				currentPreferences.notifications.email = preferences.email;
			}

			if (preferences.push !== undefined) {
				currentPreferences.notifications.push = preferences.push;
			}

			if (preferences.sms !== undefined) {
				currentPreferences.notifications.sms = preferences.sms;
			}

			// 4. Actualizar otras preferencias relacionadas
			if (preferences.projectUpdates !== undefined) {
				currentPreferences.projectUpdates = preferences.projectUpdates;
			}

			if (preferences.materialRecommendations !== undefined) {
				currentPreferences.materialRecommendations =
					preferences.materialRecommendations;
			}

			if (preferences.pricingAlerts !== undefined) {
				currentPreferences.pricingAlerts = preferences.pricingAlerts;
			}

			if (preferences.weeklyReports !== undefined) {
				currentPreferences.weeklyReports = preferences.weeklyReports;
			}

			// 5. Guardar las preferencias actualizadas
			await this.userRepository.update(userId, {
				preferences: currentPreferences,
			});

			return true;
		} catch (error) {
			console.error(
				`Error updating notification preferences for user ${userId}:`,
				error
			);
			return false;
		}
	}

	/**
	 * Obtiene las preferencias de notificación de un usuario
	 */
	async getUserNotificationPreferences(userId: string): Promise<any> {
		try {
			const user = await this.userRepository.findById(userId);
			if (!user) {
				throw new Error(`Usuario no encontrado: ${userId}`);
			}

			// Si el usuario no tiene preferencias, retornar valores predeterminados
			if (!user.preferences) {
				return {
					notifications: {
						email: true,
						push: true,
						sms: false,
					},
					projectUpdates: true,
					materialRecommendations: true,
					pricingAlerts: true,
					weeklyReports: true,
				};
			}

			return {
				notifications: user.preferences.notifications || {
					email: true,
					push: true,
					sms: false,
				},
				projectUpdates:
					user.preferences.projectUpdates !== undefined
						? user.preferences.projectUpdates
						: true,
				materialRecommendations:
					user.preferences.materialRecommendations !== undefined
						? user.preferences.materialRecommendations
						: true,
				pricingAlerts:
					user.preferences.pricingAlerts !== undefined
						? user.preferences.pricingAlerts
						: true,
				weeklyReports:
					user.preferences.weeklyReports !== undefined
						? user.preferences.weeklyReports
						: true,
			};
		} catch (error) {
			console.error(
				`Error getting notification preferences for user ${userId}:`,
				error
			);
			throw error;
		}
	}
}
