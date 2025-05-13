/**
 * @swagger
 * /api/metrics/project/{projectId}:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Métricas de proyecto
 *     description: Obtiene métricas avanzadas de rendimiento del proyecto
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
 *         description: Métricas obtenidas exitosamente
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
 *                     schedulePerformanceIndex:
 *                       type: number
 *                     costPerformanceIndex:
 *                       type: number
 *                     estimatedCostAtCompletion:
 *                       type: number
 *                     estimatedTimeToCompletion:
 *                       type: number
 *                     plannedValue:
 *                       type: number
 *                     earnedValue:
 *                       type: number
 *                     actualCost:
 *                       type: number
 *                     taskCompletionRate:
 *                       type: number
 *                     defectRate:
 *                       type: number
 *                     resourceUtilization:
 *                       type: object
 *                     materialUsageEfficiency:
 *                       type: object
 *                     phaseMetrics:
 *                       type: array
 *                       items:
 *                         type: object
 *                     projectScope:
 *                       type: object
 *       400:
 *         description: Error al obtener métricas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/metrics/predictions/{projectId}/delays:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Predicción de retrasos
 *     description: Predice posibles retrasos en el proyecto basado en datos actuales
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
 *         description: Predicción generada exitosamente
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
 *                     originalEndDate:
 *                       type: string
 *                       format: date-time
 *                     predictedEndDate:
 *                       type: string
 *                       format: date-time
 *                     predictedDelay:
 *                       type: number
 *                     delayRisk:
 *                       type: string
 *                       enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                     contributingFactors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           factor:
 *                             type: string
 *                           impact:
 *                             type: number
 *                     recommendedActions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     trendData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           predictedDelay:
 *                             type: number
 *                           predictedEndDate:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Error al predecir retrasos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/metrics/predictions/{projectId}/history:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Historial de predicciones
 *     description: Obtiene un historial de predicciones para mostrar tendencias
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
 *                   type: object
 *                   properties:
 *                     currentPrediction:
 *                       type: object
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           predictedDelay:
 *                             type: number
 *                           predictedEndDate:
 *                             type: string
 *                             format: date-time
 *                           riskLevel:
 *                             type: string
 *                             enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *       400:
 *         description: Error al obtener historial
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */