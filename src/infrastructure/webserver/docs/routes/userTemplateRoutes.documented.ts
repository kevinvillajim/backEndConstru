// src/infrastructure/webserver/docs/routes/userTemplateRoutes.documented.ts

/**
 * @swagger
 * tags:
 *   - name: UserTemplates
 *     description: Gestión de plantillas personales de usuarios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserTemplateParameter:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID del parámetro (opcional para nuevos)
 *         name:
 *           type: string
 *           description: Nombre interno del parámetro
 *           example: "areaVivienda"
 *         label:
 *           type: string
 *           description: Etiqueta visible del parámetro
 *           example: "Área de la vivienda"
 *         type:
 *           type: string
 *           enum: [number, text, select, boolean]
 *           description: Tipo de parámetro
 *         scope:
 *           type: string
 *           enum: [input, internal, output]
 *           description: Alcance del parámetro
 *         required:
 *           type: boolean
 *           description: Si el parámetro es obligatorio
 *         displayOrder:
 *           type: integer
 *           description: Orden de aparición
 *         unit:
 *           type: string
 *           description: Unidad de medida
 *           example: "m²"
 *         minValue:
 *           type: number
 *           description: Valor mínimo (solo para number)
 *         maxValue:
 *           type: number
 *           description: Valor máximo (solo para number)
 *         allowedValues:
 *           type: array
 *           items:
 *             type: string
 *           description: Valores permitidos (solo para select)
 *         defaultValue:
 *           description: Valor por defecto
 *         helpText:
 *           type: string
 *           description: Texto de ayuda
 *         dependsOnParameters:
 *           type: array
 *           items:
 *             type: string
 *           description: IDs de parámetros dependientes
 *         formula:
 *           type: string
 *           description: Fórmula para cálculo automático
 *
 *     UserCalculationTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Cálculo de Vigas de Acero"
 *         description:
 *           type: string
 *           example: "Plantilla para calcular dimensiones de vigas de acero"
 *         longDescription:
 *           type: string
 *           example: "Descripción detallada de la plantilla..."
 *         sourceType:
 *           type: string
 *           enum: [created, copied, from_result]
 *           description: Origen de la plantilla
 *         originalTemplateId:
 *           type: string
 *           format: uuid
 *           description: ID de plantilla oficial original (si fue copiada)
 *         category:
 *           type: string
 *           example: "structural"
 *         subcategory:
 *           type: string
 *           example: "steel"
 *         targetProfessions:
 *           type: array
 *           items:
 *             type: string
 *           example: ["civil_engineer", "architect"]
 *         difficulty:
 *           type: string
 *           enum: [basic, intermediate, advanced]
 *         estimatedTime:
 *           type: string
 *           example: "10-15 min"
 *         necReference:
 *           type: string
 *           example: "NEC-SE-AC, Cap. 3"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["vigas", "acero", "estructural"]
 *         parameters:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserTemplateParameter'
 *         formula:
 *           type: string
 *           description: Código JavaScript de la fórmula
 *         isPublic:
 *           type: boolean
 *           description: Si la plantilla es pública
 *         isActive:
 *           type: boolean
 *           description: Si la plantilla está activa
 *         version:
 *           type: string
 *           example: "1.0"
 *         status:
 *           type: string
 *           enum: [draft, active, archived]
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Datos de suelo", "Cargas de diseño"]
 *         applicationCases:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Edificios residenciales", "Estructuras comerciales"]
 *         limitations:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Solo para suelos cohesivos", "Máximo 5 pisos"]
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         usageCount:
 *           type: integer
 *           description: Número de veces que se ha usado
 *         averageRating:
 *           type: number
 *           format: float
 *           description: Calificación promedio
 *         isFavorite:
 *           type: boolean
 *           description: Si está marcada como favorita
 *         isNew:
 *           type: boolean
 *           description: Si es nueva (últimos 30 días)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         lastModified:
 *           type: string
 *           format: date-time
 *
 *     UserTemplateStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         active:
 *           type: integer
 *         draft:
 *           type: integer
 *         archived:
 *           type: integer
 *         favorites:
 *           type: integer
 *         public:
 *           type: integer
 *         private:
 *           type: integer
 *         byCategory:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         byDifficulty:
 *           type: object
 *           properties:
 *             basic:
 *               type: integer
 *             intermediate:
 *               type: integer
 *             advanced:
 *               type: integer
 *         recentActivity:
 *           type: object
 *           properties:
 *             createdThisWeek:
 *               type: integer
 *             updatedThisWeek:
 *               type: integer
 *             usedThisWeek:
 *               type: integer
 *
 *     TemplateFormData:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - category
 *         - targetProfessions
 *         - parameters
 *         - formula
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 255
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 2000
 *         longDescription:
 *           type: string
 *           maxLength: 5000
 *         category:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         subcategory:
 *           type: string
 *           maxLength: 50
 *         targetProfessions:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *         difficulty:
 *           type: string
 *           enum: [basic, intermediate, advanced]
 *           default: basic
 *         estimatedTime:
 *           type: string
 *           maxLength: 50
 *         necReference:
 *           type: string
 *           maxLength: 255
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 50
 *         parameters:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserTemplateParameter'
 *           minItems: 1
 *         formula:
 *           type: string
 *           minLength: 1
 *           maxLength: 50000
 *         isPublic:
 *           type: boolean
 *           default: false
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 255
 *         applicationCases:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 255
 *         limitations:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 255
 */

// === ENDPOINTS ===

/**
 * @swagger
 * /user-templates:
 *   get:
 *     tags:
 *       - UserTemplates
 *     summary: Listar plantillas personales del usuario
 *     description: Obtiene todas las plantillas personales del usuario con filtros y paginación
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt, usageCount, averageRating]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *       - in: query
 *         name: status
 *         schema:
 *           oneOf:
 *             - type: string
 *               enum: [draft, active, archived]
 *             - type: array
 *               items:
 *                 type: string
 *                 enum: [draft, active, archived]
 *       - in: query
 *         name: categories
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           oneOf:
 *             - type: string
 *               enum: [basic, intermediate, advanced]
 *             - type: array
 *               items:
 *                 type: string
 *                 enum: [basic, intermediate, advanced]
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *           maxLength: 100
 *       - in: query
 *         name: isFavorite
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de plantillas obtenida exitosamente
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
 *                         $ref: '#/components/schemas/UserCalculationTemplate'
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
 *                     stats:
 *                       $ref: '#/components/schemas/UserTemplateStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   post:
 *     tags:
 *       - UserTemplates
 *     summary: Crear nueva plantilla personal
 *     description: Crea una nueva plantilla personal desde cero
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TemplateFormData'
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
 *                   $ref: '#/components/schemas/UserCalculationTemplate'
 *                 message:
 *                   type: string
 *                   example: "Plantilla creada exitosamente"
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /user-templates/{id}:
 *   get:
 *     tags:
 *       - UserTemplates
 *     summary: Obtener plantilla específica
 *     description: Obtiene una plantilla personal específica del usuario
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
 *                   $ref: '#/components/schemas/UserCalculationTemplate'
 *       404:
 *         description: Plantilla no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   put:
 *     tags:
 *       - UserTemplates
 *     summary: Actualizar plantilla
 *     description: Actualiza una plantilla personal existente
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TemplateFormData'
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
 *                   $ref: '#/components/schemas/UserCalculationTemplate'
 *                 message:
 *                   type: string
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Plantilla no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 *   delete:
 *     tags:
 *       - UserTemplates
 *     summary: Eliminar plantilla
 *     description: Elimina una plantilla personal
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
 *       404:
 *         description: Plantilla no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /user-templates/duplicate/{officialId}:
 *   post:
 *     tags:
 *       - UserTemplates
 *     summary: Duplicar plantilla oficial
 *     description: Crea una copia personal de una plantilla oficial
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: officialId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la plantilla oficial a duplicar
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customName:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 description: Nombre personalizado (opcional)
 *               customDescription:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 description: Descripción personalizada (opcional)
 *     responses:
 *       201:
 *         description: Plantilla duplicada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserCalculationTemplate'
 *                 message:
 *                   type: string
 *       404:
 *         description: Plantilla oficial no encontrada
 *       403:
 *         description: Plantilla no disponible para duplicar
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /user-templates/from-result:
 *   post:
 *     tags:
 *       - UserTemplates
 *     summary: Crear plantilla desde resultado
 *     description: Crea una plantilla personal a partir de un resultado de cálculo
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
 *               - calculationResultId
 *               - name
 *               - category
 *               - targetProfessions
 *             properties:
 *               calculationResultId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               targetProfessions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *     responses:
 *       201:
 *         description: Plantilla creada desde resultado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserCalculationTemplate'
 *                 message:
 *                   type: string
 *       404:
 *         description: Resultado de cálculo no encontrado
 *       403:
 *         description: Sin permisos para usar este resultado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /user-templates/{id}/status:
 *   put:
 *     tags:
 *       - UserTemplates
 *     summary: Cambiar estado de plantilla
 *     description: Cambia el estado de una plantilla (draft/active/archived)
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
 *                 enum: [draft, active, archived]
 *     responses:
 *       200:
 *         description: Estado cambiado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserCalculationTemplate'
 *                 message:
 *                   type: string
 *       400:
 *         description: Transición de estado inválida
 *       404:
 *         description: Plantilla no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /user-templates/{id}/share:
 *   post:
 *     tags:
 *       - UserTemplates
 *     summary: Compartir plantilla
 *     description: Comparte una plantilla con otros usuarios
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 50
 *               message:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Plantilla compartida exitosamente
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
 *       400:
 *         description: Usuarios inválidos
 *       404:
 *         description: Plantilla no encontrada
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /user-templates/public:
 *   get:
 *     tags:
 *       - UserTemplates
 *     summary: Obtener plantillas públicas
 *     description: Lista plantillas públicas de otros usuarios
 *     parameters:
 *       - in: query
 *         name: excludeUserId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Excluir plantillas de este usuario
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *           maxLength: 100
 *     responses:
 *       200:
 *         description: Plantillas públicas obtenidas exitosamente
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
 *                         $ref: '#/components/schemas/UserCalculationTemplate'
 *                     total:
 *                       type: integer
 */

/**
 * @swagger
 * /user-templates/stats:
 *   get:
 *     tags:
 *       - UserTemplates
 *     summary: Obtener estadísticas
 *     description: Obtiene estadísticas de plantillas del usuario
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserTemplateStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
