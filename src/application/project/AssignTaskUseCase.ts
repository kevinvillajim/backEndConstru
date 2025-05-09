// src/application/project/AssignTaskUseCase.ts
import {TaskRepository} from "../../domain/repositories/TaskRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";

export class AssignTaskUseCase {
	constructor(
		private taskRepository: TaskRepository,
		private userRepository: UserRepository
	) {}

	async execute(
		taskId: string,
		assigneeId: string,
		assignedByUserId: string
	): Promise<{
		taskId: string;
		assigneeId: string;
		assigneeName: string;
	}> {
		// 1. Verificar que la tarea existe
		const task = await this.taskRepository.findById(taskId);

		if (!task) {
			throw new Error(`Tarea no encontrada: ${taskId}`);
		}

		// 2. Verificar que el usuario asignado existe
		const assignee = await this.userRepository.findById(assigneeId);

		if (!assignee) {
			throw new Error(`Usuario asignado no encontrado: ${assigneeId}`);
		}

		// 3. Actualizar la tarea
		const updatedTask = await this.taskRepository.update(taskId, {
			assignedTo: assigneeId,
		});

		if (!updatedTask) {
			throw new Error("Error al asignar la tarea");
		}

		// 4. Devolver información de la asignación
		return {
			taskId,
			assigneeId,
			assigneeName: `${assignee.firstName} ${assignee.lastName}`,
		};
	}
}
