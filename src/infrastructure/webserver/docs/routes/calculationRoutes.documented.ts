/**
 * @swagger
 * /api/calculations/execute:
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
 * /api/calculations/save-result:
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
 * /api/calculations/recommendations:
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

/**
 * @swagger
 * /api/calculations/templates:
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
 */

/**
 * @swagger
 * /api/calculations/templates/{id}:
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
 */

/**
 * @swagger
 * /api/calculations/templates:
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
 * /api/calculations/templates/{id}/preview:
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

/**
 * @swagger
 * /api/calculations/templates/{id}:
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
 */

/**
 * @swagger
 * /api/calculations/templates/{id}:
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