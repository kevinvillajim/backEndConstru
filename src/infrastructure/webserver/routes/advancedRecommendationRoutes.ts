// src/infrastructure/webserver/routes/advancedRecommendationRoutes.ts
import express from "express";
import {authenticate} from "../middlewares/authMiddleware"; // Asegúrate que este archivo existe y exporta correctamente
import {getAdvancedRecommendationsUseCase} from "../../config/service-factory";
import {AdvancedRecommendationController} from "../controllers/AdvancedRecommendationController";

const router = express.Router();
const controller = new AdvancedRecommendationController(
	getAdvancedRecommendationsUseCase()
);

// Cambia estas líneas:
router.get(
	"/templates",
	authenticate,
	controller.getTemplateRecommendations.bind(controller)
);

router.post(
	"/materials",
	authenticate,
	controller.getMaterialRecommendations.bind(controller)
);

router.post(
	"/interactions",
	authenticate,
	controller.registerUserInteraction.bind(controller)
);

export default router;
