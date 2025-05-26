// src/infrastructure/webserver/controllers/TemplateFavoriteController.ts
import {Request, Response} from "express";
import {FavoriteTemplateUseCase} from "../../../application/calculation/FavoriteTemplateUseCase";
import {GetUserFavoritesUseCase} from "../../../application/calculation/GetUserFavoritesUseCase";
import {RequestWithUser} from "../middlewares/authMiddleware";
import {handleError} from "../utils/errorHandler";

export class TemplateFavoriteController {
	constructor(
		private favoriteTemplateUseCase: FavoriteTemplateUseCase,
		private getUserFavoritesUseCase: GetUserFavoritesUseCase
	) {}

	async toggleFavorite(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;
			const {templateId} = req.params;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const result = await this.favoriteTemplateUseCase.execute(
				userId,
				templateId
			);

			res.status(200).json({
				success: true,
				data: result,
				message: result.isFavorite
					? "Agregado a favoritos"
					: "Removido de favoritos",
			});
		} catch (error: any) {
			const typedError = handleError(error);
			console.error("Error al procesar favorito:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al procesar favorito",
			});
		}
	}

	async getUserFavorites(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const userId = req.user?.id;

			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const favorites = await this.getUserFavoritesUseCase.execute(userId);

			res.status(200).json({
				success: true,
				data: favorites,
			});
		} catch (error: any) {
			const typedError = handleError(error);
			console.error("Error al obtener favoritos:", typedError);

			res.status(500).json({
				success: false,
				message: typedError.message || "Error al obtener favoritos",
			});
		}
	}
}
