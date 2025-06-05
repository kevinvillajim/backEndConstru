import { CreateMaterialCalculationUseCase } from "../../../application/calculation/material/CreateMaterialCalculationUseCase";
import { TrackMaterialTemplateUsageUseCase } from "../../../application/calculation/material/TrackMaterialTemplateUsageUseCase";
import { MaterialCalculationType } from "../../../domain/models/calculation/MaterialCalculationTemplate";
import { MaterialCalculationResultRepository, ResultFilters } from "../../../domain/repositories/MaterialCalculationResultRepository";
import { RequestWithUser } from "../middlewares/authMiddleware";
import { handleError } from "../utils/errorHandler";

// src/infrastructure/webserver/controllers/MaterialCalculationController.ts
export class MaterialCalculationController {
	constructor(
		private createMaterialCalculationUseCase: CreateMaterialCalculationUseCase,
		private trackMaterialUsageUseCase: TrackMaterialTemplateUsageUseCase,
		private resultRepository: MaterialCalculationResultRepository
	) {}

	/**
	 * POST /api/material-calculations/execute
	 * Ejecutar cálculo de materiales
	 */
	async executeCalculation(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {
				templateId,
				templateType,
				inputParameters,
				projectId,
				includeWaste,
				regionalFactors,
				currency,
				notes,
				saveResult,
			} = req.body;

			// Validar datos requeridos
			if (!templateId || !templateType || !inputParameters) {
				res.status(400).json({
					success: false,
					message: "templateId, templateType e inputParameters son requeridos",
				});
				return;
			}

			// Ejecutar cálculo
			const result = await this.createMaterialCalculationUseCase.execute({
				templateId,
				templateType,
				userId: req.user.id,
				projectId,
				inputParameters,
				includeWaste,
				regionalFactors,
				currency,
				notes,
				saveResult,
			});

			// Tracking automático (en background)
			setImmediate(async () => {
				try {
					await this.trackMaterialUsageUseCase.execute({
						templateId,
						templateType,
						userId: req.user!.id,
						projectId,
						calculationResultId: result.id,
						executionTimeMs: result.executionTime,
						wasSuccessful: true,
						totalMaterialsCalculated: result.materialQuantities.length,
						wasteIncluded: result.wasteIncluded,
						regionalFactorsApplied: result.regionalFactorsApplied,
						totalCost: result.totalCost,
						ipAddress: req.ip,
						userAgent: req.get("User-Agent"),
					});
				} catch (trackingError) {
					console.error("Error en tracking de uso de material:", trackingError);
				}
			});

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al ejecutar cálculo de materiales",
			});
		}
	}

	/**
	 * GET /api/material-calculations/results
	 * Obtener resultados de cálculos del usuario
	 */
	async getUserResults(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {
				templateType,
				materialType,
				dateFrom,
				dateTo,
				isSaved,
				page = 1,
				limit = 20,
			} = req.query;

			const filters: ResultFilters = {
				templateType: templateType as "official" | "user",
				materialType: materialType as MaterialCalculationType,
				dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
				dateTo: dateTo ? new Date(dateTo as string) : undefined,
				isSaved: isSaved === "true",
			};

			const results = await this.resultRepository.findByUserId(
				req.user.id,
				filters
			);

			// Paginación manual (simplificada)
			const pageNum = parseInt(page as string);
			const limitNum = parseInt(limit as string);
			const startIndex = (pageNum - 1) * limitNum;
			const paginatedResults = results.slice(startIndex, startIndex + limitNum);

			res.status(200).json({
				success: true,
				data: {
					results: paginatedResults,
					pagination: {
						total: results.length,
						page: pageNum,
						limit: limitNum,
						pages: Math.ceil(results.length / limitNum),
					},
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener resultados",
			});
		}
	}

	/**
	 * GET /api/material-calculations/results/:id
	 * Obtener resultado específico
	 */
	async getResultById(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;

			const result = await this.resultRepository.findById(id);

			if (!result) {
				res.status(404).json({
					success: false,
					message: "Resultado no encontrado",
				});
				return;
			}

			// Verificar que el usuario tenga acceso
			if (req.user && result.userId !== req.user.id && !result.isShared) {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para ver este resultado",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener resultado",
			});
		}
	}

	/**
	 * PUT /api/material-calculations/results/:id/save
	 * Guardar/desguardar resultado
	 */
	async toggleSaveResult(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {id} = req.params;
			const {isSaved} = req.body;

			const result = await this.resultRepository.findById(id);

			if (!result) {
				res.status(404).json({
					success: false,
					message: "Resultado no encontrado",
				});
				return;
			}

			if (result.userId !== req.user.id) {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para modificar este resultado",
				});
				return;
			}

			await this.resultRepository.toggleSaved(id, isSaved);

			res.status(200).json({
				success: true,
				message: isSaved
					? "Resultado guardado"
					: "Resultado removido de guardados",
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar resultado",
			});
		}
	}

	/**
	 * PUT /api/material-calculations/results/:id/share
	 * Compartir/no compartir resultado
	 */
	async toggleShareResult(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {id} = req.params;
			const {isShared} = req.body;

			const result = await this.resultRepository.findById(id);

			if (!result) {
				res.status(404).json({
					success: false,
					message: "Resultado no encontrado",
				});
				return;
			}

			if (result.userId !== req.user.id) {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para modificar este resultado",
				});
				return;
			}

			await this.resultRepository.toggleShared(id, isShared);

			res.status(200).json({
				success: true,
				message: isShared
					? "Resultado compartido públicamente"
					: "Resultado ya no es público",
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar resultado",
			});
		}
	}
}
