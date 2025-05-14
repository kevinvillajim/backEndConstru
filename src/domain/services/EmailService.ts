// src/domain/services/EmailService.ts
export interface EmailOptions {
	to: string;
	subject: string;
	text?: string;
	html?: string;
	attachments?: EmailAttachment[];
}

export interface EmailAttachment {
	filename: string;
	content: string | Buffer;
	contentType?: string;
}


export interface EmailResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

export interface EmailService {
	/**
	 * Envía un email
	 */
	sendEmail(options: EmailOptions): Promise<EmailResult>;

	/**
	 * Envía una notificación por email
	 */
	sendNotificationEmail(
		userEmail: string,
		notification: {
			title: string;
			content: string;
			actionUrl?: string;
			actionText?: string;
		}
	): Promise<EmailResult>;
}
