// src/domain/repositories/PromotionRequestRepository.ts
import {
	CreatePromotionRequestDTO,
	UpdatePromotionRequestDTO,
	PromotionRequestData,
	PromotionRequestFilters,
	PromotionRequestStatus,
} from "../models/tracking/PromotionRequest";

export interface PromotionRequestRepository {
	/**
	 * Crea una nueva solicitud de promoción
	 */
	create(requestData: CreatePromotionRequestDTO): Promise<any>;

	/**
	 * Encuentra una solicitud por ID
	 */
	findById(id: string): Promise<any | null>;

	/**
	 * Encuentra todas las solicitudes con filtros opcionales
	 */
	findAll(filters?: PromotionRequestFilters): Promise<any[]>;

	/**
	 * Encuentra solicitudes pendientes
	 */
	findPending(): Promise<any[]>;

	/**
	 * Encuentra solicitudes por estado
	 */
	findByStatus(status: PromotionRequestStatus[]): Promise<any[]>;

	/**
	 * Encuentra solicitudes por autor
	 */
	findByAuthor(authorId: string): Promise<any[]>;

	/**
	 * Encuentra solicitudes de alta prioridad
	 */
	findHighPriority(): Promise<any[]>;

	/**
	 * Actualiza una solicitud
	 */
	update(
		id: string,
		updateData: UpdatePromotionRequestDTO
	): Promise<any | null>;

	/**
	 * Actualiza el estado de una solicitud
	 */
	updateStatus(
		id: string,
		status: PromotionRequestStatus,
		reviewedBy: string,
		reviewComments?: string
	): Promise<any | null>;

	/**
	 * Aprueba una solicitud
	 */
	approve(
		id: string,
		reviewedBy: string,
		verifiedTemplateId: string,
		reviewComments?: string
	): Promise<any | null>;

	/**
	 * Rechaza una solicitud
	 */
	reject(
		id: string,
		reviewedBy: string,
		reviewComments: string
	): Promise<any | null>;

	/**
	 * Marca como implementada
	 */
	markAsImplemented(
		id: string,
		implementationNotes?: string
	): Promise<any | null>;

	/**
	 * Obtiene estadísticas de solicitudes
	 */
	getStatistics(): Promise<{
		total: number;
		byStatus: Record<PromotionRequestStatus, number>;
		byPriority: Record<string, number>;
		averageProcessingTime: number;
		approvalRate: number;
	}>;

	/**
	 * Obtiene carga de trabajo por revisor
	 */
	getWorkloadByReviewer(): Promise<
		Array<{
			reviewerId: string;
			reviewerName: string;
			pending: number;
			completed: number;
			averageTime: number;
		}>
	>;

	/**
	 * Elimina una solicitud
	 */
	delete(id: string): Promise<boolean>;
}
