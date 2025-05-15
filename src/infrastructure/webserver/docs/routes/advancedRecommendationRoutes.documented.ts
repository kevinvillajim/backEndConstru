/**
 * @swagger
 * /recommendations/templates:
 *   get:
 *     tags:
 *       - Recommendations
 *     summary: Recomendaciones de plantillas
 *     description: Obtiene recomendaciones de plantillas basadas en el contexto actual
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currentTemplateId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la plantilla actual (opcional)
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del proyecto (opcional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número máximo de recomendaciones
 *     responses:
 *       200:
 *         description: Recomendaciones obtenidas exitosamente
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                       score:
 *                         type: number
 *                         format: float
 *                       reason:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Error al obtener recomendaciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /recommendations/materials:
 *   post:
 *     tags:
 *       - Recommendations
 *     summary: Recomendaciones de materiales
 *     description: Obtiene recomendaciones de materiales basadas en materiales actuales
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentMaterials:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: IDs de materiales actuales
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del proyecto (opcional)
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Número máximo de recomendaciones
 *     responses:
 *       200:
 *         description: Recomendaciones obtenidas exitosamente
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
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       unit:
 *                         type: string
 *                       score:
 *                         type: number
 *                         format: float
 *                       reason:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Error al obtener recomendaciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /recommendations/interactions:
 *   post:
 *     tags:
 *       - Recommendations
 *     summary: Registrar interacción
 *     description: Registra una interacción del usuario con el sistema de recomendaciones
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
 *               - type
 *               - itemId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [view, click, add, purchase]
 *                 description: Tipo de interacción
 *               itemId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del ítem con el que se interactuó
 *               itemType:
 *                 type: string
 *                 enum: [template, material, product]
 *                 description: Tipo de ítem
 *               context:
 *                 type: object
 *                 description: Contexto adicional de la interacción
 *     responses:
 *       200:
 *         description: Interacción registrada exitosamente
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
 *                   example: Interacción registrada correctamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Error al registrar interacción
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
