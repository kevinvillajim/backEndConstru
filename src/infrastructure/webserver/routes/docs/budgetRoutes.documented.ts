// src/infrastructure/webserver/routes/budgetRoutes.documented.ts
import {Router} from "express";
import {authenticate} from "../../middlewares/authMiddleware";
import {getBudgetController} from "../../../config/service-factory";

const router = Router();

/**
 * @swagger
 * /api/budgets/generate:
 *   post:
 *     tags:
 *       - Budgets
 *     summary: Generar presupuesto desde cálculo
 *     description: Genera un presupuesto a partir de un resultado de cálculo
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - calculationResultId
 *               - projectId
 *               - name
 *             properties:
 *               calculationResultId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del resultado de cálculo
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del proyecto
 *               name:
 *                 type: string
 *                 description: Nombre del presupuesto
 *     responses:
 *       200:
 *         description: Presupuesto generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Presupuesto generado exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     projectId:
 *                       type: string
 *                       format: uuid
 *                     items:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *       400:
 *         description: Error al generar presupuesto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/generate", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.generateFromCalculation(req, res);
});

/**
 * @swagger
 * /api/budgets/project/{projectId}:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Obtener presupuestos del proyecto
 *     description: Obtiene lista de presupuestos de un proyecto
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del proyecto
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Resultados por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, rejected, revised]
 *         description: Filtrar por estado
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Campo por el cual ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Presupuestos obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     budgets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ProjectBudget'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       400:
 *         description: Error al obtener presupuestos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/project/:projectId", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.getProjectBudgets(req, res);
});

/**
 * @swagger
 * /api/budgets/{budgetId}:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Obtener detalles de presupuesto
 *     description: Obtiene detalles de un presupuesto específico
 *     security:
 *       - cookieAuth: []
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
 *         description: Detalles de presupuesto obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProjectBudget'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Presupuesto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:budgetId", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.getBudgetDetails(req, res);
});

/**
 * @swagger
 * /api/budgets/{budgetId}/version:
 *   post:
 *     tags:
 *       - Budgets
 *     summary: Crear nueva versión de presupuesto
 *     description: Crea una nueva versión de un presupuesto existente
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del presupuesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre para la nueva versión
 *               description:
 *                 type: string
 *                 description: Descripción de los cambios
 *     responses:
 *       201:
 *         description: Nueva versión creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Nueva versión del presupuesto creada exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     version:
 *                       type: integer
 *                     name:
 *                       type: string
 *       400:
 *         description: Error al crear versión
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/:budgetId/version", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.createVersion(req, res);
});

/**
 * @swagger
 * /api/budgets/{budgetId}/status:
 *   put:
 *     tags:
 *       - Budgets
 *     summary: Actualizar estado de presupuesto
 *     description: Actualiza el estado de un presupuesto
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del presupuesto
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
 *                 enum: [draft, submitted, approved, rejected, revised]
 *                 description: Nuevo estado del presupuesto
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Estado del presupuesto actualizado
 *                 data:
 *                   $ref: '#/components/schemas/ProjectBudget'
 *       400:
 *         description: Estado no válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Presupuesto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:budgetId/status", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.updateStatus(req, res);
});

/**
 * @swagger
 * /api/budgets/compare:
 *   post:
 *     tags:
 *       - Budgets
 *     summary: Comparar versiones de presupuesto
 *     description: Compara dos versiones de un presupuesto
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalBudgetId
 *               - newBudgetId
 *             properties:
 *               originalBudgetId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del presupuesto original
 *               newBudgetId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del presupuesto nuevo
 *     responses:
 *       200:
 *         description: Comparación realizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     originalBudget:
 *                       type: object
 *                     newBudget:
 *                       type: object
 *                     changes:
 *                       type: object
 *                       properties:
 *                         addedItems:
 *                           type: array
 *                           items:
 *                             type: object
 *                         removedItems:
 *                           type: array
 *                           items:
 *                             type: object
 *                         modifiedItems:
 *                           type: array
 *                           items:
 *                             type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         originalTotal:
 *                           type: number
 *                         newTotal:
 *                           type: number
 *                         difference:
 *                           type: number
 *                         percentageChange:
 *                           type: number
 *       400:
 *         description: Error al comparar presupuestos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/compare", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.compareBudgetVersions(req, res);
});

/**
 * @swagger
 * /api/budgets/{budgetId}/costs:
 *   post:
 *     tags:
 *       - Budgets
 *     summary: Añadir costos adicionales
 *     description: Añade costos de mano de obra y costos indirectos al presupuesto
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del presupuesto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - laborCosts
 *               - indirectCosts
 *             properties:
 *               laborCosts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     unitCost:
 *                       type: number
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *               indirectCosts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *     responses:
 *       200:
 *         description: Costos añadidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Costos añadidos exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     budgetId:
 *                       type: string
 *                       format: uuid
 *                     previousTotal:
 *                       type: number
 *                     newTotal:
 *                       type: number
 *                     laborCostsTotal:
 *                       type: number
 *                     indirectCostsTotal:
 *                       type: number
 *       400:
 *         description: Formato de datos inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/:budgetId/costs", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.addLaborAndIndirectCosts(req, res);
});

/**
 * @swagger
 * /api/budgets/{budgetId}/export-pdf:
 *   get:
 *     tags:
 *       - Budgets
 *     summary: Exportar presupuesto a PDF
 *     description: Exporta el presupuesto a formato PDF
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del presupuesto
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Incluir detalles completos
 *     responses:
 *       200:
 *         description: PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Error al exportar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Presupuesto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:budgetId/export-pdf", authenticate, (req, res) => {
	const budgetController = getBudgetController();
	return budgetController.exportBudgetToPdf(req, res);
});

export default router;
