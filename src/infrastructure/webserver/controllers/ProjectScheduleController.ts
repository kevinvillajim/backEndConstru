// src/infrastructure/webserver/controllers/ProjectScheduleController.ts
import {Request, Response} from "express";
import {GenerateProjectScheduleUseCase} from "../../../application/project/GenerateProjectScheduleUseCase";
import {handleError} from "../utils/errorHandler";
import {User} from "../../../domain/models/user/User";

interface RequestWithUser extends Request {
	user?: User;
}

export class ProjectScheduleController {
	constructor(
		private generateProjectScheduleUseCase: GenerateProjectScheduleUseCase
	) {}

	/**
	 * Genera un cronograma de proyecto basado en sus características
	 */
	async generateSchedule(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {projectId} = req.params;

			// Verificar que el usuario está autenticado
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const userId = req.user.id;

			// Ejecutar caso de uso
			const result = await this.generateProjectScheduleUseCase.execute(
				projectId,
				userId
			);

			res.status(200).json({
				success: true,
				message: `Cronograma generado con ${result.phases} fases y ${result.tasks} tareas`,
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al generar cronograma:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al generar el cronograma",
			});
		}
	}
}
