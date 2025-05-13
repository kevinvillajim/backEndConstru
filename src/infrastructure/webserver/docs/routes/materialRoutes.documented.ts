/**
 * @swagger
 * /api/materials:
 *   get:
 *     tags:
 *       - Materials
 *     summary: Listar materiales
 *     description: Obtiene todos los materiales con filtros opcionales
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por categoría
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por vendedor
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filtrar por materiales destacados
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
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
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Campo por el cual ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: ASC
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Materiales obtenidos exitosamente
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
 *                     materials:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Material'
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
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/materials/{id}:
 *   get:
 *     tags:
 *       - Materials
 *     summary: Obtener material por ID
 *     description: Obtiene un material específico por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del material
 *     responses:
 *       200:
 *         description: Material obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Material'
 *       404:
 *         description: Material no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/materials:
 *   post:
 *     tags:
 *       - Materials
 *     summary: Crear material
 *     description: Crea un nuevo material
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
 *               - categoryId
 *               - price
 *               - unit
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del material
 *               description:
 *                 type: string
 *                 description: Descripción detallada
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de categoría
 *               price:
 *                 type: number
 *                 description: Precio por unidad
 *               unit:
 *                 type: string
 *                 description: Unidad de medida (kg, m, m2, etc.)
 *               stock:
 *                 type: integer
 *                 description: Cantidad en stock
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: URLs de imágenes
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Etiquetas
 *               isFeatured:
 *                 type: boolean
 *                 description: Destacado en búsquedas/catálogo
 *     responses:
 *       201:
 *         description: Material creado exitosamente
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
 *                   example: Material creado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Material'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/materials/{id}:
 *   put:
 *     tags:
 *       - Materials
 *     summary: Actualizar material
 *     description: Actualiza un material existente
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Material actualizado exitosamente
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
 *                   example: Material actualizado exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/Material'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Material no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/materials/{id}:
 *   delete:
 *     tags:
 *       - Materials
 *     summary: Eliminar material
 *     description: Elimina un material (soft delete)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del material
 *     responses:
 *       200:
 *         description: Material eliminado exitosamente
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
 *                   example: Material eliminado exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Material no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/materials/{id}/stock:
 *   patch:
 *     tags:
 *       - Materials
 *     summary: Actualizar stock
 *     description: Actualiza el stock de un material
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: Nueva cantidad en stock
 *     responses:
 *       200:
 *         description: Stock actualizado exitosamente
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
 *                   example: Stock actualizado exitosamente
 *       400:
 *         description: Cantidad no proporcionada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Material no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/materials/bulk-update-prices:
 *   post:
 *     tags:
 *       - Materials
 *     summary: Actualizar precios masivamente
 *     description: Actualiza precios de múltiples materiales según criterios
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
 *               - priceChangePercentage
 *               - reason
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Filtrar por categoría
 *               sellerId:
 *                 type: string
 *                 format: uuid
 *                 description: Filtrar por vendedor
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Filtrar por etiquetas
 *               priceChangePercentage:
 *                 type: number
 *                 description: Porcentaje de cambio (positivo o negativo)
 *               reason:
 *                 type: string
 *                 enum: [market_adjustment, promotion, seasonal, cost_change, stock_clearance, other]
 *                 description: Razón del cambio
 *               notes:
 *                 type: string
 *                 description: Notas adicionales
 *               minPrice:
 *                 type: number
 *                 description: Precio mínimo para filtrar
 *               maxPrice:
 *                 type: number
 *                 description: Precio máximo para filtrar
 *     responses:
 *       200:
 *         description: Precios actualizados exitosamente
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
 *                   example: Precios actualizados exitosamente para X materiales
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: integer
 *                     updatedMaterials:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           oldPrice:
 *                             type: number
 *                           newPrice:
 *                             type: number
 *       400:
 *         description: Parámetros inválidos
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
 * /api/materials/{id}/price-history:
 *   get:
 *     tags:
 *       - Materials
 *     summary: Historial de precios
 *     description: Obtiene el historial de precios de un material
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del material
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
 *                       materialId:
 *                         type: string
 *                         format: uuid
 *                       previousPrice:
 *                         type: number
 *                       newPrice:
 *                         type: number
 *                       changePercentage:
 *                         type: number
 *                       reason:
 *                         type: string
 *                       notes:
 *                         type: string
 *                       changedBy:
 *                         type: string
 *                         format: uuid
 *                       effectiveDate:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Material no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/materials/{materialId}/compare-prices:
 *   post:
 *     tags:
 *       - Materials
 *     summary: Comparar precios entre proveedores
 *     description: Compara precios de un material entre diferentes proveedores
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectLocation:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   city:
 *                     type: string
 *                   province:
 *                     type: string
 *     responses:
 *       200:
 *         description: Comparación de precios exitosa
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
 *                     material:
 *                       type: object
 *                     suppliers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 *                           availability:
 *                             type: string
 *                           distance:
 *                             type: number
 *                           deliveryTime:
 *                             type: string
 *                     averagePrice:
 *                       type: number
 *                     lowestPrice:
 *                       type: number
 *                     highestPrice:
 *                       type: number
 *       400:
 *         description: Error al comparar precios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Solo administradores pueden acceder
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
