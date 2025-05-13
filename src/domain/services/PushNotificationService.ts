// src/domain/services/PushNotificationService.ts
export interface PushNotificationOptions {
	userId: string;
	title: string;
	body: string;
	icon?: string;
	image?: string;
	data?: Record<string, any>;
	action?: {
		url: string;
		text: string;
	};
}

export interface PushNotificationResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

export interface PushNotificationService {
	/**
	 * Registra un dispositivo para recibir notificaciones push
	 */
	registerDevice(userId: string, deviceToken: string): Promise<boolean>;

	/**
	 * Elimina el registro de un dispositivo
	 */
	unregisterDevice(userId: string, deviceToken: string): Promise<boolean>;

	/**
	 * Envía una notificación push a un usuario específico
	 */
	sendToUser(
		userId: string,
		options: PushNotificationOptions
	): Promise<PushNotificationResult>;

	/**
	 * Envía una notificación push a múltiples usuarios
	 */
	sendToUsers(
		userIds: string[],
		options: PushNotificationOptions
	): Promise<PushNotificationResult[]>;
}
