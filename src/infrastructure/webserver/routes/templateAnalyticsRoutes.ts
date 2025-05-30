// src/infrastructure/webserver/routes/templateAnalyticsRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {
	validateAnalyticsParams,
	validateTrendingParams,
} from "../validators/analyticsValidator";
import {getTemplateAnalyticsController} from "../../config/service-factory";

const router = Router();

// ============= ANALYTICS DE PLANTILLAS ESPECÍFICAS =============

/**
 * GET /api/analytics/templates/:id
 * Obtiene analytics detallados de una plantilla específica
 */
router.get("/templates/:id", validateAnalyticsParams, (req, res) => {
	const analyticsController = getTemplateAnalyticsController();
	return analyticsController.getTemplateAnalytics(req, res);
});

// ============= TRENDING TEMPLATES =============

/**
 * GET /api/analytics/trending
 * Obtiene plantillas en tendencia
 */
router.get("/trending", validateTrendingParams, (req, res) => {
	const analyticsController = getTemplateAnalyticsController();
	return analyticsController.getTrendingTemplates(req, res);
});

/**
 * GET /api/analytics/trending/summary
 * Obtiene resumen de tendencias por todos los períodos
 */
router.get("/trending/summary", (req, res) => {
	const analyticsController = getTemplateAnalyticsController();
	return analyticsController.getTrendingSummary(req, res);
});

/**
 * GET /api/analytics/trending/category/:category
 * Obtiene plantillas trending por categoría específica
 */
router.get(
	"/trending/category/:category",
	validateTrendingParams,
	(req, res) => {
		const analyticsController = getTemplateAnalyticsController();
		return analyticsController.getTrendingByCategory(req, res);
	}
);

/**
 * GET /api/analytics/trending/profession/:profession
 * Obtiene plantillas trending por profesión específica
 */
router.get(
	"/trending/profession/:profession",
	validateTrendingParams,
	(req, res) => {
		const analyticsController = getTemplateAnalyticsController();
		return analyticsController.getTrendingByProfession(req, res);
	}
);

// ============= TRACKING MANUAL =============

/**
 * POST /api/analytics/track/:id/usage
 * Registra manualmente el uso de una plantilla
 */
router.post("/track/:id/usage", authenticate, (req, res) => {
	const trackingController = getTemplateTrackingController();
	return trackingController.trackTemplateUsage(req, res);
});

/**
 * POST /api/analytics/track/batch
 * Registra múltiples usos en lote
 */
router.post("/track/batch", authenticate, (req, res) => {
	const trackingController = getTemplateTrackingController();
	return trackingController.trackBatchUsage(req, res);
});

/**
 * GET /api/analytics/track/:id/stats
 * Obtiene estadísticas de uso de una plantilla
 */
router.get("/track/:id/stats", (req, res) => {
	const trackingController = getTemplateTrackingController();
	return trackingController.getTemplateUsageStats(req, res);
});

/**
 * GET /api/analytics/most-used
 * Obtiene las plantillas más usadas
 */
router.get("/most-used", (req, res) => {
	const trackingController = getTemplateTrackingController();
	return trackingController.getMostUsedTemplates(req, res);
});

export default router;
