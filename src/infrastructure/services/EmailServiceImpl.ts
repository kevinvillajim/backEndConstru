// src/infrastructure/services/EmailServiceImpl.ts
import {
	EmailService,
	EmailOptions,
	EmailResult,
} from "../../domain/services/EmailService";

export class EmailServiceImpl implements EmailService {
	constructor(
		private apiKey: string,
		private fromEmail: string
	) {}

	/**
	 * Envía un email
	 */
	async sendEmail(options: EmailOptions): Promise<EmailResult> {
		try {
			// Mock implementation - log to console
			console.log(`[EMAIL] Sending email to ${options.to}`);
			console.log(`[EMAIL] Subject: ${options.subject}`);
			console.log(`[EMAIL] Content: ${options.text || options.html}`);

			// In a real implementation, you would use a service like SendGrid:
			/*
      const msg = {
        to: options.to,
        from: this.fromEmail,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments
      };
      const response = await sendgrid.send(msg);
      return {
        success: true,
        messageId: response[0].messageId
      };
      */

			// Mock successful response
			return {
				success: true,
				messageId: `mock-${Date.now()}`,
			};
		} catch (error) {
			console.error(`Error sending email to ${options.to}:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Envía una notificación por email
	 */
	async sendNotificationEmail(
		userEmail: string,
		notification: {
			title: string;
			content: string;
			actionUrl?: string;
			actionText?: string;
		}
	): Promise<EmailResult> {
		const subject = notification.title;

		// Create HTML content with action button if action URL exists
		let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.title}</h2>
        <p>${notification.content}</p>
    `;

		if (notification.actionUrl && notification.actionText) {
			htmlContent += `
        <div style="margin-top: 20px;">
          <a href="${notification.actionUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">${notification.actionText}</a>
        </div>
      `;
		}

		htmlContent += `
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Este es un email automático de CONSTRU. Por favor no responda a este correo.
        </p>
      </div>
    `;

		return this.sendEmail({
			to: userEmail,
			subject,
			html: htmlContent,
		});
	}
}
