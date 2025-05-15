/**
 * @swagger
 * /calculations/templates/export/{templateId}:
 *   get:
 *     tags:
 *       - CalculationTemplates
 *     summary: Exportar plantilla
 *     description: Exporta una plantilla específica a formato JSON
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la plantilla a exportar
 *     responses:
 *       200:
 *         description: Plantilla exportada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templateData:
 *                   $ref: '#/components/schemas/CalculationTemplate'
 *                 parameters:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CalculationParameter'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     exportDate:
 *                       type: string
 *                       format: date-time
 *                     exportedBy:
 *                       type: string
 *                       format: uuid
 *                     version:
 *                       type: string
 *       400:
 *         description: Error al exportar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Plantilla no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /calculations/templates/export-multiple:
 *   get:
 *     tags:
 *       - CalculationTemplates
 *     summary: Exportar múltiples plantillas
 *     description: Exporta múltiples plantillas según filtros
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Tipo de plantilla
 *       - in: query
 *         name: profession
 *         schema:
 *           type: string
 *         description: Profesión objetivo
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Etiquetas (separadas por comas)
 *     responses:
 *       200:
 *         description: Plantillas exportadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exports:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       templateData:
 *                         $ref: '#/components/schemas/CalculationTemplate'
 *                       parameters:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/CalculationParameter'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     exportDate:
 *                       type: string
 *                       format: date-time
 *                     exportedBy:
 *                       type: string
 *                       format: uuid
 *                     count:
 *                       type: integer
 *       400:
 *         description: Error al exportar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /calculations/templates/import:
 *   post:
 *     tags:
 *       - CalculationTemplates
 *     summary: Importar plantilla
 *     description: Importa una plantilla desde un archivo JSON
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
 *               - templateData
 *               - parameters
 *             properties:
 *               templateData:
 *                 $ref: '#/components/schemas/CalculationTemplate'
 *               parameters:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CalculationParameter'
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Plantilla importada exitosamente
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
 *                   example: Plantilla importada exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     templateId:
 *                       type: string
 *                       format: uuid
 *                     templateName:
 *                       type: string
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Error al importar
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
 * /calculations/templates/import-multiple:
 *   post:
 *     tags:
 *       - CalculationTemplates
 *     summary: Importar múltiples plantillas
 *     description: Importa múltiples plantillas desde un archivo JSON
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
 *               - exports
 *             properties:
 *               exports:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     templateData:
 *                       $ref: '#/components/schemas/CalculationTemplate'
 *                     parameters:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CalculationParameter'
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Plantillas importadas exitosamente
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
 *                   example: Importación completada
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           templateId:
 *                             type: string
 *                             format: uuid
 *                           templateName:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                           errors:
 *                             type: array
 *                             items:
 *                               type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         success:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       400:
 *         description: Error al importar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
