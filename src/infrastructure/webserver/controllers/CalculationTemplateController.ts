// src/infrastructure/webserver/controllers/CalculationTemplateController.ts
import {Request, Response} from "express";
import { CreateCalculationTemplateUseCase } from "../../../application/calculation/CreateCalculationTemplateUseCase";
import {CalculationService} from "../../../domain/services/CalculationService";
import {CalculationTemplateRepository} from "../../../domain/repositories/CalculationTemplateRepository";
import {
	CalculationType,
	ProfessionType,
} from "../../../domain/models/calculation/CalculationTemplate";
import { handleError } from "../utils/errorHandler";
import { User } from "../../../domain/models/user/User";

interface RequestWithUser extends Request {
	user?: User;
}

export class CalculationTemplateController {
	constructor(
		private createCalculationTemplateUseCase: CreateCalculationTemplateUseCase,
		private calculationService: CalculationService,
		private calculationTemplateRepository: CalculationTemplateRepository
	) {}

	/**
	 * Crea una nueva plantilla de cálculo
	 */
	async createTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const templateData = req.body;
			const userId = req.user?.id;

			// Verificar que userId existe
			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const createdTemplate =
				await this.createCalculationTemplateUseCase.execute(
					templateData,
					userId
				);

			res.status(201).json({
				success: true,
				data: createdTemplate,
			});
		} catch (error) {
			console.error("Error al crear plantilla:", error);

			const typedError = handleError(error);

			// Si es un error de validación específico, devolver los errores detallados
			if (typedError.name === "TemplateValidationError" && typedError.errors) {
				res.status(400).json({
					success: false,
					message: "Error de validación",
					errors: typedError.errors,
				});
			} else {
				res.status(400).json({
					success: false,
					message:
						typedError.message || "Error al crear la plantilla de cálculo",
				});
			}
		}
	}

	/**
	 * Obtiene una plantilla por su ID
	 */
	async getTemplateById(req: Request, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const template =
				await this.calculationTemplateRepository.findByIdWithParameters(id);

			if (!template) {
				res.status(404).json({
					success: false,
					message: "Plantilla no encontrada",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: template,
			});
		} catch (error) {
			console.error("Error al obtener plantilla:", error);

			const typedError = handleError(error);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener la plantilla",
			});
		}
	}

	/**
	 * Obtiene todas las plantillas con filtros opcionales
	 */
	async getTemplates(req: Request, res: Response): Promise<void> {
		try {
			const {
				types,
				targetProfessions,
				isActive,
				isVerified,
				isFeatured,
				shareLevel,
				createdBy,
				tags,
				searchTerm,
				page = 1,
				limit = 10,
				sortBy,
				sortOrder,
			} = req.query;

			// Convertir y validar filtros
			const filters: any = {};

			if (types) {
				const typeArray = Array.isArray(types) ? types : [types];
				filters.types = typeArray.filter((type) =>
					Object.values(CalculationType).includes(type as CalculationType)
				);
			}

			if (targetProfessions) {
				const professionArray = Array.isArray(targetProfessions)
					? targetProfessions
					: [targetProfessions];
				filters.targetProfessions = professionArray.filter((profession) =>
					Object.values(ProfessionType).includes(profession as ProfessionType)
				);
			}

			if (isActive !== undefined) {
				filters.isActive = isActive === "true";
			}

			if (isVerified !== undefined) {
				filters.isVerified = isVerified === "true";
			}

			if (isFeatured !== undefined) {
				filters.isFeatured = isFeatured === "true";
			}

			if (shareLevel) {
				filters.shareLevel = shareLevel;
			}

			if (createdBy) {
				filters.createdBy = createdBy;
			}

			if (tags) {
				filters.tags = Array.isArray(tags) ? tags : [tags];
			}

			if (searchTerm) {
				filters.searchTerm = searchTerm;
			}

			// Convertir y validar paginación
			const pagination = {
				page: parseInt(page as string, 10),
				limit: parseInt(limit as string, 10),
				sortBy: sortBy as string,
				sortOrder: ((sortOrder as string) || "ASC").toUpperCase() as
					| "ASC"
					| "DESC",
			};

			const {templates, total} =
				await this.calculationTemplateRepository.findAll(filters, pagination);

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
			console.error("Error al listar plantillas:", error);

			const typedError = handleError(error);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener las plantillas",
			});
		}
	}

	/**
	 * Genera una vista previa del cálculo usando valores de ejemplo
	 */
	async previewTemplate(req: Request, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const template =
				await this.calculationTemplateRepository.findByIdWithParameters(id);

			if (!template) {
				res.status(404).json({
					success: false,
					message: "Plantilla no encontrada",
				});
				return;
			}

			const preview = this.calculationService.generatePreview(template);

			res.status(200).json({
				success: true,
				data: preview,
			});
		} catch (error) {
			console.error("Error al generar vista previa:", error);

			const typedError = handleError(error);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error al generar la vista previa",
			});
		}
	}

	/**
	 * Actualiza una plantilla existente
	 */
	async updateTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const updateData = req.body;
			const userId = req.user.id;

			// Comprobar si la plantilla existe y pertenece al usuario
			const existingTemplate =
				await this.calculationTemplateRepository.findById(id);

			if (!existingTemplate) {
				res.status(404).json({
					success: false,
					message: "Plantilla no encontrada",
				});
				return;
			}

			// Verificar permisos (solo el creador o admin puede editar)
			if (existingTemplate.createdBy !== userId && req.user.role !== "admin") {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para editar esta plantilla",
				});
				return;
			}

			const updatedTemplate = await this.calculationTemplateRepository.update(
				id,
				updateData
			);

			res.status(200).json({
				success: true,
				data: updatedTemplate,
			});
		} catch (error) {
			console.error("Error al actualizar plantilla:", error);

			const typedError = handleError(error);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar la plantilla",
			});
		}
	}

	/**
	 * Elimina una plantilla
	 */
	async deleteTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const userId = req.user.id;

			// Comprobar si la plantilla existe y pertenece al usuario
			const existingTemplate =
				await this.calculationTemplateRepository.findById(id);

			if (!existingTemplate) {
				res.status(404).json({
					success: false,
					message: "Plantilla no encontrada",
				});
				return;
			}

			// Verificar permisos (solo el creador o admin puede eliminar)
			if (existingTemplate.createdBy !== userId && req.user?.role !== "admin") {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para eliminar esta plantilla",
				});
				return;
			}

			const deleted = await this.calculationTemplateRepository.delete(id);

			if (deleted) {
				res.status(200).json({
					success: true,
					message: "Plantilla eliminada correctamente",
				});
			} else {
				res.status(500).json({
					success: false,
					message: "Error al eliminar la plantilla",
				});
			}
		} catch (error) {
			console.error("Error al eliminar plantilla:", error);

			const typedError = handleError(error);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error al eliminar la plantilla",
			});
		}
	}
}
