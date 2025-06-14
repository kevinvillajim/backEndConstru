// src/application/calculation/PromoteTemplateToVerifiedUseCase.ts
import {PromotionRequestRepository} from "../../domain/repositories/PromotionRequestRepository";
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {CalculationParameterRepository} from "../../domain/repositories/CalculationParameterRepository";
import {AuthorCreditRepository} from "../../domain/repositories/AuthorCreditRepository";
import {NotificationService} from "../../domain/services/NotificationService";
// ✅ CORRIGIDO: Importar NotificationType desde la entidad correcta
import {NotificationType} from "../../infrastructure/database/entities/NotificationEntity";
import {
	PromotionRequestStatus,
	PromotionRequestData,
} from "../../domain/models/tracking/PromotionRequest";
import {
	CreateCalculationTemplateDTO,
	CalculationType,
	ProfessionType,
	TemplateSource,
} from "../../domain/models/calculation/CalculationTemplate";
import {
	CreateCalculationParameterDTO,
	ParameterScope,
} from "../../domain/models/calculation/CalculationParameter";
import {CreateAuthorCreditDTO} from "../../domain/models/tracking/AuthorCredit";
import {ParameterDataType} from "../../domain/models/calculation/CalculationParameter";

export interface PromoteTemplateInput {
	promotionRequestId: string;
	implementedBy: string;
	implementationNotes?: string;
	customizations?: {
		name?: string;
		description?: string;
		necReference?: string;
		tags?: string[];
	};
}

export class PromoteTemplateToVerifiedUseCase {
	constructor(
		private promotionRequestRepository: PromotionRequestRepository,
		private userTemplateRepository: UserCalculationTemplateRepository,
		private calculationTemplateRepository: CalculationTemplateRepository,
		private calculationParameterRepository: CalculationParameterRepository,
		private authorCreditRepository: AuthorCreditRepository,
		private notificationService: NotificationService
	) {}

	async execute(input: PromoteTemplateInput): Promise<{
		verifiedTemplate: any;
		promotionRequest: PromotionRequestData;
		authorCredit: any;
	}> {
		// 1. Obtener y validar la solicitud de promoción
		const promotionRequest = await this.promotionRequestRepository.findById(
			input.promotionRequestId
		);

		if (!promotionRequest) {
			throw new Error("Solicitud de promoción no encontrada");
		}

		if (promotionRequest.status !== PromotionRequestStatus.APPROVED) {
			throw new Error("La solicitud debe estar aprobada para ser implementada");
		}

		// 2. Obtener la plantilla personal original
		const personalTemplate = await this.userTemplateRepository.findById(
			promotionRequest.personalTemplateId
		);

		if (!personalTemplate) {
			throw new Error("Plantilla personal no encontrada");
		}

		// 3. Crear la plantilla verificada
		const verifiedTemplateData: CreateCalculationTemplateDTO = {
			name: input.customizations?.name || personalTemplate.name,
			description:
				input.customizations?.description || personalTemplate.description,
			type: this.mapCategoryToCalculationType(personalTemplate.category),
			targetProfession: this.mapToProfessionType(
				personalTemplate.targetProfessions[0]
			),
			formula: personalTemplate.formula,
			necReference:
				input.customizations?.necReference || personalTemplate.necReference,
			isActive: true,
			version: 1,
			source: TemplateSource.COMMUNITY,
			isVerified: true,
			verifiedBy: input.implementedBy,
			verifiedAt: new Date(),
			isFeatured: false, // Los admins pueden marcarla como destacada después
			tags: input.customizations?.tags || personalTemplate.tags,
			shareLevel: "public",
			parameters: [], // Se crearán por separado
		};

		const verifiedTemplate =
			await this.calculationTemplateRepository.create(verifiedTemplateData);

		// 4. Crear los parámetros de la plantilla verificada
		const verifiedParameters: CreateCalculationParameterDTO[] =
			personalTemplate.parameters.map((param) => ({
				name: param.name,
				description: param.label,
				dataType: this.mapParameterType(param.type),
				scope: this.mapScopeToParameterScope(param.scope),
				displayOrder: param.displayOrder,
				isRequired: param.required,
				defaultValue: param.defaultValue?.toString(),
				minValue: param.minValue,
				maxValue: param.maxValue,
				regexPattern: param.regexPattern,
				unitOfMeasure: param.unit,
				allowedValues: param.allowedValues
					? JSON.stringify(param.allowedValues)
					: undefined,
				helpText: param.helpText,
				dependsOnParameters: param.dependsOnParameters,
				formula: param.formula,
				calculationTemplateId: verifiedTemplate.id,
			}));

		await this.calculationParameterRepository.createMany(verifiedParameters);

		// 5. Crear el crédito al autor original
		const authorCredit = await this.createAuthorCredit(
			verifiedTemplate.id,
			personalTemplate,
			promotionRequest
		);

		// 6. Actualizar la solicitud de promoción como implementada
		const updatedPromotionRequest =
			await this.promotionRequestRepository.markAsImplemented(
				input.promotionRequestId,
				input.implementationNotes
			);

		// 7. Actualizar la referencia en la solicitud
		await this.promotionRequestRepository.update(input.promotionRequestId, {
			verifiedTemplateId: verifiedTemplate.id,
		});

		// 8. Enviar notificaciones
		await this.sendSuccessNotifications(
			personalTemplate,
			verifiedTemplate,
			promotionRequest
		);

		return {
			verifiedTemplate,
			promotionRequest: this.mapToPromotionRequestData(
				updatedPromotionRequest!
			),
			authorCredit,
		};
	}

	private async createAuthorCredit(
		verifiedTemplateId: string,
		personalTemplate: any,
		promotionRequest: any
	) {
		if (!promotionRequest.creditToAuthor) {
			return null;
		}

		const creditData: CreateAuthorCreditDTO = {
			verifiedTemplateId,
			originalPersonalTemplateId: personalTemplate.id,
			originalAuthorId: personalTemplate.author.id,
			creditType: "full_author",
			creditText: `Creada originalmente por ${personalTemplate.author.name}`,
			isVisible: true,
			visibility: "public",
			contributionDescription: "Autor original de la plantilla personal",
			contributionPercentage: 100,
			originalCreationDate: personalTemplate.createdAt,
			promotionDate: new Date(),
			promotionRequestId: promotionRequest.id,
			metricsAtPromotion: promotionRequest.metrics,
			pointsAwarded: this.calculateAuthorPoints(promotionRequest.metrics),
			recognitionLevel: this.determineRecognitionLevel(
				promotionRequest.qualityScore
			),
		};

		return await this.authorCreditRepository.create(creditData);
	}

	private calculateAuthorPoints(metrics: any): number {
		// Sistema de puntos basado en métricas
		let points = 100; // Base por promoción

		// Bonus por uso
		points += Math.min(metrics.totalUsage, 200); // Máximo 200 puntos por uso

		// Bonus por usuarios únicos
		points += metrics.uniqueUsers * 2; // 2 puntos por usuario único

		// Bonus por tasa de éxito
		if (metrics.successRate > 95) points += 50;
		else if (metrics.successRate > 90) points += 25;

		// Bonus por trending
		if (metrics.trendScore > 80) points += 100;
		else if (metrics.trendScore > 60) points += 50;

		return points;
	}

	private determineRecognitionLevel(
		qualityScore: number
	): "bronze" | "silver" | "gold" | "platinum" {
		if (qualityScore >= 9) return "platinum";
		if (qualityScore >= 7.5) return "gold";
		if (qualityScore >= 6) return "silver";
		return "bronze";
	}

	private mapCategoryToCalculationType(category: string): CalculationType {
		const categoryMap: Record<string, CalculationType> = {
			estructural: CalculationType.STRUCTURAL,
			area_volumen: CalculationType.AREA_VOLUME,
			materiales: CalculationType.MATERIAL_ESTIMATION,
			presupuesto: CalculationType.BUDGET,
			instalacion: CalculationType.INSTALLATION,
			diseno: CalculationType.DESIGN,
			arquitectura: CalculationType.ARCHITECTURE,
			hvac: CalculationType.HVAC,
			seguridad: CalculationType.FIRE_SAFETY,
			eficiencia: CalculationType.EFFICIENCY,
			cimentaciones: CalculationType.FOUNDATION,
			electrico: CalculationType.ELECTRICAL,
			telecomunicaciones: CalculationType.TELECOMMUNICATIONS,
		};

		return categoryMap[category] || CalculationType.USER_DEFINED;
	}

	private mapToProfessionType(profession: string): ProfessionType {
		const professionMap: Record<string, ProfessionType> = {
			architect: ProfessionType.ARCHITECT,
			civil_engineer: ProfessionType.CIVIL_ENGINEER,
			construction_worker: ProfessionType.CONSTRUCTION_WORKER,
			plumber: ProfessionType.PLUMBER,
			electrician: ProfessionType.ELECTRICIAN,
			contractor: ProfessionType.CONTRACTOR,
			safety_engineer: ProfessionType.SAFETY_ENGINEER,
			mechanical_engineer: ProfessionType.MECHANICAL_ENGINEER,
			electrical_engineer: ProfessionType.ELECTRICAL_ENGINEER,
			telecommunications_engineer: ProfessionType.TELECOMMUNICATIONS_ENGINEER,
		};

		return professionMap[profession] || ProfessionType.ALL;
	}

	private mapScopeToParameterScope(
		scope: "input" | "internal" | "output"
	): ParameterScope {
		switch (scope) {
			case "input":
				return ParameterScope.INPUT;
			case "internal":
				return ParameterScope.INTERNAL;
			case "output":
				return ParameterScope.OUTPUT;
			default:
				throw new Error(`Invalid scope: ${scope}`);
		}
	}

	private mapParameterType(
		type: "number" | "text" | "select" | "boolean"
	): ParameterDataType {
		// ✅ CAMBIAR string por ParameterDataType
		switch (type) {
			case "number":
				return ParameterDataType.NUMBER; // ✅ USAR ENUM
			case "text":
				return ParameterDataType.STRING; // ✅ USAR ENUM
			case "select":
				return ParameterDataType.ENUM; // ✅ USAR ENUM
			case "boolean":
				return ParameterDataType.BOOLEAN; // ✅ USAR ENUM
			default:
				return ParameterDataType.STRING; // ✅ USAR ENUM
		}
	}

	private async sendSuccessNotifications(
		personalTemplate: any,
		verifiedTemplate: any,
		promotionRequest: any
	): Promise<void> {
		try {
			// ✅ CORRIGIDO: Usar createNotification en lugar de sendToUser
			// Notificar al autor original
			await this.notificationService.createNotification({
				userId: personalTemplate.author.id,
				type: "SUCCESS",
				title: "🎉 ¡Tu plantilla ahora es oficial!",
				message: `Tu plantilla "${personalTemplate.name}" ha sido promovida a plantilla verificada y ahora está disponible para toda la comunidad.`,
				priority: "HIGH",
				relatedEntityType: "VERIFIED_TEMPLATE",
				relatedEntityId: verifiedTemplate.id,
				metadata: {
					originalTemplateId: personalTemplate.id,
					verifiedTemplateId: verifiedTemplate.id,
					promotionRequestId: promotionRequest.id,
					authorPoints: this.calculateAuthorPoints(promotionRequest.metrics),
					recognitionLevel: this.determineRecognitionLevel(
						promotionRequest.qualityScore
					),
				},
			});

			// Notificar al solicitante si es diferente
			if (promotionRequest.requestedBy !== personalTemplate.author.id) {
				await this.notificationService.createNotification({
					userId: promotionRequest.requestedBy,
					type: "SUCCESS",
					title: "Promoción implementada exitosamente",
					message: `La plantilla "${personalTemplate.name}" ha sido promovida a plantilla verificada.`,
					priority: "MEDIUM",
					relatedEntityType: "VERIFIED_TEMPLATE",
					relatedEntityId: verifiedTemplate.id,
					metadata: {
						originalTemplateId: personalTemplate.id,
						verifiedTemplateId: verifiedTemplate.id,
						promotionRequestId: promotionRequest.id,
						implementationNotes: promotionRequest.implementationNotes,
					},
				});
			}
		} catch (error) {
			console.error("Error enviando notificaciones de éxito:", error);
		}
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
