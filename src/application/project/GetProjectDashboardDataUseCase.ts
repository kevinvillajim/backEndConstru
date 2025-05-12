// src/application/project/GetProjectDashboardDataUseCase.ts
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import {PhaseRepository} from "../../domain/repositories/PhaseRepository";
import {TaskRepository} from "../../domain/repositories/TaskRepository";
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {TaskStatus} from "../../domain/models/project/Task";

export interface ProjectDashboardData {
	// Datos generales
	projectId: string;
	projectName: string;
	completionPercentage: number;

	// Datos para gráfica de progreso en el tiempo
	progressData: {
		date: Date;
		percentage: number;
	}[];

	// Datos para gráfica de estado de tareas
	taskStatusCounts: {
		status: string;
		count: number;
	}[];

	// Datos para gráfica de progreso por fase
	phaseProgress: {
		phaseId: string;
		phaseName: string;
		completionPercentage: number;
		totalTasks: number;
		completedTasks: number;
	}[];

	// Datos para gráfica de costos
	budgetData: {
		estimatedTotal: number;
		currentCost: number;
		budgetVariance: number; // negativo = sobrecosto
	};
}

export class GetProjectDashboardDataUseCase {
	constructor(
		private projectRepository: ProjectRepository,
		private phaseRepository: PhaseRepository,
		private taskRepository: TaskRepository,
		private projectBudgetRepository: ProjectBudgetRepository
	) {}

	async execute(
		projectId: string,
		userId: string
	): Promise<ProjectDashboardData> {
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

		// 4. Preparar datos de progreso por fase
		const phaseProgress = await Promise.all(
			phases.map(async (phase) => {
				const tasks = await this.taskRepository.findByPhase(phase.id);
				const completedTasks = tasks.filter(
					(task) => task.status === TaskStatus.COMPLETED
				).length;

				return {
					phaseId: phase.id,
					phaseName: phase.name,
					completionPercentage: phase.completionPercentage,
					totalTasks: tasks.length,
					completedTasks,
				};
			})
		);

		// 5. Obtener datos de tareas para gráfica de estado
		const allTasks = [].concat(
			...(await Promise.all(
				phases.map((phase) => this.taskRepository.findByPhase(phase.id))
			))
		);

		// Contar tareas por estado
		const taskStatusCounts = Object.values(TaskStatus).map((status) => {
			return {
				status,
				count: allTasks.filter((task) => task.status === status).length,
			};
		});

		// 6. Obtener datos de presupuesto más recientes
		const budgets = await this.projectBudgetRepository.findByProject(projectId);
		const latestBudget =
			budgets.length > 0
				? budgets.sort((a, b) => b.version - a.version)[0]
				: null;

		const budgetData = {
			estimatedTotal: project.estimatedBudget || 0,
			currentCost: project.currentCost || 0,
			budgetVariance:
				(project.estimatedBudget || 0) - (project.currentCost || 0),
		};

		// 7. Simular datos de progreso histórico (en un caso real, esto vendría de registros de progreso)
		const today = new Date();
		const startDate = new Date(project.startDate);
		const progressData = [];

		// Crear datos para gráfica de progreso (simulados para demostración)
		// En una implementación real, estos datos vendrían de un registro histórico de progreso
		let currentDate = new Date(startDate);
		let lastPercentage = 0;

		while (currentDate <= today) {
			// Simular un aumento gradual del progreso
			const daysFromStart = Math.floor(
				(currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
			);
			const totalDays = project.estimatedCompletionDate
				? Math.floor(
						(project.estimatedCompletionDate.getTime() - startDate.getTime()) /
							(1000 * 60 * 60 * 24)
					)
				: 100;

			// Simular progreso con una curva S
			const normalizedTime = daysFromStart / totalDays;
			const simulatedPercentage = Math.min(
				100,
				normalizedTime < 0.2
					? 20 * normalizedTime
					: normalizedTime > 0.8
						? 80 + 100 * (normalizedTime - 0.8)
						: 20 + (75 * (normalizedTime - 0.2)) / 0.6
			);

			// Añadir algo de variabilidad
			const variance = Math.random() * 5 - 2.5; // +/- 2.5%
			const percentage = Math.max(
				lastPercentage,
				Math.min(100, Math.round(simulatedPercentage + variance))
			);
			lastPercentage = percentage;

			progressData.push({
				date: new Date(currentDate),
				percentage,
			});

			// Avanzar 7 días
			currentDate.setDate(currentDate.getDate() + 7);
		}

		// 8. Retornar dashboard data
		return {
			projectId,
			projectName: project.name,
			completionPercentage: project.completionPercentage,
			progressData,
			taskStatusCounts,
			phaseProgress,
			budgetData,
		};
	}
}
