// src/infrastructure/webserver/routes/budgetTemplateRoutes.ts
import { Router } from "express";
import { validationResult } from "express-validator";
import { BudgetTemplateController } from "../controllers/BudgetTemplateController";
import {authMiddleware} from "../middlewares/authMiddleware";
import { BudgetAuthMiddleware } from "../middlewares/budgetAuthMiddleware";
import { BudgetValidator } from "../validators/budgetValidator";

// Obtener instancias desde service factory
import {
  getBudgetTemplateRepository,
  getBudgetTemplateService,
  getApplyBudgetTemplateUseCase,
  getCalculationBudgetRepository,
  getProjectRepository,
  getUserRepository
} from "../../config/service-factory";

const router = Router();

// Inicializar middleware de autorización
const budgetAuthMiddleware = new BudgetAuthMiddleware(
  getCalculationBudgetRepository(),
  getBudgetTemplateRepository(),
  getProjectRepository(),
  getUserRepository()
);

// Inicializar controlador
const budgetTemplateController = new BudgetTemplateController(
  getBudgetTemplateRepository(),
  getBudgetTemplateService(),
  getApplyBudgetTemplateUseCase()
);

// Middleware para validar errores de validación
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * /api/budget-templates:
 *   get:
 *     summary: Obtiene todos los templates de presupuesto disponibles para el usuario
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectType
 *         schema:
 *           type: string
 *           enum: [RESIDENTIAL_SINGLE, RESIDENTIAL_MULTI, COMMERCIAL_SMALL, COMMERCIAL_LARGE, INDUSTRIAL, INFRASTRUCTURE, RENOVATION, SPECIALIZED]
 *         description: Filtrar por tipo de proyecto
 *       - in: query
 *         name: geographicalZone
 *         schema:
 *           type: string
 *           enum: [QUITO, GUAYAQUIL, CUENCA, COSTA, SIERRA, ORIENTE, INSULAR]
 *         description: Filtrar por zona geográfica
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [SYSTEM, COMPANY, PERSONAL, SHARED]
 *         description: Filtrar por alcance del template
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filtrar por templates verificados
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Templates obtenidos exitosamente
 *       401:
 *         description: No autorizado
 */
router.get(
  "/",
  authMiddleware,
  BudgetValidator.queryParams(),
  handleValidationErrors,
  budgetTemplateController.getTemplates.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/{templateId}:
 *   get:
 *     summary: Obtiene un template específico por ID
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del template
 *     responses:
 *       200:
 *         description: Template obtenido exitosamente
 *       404:
 *         description: Template no encontrado
 *       403:
 *         description: Sin permisos para acceder al template
 */
router.get(
  "/:templateId",
  authMiddleware,
  BudgetValidator.validateId('templateId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkTemplatePermissions(['READ']),
  budgetTemplateController.getTemplateById.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates:
 *   post:
 *     summary: Crea un nuevo template de presupuesto
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - projectType
 *               - geographicalZone
 *               - scope
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               projectType:
 *                 type: string
 *                 enum: [RESIDENTIAL_SINGLE, RESIDENTIAL_MULTI, COMMERCIAL_SMALL, COMMERCIAL_LARGE, INDUSTRIAL, INFRASTRUCTURE, RENOVATION, SPECIALIZED]
 *               scope:
 *                 type: string
 *                 enum: [COMPANY, PERSONAL, SHARED]
 *               geographicalZone:
 *                 type: string
 *                 enum: [QUITO, GUAYAQUIL, CUENCA, COSTA, SIERRA, ORIENTE, INSULAR]
 *               wasteFactors:
 *                 type: object
 *                 properties:
 *                   general:
 *                     type: number
 *                     minimum: 1.0
 *                     maximum: 3.0
 *                   concrete:
 *                     type: number
 *                     minimum: 1.0
 *                     maximum: 2.0
 *                   steel:
 *                     type: number
 *                     minimum: 1.0
 *                     maximum: 2.0
 *     responses:
 *       201:
 *         description: Template creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       402:
 *         description: Límite de plan alcanzado
 */
router.post(
  "/",
  authMiddleware,
  budgetAuthMiddleware.checkPlanLimits('CREATE_TEMPLATE'),
  BudgetValidator.createBudgetTemplate(),
  handleValidationErrors,
  budgetAuthMiddleware.auditBudgetAction('CREATE_TEMPLATE'),
  budgetTemplateController.createTemplate.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/{templateId}:
 *   put:
 *     summary: Actualiza un template existente
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Template actualizado exitosamente
 *       403:
 *         description: Sin permisos para modificar el template
 *       404:
 *         description: Template no encontrado
 */
router.put(
  "/:templateId",
  authMiddleware,
  BudgetValidator.validateId('templateId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkTemplatePermissions(['EDIT']),
  budgetAuthMiddleware.auditBudgetAction('UPDATE_TEMPLATE'),
  budgetTemplateController.updateTemplate.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/{templateId}:
 *   delete:
 *     summary: Elimina un template
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Template eliminado exitosamente
 *       403:
 *         description: Sin permisos para eliminar el template
 *       404:
 *         description: Template no encontrado
 */
router.delete(
  "/:templateId",
  authMiddleware,
  BudgetValidator.validateId('templateId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkTemplatePermissions(['DELETE']),
  budgetAuthMiddleware.auditBudgetAction('DELETE_TEMPLATE'),
  budgetTemplateController.deleteTemplate.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/{templateId}/duplicate:
 *   post:
 *     summary: Duplica un template oficial para personalización
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Template duplicado exitosamente
 *       402:
 *         description: Límite de plan alcanzado
 *       404:
 *         description: Template original no encontrado
 */
router.post(
  "/:templateId/duplicate",
  authMiddleware,
  budgetAuthMiddleware.checkPlanLimits('CREATE_TEMPLATE'),
  BudgetValidator.validateId('templateId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkTemplatePermissions(['READ']),
  budgetAuthMiddleware.auditBudgetAction('DUPLICATE_TEMPLATE'),
  budgetTemplateController.duplicateTemplate.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/recommendations:
 *   get:
 *     summary: Obtiene recomendaciones de templates
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [RESIDENTIAL_SINGLE, RESIDENTIAL_MULTI, COMMERCIAL_SMALL, COMMERCIAL_LARGE, INDUSTRIAL, INFRASTRUCTURE, RENOVATION, SPECIALIZED]
 *       - in: query
 *         name: geographicalZone
 *         required: true
 *         schema:
 *           type: string
 *           enum: [QUITO, GUAYAQUIL, CUENCA, COSTA, SIERRA, ORIENTE, INSULAR]
 *       - in: query
 *         name: calculationResultId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recomendaciones obtenidas exitosamente
 *       400:
 *         description: Parámetros requeridos faltantes
 */
router.get(
  "/recommendations",
  authMiddleware,
  budgetTemplateController.getRecommendations.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/trending:
 *   get:
 *     summary: Obtiene templates trending o más utilizados
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *       - in: query
 *         name: projectType
 *         schema:
 *           type: string
 *           enum: [RESIDENTIAL_SINGLE, RESIDENTIAL_MULTI, COMMERCIAL_SMALL, COMMERCIAL_LARGE, INDUSTRIAL, INFRASTRUCTURE, RENOVATION, SPECIALIZED]
 *       - in: query
 *         name: geographicalZone
 *         schema:
 *           type: string
 *           enum: [QUITO, GUAYAQUIL, CUENCA, COSTA, SIERRA, ORIENTE, INSULAR]
 *     responses:
 *       200:
 *         description: Templates trending obtenidos exitosamente
 */
router.get(
  "/trending",
  authMiddleware,
  BudgetValidator.queryParams(),
  handleValidationErrors,
  budgetTemplateController.getTrendingTemplates.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/from-history:
 *   post:
 *     summary: Crea un template automático basado en histórico del usuario
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectType
 *               - geographicalZone
 *               - templateName
 *             properties:
 *               projectType:
 *                 type: string
 *                 enum: [RESIDENTIAL_SINGLE, RESIDENTIAL_MULTI, COMMERCIAL_SMALL, COMMERCIAL_LARGE, INDUSTRIAL, INFRASTRUCTURE, RENOVATION, SPECIALIZED]
 *               geographicalZone:
 *                 type: string
 *                 enum: [QUITO, GUAYAQUIL, CUENCA, COSTA, SIERRA, ORIENTE, INSULAR]
 *               templateName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Template automático creado exitosamente
 *       400:
 *         description: Datos insuficientes para generar template
 *       402:
 *         description: Límite de plan alcanzado
 */
router.post(
  "/from-history",
  authMiddleware,
  budgetAuthMiddleware.checkPlanLimits('CREATE_TEMPLATE'),
  budgetAuthMiddleware.auditBudgetAction('CREATE_AUTO_TEMPLATE'),
  budgetTemplateController.createFromHistory.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/{budgetId}/{templateId}/apply:
 *   post:
 *     summary: Aplica un template a un presupuesto existente
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applyOptions
 *             properties:
 *               applyOptions:
 *                 type: object
 *                 required:
 *                   - applyWasteFactors
 *                   - applyLaborRates
 *                   - applyIndirectCosts
 *                   - applyProfessionalFees
 *                   - preserveCustomizations
 *                   - recalculateAll
 *                 properties:
 *                   applyWasteFactors:
 *                     type: boolean
 *                   applyLaborRates:
 *                     type: boolean
 *                   applyIndirectCosts:
 *                     type: boolean
 *                   applyProfessionalFees:
 *                     type: boolean
 *                   preserveCustomizations:
 *                     type: boolean
 *                   recalculateAll:
 *                     type: boolean
 *               customAdjustments:
 *                 type: object
 *                 properties:
 *                   wasteFactorMultiplier:
 *                     type: number
 *                     minimum: 0.1
 *                     maximum: 5.0
 *                   laborRateMultiplier:
 *                     type: number
 *                     minimum: 0.1
 *                     maximum: 5.0
 *                   additionalContingency:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 20
 *               createNewVersion:
 *                 type: boolean
 *               newVersionName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Template aplicado exitosamente
 *       400:
 *         description: Datos de aplicación inválidos
 *       403:
 *         description: Sin permisos para modificar el presupuesto
 */
router.post(
  "/:budgetId/:templateId/apply",
  authMiddleware,
  BudgetValidator.applyBudgetTemplate(),
  BudgetValidator.customValidations.atLeastOneApplyOption,
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canEdit']),
  budgetAuthMiddleware.checkTemplatePermissions(['READ']),
  budgetAuthMiddleware.auditBudgetAction('APPLY_TEMPLATE'),
  budgetTemplateController.applyToExistingBudget.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/{budgetId}/{templateId}/compatibility:
 *   get:
 *     summary: Verifica compatibilidad entre un template y un presupuesto
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Compatibilidad verificada exitosamente
 *       404:
 *         description: Presupuesto o template no encontrado
 *       403:
 *         description: Sin permisos para acceder a los recursos
 */
router.get(
  "/:budgetId/:templateId/compatibility",
  authMiddleware,
  BudgetValidator.validateId('budgetId'),
  BudgetValidator.validateId('templateId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canRead']),
  budgetAuthMiddleware.checkTemplatePermissions(['READ']),
  budgetTemplateController.checkCompatibility.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/{templateId}/export:
 *   get:
 *     summary: Exporta un template a archivo JSON
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Template exportado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: Sin permisos para exportar el template
 *       404:
 *         description: Template no encontrado
 */
router.get(
  "/:templateId/export",
  authMiddleware,
  BudgetValidator.validateId('templateId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkTemplatePermissions(['READ']),
  budgetAuthMiddleware.auditBudgetAction('EXPORT_TEMPLATE'),
  budgetTemplateController.exportTemplate.bind(budgetTemplateController)
);

/**
 * @swagger
 * /api/budget-templates/import:
 *   post:
 *     summary: Importa un template desde archivo JSON
 *     tags: [Budget Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customName
 *         schema:
 *           type: string
 *         description: Nombre personalizado para el template importado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - projectType
 *               - geographicalZone
 *             properties:
 *               name:
 *                 type: string
 *               projectType:
 *                 type: string
 *               geographicalZone:
 *                 type: string
 *               wasteFactors:
 *                 type: object
 *               laborRates:
 *                 type: object
 *               indirectCosts:
 *                 type: object
 *               professionalFees:
 *                 type: object
 *     responses:
 *       201:
 *         description: Template importado exitosamente
 *       400:
 *         description: Archivo de template inválido
 *       402:
 *         description: Límite de plan alcanzado
 */
router.post(
  "/import",
  authMiddleware,
  budgetAuthMiddleware.checkPlanLimits('CREATE_TEMPLATE'),
  budgetAuthMiddleware.auditBudgetAction('IMPORT_TEMPLATE'),
  budgetTemplateController.importTemplate.bind(budgetTemplateController)
);

// Middleware de logging para todas las rutas
router.use(budgetAuthMiddleware.logBudgetAction());

export default router;