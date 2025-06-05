// src/infrastructure/webserver/controllers/UserMaterialTemplateController.ts
import {Request, Response} from "express";
import {CreateUserMaterialTemplateUseCase} from "../../../application/calculation/material/CreateUserMaterialTemplateUseCase";
import {UserMaterialCalculationTemplateRepository} from "../../../domain/repositories/UserMaterialCalculationTemplateRepository";
import {MaterialTemplateValidationService} from "../../../domain/services/MaterialTemplateValidationService";
import {RequestWithUser} from "../middlewares/authMiddleware";
import {handleError} from "../utils/errorHandler";

export class UserMaterialTemplateController {
	constructor(
		private createUserMaterialTemplateUseCase: CreateUserMaterialTemplateUseCase,
		private userMaterialTemplateRepository: UserMaterialCalculationTemplateRepository,
		private validationService: MaterialTemplateValidationService
	) {}

	async createTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const templateData = {
				...req.body,
				userId: req.user.id,
			};

			const template =
				await this.createUserMaterialTemplateUseCase.execute(templateData);

			res.status(201).json({
				success: true,
				message: "Template de material creado exitosamente",
				data: template,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al crear template de material",
			});
		}
	}

	async getUserTemplates(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const templates = await this.userMaterialTemplateRepository.findByUserId(
				req.user.id
			);

			res.status(200).json({
				success: true,
				data: templates,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener templates",
			});
		}
	}

	async getTemplateById(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const template = await this.userMaterialTemplateRepository.findById(id);

			if (!template) {
				res.status(404).json({
					success: false,
					message: "Template no encontrado",
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
				message: typedError.message || "Error al obtener template",
			});
		}
	}

	async updateTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const updateData = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const template = await this.userMaterialTemplateRepository.findById(id);

			if (!template) {
				res.status(404).json({
					success: false,
					message: "Template no encontrado",
				});
				return;
			}

			if (template.userId !== req.user.id) {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para modificar este template",
				});
				return;
			}

			const updatedTemplate = await this.userMaterialTemplateRepository.update(
				id,
				updateData
			);

			res.status(200).json({
				success: true,
				message: "Template actualizado exitosamente",
				data: updatedTemplate,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar template",
			});
		}
	}

	async deleteTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const template = await this.userMaterialTemplateRepository.findById(id);

			if (!template) {
				res.status(404).json({
					success: false,
					message: "Template no encontrado",
				});
				return;
			}

			if (template.userId !== req.user.id) {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para eliminar este template",
				});
				return;
			}

			await this.userMaterialTemplateRepository.delete(id);

			res.status(200).json({
				success: true,
				message: "Template eliminado exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al eliminar template",
			});
		}
	}

	async getPublicTemplates(req: Request, res: Response): Promise<void> {
		try {
			const templates = await this.userMaterialTemplateRepository.findPublic();

			res.status(200).json({
				success: true,
				data: templates,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener templates públicos",
			});
		}
	}

	async togglePublic(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const {isPublic} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const template = await this.userMaterialTemplateRepository.findById(id);

			if (!template) {
				res.status(404).json({
					success: false,
					message: "Template no encontrado",
				});
				return;
			}

			if (template.userId !== req.user.id) {
				res.status(403).json({
					success: false,
					message: "No tienes permiso para modificar este template",
				});
				return;
			}

			await this.userMaterialTemplateRepository.togglePublic(id, isPublic);

			res.status(200).json({
				success: true,
				message: `Template ${isPublic ? "publicado" : "marcado como privado"} exitosamente`,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al cambiar visibilidad del template",
			});
		}
	}

	async duplicateOfficialTemplate(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {officialTemplateId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// TODO: Implementar lógica de duplicación
			res.status(501).json({
				success: false,
				message: "Funcionalidad no implementada aún",
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al duplicar template",
			});
		}
	}

	async getUserStats(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const templates = await this.userMaterialTemplateRepository.findByUserId(
				req.user.id
			);

			const stats = {
				totalTemplates: templates.length,
				publicTemplates: templates.filter((t) => t.isPublic).length,
				totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
				averageRating:
					templates.reduce((sum, t) => sum + t.averageRating, 0) /
						templates.length || 0,
			};

			res.status(200).json({
				success: true,
				data: stats,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener estadísticas",
			});
		}
	}
}
