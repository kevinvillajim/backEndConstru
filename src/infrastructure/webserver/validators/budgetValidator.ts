// src/infrastructure/webserver/validators/budgetValidator.ts
import { body, param, query, ValidationChain } from "express-validator";
import { BudgetType, CalculationBudgetStatus } from "../../../domain/models/calculation/CalculationBudget";
import { ProjectType, TemplateScope } from "../../../domain/models/calculation/BudgetTemplate";

export class BudgetValidator {

  /**
   * Validaciones para crear presupuesto de cálculo
   */
  static createCalculationBudget(): ValidationChain[] {
    return [
      body('name')
        .notEmpty()
        .withMessage('El nombre del presupuesto es obligatorio')
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres')
        .matches(/^[a-zA-Z0-9\s\-\_\.\(\)]+$/)
        .withMessage('El nombre contiene caracteres no válidos'),

      body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),

      body('projectId')
        .notEmpty()
        .withMessage('El ID del proyecto es obligatorio')
        .isUUID()
        .withMessage('El ID del proyecto debe ser un UUID válido'),

      body('budgetType')
        .notEmpty()
        .withMessage('El tipo de presupuesto es obligatorio')
        .isIn(Object.values(BudgetType))
        .withMessage(`El tipo de presupuesto debe ser uno de: ${Object.values(BudgetType).join(', ')}`),

      body('calculationResultId')
        .optional()
        .isUUID()
        .withMessage('El ID del resultado de cálculo debe ser un UUID válido'),

      body('budgetTemplateId')
        .optional()
        .isUUID()
        .withMessage('El ID del template debe ser un UUID válido'),

      body('includeLabor')
        .isBoolean()
        .withMessage('includeLabor debe ser un valor booleano'),

      body('includeProfessionalFees')
        .isBoolean()
        .withMessage('includeProfessionalFees debe ser un valor booleano'),

      body('includeIndirectCosts')
        .isBoolean()
        .withMessage('includeIndirectCosts debe ser un valor booleano'),

      body('contingencyPercentage')
        .isFloat({ min: 0, max: 50 })
        .withMessage('El porcentaje de contingencia debe estar entre 0% y 50%'),

      body('taxPercentage')
        .isFloat({ min: 0, max: 30 })
        .withMessage('El porcentaje de impuestos debe estar entre 0% y 30%'),

      body('geographicalZone')
        .notEmpty()
        .withMessage('La zona geográfica es obligatoria')
        .isIn(['QUITO', 'GUAYAQUIL', 'CUENCA', 'COSTA', 'SIERRA', 'ORIENTE', 'INSULAR'])
        .withMessage('Zona geográfica no válida'),

      body('currency')
        .notEmpty()
        .withMessage('La moneda es obligatoria')
        .isIn(['USD', 'EUR'])
        .withMessage('Moneda no soportada'),

      body('exchangeRate')
        .isFloat({ min: 0.01 })
        .withMessage('La tasa de cambio debe ser mayor a 0'),

      // Validar materiales personalizados si existen
      body('customMaterials')
        .optional()
        .isArray()
        .withMessage('customMaterials debe ser un array'),

      body('customMaterials.*.materialId')
        .if(body('customMaterials').exists())
        .isUUID()
        .withMessage('El ID del material debe ser un UUID válido'),

      body('customMaterials.*.quantity')
        .if(body('customMaterials').exists())
        .isFloat({ min: 0.01 })
        .withMessage('La cantidad debe ser mayor a 0'),

      body('customMaterials.*.unitPrice')
        .if(body('customMaterials').exists())
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El precio unitario debe ser mayor o igual a 0'),

      // Validar costos de mano de obra personalizados
      body('customLaborCosts')
        .optional()
        .isArray()
        .withMessage('customLaborCosts debe ser un array'),

      body('customLaborCosts.*.type')
        .if(body('customLaborCosts').exists())
        .notEmpty()
        .withMessage('El tipo de mano de obra es obligatorio'),

      body('customLaborCosts.*.quantity')
        .if(body('customLaborCosts').exists())
        .isFloat({ min: 0.01 })
        .withMessage('La cantidad debe ser mayor a 0'),

      body('customLaborCosts.*.rate')
        .if(body('customLaborCosts').exists())
        .isFloat({ min: 0.01 })
        .withMessage('La tarifa debe ser mayor a 0')
    ];
  }

  /**
   * Validaciones para actualizar presupuesto
   */
  static updateCalculationBudget(): ValidationChain[] {
    return [
      param('budgetId')
        .isUUID()
        .withMessage('El ID del presupuesto debe ser un UUID válido'),

      body('name')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

      body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),

      body('status')
        .optional()
        .isIn(Object.values(CalculationBudgetStatus))
        .withMessage(`El estado debe ser uno de: ${Object.values(CalculationBudgetStatus).join(', ')}`),

      body('contingencyPercentage')
        .optional()
        .isFloat({ min: 0, max: 50 })
        .withMessage('El porcentaje de contingencia debe estar entre 0% y 50%'),

      body('taxPercentage')
        .optional()
        .isFloat({ min: 0, max: 30 })
        .withMessage('El porcentaje de impuestos debe estar entre 0% y 30%')
    ];
  }

  /**
   * Validaciones para actualizar precios
   */
  static updateBudgetPricing(): ValidationChain[] {
    return [
      param('budgetId')
        .isUUID()
        .withMessage('El ID del presupuesto debe ser un UUID válido'),

      body('updateSource')
        .notEmpty()
        .withMessage('La fuente de actualización es obligatoria')
        .isIn(['IPCO', 'SUPPLIER', 'MANUAL', 'ALL'])
        .withMessage('Fuente de actualización no válida'),

      body('forceUpdate')
        .optional()
        .isBoolean()
        .withMessage('forceUpdate debe ser un valor booleano'),

      body('specificMaterials')
        .optional()
        .isArray()
        .withMessage('specificMaterials debe ser un array'),

      body('specificMaterials.*')
        .if(body('specificMaterials').exists())
        .isUUID()
        .withMessage('Los IDs de materiales deben ser UUIDs válidos'),

      body('priceAdjustments')
        .optional()
        .isArray()
        .withMessage('priceAdjustments debe ser un array'),

      body('priceAdjustments.*.materialId')
        .if(body('priceAdjustments').exists())
        .isUUID()
        .withMessage('El ID del material debe ser un UUID válido'),

      body('priceAdjustments.*.newPrice')
        .if(body('priceAdjustments').exists())
        .isFloat({ min: 0 })
        .withMessage('El nuevo precio debe ser mayor o igual a 0'),

      body('notifyUser')
        .optional()
        .isBoolean()
        .withMessage('notifyUser debe ser un valor booleano'),

      body('recalculateTotals')
        .optional()
        .isBoolean()
        .withMessage('recalculateTotals debe ser un valor booleano')
    ];
  }

  /**
   * Validaciones para generar documento profesional
   */
  static generateProfessionalDocument(): ValidationChain[] {
    return [
      param('budgetId')
        .isUUID()
        .withMessage('El ID del presupuesto debe ser un UUID válido'),

      body('format')
        .notEmpty()
        .withMessage('El formato es obligatorio')
        .isIn(['PDF', 'EXCEL', 'WORD', 'ALL'])
        .withMessage('Formato no válido'),

      // Validar información del cliente
      body('clientInfo.name')
        .notEmpty()
        .withMessage('El nombre del cliente es obligatorio')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre del cliente debe tener entre 2 y 100 caracteres'),

      body('clientInfo.email')
        .optional()
        .isEmail()
        .withMessage('El email del cliente no es válido'),

      body('clientInfo.phone')
        .optional()
        .matches(/^[+]?[\d\s\-\(\)]{7,15}$/)
        .withMessage('El teléfono del cliente no es válido'),

      // Validar información de marca
      body('branding.companyName')
        .optional()
        .isLength({ max: 100 })
        .withMessage('El nombre de la empresa no puede exceder 100 caracteres'),

      body('branding.professionalName')
        .optional()
        .isLength({ max: 100 })
        .withMessage('El nombre del profesional no puede exceder 100 caracteres'),

      body('branding.contactInfo.email')
        .optional()
        .isEmail()
        .withMessage('El email de contacto no es válido'),

      body('branding.contactInfo.phone')
        .optional()
        .matches(/^[+]?[\d\s\-\(\)]{7,15}$/)
        .withMessage('El teléfono de contacto no es válido'),

      // Validar configuración del documento
      body('documentSettings.language')
        .optional()
        .isIn(['es', 'en'])
        .withMessage('Idioma no soportado'),

      body('documentSettings.currency')
        .optional()
        .isIn(['USD', 'EUR'])
        .withMessage('Moneda no soportada'),

      body('documentSettings.validityDays')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Los días de validez deben estar entre 1 y 365'),

      // Validar configuración de entrega
      body('delivery.recipientEmails')
        .if(body('delivery.sendByEmail').equals("true"))
        .isArray({ min: 1 })
        .withMessage('Se requiere al menos un email de destino'),

      body('delivery.recipientEmails.*')
        .if(body('delivery.sendByEmail').equals("true"))
        .isEmail()
        .withMessage('Todos los emails de destino deben ser válidos')
    ];
  }

  /**
   * Validaciones para crear template de presupuesto
   */
  static createBudgetTemplate(): ValidationChain[] {
    return [
      body('name')
        .notEmpty()
        .withMessage('El nombre del template es obligatorio')
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

      body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),

      body('projectType')
        .notEmpty()
        .withMessage('El tipo de proyecto es obligatorio')
        .isIn(Object.values(ProjectType))
        .withMessage(`El tipo de proyecto debe ser uno de: ${Object.values(ProjectType).join(', ')}`),

      body('scope')
        .notEmpty()
        .withMessage('El alcance del template es obligatorio')
        .isIn(Object.values(TemplateScope))
        .withMessage(`El alcance debe ser uno de: ${Object.values(TemplateScope).join(', ')}`),

      body('geographicalZone')
        .notEmpty()
        .withMessage('La zona geográfica es obligatoria')
        .isIn(['QUITO', 'GUAYAQUIL', 'CUENCA', 'COSTA', 'SIERRA', 'ORIENTE', 'INSULAR'])
        .withMessage('Zona geográfica no válida'),

      // Validar factores de desperdicio
      body('wasteFactors.general')
        .optional()
        .isFloat({ min: 1.0, max: 3.0 })
        .withMessage('El factor de desperdicio general debe estar entre 1.0 y 3.0'),

      body('wasteFactors.concrete')
        .optional()
        .isFloat({ min: 1.0, max: 2.0 })
        .withMessage('El factor de desperdicio de concreto debe estar entre 1.0 y 2.0'),

      body('wasteFactors.steel')
        .optional()
        .isFloat({ min: 1.0, max: 2.0 })
        .withMessage('El factor de desperdicio de acero debe estar entre 1.0 y 2.0'),

      // Validar tasas de mano de obra
      body('laborRates.masterBuilder')
        .optional()
        .isFloat({ min: 10, max: 200 })
        .withMessage('La tasa del maestro constructor debe estar entre $10 y $200'),

      body('laborRates.builder')
        .optional()
        .isFloat({ min: 8, max: 150 })
        .withMessage('La tasa del albañil debe estar entre $8 y $150'),

      body('laborRates.helper')
        .optional()
        .isFloat({ min: 5, max: 100 })
        .withMessage('La tasa del ayudante debe estar entre $5 y $100'),

      // Validar costos indirectos (como porcentajes)
      body('indirectCosts.administration')
        .optional()
        .isFloat({ min: 0, max: 0.5 })
        .withMessage('Los costos de administración deben estar entre 0% y 50%'),

      body('indirectCosts.utilities')
        .optional()
        .isFloat({ min: 0, max: 0.2 })
        .withMessage('Los costos de servicios deben estar entre 0% y 20%'),

      // Validar honorarios profesionales (como porcentajes)
      body('professionalFees.architectural')
        .optional()
        .isFloat({ min: 0, max: 0.25 })
        .withMessage('Los honorarios arquitectónicos deben estar entre 0% y 25%'),

      body('professionalFees.structural')
        .optional()
        .isFloat({ min: 0, max: 0.15 })
        .withMessage('Los honorarios estructurales deben estar entre 0% y 15%')
    ];
  }

  /**
   * Validaciones para aplicar template a presupuesto
   */
  static applyBudgetTemplate(): ValidationChain[] {
    return [
      param('budgetId')
        .isUUID()
        .withMessage('El ID del presupuesto debe ser un UUID válido'),

      param('templateId')
        .isUUID()
        .withMessage('El ID del template debe ser un UUID válido'),

      body('applyOptions')
        .notEmpty()
        .withMessage('Las opciones de aplicación son obligatorias'),

      body('applyOptions.applyWasteFactors')
        .isBoolean()
        .withMessage('applyWasteFactors debe ser un valor booleano'),

      body('applyOptions.applyLaborRates')
        .isBoolean()
        .withMessage('applyLaborRates debe ser un valor booleano'),

      body('applyOptions.applyIndirectCosts')
        .isBoolean()
        .withMessage('applyIndirectCosts debe ser un valor booleano'),

      body('applyOptions.applyProfessionalFees')
        .isBoolean()
        .withMessage('applyProfessionalFees debe ser un valor booleano'),

      body('applyOptions.preserveCustomizations')
        .isBoolean()
        .withMessage('preserveCustomizations debe ser un valor booleano'),

      body('applyOptions.recalculateAll')
        .isBoolean()
        .withMessage('recalculateAll debe ser un valor booleano'),

      // Validar ajustes personalizados si existen
      body('customAdjustments.wasteFactorMultiplier')
        .optional()
        .isFloat({ min: 0.1, max: 5.0 })
        .withMessage('El multiplicador de factores de desperdicio debe estar entre 0.1 y 5.0'),

      body('customAdjustments.laborRateMultiplier')
        .optional()
        .isFloat({ min: 0.1, max: 5.0 })
        .withMessage('El multiplicador de tasas de mano de obra debe estar entre 0.1 y 5.0'),

      body('customAdjustments.additionalContingency')
        .optional()
        .isFloat({ min: 0, max: 20 })
        .withMessage('La contingencia adicional debe estar entre 0% y 20%'),

      body('preserveLineItems')
        .optional()
        .isArray()
        .withMessage('preserveLineItems debe ser un array'),

      body('preserveLineItems.*')
        .if(body('preserveLineItems').exists())
        .isUUID()
        .withMessage('Los IDs de líneas a preservar deben ser UUIDs válidos'),

      body('createNewVersion')
        .optional()
        .isBoolean()
        .withMessage('createNewVersion debe ser un valor booleano'),

      body('newVersionName')
        .if(body('createNewVersion').equals("true"))
        .notEmpty()
        .withMessage('El nombre de la nueva versión es obligatorio cuando se crea una nueva versión')
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre de la versión debe tener entre 3 y 100 caracteres')
    ];
  }

  /**
   * Validaciones para parámetros de consulta generales
   */
  static queryParams(): ValidationChain[] {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero mayor a 0'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100'),

      query('sortBy')
        .optional()
        .isIn(['name', 'createdAt', 'updatedAt', 'total', 'status'])
        .withMessage('Campo de ordenamiento no válido'),

      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('El orden debe ser "asc" o "desc"'),

      query('projectType')
        .optional()
        .isIn(Object.values(ProjectType))
        .withMessage('Tipo de proyecto no válido'),

      query('geographicalZone')
        .optional()
        .isIn(['QUITO', 'GUAYAQUIL', 'CUENCA', 'COSTA', 'SIERRA', 'ORIENTE', 'INSULAR'])
        .withMessage('Zona geográfica no válida'),

      query('status')
        .optional()
        .isIn(Object.values(CalculationBudgetStatus))
        .withMessage('Estado no válido'),

      query('budgetType')
        .optional()
        .isIn(Object.values(BudgetType))
        .withMessage('Tipo de presupuesto no válido')
    ];
  }

  /**
   * Validaciones para IDs en parámetros de ruta
   */
  static validateId(paramName: string): ValidationChain {
    return param(paramName)
      .isUUID()
      .withMessage(`El ${paramName} debe ser un UUID válido`);
  }

  /**
   * Validaciones para actualizar estado del presupuesto
   */
  static updateBudgetStatus(): ValidationChain[] {
    return [
      param('budgetId')
        .isUUID()
        .withMessage('El ID del presupuesto debe ser un UUID válido'),

      body('status')
        .notEmpty()
        .withMessage('El estado es obligatorio')
        .isIn(Object.values(CalculationBudgetStatus))
        .withMessage(`El estado debe ser uno de: ${Object.values(CalculationBudgetStatus).join(', ')}`),

      body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Las notas no pueden exceder 1000 caracteres')
    ];
  }

  /**
   * Validaciones para clonar presupuesto
   */
  static cloneBudget(): ValidationChain[] {
    return [
      param('budgetId')
        .isUUID()
        .withMessage('El ID del presupuesto debe ser un UUID válido'),

      body('name')
        .notEmpty()
        .withMessage('El nombre para el presupuesto clonado es obligatorio')
        .isLength({ min: 3, max: 100 })
        .withMessage('El nombre debe tener entre 3 y 100 caracteres'),

      body('projectId')
        .optional()
        .isUUID()
        .withMessage('El ID del proyecto debe ser un UUID válido')
    ];
  }

  /**
   * Validaciones personalizadas para reglas de negocio
   */
  static customValidations = {
    /**
     * Valida que al menos una opción de aplicación esté seleccionada
     */
    atLeastOneApplyOption: (req: any, res: any, next: any) => {
      const { applyOptions } = req.body;
      
      if (applyOptions) {
        const hasAtLeastOne = applyOptions.applyWasteFactors || 
                             applyOptions.applyLaborRates || 
                             applyOptions.applyIndirectCosts || 
                             applyOptions.applyProfessionalFees;
        
        if (!hasAtLeastOne) {
          return res.status(400).json({
            success: false,
            message: "Debe seleccionar al menos una opción para aplicar del template"
          });
        }
      }
      
      next();
    },

    /**
     * Valida que los materiales personalizados tengan fuente de datos
     */
    validateDataSource: (req: any, res: any, next: any) => {
      const { calculationResultId, customMaterials } = req.body;
      
      if (!calculationResultId && (!customMaterials || customMaterials.length === 0)) {
        return res.status(400).json({
          success: false,
          message: "Debe especificar un resultado de cálculo o materiales personalizados"
        });
      }
      
      next();
    },

    /**
     * Valida coherencia de porcentajes
     */
    validatePercentages: (req: any, res: any, next: any) => {
      const { contingencyPercentage, taxPercentage } = req.body;
      
      if (contingencyPercentage !== undefined && taxPercentage !== undefined) {
        const total = contingencyPercentage + taxPercentage;
        if (total > 60) {
          return res.status(400).json({
            success: false,
            message: "La suma de contingencia e impuestos no puede exceder 60%"
          });
        }
      }
      
      next();
    }
  };
}