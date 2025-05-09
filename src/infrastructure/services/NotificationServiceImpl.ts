// src/infrastructure/services/NotificationServiceImpl.ts
import {
	NotificationService,
	NotificationOptions,
	NotificationResult,
} from "../../domain/services/NotificationService";
import {NotificationRepository} from "../../domain/repositories/NotificationRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import {WebSocketService} from "../websocket/WebSocketService";
import {
	NotificationPriority,
	NotificationType,
} from "../database/entities/NotificationEntity";
import {v4 as uuidv4} from "uuid";

export class NotificationServiceImpl implements NotificationService {
	constructor(
		private notificationRepository: NotificationRepository,
		private userRepository: UserRepository,
		private projectRepository: ProjectRepository
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
				priority: options.priority as NotificationPriority || NotificationPriority.MEDIUM,
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
				priority: options.priority as NotificationPriority || NotificationPriority.MEDIUM,
				title: options.title,
				content: options.content,
				actionUrl: options.actionUrl,
				actionText: options.actionText,
				relatedEntityType: options.relatedEntityType,
				relatedEntityId: options.relatedEntityId,
				icon: options.icon,
			});

			// 4. Enviar por otros canales si está habilitado
			if (options.sendEmail) {
				// Implementar envío de email
				// TODO: Integrar con servicio de email
				savedNotification.emailSent = true;
				await this.notificationRepository.update(savedNotification.id, {
					emailSent: true,
				});
			}

			if (options.sendPush) {
				// Implementar envío de notificación push
				// TODO: Integrar con servicio de notificaciones push
				savedNotification.pushSent = true;
				await this.notificationRepository.update(savedNotification.id, {
					pushSent: true,
				});
			}

			if (options.sendSms) {
				// Implementar envío de SMS
				// TODO: Integrar con servicio de SMS
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
				priority: options.priority as NotificationPriority || NotificationPriority.MEDIUM,
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
}
