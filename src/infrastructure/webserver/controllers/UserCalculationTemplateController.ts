// src/infrastructure/webserver/controllers/UserCalculationTemplateController.ts
import {Request, Response} from "express";
import {RequestWithUser} from "../middlewares/authMiddleware";
import {handleError} from "../utils/errorHandler";

// Use Cases
import {CreateUserTemplateUseCase} from "../../../application/user-templates/CreateUserTemplateUseCase";
import {GetUserTemplatesUseCase} from "../../../application/user-templates/GetUserTemplatesUseCase";
import {GetUserTemplateByIdUseCase} from "../../../application/user-templates/GetUserTemplateByIdUseCase";
import {UpdateUserTemplateUseCase} from "../../../application/user-templates/UpdateUserTemplateUseCase";
import {DeleteUserTemplateUseCase} from "../../../application/user-templates/DeleteUserTemplateUseCase";
import {DuplicateOfficialTemplateUseCase} from "../../../application/user-templates/DuplicateOfficialTemplateUseCase";
import {CreateTemplateFromResultUseCase} from "../../../application/user-templates/CreateTemplateFromResultUseCase";
import {ShareUserTemplateUseCase} from "../../../application/user-templates/ShareUserTemplateUseCase";
import {ChangeTemplateStatusUseCase} from "../../../application/user-templates/ChangeTemplateStatusUseCase";
import {GetPublicUserTemplatesUseCase} from "../../../application/user-templates/GetPublicUserTemplatesUseCase";
import {GetUserTemplateStatsUseCase} from "../../../application/user-templates/GetUserTemplateStatsUseCase";

// Types
import {
	UserTemplateFilters,
	UserTemplateStatus,
	UserTemplateDifficulty,
	UserTemplateSourceType,
	TemplateFormData,
} from "../../../domain/models/calculation/UserCalculationTemplate";

export class UserCalculationTemplateController {
	constructor(
		private createUserTemplateUseCase: CreateUserTemplateUseCase,
		private getUserTemplatesUseCase: GetUserTemplatesUseCase,
		private getUserTemplateByIdUseCase: GetUserTemplateByIdUseCase,
		private updateUserTemplateUseCase: UpdateUserTemplateUseCase,
		private deleteUserTemplateUseCase: DeleteUserTemplateUseCase,
		private duplicateOfficialTemplateUseCase: DuplicateOfficialTemplateUseCase,
		private createTemplateFromResultUseCase: CreateTemplateFromResultUseCase,
		private shareUserTemplateUseCase: ShareUserTemplateUseCase,
		private changeTemplateStatusUseCase: ChangeTemplateStatusUseCase,
		private getPublicUserTemplatesUseCase: GetPublicUserTemplatesUseCase,
		private getUserTemplateStatsUseCase: GetUserTemplateStatsUseCase
	) {}

	/**
	 * GET /api/user-templates
	 * Lista las plantillas personales del usuario con filtros y paginación
	 */
	async getUserTemplates(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Parsear filtros de query parameters
			const filters = this.parseFilters(req.query);

			// Parsear paginación
			const pagination = {
				page: parseInt(req.query.page as string) || 1,
				limit: Math.min(parseInt(req.query.limit as string) || 10, 100),
				sortBy: req.query.sortBy as string,
				sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
			};

			const result = await this.getUserTemplatesUseCase.execute(
				userId,
				filters,
				pagination
			);

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al obtener plantillas de usuario:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener plantillas",
			});
		}
	}

	/**
	 * GET /api/user-templates/:id
	 * Obtiene una plantilla específica del usuario
	 */
	async getUserTemplateById(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {id} = req.params;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const template = await this.getUserTemplateByIdUseCase.execute(
				id,
				userId
			);

			res.status(200).json({
				success: true,
				data: template,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al obtener plantilla:", typedError);

			if (typedError.message.includes("no encontrada")) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(500).json({
					success: false,
					message: typedError.message || "Error al obtener plantilla",
				});
			}
		}
	}

	/**
	 * POST /api/user-templates
	 * Crea una nueva plantilla personal
	 */
	async createUserTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const formData: TemplateFormData = req.body;

			const template = await this.createUserTemplateUseCase.execute(
				formData,
				userId
			);

			res.status(201).json({
				success: true,
				data: template,
				message: "Plantilla creada exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al crear plantilla:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al crear plantilla",
			});
		}
	}

	/**
	 * PUT /api/user-templates/:id
	 * Actualiza una plantilla personal existente
	 */
	async updateUserTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const formData: TemplateFormData = req.body;

			const template = await this.updateUserTemplateUseCase.execute(
				id,
				formData,
				userId
			);

			res.status(200).json({
				success: true,
				data: template,
				message: "Plantilla actualizada exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al actualizar plantilla:", typedError);

			if (typedError.message.includes("no encontrada")) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(400).json({
					success: false,
					message: typedError.message || "Error al actualizar plantilla",
				});
			}
		}
	}

	/**
	 * DELETE /api/user-templates/:id
	 * Elimina una plantilla personal
	 */
	async deleteUserTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			await this.deleteUserTemplateUseCase.execute(id, userId);

			res.status(200).json({
				success: true,
				message: "Plantilla eliminada exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al eliminar plantilla:", typedError);

			if (typedError.message.includes("no encontrada")) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(500).json({
					success: false,
					message: typedError.message || "Error al eliminar plantilla",
				});
			}
		}
	}

	/**
	 * POST /api/user-templates/duplicate/:officialId
	 * Duplica una plantilla oficial a plantilla personal
	 */
	async duplicateOfficialTemplate(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {officialId} = req.params;
			const {customName, customDescription} = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const template = await this.duplicateOfficialTemplateUseCase.execute(
				officialId,
				userId,
				customName,
				customDescription
			);

			res.status(201).json({
				success: true,
				data: template,
				message: "Plantilla duplicada exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al duplicar plantilla:", typedError);

			if (typedError.message.includes("no encontrada")) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else if (typedError.message.includes("no está disponible")) {
				res.status(403).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(400).json({
					success: false,
					message: typedError.message || "Error al duplicar plantilla",
				});
			}
		}
	}

	/**
	 * POST /api/user-templates/from-result
	 * Crea una plantilla personal desde un resultado de cálculo
	 */
	async createFromResult(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {
				calculationResultId,
				name,
				description,
				category,
				targetProfessions,
			} = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const template = await this.createTemplateFromResultUseCase.execute(
				calculationResultId,
				name,
				description,
				category,
				targetProfessions,
				userId
			);

			res.status(201).json({
				success: true,
				data: template,
				message: "Plantilla creada desde resultado exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al crear plantilla desde resultado:", typedError);

			if (typedError.message.includes("no encontrado")) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else if (typedError.message.includes("sin permisos")) {
				res.status(403).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(400).json({
					success: false,
					message: typedError.message || "Error al crear plantilla",
				});
			}
		}
	}

	/**
	 * PUT /api/user-templates/:id/status
	 * Cambia el estado de una plantilla
	 */
	async changeStatus(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const {status} = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			if (!Object.values(UserTemplateStatus).includes(status)) {
				res.status(400).json({
					success: false,
					message: "Estado inválido",
				});
				return;
			}

			const template = await this.changeTemplateStatusUseCase.execute(
				id,
				status,
				userId
			);

			res.status(200).json({
				success: true,
				data: template,
				message: `Estado cambiado a ${status} exitosamente`,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al cambiar estado:", typedError);

			if (typedError.message.includes("no encontrada")) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else if (typedError.message.includes("inválida")) {
				res.status(400).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(500).json({
					success: false,
					message: typedError.message || "Error al cambiar estado",
				});
			}
		}
	}

	/**
	 * POST /api/user-templates/:id/share
	 * Comparte una plantilla con otros usuarios
	 */
	async shareTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {id} = req.params;
			const {userIds, message} = req.body;
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
				res.status(400).json({
					success: false,
					message: "Se requiere una lista de usuarios para compartir",
				});
				return;
			}

			await this.shareUserTemplateUseCase.execute(
				{templateId: id, userIds, message},
				userId
			);

			res.status(200).json({
				success: true,
				message: "Plantilla compartida exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al compartir plantilla:", typedError);

			if (typedError.message.includes("no encontrada")) {
				res.status(404).json({
					success: false,
					message: typedError.message,
				});
			} else {
				res.status(400).json({
					success: false,
					message: typedError.message || "Error al compartir plantilla",
				});
			}
		}
	}

	/**
	 * GET /api/user-templates/public
	 * Obtiene plantillas públicas de otros usuarios
	 */
	async getPublicTemplates(req: Request, res: Response): Promise<void> {
		try {
			const excludeUserId = req.query.excludeUserId as string;
			const filters = this.parseFilters(req.query);

			const pagination = {
				page: parseInt(req.query.page as string) || 1,
				limit: Math.min(parseInt(req.query.limit as string) || 10, 100),
				sortBy: req.query.sortBy as string,
				sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "DESC",
			};

			const result = await this.getPublicUserTemplatesUseCase.execute(
				excludeUserId,
				filters,
				pagination
			);

			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al obtener plantillas públicas:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener plantillas públicas",
			});
		}
	}

	/**
	 * GET /api/user-templates/stats
	 * Obtiene estadísticas de plantillas del usuario
	 */
	async getStats(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;
			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const stats = await this.getUserTemplateStatsUseCase.execute(userId);

			res.status(200).json({
				success: true,
				data: stats,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al obtener estadísticas:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener estadísticas",
			});
		}
	}

	// === MÉTODOS PRIVADOS DE UTILIDAD ===
	private parseFilters(query: any): UserTemplateFilters {
		const filters: UserTemplateFilters = {};

		// Status
		if (query.status) {
			const statuses = Array.isArray(query.status)
				? query.status
				: [query.status];
			filters.status = statuses.filter((s: string) =>
				Object.values(UserTemplateStatus).includes(s as UserTemplateStatus)
			);
		}

		// Categories
		if (query.categories) {
			filters.categories = Array.isArray(query.categories)
				? query.categories
				: query.categories.split(",");
		}

		// Target Professions
		if (query.targetProfessions) {
			filters.targetProfessions = Array.isArray(query.targetProfessions)
				? query.targetProfessions
				: query.targetProfessions.split(",");
		}

		// Difficulty
		if (query.difficulty) {
			const difficulties = Array.isArray(query.difficulty)
				? query.difficulty
				: [query.difficulty];
			filters.difficulty = difficulties.filter((d: string) =>
				Object.values(UserTemplateDifficulty).includes(
					d as UserTemplateDifficulty
				)
			);
		}

		// Is Public
		if (query.isPublic !== undefined) {
			filters.isPublic = query.isPublic === "true";
		}

		// Tags
		if (query.tags) {
			filters.tags = Array.isArray(query.tags)
				? query.tags
				: query.tags.split(",");
		}

		// Search Term
		if (query.searchTerm) {
			filters.searchTerm = query.searchTerm;
		}

		// Source Type
		if (query.sourceType) {
			const sourceTypes = Array.isArray(query.sourceType)
				? query.sourceType
				: [query.sourceType];
			filters.sourceType = sourceTypes.filter((s: string) =>
				Object.values(UserTemplateSourceType).includes(
					s as UserTemplateSourceType
				)
			);
		}

		// Is Favorite
		if (query.isFavorite !== undefined) {
			filters.isFavorite = query.isFavorite === "true";
		}

		return filters;
	}
}
