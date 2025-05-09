// src/domain/repositories/NotificationRepository.ts
import {
	NotificationPriority,
	NotificationType,
} from "../../infrastructure/database/entities/NotificationEntity";

export interface Notification {
	id: string;
	userId: string;
	type: NotificationType;
	priority: NotificationPriority;
	title: string;
	content: string;
	isRead: boolean;
	readAt?: Date;
	actionUrl?: string;
	actionText?: string;
	relatedEntityType?: string;
	relatedEntityId?: string;
	icon?: string;
	expiresAt?: Date;
	emailSent: boolean;
	pushSent: boolean;
	smsSent: boolean;
	createdAt: Date;
}

export interface NotificationRepository {
	/**
	 * Encuentra una notificación por su ID
	 */
	findById(id: string): Promise<Notification | null>;

	/**
	 * Encuentra todas las notificaciones de un usuario
	 */
	findByUser(
		userId: string,
		filters?: any,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{notifications: Notification[]; total: number}>;

	/**
	 * Crea una nueva notificación
	 */
	create(notification: Omit<Notification, "readAt">): Promise<Notification>;

	/**
	 * Actualiza una notificación existente
	 */
	update(id: string, data: Partial<Notification>): Promise<boolean>;

	/**
	 * Elimina una notificación
	 */
	delete(id: string): Promise<boolean>;

	/**
	 * Elimina todas las notificaciones de un usuario
	 */
	deleteByUser(userId: string): Promise<boolean>;

	/**
	 * Marca todas las notificaciones de un usuario como leídas
	 */
	markAllAsRead(userId: string): Promise<boolean>;

	/**
	 * Cuenta el número de notificaciones no leídas de un usuario
	 */
	countUnread(userId: string): Promise<number>;
}
