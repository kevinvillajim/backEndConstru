// src/application/project/CreateMaterialRequestUseCase.ts
import {TaskRepository} from "../../domain/repositories/TaskRepository";
import {MaterialRepository} from "../../domain/repositories/MaterialRepository";
import {MaterialRequestRepository} from "../../domain/repositories/MaterialRequestRepository";
import {NotificationService} from "../../domain/services/NotificationService";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";
import {
	MaterialRequest,
	MaterialRequestStatus,
} from "../../domain/models/project/MaterialRequest";
import {v4 as uuidv4} from "uuid";

export class CreateMaterialRequestUseCase {
	constructor(
		private taskRepository: TaskRepository,
		private materialRepository: MaterialRepository,
		private materialRequestRepository: MaterialRequestRepository,
		private notificationService: NotificationService
	) {}

	async execute(
		taskId: string,
		materialId: string,
		quantity: number,
		requesterId: string,
		notes?: string
	): Promise<MaterialRequest> {
		// 1. Verificar que la tarea existe
		const task = await this.taskRepository.findById(taskId);

		if (!task) {
			throw new Error(`Tarea no encontrada: ${taskId}`);
		}

		// 2. Verificar que el material existe
		const material = await this.materialRepository.findById(materialId);

		if (!material) {
			throw new Error(`Material no encontrado: ${materialId}`);
		}

		// 3. Crear la solicitud de material
		const materialRequest: MaterialRequest = {
			id: uuidv4(),
			taskId,
			materialId,
			quantity,
			status: MaterialRequestStatus.PENDING,
			requesterId,
			notes,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// 4. Guardar la solicitud
		const savedRequest =
			await this.materialRequestRepository.create(materialRequest);

		// 5. Notificar al project manager o responsable de aprobaciones
		// Asumiendo que tenemos forma de obtener el ID del project manager (para simplicidad, usamos requesterId)
		await this.notificationService.sendToUser(requesterId, {
			title: "Nueva solicitud de material",
			content: `Se ha solicitado ${quantity} ${material.unitOfMeasure} de ${material.name} para la tarea "${task.name}"`,
			type: NotificationType.MATERIAL_REQUEST,
			priority: NotificationPriority.MEDIUM,
			relatedEntityType: "material_request",
			relatedEntityId: savedRequest.id,
			actionUrl: `/material-requests/${savedRequest.id}`,
			actionText: "Ver solicitud",
		});

		return savedRequest;
	}
}
