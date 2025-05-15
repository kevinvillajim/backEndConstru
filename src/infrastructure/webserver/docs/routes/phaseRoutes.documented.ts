/**
 * @swagger
 * /phases/{phaseId}:
 *   get:
 *     tags:
 *       - Phases
 *     summary: Detalles de fase
 *     description: Obtiene detalles de una fase
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la fase
 *     responses:
 *       200:
 *         description: Detalles obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Phase'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Fase no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /phases/{phaseId}/tasks:
 *   get:
 *     tags:
 *       - Phases
 *     summary: Tareas de fase
 *     description: Obtiene todas las tareas de una fase
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la fase
 *     responses:
 *       200:
 *         description: Tareas obtenidas exitosamente
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
 *                     phase:
 *                       $ref: '#/components/schemas/Phase'
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Fase no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /phases/{phaseId}/dates:
 *   patch:
 *     tags:
 *       - Phases
 *     summary: Actualizar fechas
 *     description: Actualiza las fechas de una fase
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la fase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de inicio
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de fin
 *     responses:
 *       200:
 *         description: Fechas actualizadas exitosamente
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
 *                   example: Fechas de fase actualizadas
 *                 data:
 *                   $ref: '#/components/schemas/Phase'
 *       400:
 *         description: Fechas no proporcionadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Fase no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
