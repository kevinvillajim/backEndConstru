// src/application/project/ApproveMaterialRequestUseCase.ts
import {MaterialRequestRepository} from "../../domain/repositories/MaterialRequestRepository";
import {MaterialRepository} from "../../domain/repositories/MaterialRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {NotificationService} from "../../domain/services/NotificationService";
import {MaterialRequestStatus} from "../../domain/models/project/MaterialRequest";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";

export class ApproveMaterialRequestUseCase {
	constructor(
		private materialRequestRepository: MaterialRequestRepository,
		private materialRepository: MaterialRepository,
		private userRepository: UserRepository,
		private notificationService: NotificationService
	) {}

	async execute(
		requestId: string,
		approverId: string,
		approveQuantity?: number, // Si se pasa, puede aprobar una cantidad diferente
		notes?: string
	): Promise<{
		success: boolean;
		requestId: string;
		materialId: string;
		approvedQuantity: number;
		materialName: string;
	}> {
		// 1. Verificar que la solicitud existe
		const request = await this.materialRequestRepository.findById(requestId);

		if (!request) {
			throw new Error(`Solicitud no encontrada: ${requestId}`);
		}

		// 2. Verificar si ya fue aprobada/rechazada
		if (request.status !== MaterialRequestStatus.PENDING) {
			throw new Error(
				`La solicitud ya fue procesada previamente con estado: ${request.status}`
			);
		}

		// 3. Verificar el material
		const material = await this.materialRepository.findById(request.materialId);

		if (!material) {
			throw new Error(`Material no encontrado: ${request.materialId}`);
		}

		// 4. Verificar stock disponible
		const finalQuantity = approveQuantity || request.quantity;

		if (material.stock < finalQuantity) {
			throw new Error(
				`Stock insuficiente. Disponible: ${material.stock} ${material.unitOfMeasure}`
			);
		}

		// 5. Aprobar la solicitud
		await this.materialRequestRepository.update(requestId, {
			status: MaterialRequestStatus.APPROVED,
			quantity: finalQuantity, // Actualizar cantidad si fue modificada
			notes: notes
				? `${request.notes || ""}\nNotas de aprobación: ${notes}`
				: request.notes,
			updatedAt: new Date(),
		});

		// 6. Actualizar el stock del material
		await this.materialRepository.updateStock(material.id, -finalQuantity);

		// 7. Notificar al solicitante
		const requester = await this.userRepository.findById(request.requesterId);

		if (requester) {
			await this.notificationService.sendToUser(requester.id, {
				title: "Solicitud de material aprobada",
				content: `Tu solicitud de ${finalQuantity} ${material.unitOfMeasure} de ${material.name} ha sido aprobada.`,
				type: NotificationType.MATERIAL_REQUEST,
				priority: NotificationPriority.MEDIUM,
				relatedEntityType: "material_request",
				relatedEntityId: requestId,
				actionUrl: `/material-requests/${requestId}`,
				actionText: "Ver detalles",
			});
		}

		return {
			success: true,
			requestId,
			materialId: material.id,
			approvedQuantity: finalQuantity,
			materialName: material.name,
		};
	}
}
