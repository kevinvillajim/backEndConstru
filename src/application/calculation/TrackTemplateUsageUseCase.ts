// src/application/calculation/TrackTemplateUsageUseCase.ts
import {UserTemplateUsageLogRepository} from "../../domain/repositories/UserTemplateUsageLogRepository";
import {CalculationResultRepository} from "../../domain/repositories/CalculationResultRepository";
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {CreateUsageLogDTO} from "../../domain/models/tracking/UsageLog";

export interface TrackUsageRequest {
	templateId: string;
	templateType: "personal" | "verified";
	userId: string;
	projectId?: string;
	calculationResultId: string;
	ipAddress?: string;
	userAgent?: string;
}

export class TrackTemplateUsageUseCase {
	constructor(
		private usageLogRepository: UserTemplateUsageLogRepository,
		private calculationResultRepository: CalculationResultRepository,
		private userTemplateRepository: UserCalculationTemplateRepository,
		private calculationTemplateRepository: CalculationTemplateRepository
	) {}

	async execute(
		request: TrackUsageRequest
	): Promise<{success: boolean; logId?: string}> {
		try {
			// 1. Verificar que el resultado de cálculo existe
			const calculationResult = await this.calculationResultRepository.findById(
				request.calculationResultId
			);

			if (!calculationResult) {
				throw new Error(
					`Resultado de cálculo no encontrado: ${request.calculationResultId}`
				);
			}

			// 2. Verificar que la plantilla existe
			let templateExists = false;
			if (request.templateType === "personal") {
				const personalTemplate = await this.userTemplateRepository.findById(
					request.templateId
				);
				templateExists = !!personalTemplate;
			} else {
				const verifiedTemplate =
					await this.calculationTemplateRepository.findById(request.templateId);
				templateExists = !!verifiedTemplate;
			}

			if (!templateExists) {
				throw new Error(
					`Plantilla ${request.templateType} no encontrada: ${request.templateId}`
				);
			}

			// 3. Verificar que el usuario tiene acceso al resultado
			if (calculationResult.userId !== request.userId) {
				throw new Error(
					"El usuario no tiene acceso a este resultado de cálculo"
				);
			}

			// 4. Crear el log de uso
			const logData: CreateUsageLogDTO = {
				templateId: request.templateId,
				templateType: request.templateType,
				userId: request.userId,
				projectId: request.projectId,
				calculationResultId: request.calculationResultId,
				usageDate: new Date(),
				executionTimeMs: calculationResult.executionTimeMs || 0,
				wasSuccessful: calculationResult.wasSuccessful,
				ipAddress: request.ipAddress,
				userAgent: request.userAgent,
				inputParameters: calculationResult.inputParameters,
				outputResults: calculationResult.results,
				errorMessage: calculationResult.errorMessage,
			};

			const logId = await this.usageLogRepository.create(logData);

			// 5. Actualizar contadores de uso de la plantilla
			await this.updateTemplateUsageCounters(
				request.templateId,
				request.templateType
			);

			return {
				success: true,
				logId,
			};
		} catch (error) {
			console.error("Error al trackear uso de plantilla:", error);
			return {
				success: false,
			};
		}
	}

	/**
	 * Trackea múltiples usos en batch (útil para migraciones o importaciones)
	 */
	async executeBatch(requests: TrackUsageRequest[]): Promise<{
		successful: number;
		failed: number;
		logIds: string[];
	}> {
		const results = {
			successful: 0,
			failed: 0,
			logIds: [] as string[],
		};

		for (const request of requests) {
			const result = await this.execute(request);
			if (result.success && result.logId) {
				results.successful++;
				results.logIds.push(result.logId);
			} else {
				results.failed++;
			}
		}

		return results;
	}

	/**
	 * Obtiene estadísticas de uso de una plantilla específica
	 */
	async getTemplateUsageStats(
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<{
		totalUsage: number;
		uniqueUsers: number;
		recentUsage: number;
		averageExecutionTime: number;
		successRate: number;
		lastUsed: Date | null;
		trending: number;
	}> {
		return await this.usageLogRepository.getTemplateStats(
			templateId,
			templateType
		);
	}

	/**
	 * Obtiene analytics detallados de uso
	 */
	async getUsageAnalytics(
		templateId: string,
		templateType: "personal" | "verified",
		period: "day" | "week" | "month" | "year",
		startDate: Date,
		endDate: Date
	) {
		return await this.usageLogRepository.getUsageAnalytics(
			templateId,
			templateType,
			period,
			startDate,
			endDate
		);
	}

	/**
	 * Obtiene las plantillas más usadas
	 */
	async getMostUsedTemplates(
		templateType?: "personal" | "verified",
		period?: "day" | "week" | "month",
		limit: number = 10
	) {
		return await this.usageLogRepository.getMostUsedTemplates(
			templateType,
			period,
			limit
		);
	}

	// === MÉTODOS PRIVADOS ===
	private async updateTemplateUsageCounters(
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<void> {
		try {
			if (templateType === "personal") {
				// Incrementar contador en plantilla personal
				await this.userTemplateRepository.incrementUsageCount(templateId);
			} else {
				// Incrementar contador en plantilla verificada usando el método existente
				const template =
					await this.calculationTemplateRepository.findById(templateId);
				if (template) {
					await this.calculationTemplateRepository.updateUsageStats(
						templateId,
						{
							usageCount: template.usageCount + 1,
						}
					);
				}
			}
		} catch (error) {
			console.error("Error al actualizar contadores de uso:", error);
			// No lanzamos error para no afectar el tracking principal
		}
	}
}
