// src/infrastructure/webserver/controllers/AdminPromotionController.ts
import {Request, Response} from "express";
import {RequestWithUser} from "../middlewares/authMiddleware";
import {handleError} from "../utils/errorHandler";
import {CreatePromotionRequestUseCase} from "../../../application/calculation/CreatePromotionRequestUseCase";
import {ReviewPromotionRequestUseCase} from "../../../application/calculation/ReviewPromotionRequestUseCase";
import {PromoteTemplateToVerifiedUseCase} from "../../../application/calculation/PromoteTemplateToVerifiedUseCase";
import {PromotionRequestRepository} from "../../../domain/repositories/PromotionRequestRepository";
import {UserRole} from "../../../domain/models/user/User";

export class AdminPromotionController {
	constructor(
		private createPromotionRequestUseCase: CreatePromotionRequestUseCase,
		private reviewPromotionRequestUseCase: ReviewPromotionRequestUseCase,
		private promoteTemplateToVerifiedUseCase: PromoteTemplateToVerifiedUseCase,
		private promotionRequestRepository: PromotionRequestRepository
	) {}

	/**
	 * POST /api/admin/promotion-requests
	 * Crear una nueva solicitud de promoción
	 */
	async createPromotionRequest(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			if (req.user?.role !== UserRole.ADMIN) {
				res.status(403).json({
					success: false,
					message: "Se requieren permisos de administrador",
				});
				return;
			}

			const {
				personalTemplateId,
				reason,
				detailedJustification,
				priority = "medium",
				estimatedImpact,
				creditToAuthor = true,
			} = req.body;

			if (!personalTemplateId || !reason) {
				res.status(400).json({
					success: false,
					message: "personalTemplateId y reason son requeridos",
				});
				return;
			}

			const promotionRequest = await this.createPromotionRequestUseCase.execute(
				{
					personalTemplateId,
					requestedBy: userId,
					reason,
					detailedJustification,
					priority,
					estimatedImpact,
					creditToAuthor,
				}
			);

			res.status(201).json({
				success: true,
				data: promotionRequest,
				message: "Solicitud de promoción creada exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error creando solicitud de promoción:", typedError);

			if (
				typedError.message.includes("no encontrada") ||
				typedError.message.includes("not found")
			) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else if (
				typedError.message.includes("criterios") ||
				typedError.message.includes("criteria")
			) {
				res.status(400).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(500).json({
					success: false,
					message: typedError.message || "Error creando solicitud de promoción",
				});
			}
		}
	}

	/**
	 * GET /api/admin/promotion-requests
	 * Obtener todas las solicitudes de promoción con filtros
	 */
	async getPromotionRequests(req: Request, res: Response): Promise<void> {
		try {
			const {
				status,
				priority,
				requestedBy,
				originalAuthorId,
				page = "1",
				limit = "10",
			} = req.query;

			// Validar paginación
			const pageNum = parseInt(page as string);
			const limitNum = parseInt(limit as string);

			if (isNaN(pageNum) || pageNum < 1) {
				res.status(400).json({
					success: false,
					message: "page debe ser un número mayor a 0",
				});
				return;
			}

			if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
				res.status(400).json({
					success: false,
					message: "limit debe ser un número entre 1 y 100",
				});
				return;
			}

			// Construir filtros
			const filters: any = {};

			if (status) {
				const statusArray = Array.isArray(status) ? status : [status];
				filters.status = statusArray;
			}

			if (priority) {
				const priorityArray = Array.isArray(priority) ? priority : [priority];
				filters.priority = priorityArray;
			}

			if (requestedBy) filters.requestedBy = requestedBy as string;
			if (originalAuthorId)
				filters.originalAuthorId = originalAuthorId as string;

			const promotionRequests =
				await this.promotionRequestRepository.findAll(filters);

			// Aplicar paginación manual (el repository no tiene paginación)
			const startIndex = (pageNum - 1) * limitNum;
			const endIndex = startIndex + limitNum;
			const paginatedRequests = promotionRequests.slice(startIndex, endIndex);

			res.status(200).json({
				success: true,
				data: {
					requests: paginatedRequests,
					pagination: {
						page: pageNum,
						limit: limitNum,
						total: promotionRequests.length,
						pages: Math.ceil(promotionRequests.length / limitNum),
					},
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo solicitudes de promoción:", typedError);

			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error obteniendo solicitudes de promoción",
			});
		}
	}

	/**
	 * GET /api/admin/promotion-requests/pending
	 * Obtener solicitudes pendientes
	 */
	async getPendingRequests(req: Request, res: Response): Promise<void> {
		try {
			const pendingRequests =
				await this.promotionRequestRepository.findPending();

			res.status(200).json({
				success: true,
				data: {
					requests: pendingRequests,
					total: pendingRequests.length,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo solicitudes pendientes:", typedError);

			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error obteniendo solicitudes pendientes",
			});
		}
	}

	/**
	 * GET /api/admin/promotion-requests/:id
	 * Obtener una solicitud específica
	 */
	async getPromotionRequestById(req: Request, res: Response): Promise<void> {
		try {
			const {id} = req.params;

			const promotionRequest =
				await this.promotionRequestRepository.findById(id);

			if (!promotionRequest) {
				res.status(404).json({
					success: false,
					message: "Solicitud de promoción no encontrada",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: promotionRequest,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo solicitud de promoción:", typedError);

			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error obteniendo solicitud de promoción",
			});
		}
	}

	/**
	 * PUT /api/admin/promotion-requests/:id/review
	 * Revisar una solicitud de promoción (aprobar/rechazar)
	 */
	async reviewPromotionRequest(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {id} = req.params;
			const {action, reviewComments, priority} = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			if (req.user?.role !== UserRole.ADMIN) {
				res.status(403).json({
					success: false,
					message: "Se requieren permisos de administrador",
				});
				return;
			}

			if (!["approve", "reject", "request_changes"].includes(action)) {
				res.status(400).json({
					success: false,
					message: "action debe ser 'approve', 'reject' o 'request_changes'",
				});
				return;
			}

			if (!reviewComments) {
				res.status(400).json({
					success: false,
					message: "reviewComments es requerido",
				});
				return;
			}

			const reviewedRequest = await this.reviewPromotionRequestUseCase.execute({
				requestId: id,
				reviewedBy: userId,
				action,
				reviewComments,
				priority,
			});

			res.status(200).json({
				success: true,
				data: reviewedRequest,
				message: `Solicitud ${action === "approve" ? "aprobada" : action === "reject" ? "rechazada" : "marcada para cambios"} exitosamente`,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error revisando solicitud de promoción:", typedError);

			if (
				typedError.message.includes("no encontrada") ||
				typedError.message.includes("not found")
			) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else if (
				typedError.message.includes("estado") ||
				typedError.message.includes("permite revisión")
			) {
				res.status(400).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(500).json({
					success: false,
					message:
						typedError.message || "Error revisando solicitud de promoción",
				});
			}
		}
	}

	/**
	 * POST /api/admin/templates/promote/:requestId
	 * Promover plantilla personal a verificada
	 */
	async promoteTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {requestId} = req.params;
			const {implementationNotes, customizations} = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			if (req.user?.role !== UserRole.ADMIN) {
				res.status(403).json({
					success: false,
					message: "Se requieren permisos de administrador",
				});
				return;
			}

			const result = await this.promoteTemplateToVerifiedUseCase.execute({
				promotionRequestId: requestId,
				implementedBy: userId,
				implementationNotes,
				customizations,
			});

			res.status(200).json({
				success: true,
				data: {
					verifiedTemplate: result.verifiedTemplate,
					promotionRequest: result.promotionRequest,
					authorCredit: result.authorCredit,
				},
				message: "Plantilla promovida a verificada exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error promoviendo plantilla:", typedError);

			if (
				typedError.message.includes("no encontrada") ||
				typedError.message.includes("not found")
			) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else if (
				typedError.message.includes("aprobada") ||
				typedError.message.includes("estado")
			) {
				res.status(400).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(500).json({
					success: false,
					message: typedError.message || "Error promoviendo plantilla",
				});
			}
		}
	}

	/**
	 * GET /api/admin/promotion-requests/stats
	 * Obtener estadísticas de solicitudes de promoción
	 */
	async getPromotionStats(req: Request, res: Response): Promise<void> {
		try {
			const stats = await this.promotionRequestRepository.getStatistics();

			res.status(200).json({
				success: true,
				data: stats,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo estadísticas de promoción:", typedError);

			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error obteniendo estadísticas de promoción",
			});
		}
	}

	/**
	 * GET /api/admin/promotion-requests/workload
	 * Obtener carga de trabajo por revisor
	 */
	async getReviewerWorkload(req: Request, res: Response): Promise<void> {
		try {
			const workload =
				await this.promotionRequestRepository.getWorkloadByReviewer();

			res.status(200).json({
				success: true,
				data: {
					reviewers: workload,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo carga de trabajo:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error obteniendo carga de trabajo",
			});
		}
	}

	/**
	 * GET /api/admin/templates/candidates
	 * Obtener candidatos para promoción
	 */
	async getPromotionCandidates(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			// Lógica para obtener plantillas candidatas
			// Por ahora retornamos array vacío
			res.status(200).json({
				success: true,
				data: [],
				message: "Funcionalidad en desarrollo",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo candidatos:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error obteniendo candidatos",
			});
		}
	}

	/**
	 * GET /api/admin/templates/recently-promoted
	 * Obtener plantillas recientemente promovidas
	 */
	async getRecentlyPromoted(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			// Lógica para obtener plantillas recientemente promovidas
			// Por ahora retornamos array vacío
			res.status(200).json({
				success: true,
				data: [],
				message: "Funcionalidad en desarrollo",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo plantillas promovidas:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error obteniendo plantillas promovidas",
			});
		}
	}
}

