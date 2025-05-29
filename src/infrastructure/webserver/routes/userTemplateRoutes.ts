// src/infrastructure/webserver/routes/userTemplateRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {
	validateCreateUserTemplate,
	validateUpdateUserTemplate,
	validateDuplicateTemplate,
	validateCreateFromResult,
	validateChangeStatus,
	validateShareTemplate,
	validateTemplateId,
	validateQueryParams,
} from "../validators/userTemplateValidator";
import {getUserTemplateController} from "../../config/service-factory";

const router = Router();

// === CRUD BÁSICO ===

/**
 * GET /api/user-templates
 * Lista las plantillas personales del usuario con filtros y paginación
 */
router.get("/", authenticate, validateQueryParams, (req, res) => {
	const controller = getUserTemplateController();
	return controller.getUserTemplates(req, res);
});

/**
 * GET /api/user-templates/:id
 * Obtiene una plantilla específica del usuario
 */
router.get("/:id", authenticate, validateTemplateId, (req, res) => {
	const controller = getUserTemplateController();
	return controller.getUserTemplateById(req, res);
});

/**
 * POST /api/user-templates
 * Crea una nueva plantilla personal
 */
router.post("/", authenticate, validateCreateUserTemplate, (req, res) => {
	const controller = getUserTemplateController();
	return controller.createUserTemplate(req, res);
});

/**
 * PUT /api/user-templates/:id
 * Actualiza una plantilla personal existente
 */
router.put(
	"/:id",
	authenticate,
	validateTemplateId,
	validateUpdateUserTemplate,
	(req, res) => {
		const controller = getUserTemplateController();
		return controller.updateUserTemplate(req, res);
	}
);

/**
 * DELETE /api/user-templates/:id
 * Elimina una plantilla personal
 */
router.delete("/:id", authenticate, validateTemplateId, (req, res) => {
	const controller = getUserTemplateController();
	return controller.deleteUserTemplate(req, res);
});

// === OPERACIONES ESPECIALES ===

/**
 * POST /api/user-templates/duplicate/:officialId
 * Duplica una plantilla oficial a plantilla personal
 */
router.post(
	"/duplicate/:officialId",
	authenticate,
	validateDuplicateTemplate,
	(req, res) => {
		const controller = getUserTemplateController();
		return controller.duplicateOfficialTemplate(req, res);
	}
);

/**
 * POST /api/user-templates/from-result
 * Crea una plantilla personal desde un resultado de cálculo
 */
router.post(
	"/from-result",
	authenticate,
	validateCreateFromResult,
	(req, res) => {
		const controller = getUserTemplateController();
		return controller.createFromResult(req, res);
	}
);

// === GESTIÓN DE ESTADO Y COMPARTICIÓN ===

/**
 * PUT /api/user-templates/:id/status
 * Cambia el estado de una plantilla (draft/active/archived)
 */
router.put("/:id/status", authenticate, validateChangeStatus, (req, res) => {
	const controller = getUserTemplateController();
	return controller.changeStatus(req, res);
});

/**
 * POST /api/user-templates/:id/share
 * Comparte una plantilla con otros usuarios
 */
router.post("/:id/share", authenticate, validateShareTemplate, (req, res) => {
	const controller = getUserTemplateController();
	return controller.shareTemplate(req, res);
});

// === CONSULTAS ESPECIALES ===

/**
 * GET /api/user-templates/public
 * Obtiene plantillas públicas de otros usuarios (no requiere autenticación)
 */
router.get("/public", validateQueryParams, (req, res) => {
	const controller = getUserTemplateController();
	return controller.getPublicTemplates(req, res);
});

/**
 * GET /api/user-templates/stats
 * Obtiene estadísticas de plantillas del usuario
 */
router.get("/stats", authenticate, (req, res) => {
	const controller = getUserTemplateController();
	return controller.getStats(req, res);
});

export default router;
