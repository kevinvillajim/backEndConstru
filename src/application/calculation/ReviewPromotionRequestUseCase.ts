// src/application/calculation/ReviewPromotionRequestUseCase.ts
import {PromotionRequestRepository} from "../../domain/repositories/PromotionRequestRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {NotificationService} from "../../domain/services/NotificationService";
// ✅ CORRIGIDO: Importar NotificationType desde la entidad correcta
import {NotificationType} from "../../infrastructure/database/entities/NotificationEntity";
import {
	PromotionRequestData,
	PromotionRequestStatus,
} from "../../domain/models/tracking/PromotionRequest";
import {UserRole} from "../../domain/models/user/User";

export interface ReviewPromotionRequestInput {
	requestId: string;
	reviewedBy: string;
	action: "approve" | "reject" | "request_changes";
	reviewComments: string;
	priority?: "low" | "medium" | "high" | "urgent";
}

export class ReviewPromotionRequestUseCase {
	constructor(
		private promotionRequestRepository: PromotionRequestRepository,
		private userRepository: UserRepository,
		private notificationService: NotificationService
	) {}

	async execute(
		input: ReviewPromotionRequestInput
	): Promise<PromotionRequestData> {
		// 1. Verificar que el revisor existe y tiene permisos
		const reviewer = await this.userRepository.findById(input.reviewedBy);
		if (!reviewer) {
			throw new Error("Usuario revisor no encontrado");
		}

		if (reviewer.role !== UserRole.ADMIN) {
			throw new Error("Solo los administradores pueden revisar promociones");
		}

		// 2. Obtener la solicitud de promoción
		const promotionRequest = await this.promotionRequestRepository.findById(
			input.requestId
		);
		if (!promotionRequest) {
			throw new Error("Solicitud de promoción no encontrada");
		}

		// 3. Verificar que la solicitud esté en estado que permite revisión
		if (
			![
				PromotionRequestStatus.PENDING,
				PromotionRequestStatus.UNDER_REVIEW,
			].includes(promotionRequest.status)
		) {
			throw new Error("La solicitud no está en un estado que permita revisión");
		}

		// 4. Determinar nuevo estado basado en la acción
		let newStatus: PromotionRequestStatus;
		switch (input.action) {
			case "approve":
				newStatus = PromotionRequestStatus.APPROVED;
				break;
			case "reject":
				newStatus = PromotionRequestStatus.REJECTED;
				break;
			case "request_changes":
				newStatus = PromotionRequestStatus.UNDER_REVIEW;
				break;
			default:
				throw new Error("Acción de revisión inválida");
		}

		// 5. Actualizar la solicitud
		const updatedRequest = await this.promotionRequestRepository.updateStatus(
			input.requestId,
			newStatus,
			input.reviewedBy,
			input.reviewComments
		);

		if (!updatedRequest) {
			throw new Error("Error al actualizar la solicitud de promoción");
		}

		// 6. Actualizar prioridad si se especifica
		if (input.priority) {
			await this.promotionRequestRepository.update(input.requestId, {
				priority: input.priority,
			});
		}

		// 7. Enviar notificaciones
		await this.sendNotifications(updatedRequest, input.action);

		return this.mapToPromotionRequestData(updatedRequest);
	}

	/**
	 * Aprobar directamente una solicitud de promoción
	 */
	async approve(
		requestId: string,
		reviewedBy: string,
		reviewComments?: string
	): Promise<PromotionRequestData> {
		return this.execute({
			requestId,
			reviewedBy,
			action: "approve",
			reviewComments: reviewComments || "Solicitud aprobada",
		});
	}

	/**
	 * Rechazar una solicitud de promoción
	 */
	async reject(
		requestId: string,
		reviewedBy: string,
		reviewComments: string
	): Promise<PromotionRequestData> {
		return this.execute({
			requestId,
			reviewedBy,
			action: "reject",
			reviewComments,
		});
	}

	/**
	 * Solicitar cambios en una promoción
	 */
	async requestChanges(
		requestId: string,
		reviewedBy: string,
		reviewComments: string,
		priority?: "low" | "medium" | "high" | "urgent"
	): Promise<PromotionRequestData> {
		return this.execute({
			requestId,
			reviewedBy,
			action: "request_changes",
			reviewComments,
			priority,
		});
	}

	private async sendNotifications(
		promotionRequest: any,
		action: "approve" | "reject" | "request_changes"
	): Promise<void> {
		try {
			// Notificar al autor original
			if (promotionRequest.originalAuthorId) {
				let message = "";
				let title = "";
				let notificationType: string;

				switch (action) {
					case "approve":
						title = "¡Tu plantilla ha sido aprobada para promoción!";
						message = `Tu plantilla "${promotionRequest.personalTemplate?.name}" ha sido aprobada para convertirse en plantilla verificada.`;
						notificationType = "SUCCESS";
						break;
					case "reject":
						title = "Solicitud de promoción rechazada";
						message = `La solicitud de promoción para tu plantilla "${promotionRequest.personalTemplate?.name}" ha sido rechazada.`;
						notificationType = "WARNING";
						break;
					case "request_changes":
						title = "Se requieren cambios en tu plantilla";
						message = `Se han solicitado cambios para la promoción de tu plantilla "${promotionRequest.personalTemplate?.name}".`;
						notificationType = "INFO";
						break;
					default:
						notificationType = "INFO";
				}

				// ✅ CORRIGIDO: Usar createNotification en lugar de sendToUser
				await this.notificationService.createNotification({
					userId: promotionRequest.originalAuthorId,
					type: notificationType,
					title,
					message,
					priority: "MEDIUM",
					relatedEntityType: "PROMOTION_REQUEST",
					relatedEntityId: promotionRequest.id,
					metadata: {
						promotionRequestId: promotionRequest.id,
						templateId: promotionRequest.personalTemplateId,
						action,
						reviewComments: promotionRequest.reviewComments,
					},
				});
			}

			// Notificar al solicitante si es diferente del autor
			if (promotionRequest.requestedBy !== promotionRequest.originalAuthorId) {
				const actionText =
					action === "approve"
						? "aprobada"
						: action === "reject"
							? "rechazada"
							: "en revisión";
				const notificationType = action === "approve" ? "SUCCESS" : "INFO";

				// ✅ CORRIGIDO: Usar createNotification en lugar de sendToUser
				await this.notificationService.createNotification({
					userId: promotionRequest.requestedBy,
					type: notificationType,
					title: `Solicitud de promoción ${actionText}`,
					message: `La solicitud de promoción para "${promotionRequest.personalTemplate?.name}" ha sido ${actionText}.`,
					priority: "MEDIUM",
					relatedEntityType: "PROMOTION_REQUEST",
					relatedEntityId: promotionRequest.id,
					metadata: {
						promotionRequestId: promotionRequest.id,
						templateId: promotionRequest.personalTemplateId,
						action,
						reviewComments: promotionRequest.reviewComments,
					},
				});
			}
		} catch (error) {
			console.error("Error enviando notificaciones:", error);
			// No lanzamos error para no afectar el flujo principal
		}
	}

	private mapToPromotionRequestData(entity: any): PromotionRequestData {
		return {
			id: entity.id,
			personalTemplateId: entity.personalTemplateId,
			requestedBy: entity.requestedBy,
			originalAuthorId: entity.originalAuthorId,
			reason: entity.reason,
			detailedJustification: entity.detailedJustification,
			priority: entity.priority,
			metrics: entity.metrics,
			estimatedImpact: entity.estimatedImpact,
			creditToAuthor: entity.creditToAuthor,
			qualityScore: entity.qualityScore,
			status: entity.status,
			reviewedBy: entity.reviewedBy,
			reviewedAt: entity.reviewedAt,
			reviewComments: entity.reviewComments,
			verifiedTemplateId: entity.verifiedTemplateId,
			implementationNotes: entity.implementationNotes,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
