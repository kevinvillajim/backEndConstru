/**
 * @swagger
 * /api/dashboards/project/{projectId}:
 *   get:
 *     tags:
 *       - Dashboards
 *     summary: Datos de dashboard de proyecto
 *     description: Obtiene los datos para mostrar en el dashboard visual de seguimiento del proyecto
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
 *     responses:
 *       200:
 *         description: Datos obtenidos exitosamente
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
 *                     projectName:
 *                       type: string
 *                     completionPercentage:
 *                       type: number
 *                     progressData:
 *                       type: array
 *                       items:
 *                         type: object
 *                     taskStatusCounts:
 *                       type: object
 *                     phaseProgress:
 *                       type: array
 *                       items:
 *                         type: object
 *                     budgetData:
 *                       type: object
 *                     criticalTasks:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Error al obtener datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/dashboards/enhanced/{projectId}:
 *   get:
 *     tags:
 *       - Dashboards
 *     summary: Datos de dashboard mejorado
 *     description: Obtiene datos enriquecidos para el dashboard visual del proyecto
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
 *     responses:
 *       200:
 *         description: Datos obtenidos exitosamente
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
 *                     projectName:
 *                       type: string
 *                     completionPercentage:
 *                       type: number
 *                     progressData:
 *                       type: array
 *                       items:
 *                         type: object
 *                     taskStatusCounts:
 *                       type: object
 *                     phaseProgress:
 *                       type: array
 *                       items:
 *                         type: object
 *                     budgetData:
 *                       type: object
 *                     criticalTasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                     resourceAllocation:
 *                       type: array
 *                       items:
 *                         type: object
 *                     keyPerformanceIndicators:
 *                       type: array
 *                       items:
 *                         type: object
 *                     milestones:
 *                       type: array
 *                       items:
 *                         type: object
 *                     activeRisks:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Error al obtener datos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/dashboards/enhanced/{projectId}/{widgetType}:
 *   get:
 *     tags:
 *       - Dashboards
 *     summary: Datos de widget específico
 *     description: Obtiene datos específicos para un widget del dashboard (para carga optimizada)
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
 *       - in: path
 *         name: widgetType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [progress, tasks, phases, budget, criticalTasks, resources, kpis, milestones, risks]
 *         description: Tipo de widget
 *     responses:
 *       200:
 *         description: Datos obtenidos exitosamente
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
 *       400:
 *         description: Tipo de widget inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */