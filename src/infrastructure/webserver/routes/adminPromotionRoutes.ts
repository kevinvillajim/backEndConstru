// src/infrastructure/webserver/routes/adminPromotionRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {requireAdminRole} from "../middlewares/adminAuthMiddleware";
import {
	validateCreatePromotionRequest,
	validateReviewPromotionRequest,
	validatePromoteTemplate,
} from "../validators/promotionValidator";
import {
	getAdminPromotionController,
	getGlobalStatsController,
} from "../../config/service-factory";

const router = Router();

// Middleware: Todas las rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(requireAdminRole);

// ============= GESTIÓN DE SOLICITUDES DE PROMOCIÓN =============

/**
 * POST /api/admin/promotion-requests
 * Crear una nueva solicitud de promoción
 */
router.post(
	"/promotion-requests",
	validateCreatePromotionRequest,
	(req, res) => {
		const adminController = getAdminPromotionController();
		return adminController.createPromotionRequest(req, res);
	}
);

/**
 * GET /api/admin/promotion-requests
 * Obtener todas las solicitudes de promoción con filtros
 */
router.get("/promotion-requests", (req, res) => {
	const adminController = getAdminPromotionController();
	return adminController.getPromotionRequests(req, res);
});

/**
 * GET /api/admin/promotion-requests/pending
 * Obtener solicitudes pendientes de revisión
 */
router.get("/promotion-requests/pending", (req, res) => {
	const adminController = getAdminPromotionController();
	return adminController.getPendingRequests(req, res);
});

/**
 * GET /api/admin/promotion-requests/stats
 * Obtener estadísticas de solicitudes de promoción
 */
router.get("/promotion-requests/stats", (req, res) => {
	const adminController = getAdminPromotionController();
	return adminController.getPromotionStats(req, res);
});

/**
 * GET /api/admin/promotion-requests/workload
 * Obtener carga de trabajo por revisor
 */
router.get("/promotion-requests/workload", (req, res) => {
	const adminController = getAdminPromotionController();
	return adminController.getReviewerWorkload(req, res);
});

/**
 * GET /api/admin/promotion-requests/:id
 * Obtener una solicitud específica
 */
router.get("/promotion-requests/:id", (req, res) => {
	const adminController = getAdminPromotionController();
	return adminController.getPromotionRequestById(req, res);
});

/**
 * PUT /api/admin/promotion-requests/:id/review
 * Revisar una solicitud (aprobar/rechazar/solicitar cambios)
 */
router.put(
	"/promotion-requests/:id/review",
	validateReviewPromotionRequest,
	(req, res) => {
		const adminController = getAdminPromotionController();
		return adminController.reviewPromotionRequest(req, res);
	}
);

// ============= PROMOCIÓN DE PLANTILLAS =============

/**
 * POST /api/admin/templates/promote/:requestId
 * Promover plantilla personal a verificada
 */
router.post(
	"/templates/promote/:requestId",
	validatePromoteTemplate,
	(req, res) => {
		const adminController = getAdminPromotionController();
		return adminController.promoteTemplate(req, res);
	}
);

// ============= DASHBOARD DE ADMINISTRACIÓN =============

/**
 * GET /api/admin/dashboard
 * Obtener datos completos del dashboard de administración
 */
router.get("/dashboard", (req, res) => {
	const dashboardController = getAdminPromotionController();
	return dashboardController.getAdminDashboard(req, res);
});

/**
 * GET /api/admin/dashboard/summary
 * Obtener resumen rápido para el dashboard
 */
router.get("/dashboard/summary", (req, res) => {
	const dashboardController = getAdminPromotionController();
	return dashboardController.getDashboardSummary(req, res);
});

// ============= ESTADÍSTICAS GLOBALES =============

/**
 * GET /api/admin/stats/global
 * Obtener estadísticas globales del sistema
 */
router.get("/stats/global", (req, res) => {
	const globalStatsController = getGlobalStatsController();
	return globalStatsController.getGlobalStats(req, res);
});

/**
 * GET /api/admin/stats/templates
 * Obtener estadísticas específicas de plantillas
 */
router.get("/stats/templates", (req, res) => {
	const globalStatsController = getGlobalStatsController();
	return globalStatsController.getTemplateStats(req, res);
});

/**
 * GET /api/admin/stats/usage
 * Obtener estadísticas de uso del sistema
 */
router.get("/stats/usage", (req, res) => {
	const globalStatsController = getGlobalStatsController();
	return globalStatsController.getUsageStats(req, res);
});

// ============= CANDIDATOS PARA PROMOCIÓN =============

/**
 * GET /api/admin/templates/candidates
 * Obtener plantillas candidatas para promoción
 */
router.get("/templates/candidates", (req, res) => {
	const adminController = getAdminPromotionController();
	return adminController.getPromotionCandidates(req, res);
});

/**
 * GET /api/admin/templates/recently-promoted
 * Obtener plantillas recientemente promovidas
 */
router.get("/templates/recently-promoted", (req, res) => {
	const adminController = getAdminPromotionController();
	return adminController.getRecentlyPromoted(req, res);
});

// ============= AUTHOR CREDITS =============

/**
 * GET /api/admin/author-credits
 * Obtener todos los créditos de autores
 */
router.get("/author-credits", (req, res) => {
	const authorCreditsController = getAdminPromotionController();
	return authorCreditsController.getAllCredits(req, res);
});

/**
 * GET /api/admin/author-credits/stats
 * Obtener estadísticas de créditos
 */
router.get("/author-credits/stats", (req, res) => {
	const authorCreditsController = getAdminPromotionController();
	return authorCreditsController.getCreditStats(req, res);
});

/**
 * GET /api/admin/author-credits/top-contributors
 * Obtener top contribuidores
 */
router.get("/author-credits/top-contributors", (req, res) => {
	const authorCreditsController = getAdminPromotionController();
	return authorCreditsController.getTopContributors(req, res);
});

/**
 * PUT /api/admin/author-credits/:id/visibility
 * Cambiar visibilidad de un crédito
 */
router.put("/author-credits/:id/visibility", (req, res) => {
	const authorCreditsController = getAdminPromotionController();
	return authorCreditsController.updateCreditVisibility(req, res);
});

export default router;
