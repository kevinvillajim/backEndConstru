// src/infrastructure/webserver/controllers/ProgressReportController.ts
import {Request, Response} from "express";
import {GenerateProgressReportUseCase} from "../../../application/project/GenerateProgressReportUseCase";
import {handleError} from "../utils/errorHandler";
import {User} from "../../../domain/models/user/User";

interface RequestWithUser extends Request {
	user?: User;
}

export class ProgressReportController {
	constructor(
		private generateProgressReportUseCase: GenerateProgressReportUseCase
	) {}

	/**
	 * Genera un informe detallado de progreso del proyecto
	 */
	async generateReport(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {projectId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const report = await this.generateProgressReportUseCase.execute(
				projectId,
				req.user.id
			);

			res.status(200).json({
				success: true,
				data: report,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al generar el informe de progreso",
			});
		}
	}

	/**
	 * Exporta un informe de progreso en formato PDF
	 */
	async exportReportToPdf(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {projectId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Por simplicidad, solo devolvemos un mensaje de éxito
			// En una implementación real, generaríamos el PDF
			res.status(200).json({
				success: true,
				message:
					"La funcionalidad de exportación a PDF se implementará en una fase posterior",
				data: {
					projectId,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al exportar el informe",
			});
		}
	}
}
