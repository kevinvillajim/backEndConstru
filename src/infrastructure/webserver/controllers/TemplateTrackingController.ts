// src/infrastructure/webserver/controllers/TemplateTrackingController.ts
import {Request, Response} from "express";
import {RequestWithUser} from "../middlewares/authMiddleware";
import {handleError} from "../utils/errorHandler";
import {TrackTemplateUsageUseCase} from "../../../application/calculation/TrackTemplateUsageUseCase";

export class TemplateTrackingController {
	constructor(private trackTemplateUsageUseCase: TrackTemplateUsageUseCase) {}

	/**
	 * POST /api/tracking/templates/:id/usage
	 * Registra manualmente el uso de una plantilla
	 */
	async trackTemplateUsage(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id: templateId} = req.params;
			const {templateType, calculationResultId, projectId} = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			if (!["personal", "verified"].includes(templateType)) {
				res.status(400).json({
					success: false,
					message: "templateType debe ser 'personal' o 'verified'",
				});
				return;
			}

			if (!calculationResultId) {
				res.status(400).json({
					success: false,
					message: "calculationResultId es requerido",
				});
				return;
			}

			// Obtener IP del cliente
			const ipAddress =
				req.ip ||
				req.connection.remoteAddress ||
				req.socket.remoteAddress ||
				(req.connection as any)?.socket?.remoteAddress;

			const result = await this.trackTemplateUsageUseCase.execute({
				templateId,
				templateType,
				userId,
				projectId,
				calculationResultId,
				ipAddress,
				userAgent: req.get("User-Agent"),
			});

			if (result.success) {
				res.status(200).json({
					success: true,
					data: {
						logId: result.logId,
						message: "Uso registrado exitosamente",
					},
				});
			} else {
				res.status(400).json({
					success: false,
					message: "Error registrando uso de plantilla",
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error registrando uso de plantilla:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error registrando uso de plantilla",
			});
		}
	}

	/**
	 * POST /api/tracking/templates/batch
	 * Registra múltiples usos en lote
	 */
	async trackBatchUsage(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {usages} = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			if (!Array.isArray(usages) || usages.length === 0) {
				res.status(400).json({
					success: false,
					message: "Se requiere un array de usos",
				});
				return;
			}

			if (usages.length > 100) {
				res.status(400).json({
					success: false,
					message: "Máximo 100 usos por lote",
				});
				return;
			}

			// Validar cada uso
			for (const usage of usages) {
				if (
					!usage.templateId ||
					!usage.templateType ||
					!usage.calculationResultId
				) {
					res.status(400).json({
						success: false,
						message:
							"Cada uso debe tener templateId, templateType y calculationResultId",
					});
					return;
				}

				if (!["personal", "verified"].includes(usage.templateType)) {
					res.status(400).json({
						success: false,
						message: "templateType debe ser 'personal' o 'verified'",
					});
					return;
				}
			}

			// Preparar solicitudes
			const requests = usages.map((usage) => ({
				templateId: usage.templateId,
				templateType: usage.templateType,
				userId,
				projectId: usage.projectId,
				calculationResultId: usage.calculationResultId,
				ipAddress: req.ip,
				userAgent: req.get("User-Agent"),
			}));

			const result =
				await this.trackTemplateUsageUseCase.executeBatch(requests);

			res.status(200).json({
				success: true,
				data: {
					successful: result.successful,
					failed: result.failed,
					logIds: result.logIds,
					message: `Procesados ${result.successful} usos exitosamente, ${result.failed} fallaron`,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error registrando usos en lote:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error registrando usos en lote",
			});
		}
	}

	/**
	 * GET /api/tracking/templates/:id/stats
	 * Obtiene estadísticas de uso de una plantilla
	 */
	async getTemplateUsageStats(req: Request, res: Response): Promise<void> {
		try {
			const {id: templateId} = req.params;
			const {templateType = "personal"} = req.query;

			if (!["personal", "verified"].includes(templateType as string)) {
				res.status(400).json({
					success: false,
					message: "templateType debe ser 'personal' o 'verified'",
				});
				return;
			}

			const stats = await this.trackTemplateUsageUseCase.getTemplateUsageStats(
				templateId,
				templateType as "personal" | "verified"
			);

			res.status(200).json({
				success: true,
				data: stats,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo estadísticas de uso:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error obteniendo estadísticas de uso",
			});
		}
	}

	/**
	 * GET /api/tracking/most-used
	 * Obtiene las plantillas más usadas
	 */
	async getMostUsedTemplates(req: Request, res: Response): Promise<void> {
		try {
			const {templateType, period, limit = "10"} = req.query;

			if (
				templateType &&
				!["personal", "verified"].includes(templateType as string)
			) {
				res.status(400).json({
					success: false,
					message: "templateType debe ser 'personal' o 'verified'",
				});
				return;
			}

			if (period && !["day", "week", "month"].includes(period as string)) {
				res.status(400).json({
					success: false,
					message: "period debe ser 'day', 'week' o 'month'",
				});
				return;
			}

			const limitNum = parseInt(limit as string);
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
				res.status(400).json({
					success: false,
					message: "limit debe ser un número entre 1 y 50",
				});
				return;
			}

			const mostUsed =
				await this.trackTemplateUsageUseCase.getMostUsedTemplates(
					templateType as "personal" | "verified" | undefined,
					period as "day" | "week" | "month" | undefined,
					limitNum
				);

			res.status(200).json({
				success: true,
				data: {
					templates: mostUsed,
					period: period || "all-time",
					templateType: templateType || "all",
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error obteniendo plantillas más usadas:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error obteniendo plantillas más usadas",
			});
		}
	}
}
