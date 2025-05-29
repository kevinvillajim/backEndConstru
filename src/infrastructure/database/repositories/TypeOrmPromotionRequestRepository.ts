// src/infrastructure/database/repositories/TypeOrmPromotionRequestRepository.ts
import {Repository, In, Not} from "typeorm";
import {AppDataSource} from "../data-source";
import {PromotionRequestRepository} from "../../../domain/repositories/PromotionRequestRepository";
import {
	PromotionRequestEntity,
	PromotionRequestStatus,
	PromotionPriority,
} from "../entities/PromotionRequestEntity";
import {
	CreatePromotionRequestDTO,
	UpdatePromotionRequestDTO,
	PromotionRequestData,
	PromotionRequestFilters,
} from "../../../domain/models/tracking/PromotionRequest";

export class TypeOrmPromotionRequestRepository
	implements PromotionRequestRepository
{
	private repository: Repository<PromotionRequestEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(PromotionRequestEntity);
	}

	async create(
		requestData: CreatePromotionRequestDTO
	): Promise<PromotionRequestEntity> {
		const entity = this.repository.create({
			personalTemplateId: requestData.personalTemplateId,
			requestedBy: requestData.requestedBy,
			originalAuthorId: requestData.originalAuthorId,
			reason: requestData.reason,
			detailedJustification: requestData.detailedJustification,
			metrics: requestData.metrics,
			priority:
				(requestData.priority as PromotionPriority) || PromotionPriority.MEDIUM,
			estimatedImpact: requestData.estimatedImpact,
			creditToAuthor: requestData.creditToAuthor ?? true,
			qualityScore: requestData.qualityScore,
		});

		return await this.repository.save(entity);
	}

	async findById(id: string): Promise<PromotionRequestEntity | null> {
		return await this.repository.findOne({
			where: {id},
			relations: [
				"personalTemplate",
				"requester",
				"originalAuthor",
				"reviewer",
				"verifiedTemplate",
			],
		});
	}

	async findAll(
		filters?: PromotionRequestFilters
	): Promise<PromotionRequestEntity[]> {
		let queryBuilder = this.repository
			.createQueryBuilder("request")
			.leftJoinAndSelect("request.personalTemplate", "personalTemplate")
			.leftJoinAndSelect("request.requester", "requester")
			.leftJoinAndSelect("request.originalAuthor", "originalAuthor")
			.leftJoinAndSelect("request.reviewer", "reviewer")
			.leftJoinAndSelect("request.verifiedTemplate", "verifiedTemplate");

		if (filters) {
			if (filters.status && filters.status.length > 0) {
				queryBuilder = queryBuilder.andWhere(
					"request.status IN (:...statuses)",
					{
						statuses: filters.status,
					}
				);
			}

			if (filters.priority && filters.priority.length > 0) {
				queryBuilder = queryBuilder.andWhere(
					"request.priority IN (:...priorities)",
					{
						priorities: filters.priority,
					}
				);
			}

			if (filters.requestedBy) {
				queryBuilder = queryBuilder.andWhere(
					"request.requestedBy = :requestedBy",
					{
						requestedBy: filters.requestedBy,
					}
				);
			}

			if (filters.originalAuthorId) {
				queryBuilder = queryBuilder.andWhere(
					"request.originalAuthorId = :originalAuthorId",
					{
						originalAuthorId: filters.originalAuthorId,
					}
				);
			}

			if (filters.reviewedBy) {
				queryBuilder = queryBuilder.andWhere(
					"request.reviewedBy = :reviewedBy",
					{
						reviewedBy: filters.reviewedBy,
					}
				);
			}

			if (filters.dateFrom) {
				queryBuilder = queryBuilder.andWhere("request.createdAt >= :dateFrom", {
					dateFrom: filters.dateFrom,
				});
			}

			if (filters.dateTo) {
				queryBuilder = queryBuilder.andWhere("request.createdAt <= :dateTo", {
					dateTo: filters.dateTo,
				});
			}

			if (filters.minQualityScore !== undefined) {
				queryBuilder = queryBuilder.andWhere(
					"request.qualityScore >= :minQualityScore",
					{
						minQualityScore: filters.minQualityScore,
					}
				);
			}
		}

		return queryBuilder
			.orderBy("request.priority", "DESC")
			.addOrderBy("request.createdAt", "DESC")
			.getMany();
	}

	async findPending(): Promise<PromotionRequestEntity[]> {
		return this.findAll({
			status: [
				PromotionRequestStatus.PENDING,
				PromotionRequestStatus.UNDER_REVIEW,
			],
		});
	}

	async findByStatus(
		status: PromotionRequestStatus[]
	): Promise<PromotionRequestEntity[]> {
		return this.findAll({status});
	}

	async findByAuthor(authorId: string): Promise<PromotionRequestEntity[]> {
		return this.findAll({originalAuthorId: authorId});
	}

	async findHighPriority(): Promise<PromotionRequestEntity[]> {
		return this.findAll({
			priority: [PromotionPriority.HIGH, PromotionPriority.URGENT],
			status: [
				PromotionRequestStatus.PENDING,
				PromotionRequestStatus.UNDER_REVIEW,
			],
		});
	}

	async update(
		id: string,
		updateData: UpdatePromotionRequestDTO
	): Promise<PromotionRequestEntity | null> {
		const request = await this.repository.findOne({where: {id}});
		if (!request) return null;

		// Actualizar campos
		Object.assign(request, updateData);

		// Si se está cambiando el estado a revisado, actualizar fecha
		if (updateData.status && updateData.status !== request.status) {
			if (
				[
					PromotionRequestStatus.APPROVED,
					PromotionRequestStatus.REJECTED,
					PromotionRequestStatus.IMPLEMENTED,
				].includes(updateData.status as PromotionRequestStatus)
			) {
				request.reviewedAt = new Date();
			}
		}

		return await this.repository.save(request);
	}

	async updateStatus(
		id: string,
		status: PromotionRequestStatus,
		reviewedBy: string,
		reviewComments?: string
	): Promise<PromotionRequestEntity | null> {
		return this.update(id, {
			status,
			reviewedBy,
			reviewComments,
			reviewedAt: new Date(),
		});
	}

	async approve(
		id: string,
		reviewedBy: string,
		verifiedTemplateId: string,
		reviewComments?: string
	): Promise<PromotionRequestEntity | null> {
		return this.update(id, {
			status: PromotionRequestStatus.APPROVED,
			reviewedBy,
			reviewedAt: new Date(),
			reviewComments,
			verifiedTemplateId,
		});
	}

	async reject(
		id: string,
		reviewedBy: string,
		reviewComments: string
	): Promise<PromotionRequestEntity | null> {
		return this.update(id, {
			status: PromotionRequestStatus.REJECTED,
			reviewedBy,
			reviewedAt: new Date(),
			reviewComments,
		});
	}

	async markAsImplemented(
		id: string,
		implementationNotes?: string
	): Promise<PromotionRequestEntity | null> {
		return this.update(id, {
			status: PromotionRequestStatus.IMPLEMENTED,
			implementationNotes,
		});
	}

	async getStatistics(): Promise<{
		total: number;
		byStatus: Record<PromotionRequestStatus, number>;
		byPriority: Record<PromotionPriority, number>;
		averageProcessingTime: number;
		approvalRate: number;
	}> {
		const [total, statusCounts, priorityCounts, processingTimes] =
			await Promise.all([
				this.repository.count(),
				this.getCountsByStatus(),
				this.getCountsByPriority(),
				this.getProcessingTimes(),
			]);

		const processed =
			statusCounts[PromotionRequestStatus.APPROVED] +
			statusCounts[PromotionRequestStatus.REJECTED];
		const approvalRate =
			processed > 0
				? (statusCounts[PromotionRequestStatus.APPROVED] / processed) * 100
				: 0;

		const averageProcessingTime =
			processingTimes.length > 0
				? processingTimes.reduce((sum, time) => sum + time, 0) /
					processingTimes.length
				: 0;

		return {
			total,
			byStatus: statusCounts,
			byPriority: priorityCounts,
			averageProcessingTime,
			approvalRate,
		};
	}

	async getWorkloadByReviewer(): Promise<
		Array<{
			reviewerId: string;
			reviewerName: string;
			pending: number;
			completed: number;
			averageTime: number;
		}>
	> {
		const reviewers = await this.repository
			.createQueryBuilder("request")
			.leftJoinAndSelect("request.reviewer", "reviewer")
			.select("request.reviewedBy", "reviewerId")
			.addSelect("reviewer.firstName", "firstName")
			.addSelect("reviewer.lastName", "lastName")
			.addSelect(
				"COUNT(CASE WHEN request.status IN (:...pendingStatuses) THEN 1 END)",
				"pending"
			)
			.addSelect(
				"COUNT(CASE WHEN request.status IN (:...completedStatuses) THEN 1 END)",
				"completed"
			)
			.addSelect(
				"AVG(CASE WHEN request.reviewedAt IS NOT NULL THEN DATEDIFF(request.reviewedAt, request.createdAt) END)",
				"averageTime"
			)
			.where("request.reviewedBy IS NOT NULL")
			.setParameters({
				pendingStatuses: [
					PromotionRequestStatus.PENDING,
					PromotionRequestStatus.UNDER_REVIEW,
				],
				completedStatuses: [
					PromotionRequestStatus.APPROVED,
					PromotionRequestStatus.REJECTED,
					PromotionRequestStatus.IMPLEMENTED,
				],
			})
			.groupBy("request.reviewedBy")
			.addGroupBy("reviewer.firstName")
			.addGroupBy("reviewer.lastName")
			.getRawMany();

		return reviewers.map((r) => ({
			reviewerId: r.reviewerId,
			reviewerName: `${r.firstName} ${r.lastName}`.trim(),
			pending: parseInt(r.pending) || 0,
			completed: parseInt(r.completed) || 0,
			averageTime: parseFloat(r.averageTime) || 0,
		}));
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== 0;
	}

	// === MÉTODOS PRIVADOS ===
	private async getCountsByStatus(): Promise<
		Record<PromotionRequestStatus, number>
	> {
		const counts = await this.repository
			.createQueryBuilder("request")
			.select("request.status", "status")
			.addSelect("COUNT(*)", "count")
			.groupBy("request.status")
			.getRawMany();

		const result = {} as Record<PromotionRequestStatus, number>;

		// Inicializar con 0
		Object.values(PromotionRequestStatus).forEach((status) => {
			result[status] = 0;
		});

		// Establecer valores reales
		counts.forEach((item) => {
			result[item.status as PromotionRequestStatus] = parseInt(item.count, 10);
		});

		return result;
	}

	private async getCountsByPriority(): Promise<
		Record<PromotionPriority, number>
	> {
		const counts = await this.repository
			.createQueryBuilder("request")
			.select("request.priority", "priority")
			.addSelect("COUNT(*)", "count")
			.groupBy("request.priority")
			.getRawMany();

		const result = {} as Record<PromotionPriority, number>;

		// Inicializar con 0
		Object.values(PromotionPriority).forEach((priority) => {
			result[priority] = 0;
		});

		// Establecer valores reales
		counts.forEach((item) => {
			result[item.priority as PromotionPriority] = parseInt(item.count, 10);
		});

		return result;
	}

	private async getProcessingTimes(): Promise<number[]> {
		const processedRequests = await this.repository.find({
			where: {
				status: In([
					PromotionRequestStatus.APPROVED,
					PromotionRequestStatus.REJECTED,
					PromotionRequestStatus.IMPLEMENTED,
				]),
				reviewedAt: Not(null) as any,
			},
			select: ["createdAt", "reviewedAt"],
		});

		return processedRequests
			.filter((request) => request.reviewedAt)
			.map((request) => {
				const created = new Date(request.createdAt).getTime();
				const reviewed = new Date(request.reviewedAt!).getTime();
				return Math.floor((reviewed - created) / (1000 * 60 * 60 * 24)); // días
			});
	}
}
