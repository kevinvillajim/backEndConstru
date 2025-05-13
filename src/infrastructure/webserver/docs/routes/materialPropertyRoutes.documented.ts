/**
 * @swagger
 * /api/material-properties/categories/{categoryId}/properties:
 *   get:
 *     tags:
 *       - MaterialProperties
 *     summary: Propiedades de categoría
 *     description: Obtiene las definiciones de propiedades de una categoría
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Propiedades obtenidas exitosamente
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
 *                       type:
 *                         type: string
 *                         enum: [text, number, boolean, select, date]
 *                       required:
 *                         type: boolean
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *       500:
 *         description: Error al obtener propiedades
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/material-properties/properties:
 *   post:
 *     tags:
 *       - MaterialProperties
 *     summary: Crear definición
 *     description: Crea una nueva definición de propiedad
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
 *               - name
 *               - type
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la propiedad
 *               type:
 *                 type: string
 *                 enum: [text, number, boolean, select, date]
 *                 description: Tipo de la propiedad
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la categoría
 *               required:
 *                 type: boolean
 *                 description: Indica si es obligatoria
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Opciones (para tipo select)
 *               defaultValue:
 *                 type: string
 *                 description: Valor por defecto
 *               unit:
 *                 type: string
 *                 description: Unidad (para tipo number)
 *     responses:
 *       201:
 *         description: Definición creada exitosamente
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
 *                   example: Definición de propiedad creada
 *                 data:
 *                   type: object
 *       400:
 *         description: Error al crear definición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Permiso denegado (solo admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/material-properties/properties/{definitionId}:
 *   put:
 *     tags:
 *       - MaterialProperties
 *     summary: Actualizar definición
 *     description: Actualiza una definición de propiedad
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: definitionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la definición
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               required:
 *                 type: boolean
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               defaultValue:
 *                 type: string
 *               unit:
 *                 type: string
 *     responses:
 *       200:
 *         description: Definición actualizada exitosamente
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
 *                   example: Definición de propiedad actualizada
 *                 data:
 *                   type: object
 *       400:
 *         description: Error al actualizar definición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/material-properties/properties/{definitionId}:
 *   delete:
 *     tags:
 *       - MaterialProperties
 *     summary: Eliminar definición
 *     description: Elimina una definición de propiedad
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: definitionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la definición
 *     responses:
 *       200:
 *         description: Definición eliminada exitosamente
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
 *                   example: Definición de propiedad eliminada
 *       400:
 *         description: Error al eliminar definición
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/material-properties/materials/{materialId}/properties:
 *   get:
 *     tags:
 *       - MaterialProperties
 *     summary: Propiedades de material
 *     description: Obtiene las propiedades de un material
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del material
 *     responses:
 *       200:
 *         description: Propiedades obtenidas exitosamente
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
 *                       materialId:
 *                         type: string
 *                         format: uuid
 *                       propertyId:
 *                         type: string
 *                         format: uuid
 *                       value:
 *                         type: string
 *                       propertyName:
 *                         type: string
 *                       propertyType:
 *                         type: string
 *       500:
 *         description: Error al obtener propiedades
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/material-properties/materials/{materialId}/properties:
 *   post:
 *     tags:
 *       - MaterialProperties
 *     summary: Establecer propiedades
 *     description: Establece las propiedades de un material
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del material
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - properties
 *             properties:
 *               properties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - propertyId
 *                     - value
 *                   properties:
 *                     propertyId:
 *                       type: string
 *                       format: uuid
 *                     value:
 *                       type: string
 *     responses:
 *       200:
 *         description: Propiedades establecidas exitosamente
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
 *                   example: Propiedades del material actualizadas
 *       400:
 *         description: Error al establecer propiedades
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/material-properties/materials/{materialId}/properties:
 *   delete:
 *     tags:
 *       - MaterialProperties
 *     summary: Eliminar propiedades
 *     description: Elimina todas las propiedades de un material
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del material
 *     responses:
 *       200:
 *         description: Propiedades eliminadas exitosamente
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
 *                   example: Propiedades del material eliminadas
 *       400:
 *         description: Error al eliminar propiedades
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Material no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
