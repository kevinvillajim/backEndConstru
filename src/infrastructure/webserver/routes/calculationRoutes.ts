// src/infrastructure/webserver/routes/calculationRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import { validateCalculationRequest, validateSaveResultRequest } from "../validators/calculationValidator";
import {
	validateSuggestionRequest,
	validateComparisonRequest,
} from "../validators/suggestionValidator";
import {validateTemplateRequest} from "../validators/templateValidator";
import {
	getCalculationController,
	getCalculationTemplateController,
	getTemplateFavoriteController,
	getTemplateRatingController,
	getTemplateSuggestionController,
	getCalculationComparisonController,
	getTrendingController,
} from "../../config/service-factory";

const router = Router();

// Routes for calculations
router.post(
	"/calculations/execute",
	authenticate,
	validateCalculationRequest,
	(req, res) => {
		const calculationController = getCalculationController();
		return calculationController.executeCalculation(req, res);
	}
);

router.post(
	"/calculations/save",
	authenticate,
	validateSaveResultRequest,
	(req, res) => {
		const calculationController = getCalculationController();
		return calculationController.saveCalculationResult(req, res);
	}
);

router.get("/calculations/recommendations", authenticate, (req, res) => {
	const calculationController = getCalculationController();
	return calculationController.getRecommendations(req, res);
});

// Routes for calculation templates
router.post("/templates", authenticate, validateTemplateRequest, (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.createTemplate(req, res);
});

router.get("/templates", (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.getTemplates(req, res);
});

router.get("/templates/search", (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.searchTemplates(req, res);
});

router.get("/templates/trending", (req, res) => {
	const trendingController = getTrendingController();
	return trendingController.getTrendingTemplates(req, res);
});

router.get("/templates/:id", (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.getTemplateById(req, res);
});

router.get("/templates/:id/preview", (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.previewTemplate(req, res);
});

router.put(
	"/templates/:id",
	authenticate,
	validateTemplateRequest,
	(req, res) => {
		const templateController = getCalculationTemplateController();
		return templateController.updateTemplate(req, res);
	}
);

router.delete("/templates/:id", authenticate, (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.deleteTemplate(req, res);
});

// ============= FAVORITOS =============
router.post("/templates/:templateId/favorite", authenticate, (req, res) => {
	const favoriteController = getTemplateFavoriteController();
	return favoriteController.toggleFavorite(req, res);
});

router.get("/users/favorites", authenticate, (req, res) => {
	const favoriteController = getTemplateFavoriteController();
	return favoriteController.getUserFavorites(req, res);
});

// ============= CALIFICACIONES =============
router.post("/templates/:templateId/rate", authenticate, (req, res) => {
	const ratingController = getTemplateRatingController();
	return ratingController.rateTemplate(req, res);
});

// ============= SUGERENCIAS =============
router.post(
	"/templates/:templateId/suggestions",
	authenticate,
	validateSuggestionRequest,
	(req, res) => {
		const suggestionController = getTemplateSuggestionController();
		return suggestionController.createSuggestion(req, res);
	}
);

router.get("/templates/:templateId/suggestions", (req, res) => {
	const suggestionController = getTemplateSuggestionController();
	return suggestionController.getSuggestions(req, res);
});

router.get("/users/suggestions", authenticate, (req, res) => {
	const suggestionController = getTemplateSuggestionController();
	return suggestionController.getUserSuggestions(req, res);
});

router.get("/admin/suggestions/pending", authenticate, (req, res) => {
	const suggestionController = getTemplateSuggestionController();
	return suggestionController.getPendingSuggestions(req, res);
});

router.put("/suggestions/:suggestionId/status", authenticate, (req, res) => {
	const suggestionController = getTemplateSuggestionController();
	return suggestionController.updateSuggestionStatus(req, res);
});

// ============= COMPARACIONES =============
router.post(
	"/calculations/compare",
	authenticate,
	validateComparisonRequest,
	(req, res) => {
		const comparisonController = getCalculationComparisonController();
		return comparisonController.compareCalculations(req, res);
	}
);

router.get("/calculations/comparisons", authenticate, (req, res) => {
	const comparisonController = getCalculationComparisonController();
	return comparisonController.getSavedComparisons(req, res);
});

router.delete("/calculations/comparisons/:comparisonId", authenticate, (req, res) => {
	const comparisonController = getCalculationComparisonController();
	return comparisonController.deleteComparison(req, res);
});

// ============= PLANTILLAS POR USUARIO =============
router.get("/users/:userId/templates", authenticate, (req, res) => {
	const templateController = getCalculationTemplateController();
	return templateController.getUserTemplates(req, res);
});

export default router;
