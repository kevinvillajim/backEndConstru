// src/infrastructure/webserver/docs/routes/templateAnalyticsRoutes.documented.ts - CORREGIDO
import {Router} from "express";
import {authenticate} from "../../middlewares/authMiddleware";
import {requireAdminRole} from "../../middlewares/adminAuthMiddleware";
import {
	validateAnalyticsParams, // ✅ CORREGIDO: Existe en analyticsValidator
	validateTrendingParams, // ✅ CORREGIDO: Existe en analyticsValidator
	validateUsageStatsParams, // ✅ CORREGIDO: Existe en analyticsValidator
} from "../../validators/analyticsValidator";
import {
	getTemplateAnalyticsController,
	getTemplateTrackingController,
} from "../../../config/service-factory";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     TemplateAnalytics:
 *       type: object
 *       properties:
 *         templateId:
 *           type: string
 *           format: uuid
 *         basicStats:
 *           type: object
 *           properties:
 *             totalUsage:
 *               type: integer
 *             uniqueUsers:
 *               type: integer
 *             successRate:
 *               type: number
 *               format: float
 *             averageExecutionTime:
 *               type: number
 *               format: float
 *         currentRanking:
 *           type: object
 *           properties:
 *             daily:
 *               type: integer
 *             weekly:
 *               type: integer
 *             monthly:
 *               type: integer
 *             yearly:
 *               type: integer
 *         trendingScore:
 *           type: number
 *           format: float
 *
 *     RankingData:
 *       type: object
 *       properties:
 *         templates:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               rankPosition:
 *                 type: integer
 *               trendScore:
 *                 type: number
 *               usageCount:
 *                 type: integer
 *               uniqueUsers:
 *                 type: integer
 *         period:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         generatedAt:
 *           type: string
 *           format: date-time
 *
 *     GlobalStats:
 *       type: object
 *       properties:
 *         totalTemplates:
 *           type: integer
 *         totalCalculations:
 *           type: integer
 *         totalUsers:
 *           type: integer
 *         topCategories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               count:
 *                 type: integer
 *         usageGrowth:
 *           type: object
 *           properties:
 *             daily:
 *               type: number
 *             weekly:
 *               type: number
 *             monthly:
 *               type: number
 */

/**
 * @swagger
 * /api/analytics/templates/{id}:
 *   get:
 *     summary: Obtener analytics de una plantilla específica
 *     tags: [Template Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la plantilla
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [personal, verified]
 *           default: personal
 *         description: Tipo de plantilla
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Período de análisis
 *     responses:
 *       200:
 *         description: Analytics obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TemplateAnalytics'
 *       404:
 *         description: Plantilla no encontrada
 *       401:
 *         description: No autorizado
 */
router.get(
	"/templates/:id",
	validateAnalyticsParams, // ✅ CORREGIDO: Usa función que existe
	(req, res) => {
		const controller = getTemplateAnalyticsController();
		return controller.getTemplateAnalytics(req, res);
	}
);

/**
 * @swagger
 * /api/analytics/trending:
 *   get:
 *     summary: Obtener plantillas en tendencia
 *     tags: [Template Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: weekly
 *         description: Período de tendencia
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [personal, verified]
 *         description: Tipo de plantillas a incluir
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Número de plantillas trending
 *     responses:
 *       200:
 *         description: Plantillas trending obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       templateId:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       trendScore:
 *                         type: number
 *                       growthRate:
 *                         type: number
 *                       usageCount:
 *                         type: integer
 */
router.get("/trending", validateTrendingParams, (req, res) => {
	// ✅ CORREGIDO
	const controller = getTemplateAnalyticsController();
	return controller.getTrendingTemplates(req, res);
});

/**
 * @swagger
 * /api/analytics/trending/summary:
 *   get:
 *     summary: Obtener resumen de tendencias por períodos
 *     tags: [Template Analytics]
 *     responses:
 *       200:
 *         description: Resumen de tendencias obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get("/trending/summary", (req, res) => {
	const controller = getTemplateAnalyticsController();
	return controller.getTrendingSummary(req, res);
});

/**
 * @swagger
 * /api/analytics/trending/category/{category}:
 *   get:
 *     summary: Obtener plantillas trending por categoría
 *     tags: [Template Analytics]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Categoría de plantillas
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: weekly
 *         description: Período de tendencia
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Número de plantillas
 *     responses:
 *       200:
 *         description: Plantillas trending por categoría obtenidas exitosamente
 */
router.get(
	"/trending/category/:category",
	validateTrendingParams, // ✅ CORREGIDO
	(req, res) => {
		const controller = getTemplateAnalyticsController();
		return controller.getTrendingByCategory(req, res);
	}
);

/**
 * @swagger
 * /api/analytics/trending/profession/{profession}:
 *   get:
 *     summary: Obtener plantillas trending por profesión
 *     tags: [Template Analytics]
 *     parameters:
 *       - in: path
 *         name: profession
 *         required: true
 *         schema:
 *           type: string
 *         description: Profesión objetivo
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: weekly
 *         description: Período de tendencia
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Número de plantillas
 *     responses:
 *       200:
 *         description: Plantillas trending por profesión obtenidas exitosamente
 */
router.get(
	"/trending/profession/:profession",
	validateTrendingParams, // ✅ CORREGIDO
	(req, res) => {
		const controller = getTemplateAnalyticsController();
		return controller.getTrendingByProfession(req, res);
	}
);

/**
 * @swagger
 * /api/analytics/track/{id}/stats:
 *   get:
 *     summary: Obtener estadísticas de uso de una plantilla
 *     tags: [Template Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la plantilla
 *       - in: query
 *         name: templateType
 *         schema:
 *           type: string
 *           enum: [personal, verified]
 *           default: personal
 *         description: Tipo de plantilla
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get("/track/:id/stats", validateUsageStatsParams, (req, res) => {
	// ✅ CORREGIDO
	const trackingController = getTemplateTrackingController();
	return trackingController.getTemplateUsageStats(req, res);
});

export default router;
