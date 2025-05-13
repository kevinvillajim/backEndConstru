// src/application/project/PredictProjectDelaysUseCase.ts
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import {PhaseRepository} from "../../domain/repositories/PhaseRepository";
import {TaskRepository} from "../../domain/repositories/TaskRepository";
import {
	ProjectMetricsService,
	PerformanceMetrics,
} from "../../domain/services/ProjectMetricsService";
import {NotificationService} from "../../domain/services/NotificationService";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";
import {TaskStatus} from "../../domain/models/project/Task";

export interface DelayPrediction {
	projectId: string;
	projectName: string;
	currentCompletionPercentage: number;
	predictedEndDate: Date;
	originalEndDate: Date | null;
	predictedDelay: number; // en días
	probabilityOfDelay: number; // 0-1
	riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
	criticalPath: {
		phaseId: string;
		phaseName: string;
		taskId: string;
		taskName: string;
		predictedDelay: number;
		status: TaskStatus;
	}[];
	recommendations: string[];
	factors: {
		factor: string;
		impact: number; // -1 a 1, negativo = retraso, positivo = adelanto
		description: string;
	}[];
	trendData: {
		date: Date;
		predictedEndDate: Date;
		predictedDelay: number;
	}[];
}

export class PredictProjectDelaysUseCase {
	constructor(
		private projectRepository: ProjectRepository,
		private phaseRepository: PhaseRepository,
		private taskRepository: TaskRepository,
		private projectMetricsService: ProjectMetricsService,
		private notificationService: NotificationService
	) {}

	async execute(projectId: string, userId: string): Promise<DelayPrediction> {
		// 1. Obtener información del proyecto
		const project = await this.projectRepository.findById(projectId);
		if (!project) {
			throw new Error(`Proyecto no encontrado: ${projectId}`);
		}

		// 2. Verificar permisos del usuario
		if (project.userId !== userId) {
			throw new Error("No tienes permiso para acceder a este proyecto");
		}

		// 3. Obtener fases y tareas del proyecto
		const phases = await this.phaseRepository.findByProject(projectId);
		const allTasks = [];
		for (const phase of phases) {
			const tasks = await this.taskRepository.findByPhase(phase.id);
			allTasks.push(...tasks);
		}

		// 4. Calcular métricas de rendimiento actuales
		const performanceMetrics =
			this.projectMetricsService.calculatePerformanceMetrics(
				project,
				phases,
				allTasks,
				null // No necesitamos el presupuesto para este cálculo
			);

		// 5. Identificar la ruta crítica (tareas más críticas que afectan el cronograma)
		const criticalPathTasks = this.identifyCriticalPath(phases, allTasks);

		// 6. Calcular el retraso predicho basado en métricas de rendimiento
		const predictedDelay = this.calculatePredictedDelay(
			performanceMetrics,
			project
		);

		// 7. Calcular la fecha de finalización predicha
		const predictedEndDate = this.calculatePredictedEndDate(
			project,
			predictedDelay
		);

		// 8. Determinar el nivel de riesgo
		const riskLevel = this.determineRiskLevel(predictedDelay, project);

		// 9. Generar recomendaciones
		const recommendations = this.generateRecommendations(
			performanceMetrics,
			criticalPathTasks,
			riskLevel
		);

		// 10. Identificar factores que contribuyen al retraso
		const delayFactors = this.identifyDelayFactors(
			performanceMetrics,
			criticalPathTasks
		);

		// 11. Generar datos de tendencia para visualización
		const trendData = this.generateTrendData(project, performanceMetrics);

		// 12. Calcular probabilidad de retraso
		const probabilityOfDelay = this.calculateDelayProbability(
			performanceMetrics,
			predictedDelay
		);

		// 13. Si el riesgo es alto, enviar notificación
		if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
			await this.notificationService.sendToUser(userId, {
				title: "Alerta de retraso predicho",
				content: `El proyecto ${project.name} tiene un alto riesgo de retrasarse por aproximadamente ${Math.round(predictedDelay)} días.`,
				type: NotificationType.PROJECT_DELAY,
				priority: NotificationPriority.HIGH,
				actionUrl: `/projects/${projectId}/predictions`,
				actionText: "Ver predicciones",
			});
		}

		// 14. Construir y retornar el resultado
		return {
			projectId,
			projectName: project.name,
			currentCompletionPercentage: project.completionPercentage,
			predictedEndDate,
			originalEndDate: project.estimatedCompletionDate,
			predictedDelay,
			probabilityOfDelay,
			riskLevel,
			criticalPath: criticalPathTasks,
			recommendations,
			factors: delayFactors,
			trendData,
		};
	}

	private identifyCriticalPath(phases: any[], allTasks: any[]): any[] {
		// Identificar tareas en la ruta crítica
		// En un sistema real, esto requeriría un algoritmo de ruta crítica completo
		// Para simplificar, identificamos tareas retrasadas o bloqueadas
		const criticalPathTasks = [];

		for (const phase of phases) {
			const phaseTasks = allTasks.filter((task) => task.phaseId === phase.id);

			// Encontrar tareas bloqueadas o atrasadas
			const criticalTasks = phaseTasks.filter(
				(task) =>
					task.status === TaskStatus.BLOCKED ||
					(task.endDate &&
						task.endDate < new Date() &&
						task.status !== TaskStatus.COMPLETED)
			);

			// También incluir tareas con dependencias críticas
			for (const task of criticalTasks) {
				criticalPathTasks.push({
					phaseId: phase.id,
					phaseName: phase.name,
					taskId: task.id,
					taskName: task.name,
					predictedDelay: this.calculateTaskDelay(task),
					status: task.status,
				});
			}
		}

		// Ordenar por cantidad de retraso predicho (descendente)
		return criticalPathTasks.sort(
			(a, b) => b.predictedDelay - a.predictedDelay
		);
	}

	private calculateTaskDelay(task: any): number {
		// Si la tarea está completada, no hay retraso
		if (task.status === TaskStatus.COMPLETED) {
			return 0;
		}

		// Si la tarea está bloqueada, establecer un retraso alto
		if (task.status === TaskStatus.BLOCKED) {
			return 10; // Valor arbitrario alto para tareas bloqueadas
		}

		// Si la tarea debería estar terminada pero no lo está
		if (task.endDate && task.endDate < new Date()) {
			const now = new Date();
			const daysPassed = Math.floor(
				(now.getTime() - task.endDate.getTime()) / (1000 * 60 * 60 * 24)
			);
			return daysPassed;
		}

		// Para otras tareas, asignar un valor basado en su estado
		const statusDelayMap: Record<string, number> = {
			[TaskStatus.PENDING]: 3,
			[TaskStatus.IN_PROGRESS]: 1,
		};

		return statusDelayMap[task.status] || 0;
	}

	private calculatePredictedDelay(
		metrics: PerformanceMetrics,
		project: any
	): number {
		// Combinar múltiples factores para predecir el retraso

		// 1. Factor basado en SPI (Schedule Performance Index)
		const spiDelay =
			metrics.earnedValueMetrics.spi < 1
				? (1 - metrics.earnedValueMetrics.spi) *
					this.getRemainingDuration(project)
				: 0;

		// 2. Factor basado en el drift actual
		const driftDelay =
			metrics.scheduleDrift < 0 ? Math.abs(metrics.scheduleDrift) : 0;

		// 3. Factor basado en fases retrasadas
		const phaseDelayFactor = metrics.phasesWithDelays * 3; // 3 días por fase retrasada

		// 4. Factor basado en tareas críticas retrasadas
		const criticalTaskDelayFactor = metrics.criticalTasksDelayed * 2; // 2 días por tarea crítica

		// Combinar todos los factores (se puede ajustar los pesos de cada factor)
		const predictedDelay =
			spiDelay * 0.4 +
			driftDelay * 0.3 +
			phaseDelayFactor * 0.2 +
			criticalTaskDelayFactor * 0.1;

		return predictedDelay;
	}

	private calculatePredictedEndDate(
		project: any,
		predictedDelay: number
	): Date {
		// Si hay una fecha estimada de finalización, usarla como base
		if (project.estimatedCompletionDate) {
			const estimatedDate = new Date(project.estimatedCompletionDate);
			estimatedDate.setDate(
				estimatedDate.getDate() + Math.round(predictedDelay)
			);
			return estimatedDate;
		}

		// Si no hay fecha estimada, calcular basado en la fecha de inicio y duración predicha
		const startDate = new Date(project.startDate);
		const now = new Date();

		// Calcular cuántos días han pasado
		const daysPassed = Math.floor(
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		// Estimar días restantes basado en porcentaje de progreso actual
		const totalEstimatedDays =
			project.completionPercentage > 0
				? Math.round(daysPassed / (project.completionPercentage / 100))
				: 180; // valor por defecto si no hay progreso

		const daysRemaining = totalEstimatedDays - daysPassed;

		// Añadir días restantes + retraso predicho a la fecha actual
		const predictedDate = new Date();
		predictedDate.setDate(
			predictedDate.getDate() + daysRemaining + Math.round(predictedDelay)
		);

		return predictedDate;
	}

	private getRemainingDuration(project: any): number {
		const now = new Date();

		if (project.estimatedCompletionDate) {
			const estimatedEnd = new Date(project.estimatedCompletionDate);
			const remainingDays = Math.max(
				0,
				Math.floor(
					(estimatedEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
				)
			);
			return remainingDays;
		}

		// Si no hay fecha estimada, calcular basado en progreso actual
		const startDate = new Date(project.startDate);
		const daysPassed = Math.floor(
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		// Estimar los días totales basado en el progreso actual
		if (project.completionPercentage > 0) {
			const estimatedTotalDays = Math.round(
				daysPassed / (project.completionPercentage / 100)
			);
			return Math.max(0, estimatedTotalDays - daysPassed);
		}

		return 90; // valor por defecto si no podemos calcular
	}

	private determineRiskLevel(
		predictedDelay: number,
		project: any
	): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
		// Determinar nivel de riesgo basado en la magnitud del retraso
		const totalDuration = this.getTotalDuration(project);

		// Calcular el retraso como porcentaje de la duración total
		const delayPercentage = (predictedDelay / totalDuration) * 100;

		if (delayPercentage <= 5) {
			return "LOW";
		} else if (delayPercentage <= 15) {
			return "MEDIUM";
		} else if (delayPercentage <= 30) {
			return "HIGH";
		} else {
			return "CRITICAL";
		}
	}

	private getTotalDuration(project: any): number {
		if (project.estimatedCompletionDate && project.startDate) {
			const start = new Date(project.startDate);
			const end = new Date(project.estimatedCompletionDate);
			return Math.floor(
				(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
			);
		}

		// Valor por defecto si no podemos calcular
		return 180;
	}

	private generateRecommendations(
		metrics: PerformanceMetrics,
		criticalPathTasks: any[],
		riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
	): string[] {
		const recommendations: string[] = [];

		// Recomendaciones basadas en el SPI
		if (metrics.earnedValueMetrics.spi < 0.85) {
			recommendations.push(
				"Acelerar el ritmo de trabajo para recuperar el retraso en el cronograma."
			);
		}

		// Recomendaciones basadas en el CPI
		if (metrics.earnedValueMetrics.cpi < 0.9) {
			recommendations.push(
				"Revisar y optimizar la gestión de costos del proyecto."
			);
		}

		// Recomendaciones basadas en las tareas críticas
		if (criticalPathTasks.length > 0) {
			recommendations.push(
				`Priorizar las ${criticalPathTasks.length} tareas críticas identificadas para minimizar el impacto en el cronograma.`
			);

			// Si hay tareas bloqueadas
			const blockedTasks = criticalPathTasks.filter(
				(task) => task.status === TaskStatus.BLOCKED
			);
			if (blockedTasks.length > 0) {
				recommendations.push(
					`Resolver urgentemente los bloqueos en ${blockedTasks.length} tareas críticas.`
				);
			}
		}

		// Recomendaciones basadas en el nivel de riesgo
		if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
			recommendations.push(
				"Considerar una revisión completa del cronograma del proyecto."
			);
			recommendations.push(
				"Evaluar la posibilidad de añadir recursos adicionales a las áreas críticas."
			);
		}

		// Recomendaciones basadas en la tasa de rendimiento
		if (metrics.progressRate < 0.7) {
			recommendations.push(
				"Investigar las causas del bajo rendimiento y tomar acciones correctivas."
			);
		}

		// Recomendar análisis detallado si hay muchas fases con retrasos
		if (metrics.phasesWithDelays > 2) {
			recommendations.push(
				"Realizar un análisis detallado de las causas de retraso en múltiples fases del proyecto."
			);
		}

		return recommendations;
	}

	private identifyDelayFactors(
		metrics: PerformanceMetrics,
		criticalPathTasks: any[]
	): any[] {
		const factors = [];

		// Factor: Rendimiento del cronograma (SPI)
		if (metrics.earnedValueMetrics.spi !== 1) {
			factors.push({
				factor: "Rendimiento del cronograma",
				impact: 1 - metrics.earnedValueMetrics.spi, // Negativo si SPI < 1
				description: `El índice de rendimiento del cronograma (SPI) es ${metrics.earnedValueMetrics.spi.toFixed(2)}`,
			});
		}

		// Factor: Tareas bloqueadas
		const blockedTasks = criticalPathTasks.filter(
			(task) => task.status === TaskStatus.BLOCKED
		);
		if (blockedTasks.length > 0) {
			factors.push({
				factor: "Tareas bloqueadas",
				impact: 0.1 * blockedTasks.length, // 0.1 por cada tarea bloqueada
				description: `${blockedTasks.length} tareas críticas están bloqueadas`,
			});
		}

		// Factor: Fases retrasadas
		if (metrics.phasesWithDelays > 0) {
			factors.push({
				factor: "Fases retrasadas",
				impact: 0.15 * metrics.phasesWithDelays,
				description: `${metrics.phasesWithDelays} fases del proyecto están retrasadas`,
			});
		}

		// Factor: Baja tasa de progreso
		if (metrics.progressRate < 1) {
			factors.push({
				factor: "Tasa de progreso",
				impact: 1 - metrics.progressRate,
				description: `La tasa de progreso es ${(metrics.progressRate * 100).toFixed(1)}% de lo esperado`,
			});
		}

		// Factor: Utilización de recursos
		if (metrics.resourceUtilization < 0.8) {
			factors.push({
				factor: "Utilización de recursos",
				impact: 0.8 - metrics.resourceUtilization,
				description: `La utilización de recursos es del ${(metrics.resourceUtilization * 100).toFixed(1)}%`,
			});
		}

		// Ordenar factores por impacto (mayor a menor)
		return factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
	}

	private generateTrendData(project: any, metrics: PerformanceMetrics): any[] {
		const trendData = [];
		const now = new Date();
		const startDate = new Date(project.startDate);

		// Generar datos históricos (simulados)
		// En un caso real, estos datos vendrían de registros históricos

		// Comenzar 30 días atrás o desde la fecha de inicio del proyecto, lo que sea más reciente
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const trendStartDate =
			startDate > thirtyDaysAgo ? startDate : thirtyDaysAgo;

		// Generar un punto de datos para cada 5 días
		for (
			let date = new Date(trendStartDate);
			date <= now;
			date.setDate(date.getDate() + 5)
		) {
			// Calcular un SPI simulado para esa fecha (ligeramente variable)
			const daysPassed = Math.floor(
				(date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			// Simular un SPI que empeora gradualmente (para demostración)
			const simulatedSPI = Math.max(
				0.5,
				metrics.earnedValueMetrics.spi +
					((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)) * 0.2
			);

			// Estimar retraso con ese SPI
			const simulatedDelay =
				simulatedSPI < 1
					? (1 - simulatedSPI) *
						this.getRemainingDuration(project) *
						(daysPassed / this.getTotalDuration(project))
					: 0;

			// Calcular fecha de finalización predicha con ese SPI
			const predictedEndDate = this.calculatePredictedEndDate(
				project,
				simulatedDelay
			);

			trendData.push({
				date: new Date(date),
				predictedEndDate: new Date(predictedEndDate),
				predictedDelay: simulatedDelay,
			});
		}

		// Añadir el punto actual
		trendData.push({
			date: new Date(),
			predictedEndDate: this.calculatePredictedEndDate(
				project,
				this.calculatePredictedDelay(metrics, project)
			),
			predictedDelay: this.calculatePredictedDelay(metrics, project),
		});

		return trendData;
	}

	private calculateDelayProbability(
		metrics: PerformanceMetrics,
		predictedDelay: number
	): number {
		// Calcular probabilidad de retraso basado en múltiples factores

		// 1. Base inicial basada en el SPI
		let probability =
			metrics.earnedValueMetrics.spi >= 1
				? 0.1
				: 1 - metrics.earnedValueMetrics.spi;

		// 2. Ajustar por la magnitud del retraso predicho
		if (predictedDelay <= 0) {
			probability *= 0.2; // Baja probabilidad si no se predice retraso
		} else if (predictedDelay < 5) {
			probability *= 0.6; // Probabilidad moderada para retrasos pequeños
		} else if (predictedDelay < 15) {
			probability *= 0.8; // Probabilidad alta para retrasos medianos
		} else {
			probability *= 0.95; // Probabilidad muy alta para retrasos grandes
		}

		// 3. Ajustar por fases con retrasos
		if (metrics.phasesWithDelays > 0) {
			// Incrementar probabilidad si ya hay fases retrasadas
			probability = Math.min(1, probability + 0.05 * metrics.phasesWithDelays);
		}

		// 4. Ajustar por la tasa de progreso
		if (metrics.progressRate < 0.8) {
			// Incrementar probabilidad si la tasa de progreso es baja
			probability = Math.min(
				1,
				probability + (0.8 - metrics.progressRate) * 0.2
			);
		}

		// Asegurar que el resultado esté entre 0 y 1
		return Math.max(0, Math.min(1, probability));
	}
}
