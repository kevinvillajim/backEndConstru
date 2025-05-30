// src/infrastructure/webserver/docs/routes/templateAnalyticsRoutes.documented.ts
import {Router} from "express";
import {authenticate} from "../../middlewares/authMiddleware";
import {requireAdminRole} from "../../middlewares/adminAuthMiddleware";
import {
	validateAnalyticsQuery,
	validateTemplateId,
	validateRankingQuery,
} from "../../validators/analyticsValidator";
import {getTemplateAnalyticsController} from "../../../config/service-factory";

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
 * /api/analytics/templates/{templateId}:
 *   get:
 *     summary: Obtener analytics de una plantilla específica
 *     tags: [Template Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la plantilla
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
	"/templates/:templateId",
	authenticate,
	validateTemplateId,
	validateAnalyticsQuery,
	(req, res) => {
		const controller = getTemplateAnalyticsController();
		return controller.getTemplateAnalytics(req, res);
	}
);

/**
 * @swagger
 * /api/analytics/rankings:
 *   get:
 *     summary: Obtener rankings de plantillas
 *     tags: [Template Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: weekly
 *         description: Período del ranking
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
 *           maximum: 100
 *           default: 10
 *         description: Número máximo de resultados
 *     responses:
 *       200:
 *         description: Rankings obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RankingData'
 */
router.get("/rankings", validateRankingQuery, (req, res) => {
	const controller = getTemplateAnalyticsController();
	return controller.getRankings(req, res);
});

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
router.get("/trending", validateRankingQuery, (req, res) => {
	const controller = getTemplateAnalyticsController();
	return controller.getTrending(req, res);
});

/**
 * @swagger
 * /api/analytics/global-stats:
 *   get:
 *     summary: Obtener estadísticas globales del sistema
 *     tags: [Template Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Período para las estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas globales obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/GlobalStats'
 *       403:
 *         description: Acceso denegado - Solo administradores
 */
router.get(
	"/global-stats",
	authenticate,
	requireAdminRole,
	validateAnalyticsQuery,
	(req, res) => {
		const controller = getTemplateAnalyticsController();
		return controller.getGlobalStats(req, res);
	}
);

/**
 * @swagger
 * /api/analytics/user-stats/{userId}:
 *   get:
 *     summary: Obtener estadísticas de un usuario específico
 *     tags: [Template Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Estadísticas del usuario obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTemplates:
 *                       type: integer
 *                     totalUsage:
 *                       type: integer
 *                     averageRating:
 *                       type: number
 *                     templatesInTrending:
 *                       type: integer
 */
router.get("/user-stats/:userId", authenticate, (req, res) => {
	const controller = getTemplateAnalyticsController();
	return controller.getUserStats(req, res);
});

export default router;
