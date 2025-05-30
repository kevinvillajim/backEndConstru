// src/domain/services/NotificationService.ts
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";

export interface NotificationOptions {
	title: string;
	content: string;
	type: NotificationType;
	priority?: NotificationPriority;
	actionUrl?: string;
	actionText?: string;
	relatedEntityType?: string;
	relatedEntityId?: string;
	icon?: string;
	expiresAt?: Date;
	sendEmail?: boolean;
	sendPush?: boolean;
	sendSms?: boolean;
}

export interface NotificationResult {
	id: string;
	userId: string;
	title: string;
	content: string;
	type: NotificationType;
	priority: NotificationPriority;
	isRead: boolean;
	createdAt: Date;
	success: boolean;
	emailSent?: boolean;
	pushSent?: boolean;
	smsSent?: boolean;
}

/**
 * Interfaz para el servicio de notificaciones
 */
export interface NotificationService {
	/**
	 * Envía una notificación a un usuario específico
	 */
	sendToUser(
		userId: string,
		options: NotificationOptions
	): Promise<NotificationResult>;

	/**
	 * Envía una notificación a varios usuarios
	 */
	sendToUsers(
		userIds: string[],
		options: NotificationOptions
	): Promise<NotificationResult[]>;

	/**
	 * Envía una notificación a todos los usuarios de un proyecto
	 */
	sendToProjectMembers(
		projectId: string,
		options: NotificationOptions
	): Promise<NotificationResult[]>;

	/**
	 * Envía una notificación a todos los usuarios con un rol específico
	 */
	sendToUsersByRole(
		role: string,
		options: NotificationOptions
	): Promise<NotificationResult[]>;

	/**
	 * Marca una notificación como leída
	 */
	markAsRead(notificationId: string, userId: string): Promise<boolean>;

	/**
	 * Obtiene todas las notificaciones de un usuario
	 */
	getUserNotifications(
		userId: string,
		options?: {
			unreadOnly?: boolean;
			page?: number;
			limit?: number;
			type?: NotificationType;
		}
	): Promise<{notifications: any[]; total: number}>;

	/**
	 * Elimina una notificación
	 */
	deleteNotification(notificationId: string, userId: string): Promise<boolean>;

	/**
	 * Elimina todas las notificaciones de un usuario
	 */
	deleteAllUserNotifications(userId: string): Promise<boolean>;

	/**
	 * Actualiza las preferencias de notificación de un usuario
	 */
	updateUserNotificationPreferences(
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
	): Promise<boolean>;

	/**
	 * Obtiene las preferencias de notificación de un usuario
	 */
	getUserNotificationPreferences(userId: string): Promise<any>;
}

export { NotificationType };
