// src/infrastructure/webserver/controllers/TemplateSuggestionController.ts
import {CreateSuggestionUseCase} from "../../../application/calculation/CreateSuggestionUseCase";
import {GetSuggestionsUseCase} from "../../../application/calculation/GetSuggestionsUseCase";
import {UpdateSuggestionStatusUseCase} from "../../../application/calculation/UpdateSuggestionStatusUseCase";
import { RequestWithUser } from "../middlewares/authMiddleware";
import { handleError } from "../utils/errorHandler";
import {Response, Request} from "express";

export class TemplateSuggestionController {
	constructor(
		private createSuggestionUseCase: CreateSuggestionUseCase,
		private getSuggestionsUseCase: GetSuggestionsUseCase,
		private updateSuggestionStatusUseCase: UpdateSuggestionStatusUseCase
	) {}

	async createSuggestion(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;
			const {templateId} = req.params;
			const suggestionData = {...req.body, templateId};

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validaciones básicas
			if (!suggestionData.title || !suggestionData.description) {
				res.status(400).json({
					success: false,
					message: "Título y descripción son obligatorios",
				});
				return;
			}

			const suggestion = await this.createSuggestionUseCase.execute(
				suggestionData,
				userId
			);

			res.status(201).json({
				success: true,
				data: suggestion,
				message: "Sugerencia creada exitosamente",
			});
		} catch (error: any) {
			const typedError = handleError(error);
			console.error("Error al crear sugerencia:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al crear sugerencia",
			});
		}
	}

	async getSuggestions(req: Request & { params: { templateId: string } }, res: Response): Promise<void> {
		try {
			const {templateId} = req.params;
			const suggestions = await this.getSuggestionsUseCase.execute(templateId);

			res.status(200).json({
				success: true,
				data: suggestions,
			});
		} catch (error: any) {
			const typedError = handleError(error);
			console.error("Error al obtener sugerencias:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener sugerencias",
			});
		}
	}

	async getUserSuggestions(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const suggestions =
				await this.getSuggestionsUseCase.getUserSuggestions(userId);

			res.status(200).json({
				success: true,
				data: suggestions,
			});
		} catch (error: any) {
			const typedError = handleError(error);
			console.error("Error al obtener sugerencias del usuario:", typedError);

			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al obtener sugerencias del usuario",
			});
		}
	}

	async updateSuggestionStatus(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {suggestionId} = req.params;
			const {status} = req.body;
			const reviewedBy = req.user?.id;

			if (!reviewedBy) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar status
			const validStatuses = ["pending", "approved", "rejected", "implemented"];
			if (!validStatuses.includes(status)) {
				res.status(400).json({
					success: false,
					message: "Estado inválido",
				});
				return;
			}

			const suggestion = await this.updateSuggestionStatusUseCase.execute(
				suggestionId,
				status,
				reviewedBy
			);

			res.status(200).json({
				success: true,
				data: suggestion,
				message: "Estado de sugerencia actualizado",
			});
		} catch (error: any) {
			const typedError = handleError(error);
			console.error("Error al actualizar sugerencia:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar sugerencia",
			});
		}
	}

	async getPendingSuggestions(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			// Solo admins pueden ver sugerencias pendientes
			if (req.user?.role !== "admin") {
				res.status(403).json({
					success: false,
					message: "No tienes permisos para ver sugerencias pendientes",
				});
				return;
			}

			const suggestions =
				await this.getSuggestionsUseCase.getPendingSuggestions();

			res.status(200).json({
				success: true,
				data: suggestions,
			});
		} catch (error: any) {
			const typedError = handleError(error);
			console.error("Error al obtener sugerencias pendientes:", typedError);

			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al obtener sugerencias pendientes",
			});
		}
	}
}
