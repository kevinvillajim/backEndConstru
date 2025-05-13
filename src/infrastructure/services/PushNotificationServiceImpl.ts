// src/infrastructure/services/PushNotificationServiceImpl.ts
import {
	PushNotificationService,
	PushNotificationOptions,
	PushNotificationResult,
} from "../../domain/services/PushNotificationService";

// Mock implementation of device tokens storage
// In a real implementation, this would be stored in a database
const userDeviceTokens: Record<string, string[]> = {};

export class PushNotificationServiceImpl implements PushNotificationService {
	constructor(
		private apiKey: string,
		private appId: string
	) {}

	/**
	 * Registra un dispositivo para recibir notificaciones push
	 */
	async registerDevice(userId: string, deviceToken: string): Promise<boolean> {
		try {
			// Check if user already has devices registered
			if (!userDeviceTokens[userId]) {
				userDeviceTokens[userId] = [];
			}

			// Check if device is already registered
			if (!userDeviceTokens[userId].includes(deviceToken)) {
				userDeviceTokens[userId].push(deviceToken);
			}

			console.log(
				`[PUSH] Registered device for user ${userId}: ${deviceToken}`
			);
			return true;
		} catch (error) {
			console.error(`Error registering device for user ${userId}:`, error);
			return false;
		}
	}

	/**
	 * Elimina el registro de un dispositivo
	 */
	async unregisterDevice(
		userId: string,
		deviceToken: string
	): Promise<boolean> {
		try {
			// Check if user has devices registered
			if (userDeviceTokens[userId]) {
				userDeviceTokens[userId] = userDeviceTokens[userId].filter(
					(token) => token !== deviceToken
				);
				console.log(
					`[PUSH] Unregistered device for user ${userId}: ${deviceToken}`
				);
			}

			return true;
		} catch (error) {
			console.error(`Error unregistering device for user ${userId}:`, error);
			return false;
		}
	}

	/**
	 * Envía una notificación push a un usuario específico
	 */
	async sendToUser(
		userId: string,
		options: PushNotificationOptions
	): Promise<PushNotificationResult> {
		try {
			// Check if user has registered devices
			const deviceTokens = userDeviceTokens[userId] || [];

			if (deviceTokens.length === 0) {
				console.log(`[PUSH] No registered devices for user ${userId}`);
				return {
					success: false,
					error: "No registered devices",
				};
			}

			// Log notification (mock implementation)
			console.log(`[PUSH] Sending push notification to user ${userId}`);
			console.log(`[PUSH] Title: ${options.title}`);
			console.log(`[PUSH] Body: ${options.body}`);
			console.log(`[PUSH] Devices: ${deviceTokens.join(", ")}`);

			// In a real implementation, you would use a service like Firebase:
			/*
      const message = {
        notification: {
          title: options.title,
          body: options.body,
          icon: options.icon,
          imageUrl: options.image
        },
        data: options.data || {},
        tokens: deviceTokens
      };
      
      const response = await admin.messaging().sendMulticast(message);
      return {
        success: response.successCount > 0,
        messageId: response.responses[0].messageId
      };
      */

			// Mock successful response
			return {
				success: true,
				messageId: `push-${Date.now()}`,
			};
		} catch (error) {
			console.error(
				`Error sending push notification to user ${userId}:`,
				error
			);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Envía una notificación push a múltiples usuarios
	 */
	async sendToUsers(
		userIds: string[],
		options: PushNotificationOptions
	): Promise<PushNotificationResult[]> {
		const results: PushNotificationResult[] = [];

		for (const userId of userIds) {
			const result = await this.sendToUser(userId, options);
			results.push(result);
		}

		return results;
	}
}
