/**
 * @swagger
 * /api/reports/progress/{projectId}:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Generar informe de progreso
 *     description: Genera un informe detallado de progreso del proyecto
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
 *         description: Informe generado exitosamente
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
 *                     projectId:
 *                       type: string
 *                       format: uuid
 *                     projectName:
 *                       type: string
 *                     overallProgress:
 *                       type: number
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     phases:
 *                       type: array
 *                       items:
 *                         type: object
 *                     tasksStatus:
 *                       type: object
 *                     risksIdentified:
 *                       type: array
 *                       items:
 *                         type: object
 *                     budgetOverview:
 *                       type: object
 *                     materialRequestsStatus:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Error al generar informe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/reports/progress/{projectId}/export-pdf:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Exportar informe a PDF
 *     description: Exporta un informe de progreso en formato PDF
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
 *         description: PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Error al exportar informe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */