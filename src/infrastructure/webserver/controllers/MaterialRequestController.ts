// src/infrastructure/webserver/controllers/MaterialRequestController.ts
import {Request, Response} from "express";
import {CreateMaterialRequestUseCase} from "../../../application/project/CreateMaterialRequestUseCase";
import {ApproveMaterialRequestUseCase} from "../../../application/project/ApproveMaterialRequestUseCase";
import {MaterialRequestRepository} from "../../../domain/repositories/MaterialRequestRepository";
import {handleError} from "../utils/errorHandler";
import {RequestWithUser} from "../middlewares/authMiddleware";
import {MaterialRequestStatus} from "../../../domain/models/project/MaterialRequest";

export class MaterialRequestController {
	constructor(
		private createMaterialRequestUseCase: CreateMaterialRequestUseCase,
		private approveMaterialRequestUseCase: ApproveMaterialRequestUseCase,
		private materialRequestRepository: MaterialRequestRepository
	) {}

	/**
	 * Crea una nueva solicitud de material para una tarea
	 */
	async createRequest(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {taskId, materialId, quantity, notes} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar parámetros
			if (!taskId || !materialId || !quantity || quantity <= 0) {
				res.status(400).json({
					success: false,
					message:
						"Parámetros inválidos. Se requiere taskId, materialId y quantity > 0",
				});
				return;
			}

			const materialRequest = await this.createMaterialRequestUseCase.execute(
				taskId,
				materialId,
				quantity,
				req.user.id,
				notes
			);

			res.status(201).json({
				success: true,
				message: "Solicitud de material creada exitosamente",
				data: materialRequest,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al crear solicitud de material",
			});
		}
	}

	/**
	 * Aprueba una solicitud de material
	 */
	async approveRequest(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {requestId} = req.params;
			const {approveQuantity, notes} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const result = await this.approveMaterialRequestUseCase.execute(
				requestId,
				req.user.id,
				approveQuantity,
				notes
			);

			res.status(200).json({
				success: true,
				message: "Solicitud de material aprobada exitosamente",
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al aprobar solicitud de material",
			});
		}
	}

	/**
	 * Rechaza una solicitud de material
	 */
	async rejectRequest(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {requestId} = req.params;
			const {reason} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar parámetros
			if (!reason) {
				res.status(400).json({
					success: false,
					message: "Se requiere especificar una razón para el rechazo",
				});
				return;
			}

			// Verificar que la solicitud existe
			const request = await this.materialRequestRepository.findById(requestId);

			if (!request) {
				res.status(404).json({
					success: false,
					message: "Solicitud no encontrada",
				});
				return;
			}

			// Actualizar estado
			await this.materialRequestRepository.update(requestId, {
				status: MaterialRequestStatus.REJECTED,
				notes: `${request.notes || ""}\nRazón de rechazo: ${reason}`,
				updatedAt: new Date(),
			});

			res.status(200).json({
				success: true,
				message: "Solicitud de material rechazada",
				data: {
					requestId,
					status: MaterialRequestStatus.REJECTED,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al rechazar solicitud de material",
			});
		}
	}

	/**
	 * Obtiene todas las solicitudes de material de un proyecto
	 */
	async getProjectRequests(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {projectId} = req.params;
			const {status} = req.query;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Filtrar por estado si se especifica
			const filters: any = {projectId};
			if (status) {
				filters.status = status;
			}

			const requests = await this.materialRequestRepository.findByProject(
				projectId,
				filters
			);

			res.status(200).json({
				success: true,
				data: requests,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al obtener solicitudes de material",
			});
		}
	}

	/**
	 * Confirma la recepción de materiales
	 */
	async confirmDelivery(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {requestId} = req.params;
			const {receivedQuantity, notes} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar parámetros
			if (!receivedQuantity || receivedQuantity <= 0) {
				res.status(400).json({
					success: false,
					message: "Se requiere especificar la cantidad recibida (> 0)",
				});
				return;
			}

			// Verificar que la solicitud existe y está aprobada
			const request = await this.materialRequestRepository.findById(requestId);

			if (!request) {
				res.status(404).json({
					success: false,
					message: "Solicitud no encontrada",
				});
				return;
			}

			if (request.status !== MaterialRequestStatus.APPROVED) {
				res.status(400).json({
					success: false,
					message: `La solicitud debe estar aprobada. Estado actual: ${request.status}`,
				});
				return;
			}

			// Actualizar estado
			await this.materialRequestRepository.update(requestId, {
				status: MaterialRequestStatus.DELIVERED,
				quantity: receivedQuantity, // Actualizar con la cantidad real recibida
				notes: `${request.notes || ""}\nNotas de recepción: ${notes || "Recibido"}`,
				updatedAt: new Date(),
			});

			res.status(200).json({
				success: true,
				message: "Recepción de material confirmada",
				data: {
					requestId,
					status: MaterialRequestStatus.DELIVERED,
					receivedQuantity,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al confirmar recepción",
			});
		}
	}
}
