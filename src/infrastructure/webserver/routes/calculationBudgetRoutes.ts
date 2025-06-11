// src/infrastructure/webserver/routes/calculationBudgetRoutes.ts
import { Router } from "express";
import { validationResult } from "express-validator";
import { CalculationBudgetController } from "../controllers/CalculationBudgetController";
import {authMiddleware } from "../middlewares/authMiddleware";
import { BudgetAuthMiddleware } from "../middlewares/budgetAuthMiddleware";
import { BudgetValidator } from "../validators/budgetValidator";

// Obtener instancias desde service factory
import {
  getCreateCalculationBudgetUseCase,
  getUpdateBudgetPricingUseCase,
  getGenerateProfessionalBudgetUseCase,
  getCalculationBudgetRepository,
  getBudgetLineItemRepository,
  getProfessionalCostRepository,
  getCalculationBudgetService,
  getBudgetPricingService,
  getBudgetTemplateRepository,
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
const calculationBudgetController = new CalculationBudgetController(
  getCreateCalculationBudgetUseCase(),
  getUpdateBudgetPricingUseCase(),
  getGenerateProfessionalBudgetUseCase(),
  getCalculationBudgetRepository(),
  getBudgetLineItemRepository(),
  getProfessionalCostRepository(),
  getCalculationBudgetService(),
  getBudgetPricingService()
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
 * /api/calculation-budgets:
 *   get:
 *     summary: Obtiene todos los presupuestos del usuario
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por proyecto
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, review, approved, revised, final, archived]
 *         description: Filtrar por estado
 *       - in: query
 *         name: budgetType
 *         schema:
 *           type: string
 *           enum: [materials_only, complete_project, labor_materials, professional_estimate]
 *         description: Filtrar por tipo de presupuesto
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Elementos por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt, total, status]
 *           default: createdAt
 *         description: Campo de ordenamiento
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Presupuestos obtenidos exitosamente
 *       401:
 *         description: No autorizado
 */
router.get(
  "/",
  authMiddleware,
  BudgetValidator.queryParams(),
  handleValidationErrors,
  calculationBudgetController.getUserBudgets.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}:
 *   get:
 *     summary: Obtiene un presupuesto específico con detalles completos
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del presupuesto
 *     responses:
 *       200:
 *         description: Presupuesto obtenido exitosamente
 *       404:
 *         description: Presupuesto no encontrado
 *       403:
 *         description: Sin permisos para acceder al presupuesto
 */
router.get(
  "/:budgetId",
  authMiddleware,
  BudgetValidator.validateId('budgetId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canRead']),
  calculationBudgetController.getBudgetById.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets:
 *   post:
 *     summary: Crea un nuevo presupuesto de cálculo
 *     tags: [Calculation Budgets]
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
 *               - projectId
 *               - budgetType
 *               - includeLabor
 *               - includeProfessionalFees
 *               - includeIndirectCosts
 *               - contingencyPercentage
 *               - taxPercentage
 *               - geographicalZone
 *               - currency
 *               - exchangeRate
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Nombre del presupuesto
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción opcional
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del proyecto
 *               budgetType:
 *                 type: string
 *                 enum: [materials_only, complete_project, labor_materials, professional_estimate]
 *                 description: Tipo de presupuesto
 *               calculationResultId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del resultado de cálculo (opcional)
 *               budgetTemplateId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del template a aplicar (opcional)
 *               includeLabor:
 *                 type: boolean
 *                 description: Incluir costos de mano de obra
 *               includeProfessionalFees:
 *                 type: boolean
 *                 description: Incluir honorarios profesionales
 *               includeIndirectCosts:
 *                 type: boolean
 *                 description: Incluir costos indirectos
 *               contingencyPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 50
 *                 description: Porcentaje de contingencia
 *               taxPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 30
 *                 description: Porcentaje de impuestos
 *               geographicalZone:
 *                 type: string
 *                 enum: [QUITO, GUAYAQUIL, CUENCA, COSTA, SIERRA, ORIENTE, INSULAR]
 *                 description: Zona geográfica
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR]
 *                 description: Moneda
 *               exchangeRate:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Tasa de cambio
 *               customMaterials:
 *                 type: array
 *                 description: Materiales personalizados (opcional)
 *                 items:
 *                   type: object
 *                   required:
 *                     - materialId
 *                     - quantity
 *                   properties:
 *                     materialId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                       minimum: 0.01
 *                     unitPrice:
 *                       type: number
 *                       minimum: 0
 *                     description:
 *                       type: string
 *               customLaborCosts:
 *                 type: array
 *                 description: Costos de mano de obra personalizados (opcional)
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - description
 *                     - quantity
 *                     - rate
 *                     - unit
 *                   properties:
 *                     type:
 *                       type: string
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                       minimum: 0.01
 *                     rate:
 *                       type: number
 *                       minimum: 0.01
 *                     unit:
 *                       type: string
 *     responses:
 *       201:
 *         description: Presupuesto creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       402:
 *         description: Límite de plan alcanzado
 *       403:
 *         description: Sin permisos para crear presupuestos en el proyecto
 */
router.post(
  "/",
  authMiddleware,
  budgetAuthMiddleware.checkPlanLimits('CREATE_BUDGET'),
  budgetAuthMiddleware.checkProjectAccess(),
  BudgetValidator.createCalculationBudget(),
  BudgetValidator.customValidations.validateDataSource,
  BudgetValidator.customValidations.validatePercentages,
  handleValidationErrors,
  budgetAuthMiddleware.auditBudgetAction('CREATE_BUDGET'),
  calculationBudgetController.createCalculationBudget.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}:
 *   put:
 *     summary: Actualiza un presupuesto existente
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
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
 *               contingencyPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 50
 *               taxPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 30
 *               customization:
 *                 type: object
 *               exportSettings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Presupuesto actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Sin permisos para modificar el presupuesto
 *       404:
 *         description: Presupuesto no encontrado
 */
router.put(
  "/:budgetId",
  authMiddleware,
  BudgetValidator.updateCalculationBudget(),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canEdit']),
  budgetAuthMiddleware.auditBudgetAction('UPDATE_BUDGET'),
  calculationBudgetController.updateBudget.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}/pricing:
 *   put:
 *     summary: Actualiza precios del presupuesto desde fuentes externas
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
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
 *               - updateSource
 *             properties:
 *               updateSource:
 *                 type: string
 *                 enum: [IPCO, SUPPLIER, MANUAL, ALL]
 *                 description: Fuente de actualización de precios
 *               forceUpdate:
 *                 type: boolean
 *                 default: false
 *                 description: Forzar actualización aunque los precios sean recientes
 *               specificMaterials:
 *                 type: array
 *                 description: IDs de materiales específicos a actualizar
 *                 items:
 *                   type: string
 *                   format: uuid
 *               priceAdjustments:
 *                 type: array
 *                 description: Ajustes manuales de precios
 *                 items:
 *                   type: object
 *                   required:
 *                     - materialId
 *                     - newPrice
 *                   properties:
 *                     materialId:
 *                       type: string
 *                       format: uuid
 *                     newPrice:
 *                       type: number
 *                       minimum: 0
 *                     reason:
 *                       type: string
 *               notifyUser:
 *                 type: boolean
 *                 default: true
 *                 description: Enviar notificaciones de cambios
 *               recalculateTotals:
 *                 type: boolean
 *                 default: true
 *                 description: Recalcular totales del presupuesto
 *     responses:
 *       200:
 *         description: Precios actualizados exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Sin permisos para modificar el presupuesto
 */
router.put(
  "/:budgetId/pricing",
  authMiddleware,
  BudgetValidator.updateBudgetPricing(),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canEdit']),
  budgetAuthMiddleware.auditBudgetAction('UPDATE_PRICING'),
  calculationBudgetController.updatePricing.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}/pricing/compare:
 *   get:
 *     summary: Compara precios disponibles sin actualizar
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comparación de precios obtenida exitosamente
 *       403:
 *         description: Sin permisos para acceder al presupuesto
 */
router.get(
  "/:budgetId/pricing/compare",
  authMiddleware,
  BudgetValidator.validateId('budgetId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canRead']),
  calculationBudgetController.comparePrices.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}/document:
 *   post:
 *     summary: Genera documento profesional del presupuesto
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
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
 *               - format
 *               - clientInfo
 *               - branding
 *               - documentSettings
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [PDF, EXCEL, WORD, ALL]
 *                 description: Formato del documento
 *               branding:
 *                 type: object
 *                 properties:
 *                   companyName:
 *                     type: string
 *                     maxLength: 100
 *                   companyLogo:
 *                     type: string
 *                   professionalName:
 *                     type: string
 *                     maxLength: 100
 *                   professionalTitle:
 *                     type: string
 *                     maxLength: 100
 *                   professionalRegistration:
 *                     type: string
 *                   contactInfo:
 *                     type: object
 *                     properties:
 *                       phone:
 *                         type: string
 *                         pattern: '^[+]?[\d\s\-\(\)]{7,15}$'
 *                       email:
 *                         type: string
 *                         format: email
 *                       address:
 *                         type: string
 *                       website:
 *                         type: string
 *                   colors:
 *                     type: object
 *                     properties:
 *                       primary:
 *                         type: string
 *                       secondary:
 *                         type: string
 *                       accent:
 *                         type: string
 *               clientInfo:
 *                 type: object
 *                 required:
 *                   - name
 *                 properties:
 *                   name:
 *                     type: string
 *                     minLength: 2
 *                     maxLength: 100
 *                   company:
 *                     type: string
 *                   address:
 *                     type: string
 *                   phone:
 *                     type: string
 *                     pattern: '^[+]?[\d\s\-\(\)]{7,15}$'
 *                   email:
 *                     type: string
 *                     format: email
 *                   ruc:
 *                     type: string
 *               documentSettings:
 *                 type: object
 *                 properties:
 *                   includeCalculationDetails:
 *                     type: boolean
 *                     default: false
 *                   includeMaterialSpecs:
 *                     type: boolean
 *                     default: true
 *                   includeNECReferences:
 *                     type: boolean
 *                     default: false
 *                   showPriceBreakdown:
 *                     type: boolean
 *                     default: true
 *                   showLaborDetails:
 *                     type: boolean
 *                     default: true
 *                   includeTermsAndConditions:
 *                     type: boolean
 *                     default: true
 *                   includeValidityPeriod:
 *                     type: boolean
 *                     default: true
 *                   validityDays:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 365
 *                     default: 30
 *                   language:
 *                     type: string
 *                     enum: [es, en]
 *                     default: es
 *                   currency:
 *                     type: string
 *                     enum: [USD, EUR]
 *                     default: USD
 *               delivery:
 *                 type: object
 *                 properties:
 *                   sendByEmail:
 *                     type: boolean
 *                     default: false
 *                   recipientEmails:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: email
 *                   emailSubject:
 *                     type: string
 *                   emailMessage:
 *                     type: string
 *                   generateDownloadLink:
 *                     type: boolean
 *                     default: false
 *     responses:
 *       200:
 *         description: Documento generado exitosamente
 *       400:
 *         description: Datos inválidos
 *       402:
 *         description: Límite de exportaciones alcanzado
 *       403:
 *         description: Sin permisos para exportar el presupuesto
 */
router.post(
  "/:budgetId/document",
  authMiddleware,
  budgetAuthMiddleware.checkPlanLimits('EXPORT_DOCUMENT'),
  BudgetValidator.generateProfessionalDocument(),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canExport']),
  budgetAuthMiddleware.auditBudgetAction('GENERATE_DOCUMENT'),
  calculationBudgetController.generateProfessionalDocument.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}/preview:
 *   get:
 *     summary: Genera vista previa del documento
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [PDF, HTML]
 *           default: PDF
 *     responses:
 *       200:
 *         description: Vista previa generada exitosamente
 *       403:
 *         description: Sin permisos para acceder al presupuesto
 */
router.get(
  "/:budgetId/preview",
  authMiddleware,
  BudgetValidator.validateId('budgetId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canRead']),
  calculationBudgetController.generatePreview.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}/status:
 *   put:
 *     summary: Cambia el estado del presupuesto
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, review, approved, revised, final, archived]
 *                 description: Nuevo estado del presupuesto
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Notas sobre el cambio de estado
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Transición de estado inválida
 *       403:
 *         description: Sin permisos para cambiar el estado
 */
router.put(
  "/:budgetId/status",
  authMiddleware,
  BudgetValidator.updateBudgetStatus(),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canApprove']),
  budgetAuthMiddleware.auditBudgetAction('UPDATE_STATUS'),
  calculationBudgetController.updateStatus.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}/clone:
 *   post:
 *     summary: Clona un presupuesto existente
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
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
 *                 description: Nombre para el presupuesto clonado
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del proyecto (opcional, usa el original si no se especifica)
 *     responses:
 *       201:
 *         description: Presupuesto clonado exitosamente
 *       402:
 *         description: Límite de plan alcanzado
 *       403:
 *         description: Sin permisos para clonar el presupuesto
 */
router.post(
  "/:budgetId/clone",
  authMiddleware,
  budgetAuthMiddleware.checkPlanLimits('CREATE_BUDGET'),
  BudgetValidator.cloneBudget(),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canClone']),
  budgetAuthMiddleware.checkProjectAccess(),
  budgetAuthMiddleware.auditBudgetAction('CLONE_BUDGET'),
  calculationBudgetController.cloneBudget.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}/versions:
 *   get:
 *     summary: Obtiene historial de versiones de un presupuesto
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Versiones obtenidas exitosamente
 *       403:
 *         description: Sin permisos para acceder al presupuesto
 */
router.get(
  "/:budgetId/versions",
  authMiddleware,
  BudgetValidator.validateId('budgetId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canRead']),
  calculationBudgetController.getBudgetVersions.bind(calculationBudgetController)
);

/**
 * @swagger
 * /api/calculation-budgets/{budgetId}:
 *   delete:
 *     summary: Elimina un presupuesto (soft delete)
 *     tags: [Calculation Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Presupuesto eliminado exitosamente
 *       400:
 *         description: No se pueden eliminar presupuestos aprobados o finales
 *       403:
 *         description: Sin permisos para eliminar el presupuesto
 *       404:
 *         description: Presupuesto no encontrado
 */
router.delete(
  "/:budgetId",
  authMiddleware,
  BudgetValidator.validateId('budgetId'),
  handleValidationErrors,
  budgetAuthMiddleware.checkBudgetPermissions(['canDelete']),
  budgetAuthMiddleware.auditBudgetAction('DELETE_BUDGET'),
  calculationBudgetController.deleteBudget.bind(calculationBudgetController)
);

// Middleware de logging para todas las rutas
router.use(budgetAuthMiddleware.logBudgetAction());

export default router;