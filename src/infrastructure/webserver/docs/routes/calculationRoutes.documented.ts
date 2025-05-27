/**
 * @swagger
 * tags:
 *   - name: Calculations
 *     description: Ejecución y gestión de cálculos
 *   - name: CalculationTemplates
 *     description: Gestión de plantillas de cálculo
 *   - name: Favorites
 *     description: Gestión de plantillas favoritas
 *   - name: Ratings
 *     description: Calificaciones de plantillas
 *   - name: Suggestions
 *     description: Sugerencias de mejoras para plantillas
 *   - name: Comparisons
 *     description: Comparación de cálculos
 *   - name: Trending
 *     description: Plantillas en tendencia
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CalculationParameter:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         label:
 *           type: string
 *         type:
 *           type: string
 *           enum: [number, string, boolean, select, date]
 *         unit:
 *           type: string
 *         required:
 *           type: boolean
 *         defaultValue:
 *           type: string
 *         options:
 *           type: array
 *           items:
 *             type: string
 */

// ============= CÁLCULOS =============

/**
 * @swagger
 * /calculations/execute:
 *   post:
 *     tags:
 *       - Calculations
 *     summary: Ejecutar un cálculo
 *     description: Ejecuta un cálculo con los parámetros proporcionados
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
 *               - templateId
 *               - parameters
 *             properties:
 *               templateId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la plantilla de cálculo
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del proyecto (opcional)
 *               parameters:
 *                 type: object
 *                 description: Parámetros para el cálculo
 *     responses:
 *       200:
 *         description: Cálculo ejecutado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CalculationResult'
 *       400:
 *         description: Parámetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /calculations/save:
 *   post:
 *     tags:
 *       - Calculations
 *     summary: Guardar resultado de cálculo
 *     description: Guarda un resultado de cálculo con un nombre específico
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
 *               - id
 *               - name
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del resultado de cálculo
 *               name:
 *                 type: string
 *                 description: Nombre para el resultado guardado
 *               notes:
 *                 type: string
 *                 description: Notas adicionales
 *               usedInProject:
 *                 type: boolean
 *                 description: Indica si se usa en un proyecto
 *               projectId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del proyecto relacionado
 *     responses:
 *       200:
 *         description: Resultado guardado exitosamente
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     notes:
 *                       type: string
 *                     usedInProject:
 *                       type: boolean
 *                     projectId:
 *                       type: string
 *                       format: uuid
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
 * /calculations/recommendations:
 *   get:
 *     tags:
 *       - Calculations
 *     summary: Obtener recomendaciones de plantillas
 *     description: Obtiene recomendaciones de plantillas basadas en el contexto actual
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateId
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
 *           default: 5
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
 *                       recommendationScore:
 *                         type: number
 *                         format: float
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

// ============= COMPARACIONES =============

/**
 * @swagger
 * /calculations/compare:
 *   post:
 *     tags:
 *       - Comparisons
 *     summary: Comparar cálculos
 *     description: Compara entre 2 y 4 cálculos guardados
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
 *               - calculationIds
 *             properties:
 *               calculationIds:
 *                 type: array
 *                 minItems: 2
 *                 maxItems: 4
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: IDs de los cálculos a comparar
 *               saveName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Nombre para guardar la comparación (opcional)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     calculations:
 *                       type: array
 *                       items:
 *                         type: object
 *                     comparisonData:
 *                       type: object
 *                     savedComparison:
 *                       type: object
 *       400:
 *         description: Datos de validación incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /calculations/comparisons:
 *   get:
 *     tags:
 *       - Comparisons
 *     summary: Obtener comparaciones guardadas
 *     description: Lista todas las comparaciones guardadas del usuario
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de comparaciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *                       calculationIds:
 *                         type: array
 *                         items:
 *                           type: string
 *                           format: uuid
 *                       comparisonData:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */

/**
 * @swagger
 * /calculations/comparisons/{comparisonId}:
 *   delete:
 *     tags:
 *       - Comparisons
 *     summary: Eliminar comparación guardada
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: comparisonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comparación eliminada exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sin permisos para eliminar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Comparación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// ============= PLANTILLAS =============

/**
 * @swagger
 * /calculations/templates:
 *   post:
 *     tags:
 *       - CalculationTemplates
 *     summary: Crear plantilla de cálculo
 *     description: Crea una nueva plantilla de cálculo
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
 *               - parameters
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la plantilla
 *               description:
 *                 type: string
 *                 description: Descripción detallada
 *               type:
 *                 type: string
 *                 enum:
 *                   - material_calculation
 *                   - structural_calculation
 *                   - cost_calculation
 *                   - time_calculation
 *                   - area_calculation
 *               targetProfessions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum:
 *                     - architect
 *                     - civil_engineer
 *                     - constructor
 *                     - contractor
 *                     - electrician
 *                     - plumber
 *                     - designer
 *               formula:
 *                 type: string
 *                 description: Fórmula de cálculo (código o expresión)
 *               parameters:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     label:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [number, string, boolean, select, date]
 *                     unit:
 *                       type: string
 *                     required:
 *                       type: boolean
 *                     defaultValue:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Plantilla creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CalculationTemplate'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   get:
 *     tags:
 *       - CalculationTemplates
 *     summary: Listar plantillas
 *     description: Obtiene todas las plantillas con filtros opcionales
 *     parameters:
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *         description: Tipos de plantillas (separados por comas)
 *       - in: query
 *         name: targetProfessions
 *         schema:
 *           type: string
 *         description: Profesiones objetivo (separadas por comas)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado verificado
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filtrar por plantillas destacadas
 *       - in: query
 *         name: shareLevel
 *         schema:
 *           type: string
 *           enum: [private, public, organization]
 *         description: Nivel de compartición
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por creador
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Etiquetas (separadas por comas)
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
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
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Plantillas obtenidas exitosamente
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
 *                     templates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CalculationTemplate'
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
 * /calculations/templates/search:
 *   get:
 *     tags:
 *       - CalculationTemplates
 *     summary: Búsqueda avanzada de plantillas
 *     description: Búsqueda de plantillas con filtros avanzados
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: profession
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Tags separados por comas
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CalculationTemplate'
 */

/**
 * @swagger
 * /calculations/templates/trending:
 *   get:
 *     tags:
 *       - Trending
 *     summary: Plantillas en tendencia
 *     description: Obtiene las plantillas más populares y utilizadas
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: weekly
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Plantillas trending obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/CalculationTemplate'
 *                       - type: object
 *                         properties:
 *                           trendScore:
 *                             type: number
 *                             format: float
 *                           rankPosition:
 *                             type: integer
 *                           periodUsage:
 *                             type: integer
 */

/**
 * @swagger
 * /calculations/templates/{id}:
 *   get:
 *     tags:
 *       - CalculationTemplates
 *     summary: Obtener plantilla por ID
 *     description: Obtiene una plantilla específica por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Plantilla obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CalculationTemplate'
 *       404:
 *         description: Plantilla no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     tags:
 *       - CalculationTemplates
 *     summary: Actualizar plantilla
 *     description: Actualiza una plantilla existente
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
 *         description: ID de la plantilla
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
 *               type:
 *                 type: string
 *                 enum:
 *                   - material_calculation
 *                   - structural_calculation
 *                   - cost_calculation
 *                   - time_calculation
 *                   - area_calculation
 *               targetProfessions:
 *                 type: array
 *                 items:
 *                   type: string
 *               formula:
 *                 type: string
 *               parameters:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CalculationParameter'
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               shareLevel:
 *                 type: string
 *                 enum: [private, public, organization]
 *     responses:
 *       200:
 *         description: Plantilla actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CalculationTemplate'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Permiso denegado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Plantilla no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     tags:
 *       - CalculationTemplates
 *     summary: Eliminar plantilla
 *     description: Elimina una plantilla existente
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
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Plantilla eliminada exitosamente
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
 *                   example: Plantilla eliminada correctamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Permiso denegado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Plantilla no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /calculations/templates/{id}/preview:
 *   get:
 *     tags:
 *       - CalculationTemplates
 *     summary: Vista previa de plantilla
 *     description: Genera una vista previa del cálculo usando valores de ejemplo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Vista previa generada exitosamente
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
 *                     parameters:
 *                       type: object
 *                     results:
 *                       type: object
 *       404:
 *         description: Plantilla no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// ============= FAVORITOS =============

/**
 * @swagger
 * /calculations/templates/{templateId}/favorite:
 *   post:
 *     tags:
 *       - Favorites
 *     summary: Agregar/quitar de favoritos
 *     description: Alterna el estado de favorito de una plantilla
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
 *     responses:
 *       200:
 *         description: Estado de favorito actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isFavorite:
 *                       type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /users/favorites:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Obtener plantillas favoritas del usuario
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de favoritos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CalculationTemplate'
 */

// ============= CALIFICACIONES =============

/**
 * @swagger
 * /calculations/templates/{templateId}/rate:
 *   post:
 *     tags:
 *       - Ratings
 *     summary: Calificar plantilla
 *     description: Asigna una calificación y comentario opcional a una plantilla
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Calificación de 1 a 5 estrellas
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Comentario opcional
 *     responses:
 *       200:
 *         description: Calificación guardada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Calificación inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

// ============= SUGERENCIAS =============

/**
 * @swagger
 * /calculations/templates/{templateId}/suggestions:
 *   post:
 *     tags:
 *       - Suggestions
 *     summary: Crear sugerencia de mejora
 *     description: Propone una mejora o corrección para una plantilla
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               suggestionType:
 *                 type: string
 *                 enum: [improvement, correction, addition, other]
 *                 default: improvement
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               currentValue:
 *                 type: string
 *                 maxLength: 1000
 *               proposedValue:
 *                 type: string
 *                 maxLength: 1000
 *               justification:
 *                 type: string
 *                 maxLength: 1000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *               affectsAccuracy:
 *                 type: boolean
 *                 default: false
 *               affectsCompliance:
 *                 type: boolean
 *                 default: false
 *               references:
 *                 type: array
 *                 items:
 *                   type: string
 *               contactForFollowup:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Sugerencia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos de validación incorrectos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sin permisos para sugerir cambios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   get:
 *     tags:
 *       - Suggestions
 *     summary: Obtener sugerencias de una plantilla
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de sugerencias obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /users/suggestions:
 *   get:
 *     tags:
 *       - Suggestions
 *     summary: Obtener sugerencias del usuario
 *     description: Lista todas las sugerencias creadas por el usuario autenticado
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sugerencias del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /admin/suggestions/pending:
 *   get:
 *     tags:
 *       - Suggestions
 *     summary: Obtener sugerencias pendientes (Admin)
 *     description: Lista todas las sugerencias pendientes de revisión
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sugerencias pendientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Requiere permisos de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /suggestions/{suggestionId}/status:
 *   put:
 *     tags:
 *       - Suggestions
 *     summary: Actualizar estado de sugerencia (Admin)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: suggestionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 enum: [pending, approved, rejected, implemented]
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
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       403:
 *         description: Requiere permisos de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// ============= PLANTILLAS POR USUARIO =============

/**
 * @swagger
 * /users/{userId}/calculations/templates:
 *   get:
 *     tags:
 *       - CalculationTemplates
 *     summary: Obtener plantillas de un usuario específico
 *     description: Lista las plantillas creadas por un usuario específico
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plantillas del usuario obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CalculationTemplate'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sin permisos para ver plantillas de este usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
