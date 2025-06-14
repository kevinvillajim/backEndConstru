// src/domain/services/NotificationService.ts - Interface actualizada

export interface CreateNotificationRequest {
	userId: string;
	type: string;
	title: string;
	message: string;
	priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
	relatedEntityType?: string;
	relatedEntityId?: string;
	metadata?: Record<string, any>;
}

// ✅ AGREGADO: Interface para opciones de notificación
export interface NotificationOptions {
	title: string;
	content: string;
	type: string;
	priority?: string;
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

// ✅ AGREGADO: Interface para resultado de notificación
export interface NotificationResult {
	id: string;
	userId: string;
	title: string;
	content: string;
	type: string;
	priority: string;
	isRead: boolean;
	createdAt: Date;
	success: boolean;
	emailSent?: boolean;
	pushSent?: boolean;
	smsSent?: boolean;
	readAt?: Date;
	actionUrl?: string;
	actionText?: string;
	relatedEntityType?: string;
	relatedEntityId?: string;
	icon?: string;
	expiresAt?: Date;
}

export interface NotificationService {
	createNotification(request: CreateNotificationRequest): Promise<any>;

	// ✅ AGREGADO: Método sendToUser que se usa en ReviewPromotionRequestUseCase
	sendToUser(
		userId: string,
		options: NotificationOptions
	): Promise<NotificationResult>;

	// ✅ AGREGADO: Métodos adicionales que se usan en la implementación
	sendToUsers(
		userIds: string[],
		options: NotificationOptions
	): Promise<NotificationResult[]>;
	sendToProjectMembers(
		projectId: string,
		options: NotificationOptions
	): Promise<NotificationResult[]>;
	sendToUsersByRole(
		role: string,
		options: NotificationOptions
	): Promise<NotificationResult[]>;

	// Métodos básicos de gestión de notificaciones
	markAsRead(notificationId: string, userId: string): Promise<boolean>;
	markAllAsRead(userId: string): Promise<boolean>;
	getNotifications(userId: string, filters?: any): Promise<any[]>;
	deleteNotification(notificationId: string, userId: string): Promise<boolean>;
	deleteAllUserNotifications(userId: string): Promise<boolean>;

	// ✅ AGREGADO: Métodos para gestión de preferencias
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

	getUserNotificationPreferences(userId: string): Promise<any>;

	// ✅ AGREGADO: Métodos para obtener notificaciones con opciones específicas
	getUserNotifications(
		userId: string,
		options?: {
			unreadOnly?: boolean;
			page?: number;
			limit?: number;
			type?: any;
		}
	): Promise<{notifications: any[]; total: number}>;

	// Métodos específicos para tipos de notificación
	createWeatherAlert(
		request: CreateNotificationRequest & {
			metadata: {
				alertType: "rain" | "wind" | "temperature" | "storm";
				severity: "low" | "medium" | "high";
				affectedDates: Date[];
				recommendedActions: string[];
			};
		}
	): Promise<any>;

	createScheduleAlert(
		request: CreateNotificationRequest & {
			metadata: {
				scheduleId: string;
				changeType: "delay" | "cost_overrun" | "resource_conflict";
				impact: "low" | "medium" | "high";
			};
		}
	): Promise<any>;

	createSystemAlert(
		request: CreateNotificationRequest & {
			metadata: {
				component: string;
				errorCode?: string;
				resolution?: string;
			};
		}
	): Promise<any>;
}

// ✅ AGREGADO: Ejemplo de implementación base simplificada para referencia
export class BaseNotificationService implements NotificationService {
	async createNotification(request: CreateNotificationRequest): Promise<any> {
		// Implementación base
		const notification = {
			id: this.generateId(),
			...request,
			createdAt: new Date(),
			isRead: false,
			isArchived: false,
		};

		return notification;
	}

	async sendToUser(
		userId: string,
		options: NotificationOptions
	): Promise<NotificationResult> {
		// Implementación base para sendToUser
		return {
			id: this.generateId(),
			userId,
			title: options.title,
			content: options.content,
			type: options.type,
			priority: options.priority || "MEDIUM",
			isRead: false,
			createdAt: new Date(),
			success: true,
			actionUrl: options.actionUrl,
			actionText: options.actionText,
			relatedEntityType: options.relatedEntityType,
			relatedEntityId: options.relatedEntityId,
			icon: options.icon,
			expiresAt: options.expiresAt,
		};
	}

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

	async sendToProjectMembers(
		projectId: string,
		options: NotificationOptions
	): Promise<NotificationResult[]> {
		// Implementación simplificada
		return [];
	}

	async sendToUsersByRole(
		role: string,
		options: NotificationOptions
	): Promise<NotificationResult[]> {
		// Implementación simplificada
		return [];
	}

	async createWeatherAlert(
		request: CreateNotificationRequest & {
			metadata: {
				alertType: "rain" | "wind" | "temperature" | "storm";
				severity: "low" | "medium" | "high";
				affectedDates: Date[];
				recommendedActions: string[];
			};
		}
	): Promise<any> {
		const enrichedRequest = {
			...request,
			type: "WEATHER_ALERT",
			metadata: {
				...request.metadata,
				category: "weather",
				requiresAction: request.metadata.severity === "high",
			},
		};

		return this.createNotification(enrichedRequest);
	}

	async createScheduleAlert(
		request: CreateNotificationRequest & {
			metadata: {
				scheduleId: string;
				changeType: "delay" | "cost_overrun" | "resource_conflict";
				impact: "low" | "medium" | "high";
			};
		}
	): Promise<any> {
		const enrichedRequest = {
			...request,
			type: "SCHEDULE_ALERT",
			metadata: {
				...request.metadata,
				category: "schedule",
				requiresAction: request.metadata.impact === "high",
			},
		};

		return this.createNotification(enrichedRequest);
	}

	async createSystemAlert(
		request: CreateNotificationRequest & {
			metadata: {
				component: string;
				errorCode?: string;
				resolution?: string;
			};
		}
	): Promise<any> {
		const enrichedRequest = {
			...request,
			type: "SYSTEM_ALERT",
			metadata: {
				...request.metadata,
				category: "system",
				requiresAction:
					request.priority === "HIGH" || request.priority === "URGENT",
			},
		};

		return this.createNotification(enrichedRequest);
	}

	async markAsRead(notificationId: string, userId: string): Promise<boolean> {
		return true;
	}

	async markAllAsRead(userId: string): Promise<boolean> {
		return true;
	}

	async getNotifications(userId: string, filters?: any): Promise<any[]> {
		return [];
	}

	async deleteNotification(
		notificationId: string,
		userId: string
	): Promise<boolean> {
		return true;
	}

	async deleteAllUserNotifications(userId: string): Promise<boolean> {
		return true;
	}

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
		return true;
	}

	async getUserNotificationPreferences(userId: string): Promise<any> {
		return {
			notifications: {email: true, push: true, sms: false},
			projectUpdates: true,
			materialRecommendations: true,
			pricingAlerts: true,
			weeklyReports: true,
		};
	}

	async getUserNotifications(
		userId: string,
		options?: {
			unreadOnly?: boolean;
			page?: number;
			limit?: number;
			type?: any;
		}
	): Promise<{notifications: any[]; total: number}> {
		return {notifications: [], total: 0};
	}

	private generateId(): string {
		return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
