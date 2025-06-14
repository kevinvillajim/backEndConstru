// src/application/schedule/OptimizeProjectScheduleUseCase.ts

import {CalculationScheduleRepository} from "../../domain/repositories/CalculationScheduleRepository";
import {ScheduleActivityRepository} from "../../domain/repositories/ScheduleActivityRepository";
// ✅ CORRIGIDO: Importar entidad desde infrastructure
import {ScheduleActivityEntity} from "../../infrastructure/database/entities/ScheduleActivityEntity";
import {
	ScheduleActivity,
	ActivityDependency,
	ActivityStatus,
	calculateDurationVariance,
	calculateCostVariance,
	isActivityDelayed,
} from "../../domain/models/calculation/ScheduleActivity";

export interface OptimizeScheduleRequest {
	scheduleId: string;
	optimizationGoals: {
		minimizeDuration: boolean;
		minimizeCost: boolean;
		maximizeResourceUtilization: boolean;
		minimizeRisk: boolean;
	};
	constraints: {
		maxDuration?: number;
		maxBudget?: number;
		availableResources?: any[];
		fixedActivities?: string[]; // IDs de actividades que no se pueden mover
	};
	scenarios?: {
		name: string;
		parameters: any;
	}[];
}

export interface OptimizeScheduleResponse {
	originalSchedule: any;
	optimizedSchedule: any;
	improvements: {
		durationReduction: number;
		costReduction: number;
		resourceEfficiencyGain: number;
	};
	recommendedActions: {
		action: string;
		impact: string;
		priority: "high" | "medium" | "low";
	}[];
	alternativeScenarios?: any[];
}

export class OptimizeProjectScheduleUseCase {
	constructor(
		private scheduleRepository: CalculationScheduleRepository,
		private activityRepository: ScheduleActivityRepository
	) {}

	async execute(
		request: OptimizeScheduleRequest
	): Promise<OptimizeScheduleResponse> {
		// 1. Obtener cronograma actual
		const originalSchedule = await this.scheduleRepository.findById(
			request.scheduleId
		);
		if (!originalSchedule) {
			throw new Error("Schedule not found");
		}

		const activityEntities = await this.activityRepository.findByScheduleId(
			request.scheduleId
		);

		// 2. Convertir entidades a modelos de dominio
		const activities = this.mapEntitiesToDomainModels(activityEntities);

		// 3. Crear copia para optimización
		const optimizedSchedule = {...originalSchedule};
		const optimizedActivities = activities.map((a) => ({...a}));

		// 4. Aplicar algoritmos de optimización
		if (request.optimizationGoals.minimizeDuration) {
			this.optimizeForDuration(
				optimizedSchedule,
				optimizedActivities,
				request.constraints
			);
		}

		if (request.optimizationGoals.minimizeCost) {
			this.optimizeForCost(
				optimizedSchedule,
				optimizedActivities,
				request.constraints
			);
		}

		if (request.optimizationGoals.maximizeResourceUtilization) {
			this.optimizeForResources(
				optimizedSchedule,
				optimizedActivities,
				request.constraints
			);
		}

		// 5. Calcular mejoras
		const improvements = this.calculateImprovements(
			originalSchedule,
			optimizedSchedule,
			activities,
			optimizedActivities
		);

		// 6. Generar recomendaciones
		const recommendedActions = this.generateOptimizationRecommendations(
			originalSchedule,
			optimizedSchedule,
			improvements
		);

		// 7. Procesar escenarios alternativos si se solicitan
		const alternativeScenarios = request.scenarios
			? await this.processAlternativeScenarios(
					originalSchedule,
					activities,
					request.scenarios
				)
			: undefined;

		return {
			originalSchedule,
			optimizedSchedule,
			improvements,
			recommendedActions,
			alternativeScenarios,
		};
	}

	// ✅ CORRIGIDO: Función para mapear entidades a modelos de dominio
	private mapEntitiesToDomainModels(
		entities: ScheduleActivityEntity[]
	): ScheduleActivity[] {
		return entities.map((entity) => ({
			id: entity.id,
			scheduleId: entity.scheduleId,
			name: entity.name,
			description: entity.description || undefined,
			status: entity.status,
			activityType: entity.activityType,
			priority: entity.priority,
			primaryTrade: entity.primaryTrade,
			plannedStartDate: entity.plannedStartDate,
			plannedEndDate: entity.plannedEndDate,
			plannedDurationDays: entity.plannedDurationDays,
			actualStartDate: entity.actualStartDate,
			actualEndDate: entity.actualEndDate,
			actualDurationDays: entity.actualDurationDays,
			earlyStartDate: entity.earlyStartDate,
			earlyFinishDate: entity.earlyFinishDate,
			lateStartDate: entity.lateStartDate,
			lateFinishDate: entity.lateFinishDate,
			totalFloat: entity.totalFloat,
			freeFloat: entity.freeFloat,
			progressPercentage: entity.progressPercentage,
			isCriticalPath: entity.isCriticalPath,
			isMilestone: entity.isMilestone,
			workConfiguration: entity.workConfiguration,
			workQuantities: entity.workQuantities,
			plannedLaborCost: entity.plannedLaborCost,
			plannedMaterialCost: entity.plannedMaterialCost,
			plannedEquipmentCost: entity.plannedEquipmentCost,
			plannedTotalCost: entity.plannedTotalCost,
			actualLaborCost: entity.actualLaborCost,
			actualMaterialCost: entity.actualMaterialCost,
			actualEquipmentCost: entity.actualEquipmentCost,
			actualTotalCost: entity.actualTotalCost,
			predecessors: entity.predecessors,
			successors: entity.successors,
			alertConfiguration: entity.alertConfiguration,
			environmentalFactors: entity.environmentalFactors,
			qualityControl: entity.qualityControl,

			// ✅ CORRIGIDO: Mapear location correctamente incluyendo indoorWork
			location: entity.location
				? {
						area: entity.location.area,
						floor: entity.location.floor,
						zone: entity.location.zone,
						coordinates: entity.location.coordinates,
						indoorWork:
							entity.environmentalFactors?.workingConditions?.indoorWork ||
							false,
					}
				: undefined,

			// Mapear resourceAssignments de entidades a modelo simple
			resourceAssignments: entity.resourceAssignments?.map((assignment) => ({
				id: assignment.id,
				resourceType: assignment.resourceType,
				resourceId: assignment.resourceId || "",
				quantity: assignment.quantity || 0,
				allocationPercentage: assignment.allocationPercentage || 100,
			})),

			// Mapear resourceRequirements desde resourceAssignments
			resourceRequirements: this.mapResourceRequirements(
				entity.resourceAssignments || []
			),

			// Propiedades calculadas
			assignments: entity.resourceAssignments || [],
			durationVariance: entity.durationVariance,
			costVariance: entity.costVariance,
			isDelayed: entity.isDelayed,

			progressReports: entity.progressReports?.map((p) => p.id) || [],
			customFields: entity.customFields,
			isActive: entity.isActive,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		}));
	}

	private mapResourceRequirements(assignments: any[]): any {
		const workforce = assignments
			.filter((a) => a.resourceType === "WORKFORCE")
			.map((a) => ({
				trade: a.workforce?.trade || "general",
				quantity: a.quantity || 1,
				skillLevel: a.workforce?.skillLevel || "basic",
				hourlyRate: a.plannedCost || 25,
			}));

		const equipment = assignments
			.filter((a) => a.resourceType === "EQUIPMENT")
			.map((a) => ({
				type: a.equipment?.type || "general",
				quantity: a.quantity || 1,
				dailyCost: a.plannedCost || 100,
			}));

		const materials = assignments
			.filter((a) => a.resourceType === "MATERIAL")
			.map((a) => ({
				material: a.material?.name || "general",
				quantity: a.quantity || 1,
				unit: a.unit || "unit",
				unitCost: a.plannedCost || 10,
			}));

		return {
			workforce: workforce.length > 0 ? workforce : undefined,
			equipment: equipment.length > 0 ? equipment : undefined,
			materials: materials.length > 0 ? materials : undefined,
		};
	}

	private optimizeForDuration(
		schedule: any,
		activities: ScheduleActivity[],
		constraints: any
	): void {
		// Fast-tracking: Identificar actividades que se pueden paralelizar
		const criticalPath = activities.filter((a) => a.isCriticalPath);

		for (const activity of criticalPath) {
			// Buscar actividades que se pueden ejecutar en paralelo
			const parallelCandidates = activities.filter(
				(a) =>
					!a.isCriticalPath &&
					!this.hasPredecessorRelationship(activity, a) &&
					!this.hasPredecessorRelationship(a, activity)
			);

			// Ajustar fechas para paralelización
			for (const candidate of parallelCandidates) {
				if (this.canParallelize(activity, candidate)) {
					candidate.plannedStartDate = activity.plannedStartDate;
				}
			}
		}

		// Crashing: Agregar recursos para reducir duración
		for (const activity of criticalPath) {
			if (this.canCrash(activity, constraints)) {
				const originalDuration = activity.plannedDurationDays;
				activity.plannedDurationDays = Math.max(1, originalDuration * 0.8); // Reducir 20%

				// Ajustar costo por recursos adicionales
				activity.plannedTotalCost *= 1.3; // Incrementar 30% por recursos extra
			}
		}
	}

	private optimizeForCost(
		schedule: any,
		activities: ScheduleActivity[],
		constraints: any
	): void {
		// Optimización de recursos para reducir costos
		const resourceGroups = this.groupActivitiesByResource(activities);

		for (const [resource, resourceActivities] of resourceGroups) {
			// Nivelar recursos para evitar picos costosos
			this.levelResources(resourceActivities);

			// Buscar oportunidades de compartir recursos
			this.optimizeResourceSharing(resourceActivities);
		}
	}

	private optimizeForResources(
		schedule: any,
		activities: ScheduleActivity[],
		constraints: any
	): void {
		// Resource leveling algorithm
		const resourceCalendar = this.buildResourceCalendar(activities);

		// Identificar conflictos de recursos
		const conflicts = this.identifyResourceConflicts(resourceCalendar);

		// Resolver conflictos moviendo actividades no críticas
		for (const conflict of conflicts) {
			this.resolveResourceConflict(conflict, activities);
		}
	}

	private hasPredecessorRelationship(
		activity1: ScheduleActivity,
		activity2: ScheduleActivity
	): boolean {
		return (
			activity1.predecessors?.some((p) => p.activityId === activity2.id) ||
			false
		);
	}

	private canParallelize(
		activity1: ScheduleActivity,
		activity2: ScheduleActivity
	): boolean {
		// Verificar si dos actividades pueden ejecutarse en paralelo
		return (
			!this.hasResourceConflict(activity1, activity2) &&
			!this.hasDependencyConflict(activity1, activity2)
		);
	}

	private canCrash(activity: ScheduleActivity, constraints: any): boolean {
		// Verificar si una actividad puede ser "crashed" (acelerada con más recursos)
		return (
			activity.plannedDurationDays > 1 &&
			(!constraints.maxBudget ||
				activity.plannedTotalCost * 1.3 <= constraints.maxBudget)
		);
	}

	private hasResourceConflict(
		activity1: ScheduleActivity,
		activity2: ScheduleActivity
	): boolean {
		// Verificar conflictos de recursos entre actividades
		const resources1 = activity1.resourceRequirements?.workforce || [];
		const resources2 = activity2.resourceRequirements?.workforce || [];

		return resources1.some((r1) =>
			resources2.some((r2) => r1.trade === r2.trade)
		);
	}

	private hasDependencyConflict(
		activity1: ScheduleActivity,
		activity2: ScheduleActivity
	): boolean {
		// Verificar conflictos de dependencias
		const pred1 = activity1.predecessors || [];
		const succ1 = activity1.successors || [];
		const pred2 = activity2.predecessors || [];
		const succ2 = activity2.successors || [];

		return (
			pred1.some((p) => p.activityId === activity2.id) ||
			pred2.some((p) => p.activityId === activity1.id) ||
			succ1.some((s) => s.activityId === activity2.id) ||
			succ2.some((s) => s.activityId === activity1.id)
		);
	}

	private groupActivitiesByResource(
		activities: ScheduleActivity[]
	): Map<string, ScheduleActivity[]> {
		const groups = new Map<string, ScheduleActivity[]>();

		for (const activity of activities) {
			const resources = activity.resourceRequirements?.workforce || [];
			for (const resource of resources) {
				const key = resource.trade;
				if (!groups.has(key)) {
					groups.set(key, []);
				}
				groups.get(key)!.push(activity);
			}
		}

		return groups;
	}

	private levelResources(activities: ScheduleActivity[]): void {
		// Resource leveling algorithm - simplified implementation
		activities.sort(
			(a, b) => a.plannedStartDate.getTime() - b.plannedStartDate.getTime()
		);

		for (let i = 1; i < activities.length; i++) {
			const current = activities[i];
			const previous = activities[i - 1];

			// Si hay solapamiento, mover la actividad actual
			if (current.plannedStartDate < previous.plannedEndDate) {
				const delay =
					previous.plannedEndDate.getTime() -
					current.plannedStartDate.getTime();
				current.plannedStartDate = new Date(previous.plannedEndDate);
				current.plannedEndDate = new Date(
					current.plannedEndDate.getTime() + delay
				);
			}
		}
	}

	private optimizeResourceSharing(activities: ScheduleActivity[]): void {
		// Implementar lógica para optimizar el compartir recursos entre actividades
		// Por ahora implementation básica
	}

	private buildResourceCalendar(
		activities: ScheduleActivity[]
	): Map<string, any[]> {
		const calendar = new Map<string, any[]>();

		for (const activity of activities) {
			const resources = activity.resourceRequirements?.workforce || [];
			for (const resource of resources) {
				const key = resource.trade;
				if (!calendar.has(key)) {
					calendar.set(key, []);
				}

				calendar.get(key)!.push({
					activityId: activity.id,
					startDate: activity.plannedStartDate,
					endDate: activity.plannedEndDate,
					quantity: resource.quantity,
				});
			}
		}

		return calendar;
	}

	private identifyResourceConflicts(
		resourceCalendar: Map<string, any[]>
	): any[] {
		const conflicts: any[] = [];

		for (const [resource, assignments] of resourceCalendar) {
			// Ordenar por fecha de inicio
			assignments.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

			for (let i = 0; i < assignments.length - 1; i++) {
				const current = assignments[i];
				const next = assignments[i + 1];

				// Verificar solapamiento
				if (current.endDate > next.startDate) {
					conflicts.push({
						resource,
						conflictingActivities: [current.activityId, next.activityId],
						overlapDays:
							(current.endDate.getTime() - next.startDate.getTime()) /
							(24 * 60 * 60 * 1000),
					});
				}
			}
		}

		return conflicts;
	}

	private resolveResourceConflict(
		conflict: any,
		activities: ScheduleActivity[]
	): void {
		// Resolver conflicto moviendo la actividad no crítica
		const activity1 = activities.find(
			(a) => a.id === conflict.conflictingActivities[0]
		);
		const activity2 = activities.find(
			(a) => a.id === conflict.conflictingActivities[1]
		);

		if (activity1 && activity2) {
			if (!activity1.isCriticalPath && activity2.isCriticalPath) {
				// Mover activity1 después de activity2
				this.rescheduleActivity(activity1, activity2.plannedEndDate);
			} else if (activity1.isCriticalPath && !activity2.isCriticalPath) {
				// Mover activity2 después de activity1
				this.rescheduleActivity(activity2, activity1.plannedEndDate);
			}
		}
	}

	private rescheduleActivity(
		activity: ScheduleActivity,
		newStartDate: Date
	): void {
		const duration = activity.plannedDurationDays * 24 * 60 * 60 * 1000;
		activity.plannedStartDate = newStartDate;
		activity.plannedEndDate = new Date(newStartDate.getTime() + duration);
	}

	private calculateImprovements(
		originalSchedule: any,
		optimizedSchedule: any,
		originalActivities: ScheduleActivity[],
		optimizedActivities: ScheduleActivity[]
	): any {
		const originalDuration = originalSchedule.estimatedDurationDays || 0;
		const optimizedDuration = Math.max(
			...optimizedActivities.map(
				(a) =>
					(a.plannedEndDate.getTime() -
						optimizedActivities[0].plannedStartDate.getTime()) /
					(24 * 60 * 60 * 1000)
			)
		);

		const originalCost = originalActivities.reduce(
			(sum, a) => sum + a.plannedTotalCost,
			0
		);
		const optimizedCost = optimizedActivities.reduce(
			(sum, a) => sum + a.plannedTotalCost,
			0
		);

		return {
			durationReduction: Math.max(0, originalDuration - optimizedDuration),
			costReduction: Math.max(0, originalCost - optimizedCost),
			resourceEfficiencyGain:
				this.calculateResourceEfficiency(optimizedActivities) -
				this.calculateResourceEfficiency(originalActivities),
		};
	}

	private calculateResourceEfficiency(activities: ScheduleActivity[]): number {
		// Simplified resource efficiency calculation
		return activities.length > 0
			? (activities.filter(
					(a) =>
						a.resourceRequirements?.workforce &&
						a.resourceRequirements.workforce.length > 0
				).length /
					activities.length) *
					100
			: 0;
	}

	private generateOptimizationRecommendations(
		originalSchedule: any,
		optimizedSchedule: any,
		improvements: any
	): any[] {
		const recommendations: any[] = [];

		if (improvements.durationReduction > 0) {
			recommendations.push({
				action: `Implementar paralelización de actividades para reducir ${improvements.durationReduction} días`,
				impact: `Reducción del ${((improvements.durationReduction / (originalSchedule.estimatedDurationDays || 1)) * 100).toFixed(1)}% en duración`,
				priority: "high" as const,
			});
		}

		if (improvements.costReduction > 0) {
			recommendations.push({
				action: `Optimizar asignación de recursos para reducir costos`,
				impact: `Ahorro de $${improvements.costReduction.toFixed(2)}`,
				priority: "medium" as const,
			});
		}

		if (improvements.resourceEfficiencyGain > 5) {
			recommendations.push({
				action: `Implementar nivelación de recursos`,
				impact: `Mejora del ${improvements.resourceEfficiencyGain.toFixed(1)}% en eficiencia de recursos`,
				priority: "medium" as const,
			});
		}

		return recommendations;
	}

	private async processAlternativeScenarios(
		schedule: any,
		activities: ScheduleActivity[],
		scenarios: any[]
	): Promise<any[]> {
		const results = [];

		for (const scenario of scenarios) {
			// Procesar cada escenario alternativo
			const scenarioResult = await this.processScenario(
				schedule,
				activities,
				scenario
			);
			results.push({
				name: scenario.name,
				...scenarioResult,
			});
		}

		return results;
	}

	private async processScenario(
		schedule: any,
		activities: ScheduleActivity[],
		scenario: any
	): Promise<any> {
		// Implementar procesamiento de escenarios what-if
		return {
			estimatedDuration: schedule.estimatedDurationDays || 0,
			estimatedCost: activities.reduce((sum, a) => sum + a.plannedTotalCost, 0),
			riskLevel: "medium",
			feasibility: "high",
		};
	}
}
