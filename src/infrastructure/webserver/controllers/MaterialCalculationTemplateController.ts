import { MaterialCalculationType, MaterialParameter } from "../../../domain/models/calculation/MaterialCalculationTemplate";
import { MaterialCalculationTemplateRepository, MaterialTemplateFilters } from "../../../domain/repositories/MaterialCalculationTemplateRepository";
import { getMaterialCalculationService } from "@infrastructure/config/service-factory";
import { handleError } from "../utils/errorHandler";

// src/infrastructure/webserver/controllers/MaterialCalculationTemplateController.ts
export class MaterialCalculationTemplateController {
	constructor(
		private materialTemplateRepository: MaterialCalculationTemplateRepository,
		private getMaterialTemplatesByTypeUseCase: GetMaterialTemplatesByTypeUseCase,
		private searchMaterialTemplatesUseCase: SearchMaterialTemplatesUseCase
	) {}

	/**
	 * GET /api/material-calculations/templates
	 * Listar templates de materiales con filtros
	 */
	async getTemplates(req: Request, res: Response): Promise<void> {
		try {
			const {
				type,
				subCategory,
				isFeatured,
				searchTerm,
				tags,
				minRating,
				page = 1,
				limit = 20,
				sortBy,
				sortOrder,
			} = req.query;

			const filters: MaterialTemplateFilters = {
				type: type as MaterialCalculationType,
				subCategory: subCategory as string,
				isFeatured: isFeatured === "true",
				searchTerm: searchTerm as string,
				tags: tags ? (tags as string).split(",") : undefined,
				minRating: minRating ? parseFloat(minRating as string) : undefined,
				isActive: true,
			};

			const pagination = {
				page: parseInt(page as string),
				limit: parseInt(limit as string),
				sortBy: sortBy as string,
				sortOrder: (sortOrder as string)?.toUpperCase() as "ASC" | "DESC",
			};

			const {templates, total} = await this.materialTemplateRepository.findAll(
				filters,
				pagination
			);

			res.status(200).json({
				success: true,
				data: {
					templates,
					pagination: {
						total,
						page: pagination.page,
						limit: pagination.limit,
						pages: Math.ceil(total / pagination.limit),
					},
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al obtener templates de materiales",
			});
		}
	}

	/**
	 * GET /api/material-calculations/templates/:id
	 * Obtener template por ID
	 */
	async getTemplateById(req: Request, res: Response): Promise<void> {
		try {
			const {id} = req.params;

			const template = await this.materialTemplateRepository.findById(id);

			if (!template) {
				res.status(404).json({
					success: false,
					message: "Template de material no encontrado",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: template,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener template de material",
			});
		}
	}

	/**
	 * GET /api/material-calculations/templates/by-type/:type
	 * Obtener templates por tipo de material
	 */
	async getTemplatesByType(req: Request, res: Response): Promise<void> {
		try {
			const {type} = req.params;

			if (
				!Object.values(MaterialCalculationType).includes(
					type as MaterialCalculationType
				)
			) {
				res.status(400).json({
					success: false,
					message: "Tipo de material inválido",
				});
				return;
			}

			const templates = await this.getMaterialTemplatesByTypeUseCase.execute(
				type as MaterialCalculationType
			);

			res.status(200).json({
				success: true,
				data: templates,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener templates por tipo",
			});
		}
	}

	/**
	 * GET /api/material-calculations/templates/featured
	 * Obtener templates destacados
	 */
	async getFeaturedTemplates(req: Request, res: Response): Promise<void> {
		try {
			const templates = await this.materialTemplateRepository.findFeatured();

			res.status(200).json({
				success: true,
				data: templates,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener templates destacados",
			});
		}
	}

	/**
	 * GET /api/material-calculations/templates/:id/preview
	 * Vista previa de template con datos de ejemplo
	 */
	async getTemplatePreview(req: Request, res: Response): Promise<void> {
		try {
			const {id} = req.params;

			const template = await this.materialTemplateRepository.findById(id);

			if (!template) {
				res.status(404).json({
					success: false,
					message: "Template no encontrado",
				});
				return;
			}

			// Generar datos de ejemplo basados en los parámetros
			const sampleInputs = this.generateSampleInputs(template.parameters);

			// Ejecutar cálculo de prueba
			const materialCalculationService = getMaterialCalculationService();
			const result = await materialCalculationService.executeCalculation(
				template.formula,
				sampleInputs,
				template.materialOutputs,
				template.wasteFactors,
				true
			);

			res.status(200).json({
				success: true,
				data: {
					sampleInputs,
					results: result.materialQuantities,
					additionalOutputs: result.additionalOutputs,
					wasSuccessful: result.executionSuccessful,
					errorMessage: result.errorMessage,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al generar vista previa",
			});
		}
	}

	private generateSampleInputs(
		parameters: MaterialParameter[]
	): Record<string, any> {
		const sampleInputs: Record<string, any> = {};

		parameters
			.filter((p) => p.scope === "input")
			.forEach((param) => {
				if (param.defaultValue !== undefined) {
					sampleInputs[param.name] = this.parseDefaultValue(
						param.defaultValue,
						param.dataType
					);
				} else {
					sampleInputs[param.name] = this.generateSampleValue(param);
				}
			});

		return sampleInputs;
	}

	private parseDefaultValue(value: string, dataType: string): any {
		switch (dataType) {
			case "number":
				return parseFloat(value);
			case "boolean":
				return value.toLowerCase() === "true";
			case "array":
				try {
					return JSON.parse(value);
				} catch {
					return value.split(",");
				}
			default:
				return value;
		}
	}

	private generateSampleValue(param: MaterialParameter): any {
		switch (param.dataType) {
			case "number":
				const min = param.minValue || 1;
				const max = param.maxValue || 100;
				return Math.round(((min + max) / 2) * 100) / 100;
			case "boolean":
				return true;
			case "enum":
				return param.allowedValues?.[0] || "default";
			case "array":
				return param.allowedValues || ["sample"];
			default:
				return "sample_value";
		}
	}
}
