// src/application/project/UpdateTaskProgressUseCase.ts
import {TaskRepository} from "../../domain/repositories/TaskRepository";
import {PhaseRepository} from "../../domain/repositories/PhaseRepository";
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import {TaskStatus} from "../../domain/models/project/Task";

export class UpdateTaskProgressUseCase {
	constructor(
		private taskRepository: TaskRepository,
		private phaseRepository: PhaseRepository,
		private projectRepository: ProjectRepository
	) {}

	async execute(
		taskId: string,
		userId: string,
		progressData: {
			status: TaskStatus;
			notes?: string;
		}
	): Promise<{
		taskId: string;
		status: TaskStatus;
		phaseId: string;
		phaseProgress: number;
		projectId: string;
		projectProgress: number;
	}> {
		// 1. Obtener la tarea actual
		const task = await this.taskRepository.findById(taskId);

		if (!task) {
			throw new Error(`Tarea no encontrada: ${taskId}`);
		}

		// 2. Actualizar tarea
		const updatedTask = await this.taskRepository.update(taskId, {
			status: progressData.status,
		});

		if (!updatedTask) {
			throw new Error("Error al actualizar la tarea");
		}

		// 3. Recalcular progreso de la fase
		const phaseTasks = await this.taskRepository.findByPhase(task.phaseId);
		let completedTasks = 0;

		phaseTasks.forEach((phaseTask) => {
			if (phaseTask.status === TaskStatus.COMPLETED) {
				completedTasks++;
			}
		});

		const phaseProgress =
			phaseTasks.length > 0
				? Math.round((completedTasks / phaseTasks.length) * 100)
				: 0;

		// 4. Obtener la fase
		const phase = await this.phaseRepository.findById(task.phaseId);

		if (!phase) {
			throw new Error(`Fase no encontrada: ${task.phaseId}`);
		}

		// 5. Actualizar progreso de la fase
		await this.phaseRepository.update(phase.id, {
			completionPercentage: phaseProgress,
		});

		// 6. Recalcular progreso del proyecto
		const phases = await this.phaseRepository.findByProject(phase.projectId);
		let totalProgress = 0;

		phases.forEach((p) => {
			totalProgress += p.completionPercentage;
		});

		const projectProgress =
			phases.length > 0 ? Math.round(totalProgress / phases.length) : 0;

		// 7. Actualizar progreso del proyecto
		await this.projectRepository.update(phase.projectId, {
			completionPercentage: projectProgress,
		});

		return {
			taskId,
			status: progressData.status,
			phaseId: phase.id,
			phaseProgress,
			projectId: phase.projectId,
			projectProgress,
		};
	}
}
