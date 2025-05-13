// src/infrastructure/webserver/controllers/TaskController.ts
import {Request, Response} from "express";
import {UpdateTaskProgressUseCase} from "../../../application/project/UpdateTaskProgressUseCase";
import {AssignTaskUseCase} from "../../../application/project/AssignTaskUseCase";
import {TaskRepository} from "../../../domain/repositories/TaskRepository";
import {handleError} from "../utils/errorHandler";
import {TaskStatus} from "../../../domain/models/project/Task";
import {RequestWithUser} from "../middlewares/authMiddleware";

export class TaskController {
	constructor(
		private updateTaskProgressUseCase: UpdateTaskProgressUseCase,
		private assignTaskUseCase: AssignTaskUseCase,
		private taskRepository: TaskRepository
	) {}

	/**
	 * Actualiza el progreso de una tarea
	 */
	async updateTaskProgress(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {taskId} = req.params;
			const {status, notes} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar status
			if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
				res.status(400).json({
					success: false,
					message: "Estado no válido",
				});
				return;
			}

			const result = await this.updateTaskProgressUseCase.execute(
				taskId,
				req.user.id,
				{
					status: status as TaskStatus,
					notes,
				}
			);

			res.status(200).json({
				success: true,
				message: "Progreso de tarea actualizado",
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar progreso",
			});
		}
	}

	/**
	 * Asigna una tarea a un usuario
	 */
	async assignTask(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {taskId} = req.params;
			const {assigneeId} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			if (!assigneeId) {
				res.status(400).json({
					success: false,
					message: "El ID del usuario asignado es requerido",
				});
				return;
			}

			const result = await this.assignTaskUseCase.execute(
				taskId,
				assigneeId,
				req.user.id
			);

			res.status(200).json({
				success: true,
				message: "Tarea asignada exitosamente",
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al asignar tarea",
			});
		}
	}

	/**
	 * Obtiene detalles de una tarea
	 */
	async getTaskDetails(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {taskId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const task = await this.taskRepository.findById(taskId);

			if (!task) {
				res.status(404).json({
					success: false,
					message: "Tarea no encontrada",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: task,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener detalles de la tarea",
			});
		}
	}
}
