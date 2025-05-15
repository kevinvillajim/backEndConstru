/**
 * @swagger
 * /accounting/systems:
 *   get:
 *     tags:
 *       - Accounting
 *     summary: Sistemas contables
 *     description: Obtiene los sistemas contables soportados
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sistemas obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       logo:
 *                         type: string
 *       400:
 *         description: Error al obtener sistemas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /accounting/budgets/{budgetId}/sync:
 *   post:
 *     tags:
 *       - Accounting
 *     summary: Sincronizar presupuesto
 *     description: Sincroniza un presupuesto con un sistema contable
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
 *               - system
 *               - config
 *             properties:
 *               system:
 *                 type: string
 *                 description: ID del sistema contable
 *               config:
 *                 type: object
 *                 description: Configuración específica del sistema
 *     responses:
 *       200:
 *         description: Presupuesto sincronizado exitosamente
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
 *                   example: Presupuesto sincronizado correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     externalId:
 *                       type: string
 *                     syncDate:
 *                       type: string
 *                       format: date-time
 *                     success:
 *                       type: boolean
 *       400:
 *         description: Error en la sincronización
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /accounting/budgets/{budgetId}/sync-history:
 *   get:
 *     tags:
 *       - Accounting
 *     summary: Historial de sincronizaciones
 *     description: Obtiene el historial de sincronizaciones de un presupuesto
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
 *         description: Historial obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       entityId:
 *                         type: string
 *                         format: uuid
 *                       entityType:
 *                         type: string
 *                         example: budget
 *                       system:
 *                         type: string
 *                       externalId:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [success, failed, pending]
 *                       details:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Error al obtener historial
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
