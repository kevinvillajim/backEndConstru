// src/infrastructure/webserver/docs/routes/adminPromotionRoutes.documented.ts
import {Router} from "express";
import {authenticate} from "../../middlewares/authMiddleware";
import {requireAdminRole} from "../../middlewares/adminAuthMiddleware";
import {
	validateCreatePromotionRequest, // ✅ CORREGIDO
	validateReviewPromotionRequest, // ✅ CORREGIDO
	validatePromoteTemplate, // ✅ CORREGIDO
} from "../../validators/promotionValidator";
import {getAdminPromotionController} from "../../../config/service-factory";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         personalTemplateId:
 *           type: string
 *           format: uuid
 *         requestedBy:
 *           type: string
 *           format: uuid
 *         originalAuthorId:
 *           type: string
 *           format: uuid
 *         reason:
 *           type: string
 *         metrics:
 *           type: object
 *           properties:
 *             totalUsage:
 *               type: integer
 *             uniqueUsers:
 *               type: integer
 *             successRate:
 *               type: number
 *             averageRating:
 *               type: number
 *             rankingPosition:
 *               type: integer
 *             trendScore:
 *               type: number
 *         status:
 *           type: string
 *           enum: [pending, under_review, approved, rejected, implemented]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         qualityScore:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AdminDashboard:
 *       type: object
 *       properties:
 *         pendingPromotions:
 *           type: integer
 *         totalPromotions:
 *           type: integer
 *         promotionsByStatus:
 *           type: object
 *           properties:
 *             pending:
 *               type: integer
 *             approved:
 *               type: integer
 *             rejected:
 *               type: integer
 *             implemented:
 *               type: integer
 *         topCandidates:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               qualityScore:
 *                 type: number
 *               metrics:
 *                 type: object
 *         recentActivity:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Obtener datos del dashboard de administración
 *     tags: [Admin Promotion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del dashboard obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AdminDashboard'
 *       403:
 *         description: Acceso denegado - Solo administradores
 */
router.get("/dashboard", authenticate, requireAdminRole, (req, res) => {
	const controller = getAdminPromotionController();
	return controller.getAdminDashboard(req, res); // ✅ CORREGIDO
});

/**
 * @swagger
 * /api/admin/promotion-requests:
 *   get:
 *     summary: Listar solicitudes de promoción
 *     tags: [Admin Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, under_review, approved, rejected, implemented]
 *         description: Filtrar por estado
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Solicitudes obtenidas exitosamente
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
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PromotionRequest'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *   post:
 *     summary: Crear nueva solicitud de promoción
 *     tags: [Admin Promotion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personalTemplateId
 *               - reason
 *             properties:
 *               personalTemplateId:
 *                 type: string
 *                 format: uuid
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               detailedJustification:
 *                 type: string
 *                 maxLength: 2000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               estimatedImpact:
 *                 type: object
 *                 properties:
 *                   potentialUsers:
 *                     type: integer
 *                   industryBenefit:
 *                     type: string
 *                   technicalComplexity:
 *                     type: string
 *                     enum: [low, medium, high]
 *               creditToAuthor:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Solicitud creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PromotionRequest'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Acceso denegado
 */
router.get(
	"/promotion-requests",
	authenticate,
	requireAdminRole,
	(req, res) => {
		const controller = getAdminPromotionController();
		return controller.getPromotionRequests(req, res);
	}
);

router.post(
	"/promotion-requests",
	authenticate,
	requireAdminRole,
	validateCreatePromotionRequest, // ✅ CORREGIDO
	(req, res) => {
		const controller = getAdminPromotionController();
		return controller.createPromotionRequest(req, res);
	}
);

/**
 * @swagger
 * /api/admin/promotion-requests/{requestId}:
 *   get:
 *     summary: Obtener solicitud de promoción específica
 *     tags: [Admin Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     responses:
 *       200:
 *         description: Solicitud obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PromotionRequest'
 *       404:
 *         description: Solicitud no encontrada
 */
router.get(
	"/promotion-requests/:requestId",
	authenticate,
	requireAdminRole,
	(req, res) => {
		const controller = getAdminPromotionController();
		return controller.getPromotionRequestById(req, res); // ✅ CORREGIDO
	}
);

/**
 * @swagger
 * /api/admin/promotion-requests/{requestId}/review:
 *   put:
 *     summary: Revisar solicitud de promoción
 *     tags: [Admin Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - reviewComments
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, request_changes]
 *               reviewComments:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       200:
 *         description: Solicitud revisada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PromotionRequest'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Solicitud no encontrada
 */
router.put(
	"/promotion-requests/:requestId/review",
	authenticate,
	requireAdminRole,
	validateReviewPromotionRequest, // ✅ CORREGIDO
	(req, res) => {
		const controller = getAdminPromotionController();
		return controller.reviewPromotionRequest(req, res);
	}
);

/**
 * @swagger
 * /api/admin/promotion-requests/{requestId}/implement:
 *   post:
 *     summary: Implementar promoción aprobada
 *     tags: [Admin Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud aprobada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               implementationNotes:
 *                 type: string
 *                 maxLength: 1000
 *               customizations:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     maxLength: 255
 *                   description:
 *                     type: string
 *                     maxLength: 2000
 *                   necReference:
 *                     type: string
 *                     maxLength: 100
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Promoción implementada exitosamente
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
 *                     verifiedTemplate:
 *                       type: object
 *                     promotionRequest:
 *                       $ref: '#/components/schemas/PromotionRequest'
 *                     authorCredit:
 *                       type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Solicitud no apta para implementación
 *       404:
 *         description: Solicitud no encontrada
 */
router.post(
	"/promotion-requests/:requestId/implement",
	authenticate,
	requireAdminRole,
	validatePromoteTemplate, // ✅ CORREGIDO
	(req, res) => {
		const controller = getAdminPromotionController();
		return controller.promoteTemplate(req, res); // ✅ CORREGIDO
	}
);

/**
 * @swagger
 * /api/admin/promotion-candidates:
 *   get:
 *     summary: Obtener candidatos para promoción
 *     tags: [Admin Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minUsage
 *         schema:
 *           type: integer
 *           minimum: 10
 *           default: 50
 *         description: Uso mínimo requerido
 *       - in: query
 *         name: minUsers
 *         schema:
 *           type: integer
 *           minimum: 5
 *           default: 10
 *         description: Usuarios únicos mínimos
 *       - in: query
 *         name: minSuccessRate
 *         schema:
 *           type: number
 *           minimum: 70
 *           maximum: 100
 *           default: 80
 *         description: Tasa de éxito mínima (%)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Número máximo de candidatos
 *     responses:
 *       200:
 *         description: Candidatos obtenidos exitosamente
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
 *                       author:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                       metrics:
 *                         type: object
 *                       qualityScore:
 *                         type: number
 *                       recommendedPriority:
 *                         type: string
 */
router.get(
	"/promotion-candidates",
	authenticate,
	requireAdminRole,
	(req, res) => {
		const controller = getAdminPromotionController();
		return controller.getPromotionCandidates(req, res);
	}
);

/**
 * @swagger
 * /api/admin/promotion-stats:
 *   get:
 *     summary: Obtener estadísticas de promociones
 *     tags: [Admin Promotion]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Período de estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
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
 *                     totalRequests:
 *                       type: integer
 *                     approvalRate:
 *                       type: number
 *                     averageProcessingTime:
 *                       type: number
 *                     byStatus:
 *                       type: object
 *                     byPriority:
 *                       type: object
 *                     topAuthors:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get("/promotion-stats", authenticate, requireAdminRole, (req, res) => {
	const controller = getAdminPromotionController();
	return controller.getPromotionStats(req, res);
});

export default router;
