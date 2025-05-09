// src/infrastructure/webserver/controllers/PhaseController.ts
import {Request, Response} from "express";
import {PhaseRepository} from "../../../domain/repositories/PhaseRepository";
import {TaskRepository} from "../../../domain/repositories/TaskRepository";
import {handleError} from "../utils/errorHandler";
import {User} from "../../../domain/models/user/User";

interface RequestWithUser extends Request {
	user?: User;
}

export class PhaseController {
	constructor(
		private phaseRepository: PhaseRepository,
		private taskRepository: TaskRepository
	) {}

	/**
	 * Obtiene detalles de una fase
	 */
	async getPhaseDetails(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {phaseId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const phase = await this.phaseRepository.findById(phaseId);

			if (!phase) {
				res.status(404).json({
					success: false,
					message: "Fase no encontrada",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: phase,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener detalles de la fase",
			});
		}
	}

	/**
	 * Obtiene todas las tareas de una fase
	 */
	async getPhaseTasks(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {phaseId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const phase = await this.phaseRepository.findById(phaseId);

			if (!phase) {
				res.status(404).json({
					success: false,
					message: "Fase no encontrada",
				});
				return;
			}

			const tasks = await this.taskRepository.findByPhase(phaseId);

			res.status(200).json({
				success: true,
				data: {
					phase,
					tasks,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener tareas de la fase",
			});
		}
	}

	/**
	 * Actualiza fechas de una fase
	 */
	async updatePhaseDates(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {phaseId} = req.params;
			const {startDate, endDate} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar fechas
			if (!startDate || !endDate) {
				res.status(400).json({
					success: false,
					message: "Las fechas de inicio y fin son requeridas",
				});
				return;
			}

			const phase = await this.phaseRepository.findById(phaseId);

			if (!phase) {
				res.status(404).json({
					success: false,
					message: "Fase no encontrada",
				});
				return;
			}

			const updatedPhase = await this.phaseRepository.update(phaseId, {
				startDate: new Date(startDate),
				endDate: new Date(endDate),
			});

			res.status(200).json({
				success: true,
				message: "Fechas de fase actualizadas",
				data: updatedPhase,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar fechas de la fase",
			});
		}
	}
}
