// src/application/order/CreateOrderFromMaterialRequestsUseCase.ts
import {OrderRepository} from "../../domain/repositories/OrderRepository";
import {OrderItemRepository} from "../../domain/repositories/OrderItemRepository";
import {MaterialRequestRepository} from "../../domain/repositories/MaterialRequestRepository";
import {MaterialRepository} from "../../domain/repositories/MaterialRepository";
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import {OrderStatus, PaymentStatus} from "../../domain/models/order/Order";
import {MaterialRequestStatus} from "../../domain/models/project/MaterialRequest";
import {v4 as uuidv4} from "uuid";
import {NotificationService} from "../../domain/services/NotificationService";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";

export class CreateOrderFromMaterialRequestsUseCase {
	constructor(
		private orderRepository: OrderRepository,
		private orderItemRepository: OrderItemRepository,
		private materialRequestRepository: MaterialRequestRepository,
		private materialRepository: MaterialRepository,
		private projectRepository: ProjectRepository,
		private notificationService: NotificationService
	) {}

	async execute(
		materialRequestIds: string[],
		userId: string,
		shippingAddress: any,
		notes?: string
	): Promise<{orderId: string; total: number; itemCount: number}> {
		// 1. Verificar que todas las solicitudes de material existen y están aprobadas
		const materialRequests = await Promise.all(
			materialRequestIds.map((id) =>
				this.materialRequestRepository.findById(id)
			)
		);

		const invalidRequests = materialRequests.filter(
			(request) => !request || request.status !== MaterialRequestStatus.APPROVED
		);

		if (invalidRequests.length > 0) {
			throw new Error(
				"Algunas solicitudes de material no existen o no están aprobadas"
			);
		}

		// 2. Obtener detalles de los materiales
		const materialsData = await Promise.all(
			materialRequests.map((request) =>
				this.materialRepository.findById(request!.materialId)
			)
		);

		// 3. Verificar que el proyecto existe y obtener su información
		const projectId = materialRequests[0]!.taskId.split("-")[0]; // Asumiendo formato de IDs
		const project = await this.projectRepository.findById(projectId);

		if (!project) {
			throw new Error(`Proyecto no encontrado: ${projectId}`);
		}

		// 4. Crear la orden
		const subtotal = materialsData.reduce((total, material, index) => {
			if (!material) return total;
			const request = materialRequests[index]!;
			return total + material.price * request.quantity;
		}, 0);

		const taxRate = 0.12; // 12% IVA en Ecuador
		const taxAmount = subtotal * taxRate;
		const shippingAmount = 0; // Por ahora gratuito
		const total = subtotal + taxAmount + shippingAmount;

		const order = {
			id: uuidv4(),
			projectId: project.id,
			userId,
			reference: `ORD-${Date.now().toString().slice(-6)}`,
			status: OrderStatus.PENDING,
			paymentStatus: PaymentStatus.PENDING,
			subtotal,
			taxAmount,
			shippingAmount,
			discountAmount: 0,
			total,
			notes,
			shippingAddress,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const savedOrder = await this.orderRepository.create(order);

		// 5. Crear los items de la orden
		const orderItems = materialRequests
			.map((request, index) => {
				const material = materialsData[index];
				if (!request || !material) return null;

				return {
					id: uuidv4(),
					orderId: savedOrder.id,
					materialId: material.id,
					quantity: request.quantity,
					unitPrice: material.price,
					subtotal: material.price * request.quantity,
					status: "pending",
					materialRequestId: request.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
			})
			.filter(Boolean);

		await this.orderItemRepository.createMany(orderItems as any[]);

		// 6. Actualizar el estado de las solicitudes de material
		await Promise.all(
			materialRequestIds.map((id) =>
				this.materialRequestRepository.update(id, {
					status: MaterialRequestStatus.DELIVERED,
					updatedAt: new Date(),
				})
			)
		);

		// 7. Notificar al usuario sobre la creación de la orden
		await this.notificationService.sendToUser(userId, {
			title: "Orden creada exitosamente",
			content: `Tu orden #${savedOrder.reference} por $${savedOrder.total.toFixed(2)} ha sido creada y está en proceso.`,
			type: NotificationType.MATERIAL_REQUEST,
			priority: NotificationPriority.MEDIUM,
			relatedEntityType: "order",
			relatedEntityId: savedOrder.id,
			actionUrl: `/orders/${savedOrder.id}`,
			actionText: "Ver orden",
		});

		return {
			orderId: savedOrder.id,
			total: savedOrder.total,
			itemCount: orderItems.length,
		};
	}
}
