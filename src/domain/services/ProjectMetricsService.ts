// src/domain/services/ProjectMetricsService.ts
import {Project} from "../models/project/Project";
import {Phase} from "../models/project/Phase";
import {Task} from "../models/project/Task";
import {ProjectBudget} from "../models/project/ProjectBudget";
import {TaskStatus} from "../models/project/Task";

export interface EarnedValueMetrics {
	// Valores base
	plannedValue: number; // PV (BCWS) - Valor planeado
	earnedValue: number; // EV (BCWP) - Valor ganado
	actualCost: number; // AC (ACWP) - Costo actual

	// Índices de rendimiento
	cpi: number; // Cost Performance Index (EV/AC)
	spi: number; // Schedule Performance Index (EV/PV)

	// Variaciones
	sv: number; // Schedule Variance (EV-PV)
	cv: number; // Cost Variance (EV-AC)

	// Proyecciones
	bac: number; // Budget At Completion
	eac: number; // Estimate At Completion
	etc: number; // Estimate To Complete
	vac: number; // Variance At Completion
	tcpi: number; // To Complete Performance Index
}

export interface PerformanceMetrics {
	// Métricas generales
	progressRate: number; // Tasa de progreso (% completado / tiempo transcurrido)
	taskCompletionRate: number; // Tareas completadas / total tareas
	onTimeCompletionRate: number; // Tareas completadas a tiempo / tareas completadas

	// Índices específicos
	earnedValueMetrics: EarnedValueMetrics;

	// Métricas de retraso
	scheduleDrift: number; // Días de retraso o adelanto
	phasesWithDelays: number; // Número de fases con retraso
	criticalTasksDelayed: number; // Tareas críticas con retraso

	// Métricas de recursos
	resourceUtilization: number; // % de utilización de recursos asignados

	// Métricas de calidad
	reworkRate: number; // Tareas que requirieron reelaboración / total tareas

	// Métricas de efectividad
	phaseTransitionEfficiency: number; // Tiempo entre fases
}

export class ProjectMetricsService {
	/**
	 * Calcula métricas de valor ganado (Earned Value Management)
	 */
	calculateEarnedValueMetrics(
		project: Project,
		phases: Phase[],
		tasks: Task[],
		budget: ProjectBudget
	): EarnedValueMetrics {
		const now = new Date();
		const startDate = project.startDate;
		const plannedEndDate = project.estimatedCompletionDate || new Date();

		// Duración planeada total en días
		const plannedDuration =
			(plannedEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

		// Tiempo transcurrido hasta ahora en días
		const elapsedTime =
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

		// Porcentaje de tiempo transcurrido
		const percentageTimeElapsed = Math.min(
			100,
			(elapsedTime / plannedDuration) * 100
		);

		// Presupuesto total (BAC - Budget At Completion)
		const bac = budget ? budget.total : project.estimatedBudget || 0;

		// Valor planeado (PV) - Lo que debería estar completado según cronograma
		const plannedValue = (percentageTimeElapsed / 100) * bac;

		// Valor ganado (EV) - Valor del trabajo completado según % real
		const earnedValue = (project.completionPercentage / 100) * bac;

		// Costo actual (AC)
		const actualCost = project.currentCost || 0;

		// Calcular variaciones
		const cv = earnedValue - actualCost; // Cost Variance
		const sv = earnedValue - plannedValue; // Schedule Variance

		// Calcular índices de rendimiento
		const cpi = actualCost === 0 ? 1 : earnedValue / actualCost; // Cost Performance Index
		const spi = plannedValue === 0 ? 1 : earnedValue / plannedValue; // Schedule Performance Index

		// Calcular proyecciones
		// EAC (Estimate At Completion) - proyección del costo total del proyecto
		const eac = cpi === 0 ? bac : bac / cpi;

		// ETC (Estimate To Complete) - costo restante para completar
		const etc = Math.max(0, eac - actualCost);

		// VAC (Variance At Completion) - variación esperada al final
		const vac = bac - eac;

		// TCPI (To Complete Performance Index) - rendimiento requerido para cumplir con BAC
		const tcpi =
			bac - earnedValue === 0 || bac - actualCost === 0
				? 1
				: (bac - earnedValue) / (bac - actualCost);

		return {
			plannedValue,
			earnedValue,
			actualCost,
			cpi,
			spi,
			sv,
			cv,
			bac,
			eac,
			etc,
			vac,
			tcpi,
		};
	}

	/**
	 * Calcula métricas avanzadas de rendimiento del proyecto
	 */
	calculatePerformanceMetrics(
		project: Project,
		phases: Phase[],
		tasks: Task[],
		budget: ProjectBudget
	): PerformanceMetrics {
		const now = new Date();
		const startDate = project.startDate;
		const endDate = project.estimatedCompletionDate || new Date();

		// Calcular tiempo transcurrido en porcentaje
		const totalDuration =
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
		const elapsedDuration =
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
		const timeProgressPercentage = Math.min(
			100,
			(elapsedDuration / totalDuration) * 100
		);

		// Tasa de progreso (comparación entre % completado y tiempo transcurrido)
		const progressRate =
			timeProgressPercentage === 0
				? 1
				: project.completionPercentage / timeProgressPercentage;

		// Métricas de completitud de tareas
		const totalTasks = tasks.length;
		const completedTasks = tasks.filter(
			(task) => task.status === TaskStatus.COMPLETED
		).length;
		const taskCompletionRate =
			totalTasks === 0 ? 0 : completedTasks / totalTasks;

		// Tareas completadas a tiempo (simulado - en una implementación real se comprobaría contra línea base)
		const onTimeCompletionRate = 0.85; // Simulado para el ejemplo

		// Métricas de retraso
		const scheduleDrift =
			project.completionPercentage < timeProgressPercentage
				? (-(timeProgressPercentage - project.completionPercentage) *
						totalDuration) /
					100
				: ((project.completionPercentage - timeProgressPercentage) *
						totalDuration) /
					100;

		// Fases con retraso
		const phasesWithDelays = phases.filter((phase) => {
			const phaseEndDate = phase.endDate;
			return (
				phaseEndDate && phaseEndDate < now && phase.completionPercentage < 100
			);
		}).length;

		// Tareas críticas retrasadas (simulado - en una implementación real se identificarían tareas críticas)
		const criticalTasksDelayed = Math.floor(
			totalTasks * 0.2 * (1 - progressRate)
		); // Simulado

		// Utilización de recursos (simulado - en una implementación real se calcularía desde asignaciones)
		const resourceUtilization = 0.75; // Simulado para el ejemplo

		// Tasa de reelaboración (simulado - en una implementación real vendría de un registro de rework)
		const reworkRate = 0.12; // Simulado para el ejemplo

		// Eficiencia de transición entre fases (simulado)
		const phaseTransitionEfficiency = 0.8; // Simulado para el ejemplo

		// Cálculo de métricas EVM
		const earnedValueMetrics = this.calculateEarnedValueMetrics(
			project,
			phases,
			tasks,
			budget
		);

		return {
			progressRate,
			taskCompletionRate,
			onTimeCompletionRate,
			earnedValueMetrics,
			scheduleDrift,
			phasesWithDelays,
			criticalTasksDelayed,
			resourceUtilization,
			reworkRate,
			phaseTransitionEfficiency,
		};
	}
}
