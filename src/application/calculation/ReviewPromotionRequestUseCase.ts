// src/application/calculation/ReviewPromotionRequestUseCase.ts
import {PromotionRequestRepository} from "../../domain/repositories/PromotionRequestRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {NotificationService} from "../../domain/services/NotificationService";
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

				switch (action) {
					case "approve":
						title = "¡Tu plantilla ha sido aprobada para promoción!";
						message = `Tu plantilla "${promotionRequest.personalTemplate?.name}" ha sido aprobada para convertirse en plantilla verificada.`;
						break;
					case "reject":
						title = "Solicitud de promoción rechazada";
						message = `La solicitud de promoción para tu plantilla "${promotionRequest.personalTemplate?.name}" ha sido rechazada.`;
						break;
					case "request_changes":
						title = "Se requieren cambios en tu plantilla";
						message = `Se han solicitado cambios para la promoción de tu plantilla "${promotionRequest.personalTemplate?.name}".`;
						break;
				}

				await this.notificationService.sendToUser(
					promotionRequest.originalAuthorId,
					{
						title,
						message,
						type: action === "approve" ? "notification" : "notification", // ✅ Usar tipo válido
						category: "template_promotion",
						data: {
							promotionRequestId: promotionRequest.id,
							templateId: promotionRequest.personalTemplateId,
							action,
						},
					}
				);
			}

			// Notificar al solicitante si es diferente del autor
			if (promotionRequest.requestedBy !== promotionRequest.originalAuthorId) {
				await this.notificationService.sendToUser(
					promotionRequest.requestedBy,
					{
						title: `Solicitud de promoción ${action === "approve" ? "aprobada" : action === "reject" ? "rechazada" : "en revisión"}`,
						message: `La solicitud de promoción para "${promotionRequest.personalTemplate?.name}" ha sido ${action === "approve" ? "aprobada" : action === "reject" ? "rechazada" : "marcada para revisión"}.`,
						type: action === "approve" ? "notification" : "notification", // ✅ Usar tipo válido
						category: "admin_action",
					}
				);
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
