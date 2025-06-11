// src/infrastructure/webserver/docs/routes/budgetRoutes.documented.ts

/**
 * @swagger
 * components:
 *   schemas:
 *     BudgetTemplate:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - projectType
 *         - scope
 *         - geographicalZone
 *         - createdBy
 *         - isActive
 *         - isVerified
 *         - usageCount
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del template
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Nombre del template
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Descripción del template
 *         projectType:
 *           type: string
 *           enum: [RESIDENTIAL_SINGLE, RESIDENTIAL_MULTI, COMMERCIAL_SMALL, COMMERCIAL_LARGE, INDUSTRIAL, INFRASTRUCTURE, RENOVATION, SPECIALIZED]
 *           description: Tipo de proyecto
 *         scope:
 *           type: string
 *           enum: [SYSTEM, COMPANY, PERSONAL, SHARED]
 *           description: Alcance del template
 *         geographicalZone:
 *           type: string
 *           enum: [QUITO, GUAYAQUIL, CUENCA, COSTA, SIERRA, ORIENTE, INSULAR]
 *           description: Zona geográfica de Ecuador
 *         wasteFactors:
 *           type: object
 *           description: Factores de desperdicio por tipo de material
 *           properties:
 *             general:
 *               type: number
 *               minimum: 1.0
 *               maximum: 3.0
 *               description: Factor de desperdicio general
 *             concrete:
 *               type: number
 *               minimum: 1.0
 *               maximum: 2.0
 *               description: Factor de desperdicio para concreto
 *             steel:
 *               type: number
 *               minimum: 1.0
 *               maximum: 2.0
 *               description: Factor de desperdicio para acero
 *             ceramics:
 *               type: number
 *               description: Factor de desperdicio para cerámicos
 *             electrical:
 *               type: number
 *               description: Factor de desperdicio para instalaciones eléctricas
 *             plumbing:
 *               type: number
 *               description: Factor de desperdicio para plomería
 *         laborRates:
 *           type: object
 *           description: Tasas de mano de obra por especialidad (USD/día)
 *           properties:
 *             masterBuilder:
 *               type: number
 *               minimum: 10
 *               maximum: 200
 *               description: Tasa del maestro constructor
 *             builder:
 *               type: number
 *               minimum: 8
 *               maximum: 150
 *               description: Tasa del albañil
 *             helper:
 *               type: number
 *               minimum: 5
 *               maximum: 100
 *               description: Tasa del ayudante
 *             electrician:
 *               type: number
 *               description: Tasa del electricista
 *             plumber:
 *               type: number
 *               description: Tasa del plomero
 *             painter:
 *               type: number
 *               description: Tasa del pintor
 *             carpenter:
 *               type: number
 *               description: Tasa del carpintero
 *         laborProductivity:
 *           type: object
 *           description: Productividad de mano de obra (unidades/día)
 *           properties:
 *             concretePouring:
 *               type: number
 *               description: m³ de concreto por día
 *             wallConstruction:
 *               type: number
 *               description: m² de pared por día
 *             tileInstallation:
 *               type: number
 *               description: m² de cerámica por día
 *             paintingInterior:
 *               type: number
 *               description: m² de pintura interior por día
 *             paintingExterior:
 *               type: number
 *               description: m² de pintura exterior por día
 *         indirectCosts:
 *           type: object
 *           description: Costos indirectos como porcentajes (0.0-1.0)
 *           properties:
 *             administration:
 *               type: number
 *               minimum: 0
 *               maximum: 0.5
 *               description: Costos de administración
 *             utilities:
 *               type: number
 *               minimum: 0
 *               maximum: 0.2
 *               description: Servicios básicos
 *             tools:
 *               type: number
 *               description: Herramientas y equipos
 *             safety:
 *               type: number
 *               description: Seguridad industrial
 *             permits:
 *               type: number
 *               description: Permisos y licencias
 *         professionalFees:
 *           type: object
 *           description: Honorarios profesionales como porcentajes (0.0-1.0)
 *           properties:
 *             architectural:
 *               type: number
 *               minimum: 0
 *               maximum: 0.25
 *               description: Honorarios arquitectónicos
 *             structural:
 *               type: number
 *               minimum: 0
 *               maximum: 0.15
 *               description: Honorarios estructurales
 *             electrical:
 *               type: number
 *               description: Honorarios de instalaciones eléctricas
 *             mechanical:
 *               type: number
 *               description: Honorarios de instalaciones mecánicas
 *             supervision:
 *               type: number
 *               description: Supervisión de obra
 *             consultation:
 *               type: number
 *               description: Consultoría especializada
 *         necCompliance:
 *           type: object
 *           description: Cumplimiento de Norma Ecuatoriana de Construcción
 *           properties:
 *             seismicZone:
 *               type: string
 *               description: Zona sísmica según NEC
 *             soilType:
 *               type: string
 *               description: Tipo de suelo
 *             windZone:
 *               type: string
 *               description: Zona de vientos
 *             requiredFactors:
 *               type: object
 *               description: Factores requeridos por NEC
 *         createdBy:
 *           type: string
 *           format: uuid
 *           description: ID del usuario creador
 *         isActive:
 *           type: boolean
 *           description: Si el template está activo
 *         isVerified:
 *           type: boolean
 *           description: Si el template está verificado por expertos
 *         usageCount:
 *           type: integer
 *           minimum: 0
 *           description: Número de veces que se ha usado el template
 *         averageRating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           description: Calificación promedio del template
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *
 *     CalculationBudget:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - status
 *         - budgetType
 *         - version
 *         - projectId
 *         - userId
 *         - materialsSubtotal
 *         - laborSubtotal
 *         - indirectCosts
 *         - contingencyPercentage
 *         - contingencyAmount
 *         - subtotal
 *         - taxPercentage
 *         - taxAmount
 *         - total
 *         - geographicalZone
 *         - currency
 *         - exchangeRate
 *         - professionalCostsTotal
 *         - isTemplateBudget
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del presupuesto
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Nombre del presupuesto
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Descripción del presupuesto
 *         status:
 *           type: string
 *           enum: [draft, review, approved, revised, final, archived]
 *           description: Estado del presupuesto
 *         budgetType:
 *           type: string
 *           enum: [materials_only, complete_project, labor_materials, professional_estimate]
 *           description: Tipo de presupuesto
 *         version:
 *           type: integer
 *           minimum: 1
 *           description: Versión del presupuesto
 *         parentBudgetId:
 *           type: string
 *           format: uuid
 *           description: ID del presupuesto padre (para versiones)
 *         projectId:
 *           type: string
 *           format: uuid
 *           description: ID del proyecto
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID del usuario propietario
 *         calculationResultId:
 *           type: string
 *           format: uuid
 *           description: ID del resultado de cálculo origen
 *         budgetTemplateId:
 *           type: string
 *           format: uuid
 *           description: ID del template aplicado
 *         materialsSubtotal:
 *           type: number
 *           minimum: 0
 *           description: Subtotal de materiales
 *         laborSubtotal:
 *           type: number
 *           minimum: 0
 *           description: Subtotal de mano de obra
 *         indirectCosts:
 *           type: number
 *           minimum: 0
 *           description: Costos indirectos
 *         contingencyPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 50
 *           description: Porcentaje de contingencia
 *         contingencyAmount:
 *           type: number
 *           minimum: 0
 *           description: Monto de contingencia
 *         subtotal:
 *           type: number
 *           minimum: 0
 *           description: Subtotal antes de impuestos
 *         taxPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 30
 *           description: Porcentaje de impuestos
 *         taxAmount:
 *           type: number
 *           minimum: 0
 *           description: Monto de impuestos
 *         total:
 *           type: number
 *           minimum: 0
 *           description: Total del presupuesto
 *         geographicalZone:
 *           type: string
 *           enum: [QUITO, GUAYAQUIL, CUENCA, COSTA, SIERRA, ORIENTE, INSULAR]
 *           description: Zona geográfica
 *         currency:
 *           type: string
 *           enum: [USD, EUR]
 *           description: Moneda
 *         exchangeRate:
 *           type: number
 *           minimum: 0.01
 *           description: Tasa de cambio
 *         professionalCostsTotal:
 *           type: number
 *           minimum: 0
 *           description: Total de honorarios profesionales
 *         isTemplateBudget:
 *           type: boolean
 *           description: Si es un presupuesto template
 *         customization:
 *           type: object
 *           description: Configuración de personalización
 *         exportSettings:
 *           type: object
 *           description: Configuración de exportación
 *         lastCalculatedAt:
 *           type: string
 *           format: date-time
 *           description: Última vez que se calculó
 *         approvedBy:
 *           type: string
 *           format: uuid
 *           description: Usuario que aprobó
 *         approvedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de aprobación
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *
 *     BudgetLineItem:
 *       type: object
 *       required:
 *         - id
 *         - budgetId
 *         - itemType
 *         - description
 *         - quantity
 *         - unit
 *         - unitPrice
 *         - totalPrice
 *         - category
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         budgetId:
 *           type: string
 *           format: uuid
 *         itemType:
 *           type: string
 *           enum: [MATERIAL, LABOR, EQUIPMENT, SERVICE]
 *         description:
 *           type: string
 *           description: Descripción del ítem
 *         materialId:
 *           type: string
 *           format: uuid
 *           description: ID del material (si aplica)
 *         quantity:
 *           type: number
 *           minimum: 0
 *         unit:
 *           type: string
 *           description: Unidad de medida
 *         unitPrice:
 *           type: number
 *           minimum: 0
 *         totalPrice:
 *           type: number
 *           minimum: 0
 *         category:
 *           type: string
 *           description: Categoría del ítem
 *         laborType:
 *           type: string
 *           description: Tipo de mano de obra (si aplica)
 *         notes:
 *           type: string
 *           description: Notas adicionales
 *         priceSource:
 *           type: string
 *           description: Fuente del precio
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ProfessionalCost:
 *       type: object
 *       required:
 *         - id
 *         - budgetId
 *         - type
 *         - description
 *         - amount
 *         - isPercentage
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         budgetId:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [ARCHITECTURAL, STRUCTURAL, ELECTRICAL, MECHANICAL, SUPERVISION, CONSULTATION]
 *         description:
 *           type: string
 *         percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Porcentaje (si es aplicable)
 *         amount:
 *           type: number
 *           minimum: 0
 *         basedOnAmount:
 *           type: number
 *           minimum: 0
 *           description: Monto base para el cálculo
 *         isPercentage:
 *           type: boolean
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     BudgetValidation:
 *       type: object
 *       properties:
 *         isValid:
 *           type: boolean
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *         suggestions:
 *           type: array
 *           items:
 *             type: string
 *         completeness:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *
 *     PriceComparison:
 *       type: object
 *       properties:
 *         materialId:
 *           type: string
 *           format: uuid
 *         materialName:
 *           type: string
 *         currentPrice:
 *           type: number
 *         availablePrices:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *               price:
 *                 type: number
 *               reliability:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               lastUpdated:
 *                 type: string
 *                 format: date-time
 *         recommendation:
 *           type: string
 *           enum: [KEEP_CURRENT, UPDATE_TO_LOWEST, UPDATE_TO_MOST_RELIABLE, NEEDS_REVIEW]
 *         estimatedSavings:
 *           type: number
 *
 *     TemplateRecommendation:
 *       type: object
 *       properties:
 *         templateId:
 *           type: string
 *           format: uuid
 *         templateName:
 *           type: string
 *         matchScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         matchReasons:
 *           type: array
 *           items:
 *             type: string
 *         projectType:
 *           type: string
 *         geographicalZone:
 *           type: string
 *
 *     DocumentGeneration:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         documentId:
 *           type: string
 *         generatedFiles:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *               filename:
 *                 type: string
 *               path:
 *                 type: string
 *               size:
 *                 type: integer
 *               downloadUrl:
 *                 type: string
 *         emailsSent:
 *           type: array
 *           items:
 *             type: string
 *             format: email
 *         validUntil:
 *           type: string
 *           format: date-time
 *         documentNumber:
 *           type: string
 *
 *     ApiResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *
 *     PaginatedResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ApiResponse'
 *         - type: object
 *           properties:
 *             data:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Token de acceso faltante o inválido
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiResponse'
 *           example:
 *             success: false
 *             message: "Token de acceso requerido"
 *
 *     ForbiddenError:
 *       description: Acceso denegado - permisos insuficientes
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiResponse'
 *           example:
 *             success: false
 *             message: "No tiene permisos para realizar esta acción"
 *
 *     NotFoundError:
 *       description: Recurso no encontrado
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiResponse'
 *           example:
 *             success: false
 *             message: "Recurso no encontrado"
 *
 *     ValidationError:
 *       description: Error de validación de datos
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   errors:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         field:
 *                           type: string
 *                         message:
 *                           type: string
 *           example:
 *             success: false
 *             message: "Errores de validación"
 *             errors:
 *               - field: "name"
 *                 message: "El nombre es obligatorio"
 *
 *     PlanLimitError:
 *       description: Límite del plan alcanzado
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ApiResponse'
 *               - type: object
 *                 properties:
 *                   planLimits:
 *                     type: object
 *                   currentUsage:
 *                     type: object
 *           example:
 *             success: false
 *             message: "Ha alcanzado el límite de presupuestos para su plan"
 *             planLimits:
 *               monthlyBudgets: 3
 *             currentUsage:
 *               budgetsThisMonth: 3
 */

/**
 * @swagger
 * tags:
 *   - name: Budget Templates
 *     description: Gestión de plantillas de presupuesto
 *   - name: Calculation Budgets
 *     description: Gestión de presupuestos de cálculo
 *   - name: Budget Pricing
 *     description: Gestión de precios en presupuestos
 *   - name: Budget Documents
 *     description: Generación de documentos profesionales
 */