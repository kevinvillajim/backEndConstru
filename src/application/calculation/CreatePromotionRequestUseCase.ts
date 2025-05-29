// src/application/calculation/CreatePromotionRequestUseCase.ts
import {PromotionRequestRepository} from "../../domain/repositories/PromotionRequestRepository";
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {TemplateRankingRepository} from "../../domain/repositories/TemplateRankingRepository";
import {UserTemplateUsageLogRepository} from "../../domain/repositories/UserTemplateUsageLogRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {
	CreatePromotionRequestDTO,
	PromotionRequestData,
} from "../../domain/models/tracking/PromotionRequest";
import {UserRole} from "../../domain/models/user/User";

export interface CreatePromotionRequestInput {
	personalTemplateId: string;
	requestedBy: string;
	reason: string;
	detailedJustification?: string;
	priority?: "low" | "medium" | "high" | "urgent";
	estimatedImpact?: {
		potentialUsers: number;
		industryBenefit: string;
		technicalComplexity: "low" | "medium" | "high";
		maintenanceRequirement: "low" | "medium" | "high";
	};
	creditToAuthor?: boolean;
}

export class CreatePromotionRequestUseCase {
	constructor(
		private promotionRequestRepository: PromotionRequestRepository,
		private userTemplateRepository: UserCalculationTemplateRepository,
		private templateRankingRepository: TemplateRankingRepository,
		private usageLogRepository: UserTemplateUsageLogRepository,
		private userRepository: UserRepository
	) {}

	async execute(
		input: CreatePromotionRequestInput
	): Promise<PromotionRequestData> {
		// 1. Verificar que el usuario que solicita tenga permisos de admin
		const requester = await this.userRepository.findById(input.requestedBy);
		if (!requester) {
			throw new Error("Usuario solicitante no encontrado");
		}

		if (requester.role !== UserRole.ADMIN) {
			throw new Error(
				"Solo los administradores pueden crear solicitudes de promoción"
			);
		}

		// 2. Verificar que la plantilla personal existe
		const personalTemplate = await this.userTemplateRepository.findById(
			input.personalTemplateId
		);
		if (!personalTemplate) {
			throw new Error("Plantilla personal no encontrada");
		}

		// 3. Verificar que la plantilla esté activa y sea pública
		if (!personalTemplate.isActive) {
			throw new Error("La plantilla no está activa");
		}

		if (!personalTemplate.isPublic) {
			throw new Error("Solo las plantillas públicas pueden ser promovidas");
		}

		// 4. Verificar que no exista ya una solicitud de promoción para esta plantilla
		const existingRequests = await this.promotionRequestRepository.findAll({
			personalTemplateId: input.personalTemplateId,
			status: ["pending", "under_review"],
		});

		if (existingRequests.length > 0) {
			throw new Error(
				"Ya existe una solicitud de promoción pendiente para esta plantilla"
			);
		}

		// 5. Obtener métricas de la plantilla
		const metrics = await this.gatherTemplateMetrics(input.personalTemplateId);

		// 6. Validar que la plantilla cumple con los criterios mínimos
		this.validatePromotionCriteria(metrics);

		// 7. Calcular quality score
		const qualityScore = this.calculateQualityScore(metrics);

		// 8. Crear la solicitud de promoción
		const promotionRequest: CreatePromotionRequestDTO = {
			personalTemplateId: input.personalTemplateId,
			requestedBy: input.requestedBy,
			originalAuthorId: personalTemplate.author.id,
			reason: input.reason,
			detailedJustification: input.detailedJustification,
			priority: input.priority || "medium",
			metrics,
			estimatedImpact: input.estimatedImpact,
			creditToAuthor: input.creditToAuthor ?? true,
			qualityScore,
		};

		const createdRequest =
			await this.promotionRequestRepository.create(promotionRequest);

		return this.mapToPromotionRequestData(createdRequest);
	}

	private async gatherTemplateMetrics(templateId: string) {
		// Obtener estadísticas de uso
		const usageStats = await this.usageLogRepository.getTemplateStats(
			templateId,
			"personal"
		);

		// Obtener ranking más reciente
		const recentRankings = await this.templateRankingRepository.findByTemplate(
			templateId,
			"personal",
			undefined,
			1
		);

		const currentRanking = recentRankings[0];

		return {
			totalUsage: usageStats.totalUsage,
			uniqueUsers: usageStats.uniqueUsers,
			successRate: usageStats.successRate,
			averageRating: 0, // TODO: Implementar cuando se tenga sistema de ratings
			rankingPosition: currentRanking?.rankPosition || 0,
			trendScore: currentRanking?.trendScore || 0,
			growthRate: currentRanking?.growthRate || 0,
			userFeedback: [], // TODO: Implementar cuando se tenga sistema de feedback
			technicalAssessment: undefined,
		};
	}

	private validatePromotionCriteria(metrics: any): void {
		const errors: string[] = [];

		// Criterios mínimos para promoción
		if (metrics.totalUsage < 50) {
			errors.push("La plantilla debe tener al menos 50 usos");
		}

		if (metrics.uniqueUsers < 10) {
			errors.push(
				"La plantilla debe haber sido usada por al menos 10 usuarios"
			);
		}

		if (metrics.successRate < 80) {
			errors.push(
				"La plantilla debe tener una tasa de éxito del 80% o superior"
			);
		}

		if (errors.length > 0) {
			throw new Error(
				`La plantilla no cumple con los criterios de promoción: ${errors.join(", ")}`
			);
		}
	}

	private calculateQualityScore(metrics: any): number {
		// Algoritmo de calidad basado en métricas
		let score = 0;

		// Peso por uso (30%)
		const usageScore = Math.min(metrics.totalUsage / 100, 1) * 3;
		score += usageScore;

		// Peso por diversidad de usuarios (25%)
		const userScore = Math.min(metrics.uniqueUsers / 25, 1) * 2.5;
		score += userScore;

		// Peso por tasa de éxito (25%)
		const successScore = (metrics.successRate / 100) * 2.5;
		score += successScore;

		// Peso por tendencia (20%)
		const trendScore = Math.min(metrics.trendScore / 100, 1) * 2;
		score += trendScore;

		return Math.round(score * 100) / 100; // Redondear a 2 decimales
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
