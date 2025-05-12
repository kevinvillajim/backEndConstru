// src/application/project/GetProjectMetricsUseCase.ts
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import {PhaseRepository} from "../../domain/repositories/PhaseRepository";
import {TaskRepository} from "../../domain/repositories/TaskRepository";
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {
	ProjectMetricsService,
	PerformanceMetrics,
} from "../../domain/services/ProjectMetricsService";

export class GetProjectMetricsUseCase {
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
	): Promise<PerformanceMetrics> {
		// 1. Obtener el proyecto
		const project = await this.projectRepository.findById(projectId);

		if (!project) {
			throw new Error(`Proyecto no encontrado: ${projectId}`);
		}

		// 2. Verificar permisos del usuario
		if (project.userId !== userId) {
			// Aquí se podría verificar si el usuario es parte del equipo del proyecto
			throw new Error(
				"No tienes permiso para acceder a las métricas de este proyecto"
			);
		}

		// 3. Obtener fases del proyecto
		const phases = await this.phaseRepository.findByProject(projectId);

		// 4. Obtener todas las tareas del proyecto
		const allTasks = [].concat(
			...(await Promise.all(
				phases.map((phase) => this.taskRepository.findByPhase(phase.id))
			))
		);

		// 5. Obtener el presupuesto más reciente
		const budgets = await this.projectBudgetRepository.findByProject(projectId);
		const latestBudget =
			budgets.length > 0
				? budgets.sort((a, b) => b.version - a.version)[0]
				: null;

		// 6. Calcular métricas avanzadas
		return this.projectMetricsService.calculatePerformanceMetrics(
			project,
			phases,
			allTasks,
			latestBudget
		);
	}
}
