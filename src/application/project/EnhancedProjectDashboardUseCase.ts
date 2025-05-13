// src/application/project/EnhancedProjectDashboardUseCase.ts
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import {PhaseRepository} from "../../domain/repositories/PhaseRepository";
import {TaskRepository} from "../../domain/repositories/TaskRepository";
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {ProjectMetricsService} from "../../domain/services/ProjectMetricsService";
import {TaskStatus} from "../../domain/models/project/Task";

export interface EnhancedDashboardData {
	// Datos generales
	projectId: string;
	projectName: string;
	completionPercentage: number;
	startDate: Date;
	estimatedEndDate: Date | null;
	actualEndDate: Date | null;
	daysRemaining: number;
	daysElapsed: number;

	// Datos para gráfica de progreso en el tiempo
	progressData: {
		date: Date;
		percentage: number;
		expectedPercentage: number; // Añadido para comparar con lo esperado
	}[];

	// Datos para gráfica de estado de tareas
	taskStatusCounts: {
		status: string;
		count: number;
		color: string; // Para visualización
	}[];

	// Datos para gráfica de progreso por fase
	phaseProgress: {
		phaseId: string;
		phaseName: string;
		completionPercentage: number;
		expectedPercentage: number; // Añadido para comparar con lo esperado
		totalTasks: number;
		completedTasks: number;
		inProgressTasks: number;
		pendingTasks: number;
		blockedTasks: number;
		startDate: Date;
		endDate: Date | null;
		isDelayed: boolean;
	}[];

	// Datos para gráfica de costos
	budgetData: {
		estimatedTotal: number;
		currentCost: number;
		budgetVariance: number; // negativo = sobrecosto
		plannedValue: number; // Valor Planeado (PV)
		earnedValue: number; // Valor Ganado (EV)
		actualCost: number; // Costo Actual (AC)
		costPerformanceIndex: number; // CPI
		schedulePerformanceIndex: number; // SPI
	};

	// Tareas críticas (añadido para el dashboard mejorado)
	criticalTasks: {
		taskId: string;
		taskName: string;
		status: TaskStatus;
		phaseId: string;
		phaseName: string;
		startDate: Date | null;
		endDate: Date | null;
		assignedTo: string | null;
		isDelayed: boolean;
		daysDelayed: number;
	}[];

	// Recursos (añadido para el dashboard mejorado)
	resourceAllocation: {
		resourceId: string;
		resourceName: string;
		resourceType: string;
		tasksAssigned: number;
		utilizationPercentage: number;
	}[];

	// KPIs principales (añadido para el dashboard mejorado)
	keyPerformanceIndicators: {
		name: string;
		value: number;
		target: number;
		unit: string;
		status: "good" | "warning" | "critical";
	}[];

	// Hitos del proyecto (añadido para el dashboard mejorado)
	milestones: {
		name: string;
		date: Date;
		completed: boolean;
		isDelayed: boolean;
		daysDelayed: number;
	}[];

	// Riesgos activos (añadido para el dashboard mejorado)
	activeRisks: {
		description: string;
		probability: number; // 0-1
		impact: number; // 1-5
		riskScore: number;
		mitigationPlan: string;
	}[];
}

export class EnhancedProjectDashboardUseCase {
	constructor(
		private projectRepository: ProjectRepository,
		private phaseRepository: PhaseRepository,
		private taskRepository: TaskRepository,
		private projectBudgetRepository: ProjectBudgetRepository,
		private projectMetricsService: ProjectMetricsService
	) {}

	async execute(
		projectId: string,
		userId: string
	): Promise<EnhancedDashboardData> {
		// 1. Obtener datos del proyecto
		const project = await this.projectRepository.findById(projectId);

		if (!project) {
			throw new Error(`Proyecto no encontrado: ${projectId}`);
		}

		// 2. Verificar permisos del usuario
		if (project.userId !== userId) {
			// Aquí se podría verificar si el usuario es parte del equipo del proyecto
			throw new Error("No tienes permiso para acceder a este dashboard");
		}

		// 3. Obtener fases del proyecto
		const phases = await this.phaseRepository.findByProject(projectId);

		// 4. Obtener todas las tareas del proyecto
		const allTasks = [];
		for (const phase of phases) {
			const tasks = await this.taskRepository.findByPhase(phase.id);
			allTasks.push(
				...tasks.map((task) => ({
					...task,
					phaseName: phase.name,
				}))
			);
		}

		// 5. Obtener presupuestos
		const budgets = await this.projectBudgetRepository.findByProject(projectId);
		const latestBudget =
			budgets.length > 0
				? budgets.sort((a, b) => b.version - a.version)[0]
				: null;

		// 6. Calcular métricas de valor ganado con el ProjectMetricsService
		const metrics = this.projectMetricsService.calculatePerformanceMetrics(
			project,
			phases,
			allTasks,
			latestBudget
		);

		// 7. Preparar datos de progreso por fase
		const phaseProgress = phases.map((phase) => {
			const phaseTasks = allTasks.filter((task) => task.phaseId === phase.id);
			const completedTasks = phaseTasks.filter(
				(task) => task.status === TaskStatus.COMPLETED
			).length;
			const inProgressTasks = phaseTasks.filter(
				(task) => task.status === TaskStatus.IN_PROGRESS
			).length;
			const pendingTasks = phaseTasks.filter(
				(task) => task.status === TaskStatus.PENDING
			).length;
			const blockedTasks = phaseTasks.filter(
				(task) => task.status === TaskStatus.BLOCKED
			).length;

			// Calcular porcentaje esperado basado en tiempo transcurrido
			const now = new Date();
			const phaseStartDate = phase.startDate;
			const phaseEndDate =
				phase.endDate || project.estimatedCompletionDate || new Date();

			const phaseTotalDuration =
				(phaseEndDate.getTime() - phaseStartDate.getTime()) /
				(1000 * 60 * 60 * 24);
			const phaseElapsedDuration =
				(now.getTime() - phaseStartDate.getTime()) / (1000 * 60 * 60 * 24);

			const expectedPercentage = Math.min(
				100,
				Math.max(0, (phaseElapsedDuration / phaseTotalDuration) * 100)
			);

			const isDelayed = phase.completionPercentage < expectedPercentage;

			return {
				phaseId: phase.id,
				phaseName: phase.name,
				completionPercentage: phase.completionPercentage,
				expectedPercentage,
				totalTasks: phaseTasks.length,
				completedTasks,
				inProgressTasks,
				pendingTasks,
				blockedTasks,
				startDate: phase.startDate,
				endDate: phase.endDate,
				isDelayed,
			};
		});

		// 8. Preparar datos de estado de tareas
		const taskStatusMap = {
			[TaskStatus.COMPLETED]: {status: "Completado", color: "#4CAF50"},
			[TaskStatus.IN_PROGRESS]: {status: "En progreso", color: "#2196F3"},
			[TaskStatus.PENDING]: {status: "Pendiente", color: "#9E9E9E"},
			[TaskStatus.BLOCKED]: {status: "Bloqueado", color: "#F44336"},
		};

		const taskStatusCounts = Object.entries(TaskStatus).map(([_, status]) => {
			return {
				status: taskStatusMap[status].status,
				count: allTasks.filter((task) => task.status === status).length,
				color: taskStatusMap[status].color,
			};
		});

		// 9. Preparar datos de presupuesto
		const budgetData = {
			estimatedTotal: project.estimatedBudget || 0,
			currentCost: project.currentCost || 0,
			budgetVariance:
				(project.estimatedBudget || 0) - (project.currentCost || 0),
			plannedValue: metrics.earnedValueMetrics.plannedValue,
			earnedValue: metrics.earnedValueMetrics.earnedValue,
			actualCost: metrics.earnedValueMetrics.actualCost,
			costPerformanceIndex: metrics.earnedValueMetrics.cpi,
			schedulePerformanceIndex: metrics.earnedValueMetrics.spi,
		};

		// 10. Generar datos de progreso histórico y esperado
		const today = new Date();
		const startDate = new Date(project.startDate);
		const endDate = project.estimatedCompletionDate
			? new Date(project.estimatedCompletionDate)
			: new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000); // +90 días por defecto

		const totalDuration =
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

		// Crear datos para gráfica de progreso
		const progressData = [];
		let currentDate = new Date(startDate);
		let lastPercentage = 0;

		while (currentDate <= today) {
			// Días transcurridos desde el inicio hasta esta fecha
			const daysPassed = Math.floor(
				(currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			// Calcular porcentaje esperado basado en el tiempo transcurrido
			// Curva S ligeramente más lenta al inicio y al final
			const timeRatio = daysPassed / totalDuration;
			const expectedPercentage =
				timeRatio < 0.2
					? 15 * timeRatio // Arranque lento
					: timeRatio > 0.8
						? 85 + (75 * (timeRatio - 0.8)) / 0.2 // Finalización lenta
						: 15 + (70 * (timeRatio - 0.2)) / 0.6; // Ritmo intermedio

			// Simular el progreso real (para datos históricos)
			// En un sistema real, estos datos vendrían de registros históricos
			const variance = Math.random() * 5 - 2.5; // +/- 2.5%
			const percentage = Math.max(
				lastPercentage,
				Math.min(
					100,
					Math.round(
						expectedPercentage * (0.85 + Math.random() * 0.3) + variance
					)
				)
			);
			lastPercentage = percentage;

			progressData.push({
				date: new Date(currentDate),
				percentage,
				expectedPercentage: Math.min(100, Math.round(expectedPercentage)),
			});

			// Avanzar 7 días
			currentDate.setDate(currentDate.getDate() + 7);
		}

		// 11. Identificar tareas críticas
		const criticalTasks = this.identifyCriticalTasks(allTasks);

		// 12. Datos de asignación de recursos (simulados)
		const resourceAllocation = this.generateResourceAllocationData(allTasks);

		// 13. Generar KPIs
		const keyPerformanceIndicators = this.generateKPIs(metrics, project);

		// 14. Generar hitos (simulados)
		const milestones = this.generateMilestones(project, phases);

		// 15. Generar riesgos activos (simulados)
		const activeRisks = this.generateActiveRisks(project, allTasks, metrics);

		// 16. Calcular días restantes y transcurridos
		const now = new Date();
		const daysElapsed = Math.floor(
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
		);
		const daysRemaining = project.estimatedCompletionDate
			? Math.max(
					0,
					Math.floor(
						(new Date(project.estimatedCompletionDate).getTime() -
							now.getTime()) /
							(1000 * 60 * 60 * 24)
					)
				)
			: 0;

		// 17. Retornar dashboard data mejorado
		return {
			projectId,
			projectName: project.name,
			completionPercentage: project.completionPercentage,
			startDate: project.startDate,
			estimatedEndDate: project.estimatedCompletionDate,
			actualEndDate: project.endDate || null,
			daysRemaining,
			daysElapsed,
			progressData,
			taskStatusCounts,
			phaseProgress,
			budgetData,
			criticalTasks,
			resourceAllocation,
			keyPerformanceIndicators,
			milestones,
			activeRisks,
		};
	}

	private identifyCriticalTasks(allTasks: any[]): any[] {
		const now = new Date();

		// Criterios para considerar una tarea como crítica:
		// 1. Tareas bloqueadas
		// 2. Tareas retrasadas (fecha fin pasada pero no completadas)
		// 3. Tareas en progreso con fecha fin cercana (próximos 7 días)

		const criticalTasks = allTasks.filter((task) => {
			// Tareas bloqueadas
			if (task.status === TaskStatus.BLOCKED) {
				return true;
			}

			// Tareas retrasadas
			if (
				task.endDate &&
				task.endDate < now &&
				task.status !== TaskStatus.COMPLETED
			) {
				return true;
			}

			// Tareas en progreso con fecha fin cercana
			if (task.status === TaskStatus.IN_PROGRESS && task.endDate) {
				const daysToDeadline = Math.floor(
					(task.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
				);
				return daysToDeadline >= 0 && daysToDeadline <= 7;
			}

			return false;
		});

		// Transformar datos para el dashboard
		return criticalTasks.map((task) => {
			const isDelayed =
				task.endDate &&
				task.endDate < now &&
				task.status !== TaskStatus.COMPLETED;
			const daysDelayed = isDelayed
				? Math.floor(
						(now.getTime() - task.endDate.getTime()) / (1000 * 60 * 60 * 24)
					)
				: 0;

			return {
				taskId: task.id,
				taskName: task.name,
				status: task.status,
				phaseId: task.phaseId,
				phaseName: task.phaseName, // asumiendo que añadimos este campo cuando obtuvimos las tareas
				startDate: task.startDate,
				endDate: task.endDate,
				assignedTo: task.assignedTo,
				isDelayed,
				daysDelayed,
			};
		});
	}

	private generateResourceAllocationData(allTasks: any[]): any[] {
		// En un sistema real, obtendríamos esta información de la base de datos
		// Aquí generamos datos simulados basados en las tareas

		// Extraer usuarios únicos asignados a tareas
		const assignedUsers = new Set();
		allTasks.forEach((task) => {
			if (task.assignedTo) {
				assignedUsers.add(task.assignedTo);
			}
		});

		// Generar datos simulados de asignación
		const resourceData = [];

		// Convertir a array y limitar a 5 recursos como máximo
		Array.from(assignedUsers)
			.slice(0, 5)
			.forEach((userId: any, index) => {
				const tasksForResource = allTasks.filter(
					(task) => task.assignedTo === userId
				);

				resourceData.push({
					resourceId: userId,
					resourceName: `Recurso ${index + 1}`, // En un sistema real, obtendríamos el nombre del usuario
					resourceType: index % 2 === 0 ? "Interno" : "Externo", // Simulado
					tasksAssigned: tasksForResource.length,
					utilizationPercentage: 60 + Math.floor(Math.random() * 40), // Valor simulado entre 60-99%
				});
			});

		// Añadir algunos recursos simulados si no hay suficientes
		if (resourceData.length < 3) {
			for (let i = resourceData.length; i < 3; i++) {
				resourceData.push({
					resourceId: `simulated-${i}`,
					resourceName: `Recurso ${i + 1}`,
					resourceType: i % 2 === 0 ? "Interno" : "Externo",
					tasksAssigned: Math.floor(Math.random() * 5) + 1,
					utilizationPercentage: 60 + Math.floor(Math.random() * 40),
				});
			}
		}

		return resourceData;
	}

	private generateKPIs(metrics: any, project: any): any[] {
		return [
			{
				name: "SPI",
				value: metrics.earnedValueMetrics.spi,
				target: 1.0,
				unit: "",
				status:
					metrics.earnedValueMetrics.spi >= 0.95
						? "good"
						: metrics.earnedValueMetrics.spi >= 0.85
							? "warning"
							: "critical",
			},
			{
				name: "CPI",
				value: metrics.earnedValueMetrics.cpi,
				target: 1.0,
				unit: "",
				status:
					metrics.earnedValueMetrics.cpi >= 0.95
						? "good"
						: metrics.earnedValueMetrics.cpi >= 0.85
							? "warning"
							: "critical",
			},
			{
				name: "Progreso",
				value: project.completionPercentage,
				target:
					(metrics.earnedValueMetrics.plannedValue * 100) /
					metrics.earnedValueMetrics.bac,
				unit: "%",
				status:
					project.completionPercentage >=
					(metrics.earnedValueMetrics.plannedValue * 90) /
						metrics.earnedValueMetrics.bac
						? "good"
						: project.completionPercentage >=
							  (metrics.earnedValueMetrics.plannedValue * 70) /
									metrics.earnedValueMetrics.bac
							? "warning"
							: "critical",
			},
			{
				name: "Tasa de Finalización",
				value: metrics.taskCompletionRate * 100,
				target: 75,
				unit: "%",
				status:
					metrics.taskCompletionRate >= 0.75
						? "good"
						: metrics.taskCompletionRate >= 0.5
							? "warning"
							: "critical",
			},
			{
				name: "Costos vs. Presupuesto",
				value: project.currentCost || 0,
				target: project.estimatedBudget || 0,
				unit: "$",
				status:
					(project.currentCost || 0) <= (project.estimatedBudget || 0)
						? "good"
						: (project.currentCost || 0) <= (project.estimatedBudget || 0) * 1.1
							? "warning"
							: "critical",
			},
		];
	}

	private generateMilestones(project: any, phases: any[]): any[] {
		const milestones = [];
		const now = new Date();

		// Milestone de inicio del proyecto
		milestones.push({
			name: "Inicio del Proyecto",
			date: new Date(project.startDate),
			completed: true,
			isDelayed: false,
			daysDelayed: 0,
		});

		// Milestone para cada fase finalizada
		phases.forEach((phase, index) => {
			if (phase.endDate) {
				const isCompleted = phase.completionPercentage >= 100;
				const isDelayed = phase.endDate < now && !isCompleted;
				const daysDelayed = isDelayed
					? Math.floor(
							(now.getTime() - phase.endDate.getTime()) / (1000 * 60 * 60 * 24)
						)
					: 0;

				milestones.push({
					name: `Finalización de Fase: ${phase.name}`,
					date: new Date(phase.endDate),
					completed: isCompleted,
					isDelayed,
					daysDelayed,
				});
			}
		});

		// Milestone de finalización del proyecto
		if (project.estimatedCompletionDate) {
			const isCompleted = project.completionPercentage >= 100;
			const isDelayed =
				new Date(project.estimatedCompletionDate) < now && !isCompleted;
			const daysDelayed = isDelayed
				? Math.floor(
						(now.getTime() -
							new Date(project.estimatedCompletionDate).getTime()) /
							(1000 * 60 * 60 * 24)
					)
				: 0;

			milestones.push({
				name: "Finalización del Proyecto",
				date: new Date(project.estimatedCompletionDate),
				completed: isCompleted,
				isDelayed,
				daysDelayed,
			});
		}

		return milestones;
	}

	private generateActiveRisks(
		project: any,
		allTasks: any[],
		metrics: any
	): any[] {
		const risks = [];

		// Riesgo basado en SPI
		if (metrics.earnedValueMetrics.spi < 0.9) {
			risks.push({
				description: "Retraso en el cronograma del proyecto",
				probability: Math.min(1, 1.2 - metrics.earnedValueMetrics.spi),
				impact: 4,
				riskScore:
					Math.round(
						Math.min(1, 1.2 - metrics.earnedValueMetrics.spi) * 4 * 10
					) / 10,
				mitigationPlan:
					"Revisar planificación, ajustar recursos y priorizar tareas críticas",
			});
		}

		// Riesgo basado en CPI
		if (metrics.earnedValueMetrics.cpi < 0.9) {
			risks.push({
				description: "Desviación de costos por encima del presupuesto",
				probability: Math.min(1, 1.2 - metrics.earnedValueMetrics.cpi),
				impact: 4,
				riskScore:
					Math.round(
						Math.min(1, 1.2 - metrics.earnedValueMetrics.cpi) * 4 * 10
					) / 10,
				mitigationPlan:
					"Revisar y optimizar gastos, evaluar ajustes al alcance del proyecto",
			});
		}

		// Riesgo basado en tareas bloqueadas
		const blockedTasks = allTasks.filter(
			(task) => task.status === TaskStatus.BLOCKED
		);
		if (blockedTasks.length > 0) {
			risks.push({
				description: `${blockedTasks.length} tareas bloqueadas impidiendo progreso`,
				probability: Math.min(1, 0.5 + blockedTasks.length * 0.1),
				impact: 3,
				riskScore:
					Math.round(Math.min(1, 0.5 + blockedTasks.length * 0.1) * 3 * 10) /
					10,
				mitigationPlan:
					"Realizar reunión inmediata para resolver bloqueos, escalar problemas si es necesario",
			});
		}

		// Riesgo basado en progreso general
		const now = new Date();
		const startDate = new Date(project.startDate);
		const endDate = project.estimatedCompletionDate
			? new Date(project.estimatedCompletionDate)
			: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

		const percentageTimeElapsed = Math.min(
			100,
			((now.getTime() - startDate.getTime()) /
				(endDate.getTime() - startDate.getTime())) *
				100
		);

		if (project.completionPercentage < percentageTimeElapsed * 0.8) {
			risks.push({
				description:
					"Progreso general significativamente más lento de lo planeado",
				probability: 0.7,
				impact: 5,
				riskScore: 3.5,
				mitigationPlan:
					"Reevaluar cronograma, realizar ajustes en recursos y/o alcance",
			});
		}

		// Riesgo basado en tareas sin asignar
		const unassignedTasks = allTasks.filter(
			(task) => !task.assignedTo && task.status !== TaskStatus.COMPLETED
		);

		if (unassignedTasks.length > allTasks.length * 0.2) {
			risks.push({
				description: "Alto número de tareas sin asignar",
				probability: 0.6,
				impact: 3,
				riskScore: 1.8,
				mitigationPlan:
					"Realizar asignaciones pendientes y verificar disponibilidad de recursos",
			});
		}

		return risks;
	}
}
