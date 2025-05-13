// src/infrastructure/webserver/controllers/OrderController.ts
import {Request, Response} from "express";
import {CreateOrderFromMaterialRequestsUseCase} from "../../../application/order/CreateOrderFromMaterialRequestsUseCase";
import {OrderRepository} from "../../../domain/repositories/OrderRepository";
import {OrderItemRepository} from "../../../domain/repositories/OrderItemRepository";
import {handleError} from "../utils/errorHandler";
import {User, UserRole} from "../../../domain/models/user/User";

interface RequestWithUser extends Request {
	user?: User;
}

export class OrderController {
	constructor(
		private createOrderFromMaterialRequestsUseCase: CreateOrderFromMaterialRequestsUseCase,
		private orderRepository: OrderRepository,
		private orderItemRepository: OrderItemRepository
	) {}

	/**
	 * Crea una orden a partir de solicitudes de material aprobadas
	 */
	async createFromMaterialRequests(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {materialRequestIds, shippingAddress, notes} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar entrada
			if (
				!materialRequestIds ||
				!Array.isArray(materialRequestIds) ||
				materialRequestIds.length === 0
			) {
				res.status(400).json({
					success: false,
					message: "Se requieren IDs de solicitudes de material válidos",
				});
				return;
			}

			if (
				!shippingAddress ||
				!shippingAddress.street ||
				!shippingAddress.city ||
				!shippingAddress.province
			) {
				res.status(400).json({
					success: false,
					message: "Se requiere una dirección de entrega completa",
				});
				return;
			}

			// Ejecutar caso de uso
			const result = await this.createOrderFromMaterialRequestsUseCase.execute(
				materialRequestIds,
				req.user.id,
				shippingAddress,
				notes
			);

			res.status(201).json({
				success: true,
				message: "Orden creada exitosamente",
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al crear la orden",
			});
		}
	}

	/**
	 * Obtiene las órdenes del usuario actual
	 */
	async getUserOrders(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Extraer filtros de query params
			const {status, paymentStatus, startDate, endDate} = req.query;

			const filters: any = {};
			if (status) filters.status = status;
			if (paymentStatus) filters.paymentStatus = paymentStatus;
			if (startDate) filters.startDate = new Date(startDate as string);
			if (endDate) filters.endDate = new Date(endDate as string);

			const orders = await this.orderRepository.findByUser(
				req.user.id,
				filters
			);

			res.status(200).json({
				success: true,
				data: {
					orders,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener órdenes",
			});
		}
	}

	/**
	 * Obtiene los detalles de una orden específica
	 */
	async getOrderDetails(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {orderId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Obtener la orden
			const order = await this.orderRepository.findById(orderId);

			if (!order) {
				res.status(404).json({
					success: false,
					message: "Orden no encontrada",
				});
				return;
			}

			// Verificar propiedad (o permisos de admin)
			if (order.userId !== req.user.id && req.user.role !== UserRole.ADMIN) {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para acceder a esta orden",
				});
				return;
			}

			// Obtener items de la orden
			const items = await this.orderItemRepository.findByOrder(orderId);

			res.status(200).json({
				success: true,
				data: {
					order,
					items,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener detalles de la orden",
			});
		}
	}

	/**
	 * Actualiza el estado de una orden
	 */
	async updateOrderStatus(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {orderId} = req.params;
			const {status} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar estado
			const validStatuses = [
				"pending",
				"processing",
				"shipped",
				"delivered",
				"cancelled",
			];
			if (!validStatuses.includes(status)) {
				res.status(400).json({
					success: false,
					message: "Estado no válido",
				});
				return;
			}

			// Obtener la orden para verificar permisos
			const order = await this.orderRepository.findById(orderId);

			if (!order) {
				res.status(404).json({
					success: false,
					message: "Orden no encontrada",
				});
				return;
			}

			// Solo admin o el vendedor pueden actualizar el estado
			if (
				req.user.role !== UserRole.ADMIN &&
				req.user.role !== UserRole.SELLER
			) {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para actualizar esta orden",
				});
				return;
			}

			// Actualizar estado
			const success = await this.orderRepository.updateStatus(orderId, status);

			if (success) {
				// Si la orden se marca como entregada, actualizar la fecha de entrega
				if (status === "delivered") {
					await this.orderRepository.update(orderId, {
						actualDeliveryDate: new Date(),
					});
				}

				res.status(200).json({
					success: true,
					message: "Estado de la orden actualizado",
					data: {
						orderId,
						status,
					},
				});
			} else {
				res.status(400).json({
					success: false,
					message: "No se pudo actualizar el estado de la orden",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar estado de la orden",
			});
		}
	}
}
