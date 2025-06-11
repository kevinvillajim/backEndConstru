// tests/budget-module/budget-module.test.ts
// Pruebas básicas para verificar la funcionalidad del Budget Module

import { CalculationBudgetService } from "../../src/domain/services/CalculationBudgetService";
import { BudgetTemplateService } from "../../src/domain/services/BudgetTemplateService";
import { BudgetPricingService } from "../../src/domain/services/BudgetPricingService";
import { CreateCalculationBudgetUseCase } from "../../src/application/budget/CreateCalculationBudgetUseCase";
import { BudgetType, CalculationBudgetStatus } from "../../src/domain/models/calculation/CalculationBudget";
import { ProjectType, TemplateScope } from "../../src/domain/models/calculation/BudgetTemplate";

describe('Budget Module Tests', () => {

  describe('CalculationBudgetService', () => {
    let budgetService: CalculationBudgetService;

    beforeEach(() => {
      budgetService = new CalculationBudgetService();
    });

    test('should validate budget coherence correctly', () => {
      const budget = {
        id: 'test-budget-id',
        name: 'Test Budget',
        status: CalculationBudgetStatus.DRAFT,
        budgetType: BudgetType.COMPLETE_PROJECT,
        version: 1,
        projectId: 'test-project-id',
        userId: 'test-user-id',
        materialsSubtotal: 1000,
        laborSubtotal: 500,
        indirectCosts: 150,
        contingencyPercentage: 10,
        contingencyAmount: 165, // (1000+500+150) * 0.10
        subtotal: 1650,
        taxPercentage: 12,
        taxAmount: 198, // 1650 * 0.12
        total: 1848,
        geographicalZone: 'QUITO',
        currency: 'USD',
        exchangeRate: 1,
        professionalCostsTotal: 0,
        isTemplateBudget: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = budgetService.validateBudgetCoherence(budget);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect budget calculation errors', () => {
      const budget = {
        id: 'test-budget-id',
        name: 'Test Budget',
        status: CalculationBudgetStatus.DRAFT,
        budgetType: BudgetType.COMPLETE_PROJECT,
        version: 1,
        projectId: 'test-project-id',
        userId: 'test-user-id',
        materialsSubtotal: 1000,
        laborSubtotal: 500,
        indirectCosts: 150,
        contingencyPercentage: 10,
        contingencyAmount: 200, // INCORRECTO: debería ser 165
        subtotal: 1650,
        taxPercentage: 12,
        taxAmount: 198,
        total: 1848,
        geographicalZone: 'QUITO',
        currency: 'USD',
        exchangeRate: 1,
        professionalCostsTotal: 0,
        isTemplateBudget: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = budgetService.validateBudgetCoherence(budget);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('contingencia');
    });

    test('should calculate percentage changes correctly', () => {
      const originalBudget = {
        total: 1000,
        materialsSubtotal: 600,
        laborSubtotal: 300,
        indirectCosts: 100,
        professionalCostsTotal: 0
      };

      const updatedBudget = {
        total: 1100,
        materialsSubtotal: 650,
        laborSubtotal: 330,
        indirectCosts: 120,
        professionalCostsTotal: 0
      };

      const differences = budgetService.compareBudgetVersions(
        originalBudget as any,
        updatedBudget as any
      );

      expect(differences.totalChange.absolute).toBe(100);
      expect(differences.totalChange.percentage).toBe(10);
      expect(differences.materialsChange.absolute).toBe(50);
    });
  });

  describe('BudgetTemplateService', () => {
    let templateService: BudgetTemplateService;

    beforeEach(() => {
      templateService = new BudgetTemplateService();
    });

    test('should validate template correctly', () => {
      const validTemplate = {
        id: 'test-template-id',
        name: 'Test Template',
        description: 'A test template',
        projectType: ProjectType.RESIDENTIAL_SINGLE,
        scope: TemplateScope.PERSONAL,
        geographicalZone: 'QUITO',
        wasteFactors: {
          general: 1.05,
          concrete: 1.03
        },
        laborRates: {
          masterBuilder: 35,
          builder: 25
        },
        laborProductivity: {},
        indirectCosts: {
          administration: 0.08
        },
        professionalFees: {
          architectural: 0.06
        },
        createdBy: 'test-user-id',
        isActive: true,
        isVerified: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = templateService.validateTemplate(validTemplate);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.completeness).toBeGreaterThan(0);
    });

    test('should detect invalid template data', () => {
      const invalidTemplate = {
        id: 'test-template-id',
        name: '', // INVÁLIDO: nombre vacío
        description: 'Invalid template description', // Se agregó la descripción requerida
        projectType: ProjectType.RESIDENTIAL_SINGLE,
        scope: TemplateScope.PERSONAL,
        geographicalZone: 'QUITO',
        wasteFactors: {
          general: 0.5 // INVÁLIDO: menor a 1.0
        },
        laborRates: {
          masterBuilder: 500 // ADVERTENCIA: muy alto
        },
        laborProductivity: {},
        indirectCosts: {},
        professionalFees: {},
        createdBy: 'test-user-id',
        isActive: true,
        isVerified: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = templateService.validateTemplate(invalidTemplate);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('BudgetPricingService', () => {
    let pricingService: BudgetPricingService;

    beforeEach(() => {
      pricingService = new BudgetPricingService();
    });

    test('should apply geographical adjustments correctly', () => {
      const basePrice = 100;
      
      const quitoPrice = pricingService.applyGeographicalAdjustment(basePrice, 'QUITO');
      const costaPrice = pricingService.applyGeographicalAdjustment(basePrice, 'COSTA');
      const orientePrice = pricingService.applyGeographicalAdjustment(basePrice, 'ORIENTE');

      expect(quitoPrice).toBe(115); // 15% incremento
      expect(costaPrice).toBe(100); // Sin incremento (base)
      expect(orientePrice).toBe(125); // 25% incremento
    });

    test('should get geographical adjustments for all zones', () => {
      const adjustments = pricingService.getGeographicalAdjustments();

      expect(adjustments).toHaveLength(7); // 7 zonas de Ecuador
      expect(adjustments.find(adj => adj.zone === 'QUITO')?.factor).toBe(1.15);
      expect(adjustments.find(adj => adj.zone === 'COSTA')?.factor).toBe(1.0);
      expect(adjustments.find(adj => adj.zone === 'INSULAR')?.factor).toBe(1.40);
    });

    test('should handle unknown geographical zones', () => {
      const basePrice = 100;
      const unknownZonePrice = pricingService.applyGeographicalAdjustment(basePrice, 'UNKNOWN_ZONE');

      expect(unknownZonePrice).toBe(100); // Factor 1.0 por defecto
    });
  });

  describe('Integration Tests', () => {
    test('should create budget from calculation result', async () => {
      // Mock de dependencias
      const mockCalculationResult = {
        id: 'calc-result-id',
        templateName: 'Test Calculation',
        results: {
          area: 100,
          volume: 25,
          costo_materiales: 5000
        }
      };

      const mockTemplate = {
        id: 'template-id',
        name: 'Residential Template',
        description: 'Test Description',
        projectType: ProjectType.RESIDENTIAL_SINGLE,
        scope: TemplateScope.SYSTEM,
        geographicalZone: 'QUITO',
        wasteFactors: {
          general: 1.05
        },
        laborRates: {
          masterBuilder: 35,
          builder: 25
        },
        indirectCosts: {
          administration: 0.08
        },
        professionalFees: {
          architectural: 0.06
        },
        createdBy: 'system',
        isActive: true,
        isVerified: true,
        usageCount: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const budgetService = new CalculationBudgetService();
      
      const options = {
        budgetType: BudgetType.COMPLETE_PROJECT,
        includeLabor: true,
        includeProfessionalFees: true,
        includeIndirectCosts: true,
        contingencyPercentage: 10,
        taxPercentage: 12,
        geographicalZone: 'QUITO',
        currency: 'USD',
        exchangeRate: 1
      };

      const budget = await budgetService.generateFromCalculationResult(
        mockCalculationResult as any,
        mockTemplate as any,
        options,
        'user-id',
        'project-id'
      );

      expect(budget.id).toBeDefined();
      expect(budget.name).toContain('Test Calculation');
      expect(budget.materialsSubtotal).toBeGreaterThan(0);
      expect(budget.total).toBeGreaterThan(budget.subtotal);
      expect(budget.status).toBe(CalculationBudgetStatus.DRAFT);
    });

    test('should validate complete budget workflow', () => {
      // Simular flujo completo: crear presupuesto -> aplicar template -> validar -> aprobar
      const budgetService = new CalculationBudgetService();
      
      // 1. Crear presupuesto básico
      let budget = {
        id: 'workflow-budget',
        name: 'Workflow Test Budget',
        status: CalculationBudgetStatus.DRAFT,
        budgetType: BudgetType.COMPLETE_PROJECT,
        version: 1,
        projectId: 'project-id',
        userId: 'user-id',
        materialsSubtotal: 1000,
        laborSubtotal: 600,
        indirectCosts: 160,
        contingencyPercentage: 10,
        contingencyAmount: 176,
        subtotal: 1760,
        taxPercentage: 12,
        taxAmount: 211.2,
        total: 1971.2,
        geographicalZone: 'QUITO',
        currency: 'USD',
        exchangeRate: 1,
        professionalCostsTotal: 0,
        isTemplateBudget: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 2. Validar coherencia inicial
      let validation = budgetService.validateBudgetCoherence(budget);
      expect(validation.isValid).toBe(true);

      // 3. Simular cambio de estado
      budget.status = CalculationBudgetStatus.REVIEW;
      
      // 4. Simular aprobación
      budget.status = CalculationBudgetStatus.APPROVED;

      // 5. Validación final
      validation = budgetService.validateBudgetCoherence(budget);
      expect(validation.isValid).toBe(true);
      expect(budget.status).toBe(CalculationBudgetStatus.APPROVED);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle invalid calculation result gracefully', async () => {
      const budgetService = new CalculationBudgetService();
      
      const invalidCalculationResult = {
        id: 'invalid-calc',
        templateName: null,
        results: null
      };

      const options = {
        budgetType: BudgetType.MATERIALS_ONLY,
        includeLabor: false,
        includeProfessionalFees: false,
        includeIndirectCosts: false,
        contingencyPercentage: 0,
        taxPercentage: 0,
        geographicalZone: 'COSTA',
        currency: 'USD',
        exchangeRate: 1
      };

      const budget = await budgetService.generateFromCalculationResult(
        invalidCalculationResult as any,
        null,
        options,
        'user-id',
        'project-id'
      );

      expect(budget.materialsSubtotal).toBe(0);
      expect(budget.laborSubtotal).toBe(0);
      expect(budget.total).toBe(0);
    });

    test('should handle template validation errors', () => {
      const templateService = new BudgetTemplateService();
      
      const brokenTemplate = {
        id: 'broken-template',
        name: null, // Error: nombre nulo
        projectType: 'INVALID_TYPE', // Error: tipo inválido
        scope: TemplateScope.PERSONAL,
        geographicalZone: null, // Error: zona nula
        wasteFactors: {
          general: -1 // Error: factor negativo
        },
        createdBy: 'user-id',
        isActive: true,
        isVerified: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const validation = templateService.validateTemplate(brokenTemplate as any);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(3);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large budget calculations efficiently', () => {
      const startTime = performance.now();
      
      const budgetService = new CalculationBudgetService();
      
      // Simular presupuesto con muchos materiales
      const largeBudget = {
        id: 'large-budget',
        name: 'Large Budget Test',
        status: CalculationBudgetStatus.DRAFT,
        budgetType: BudgetType.COMPLETE_PROJECT,
        version: 1,
        projectId: 'project-id',
        userId: 'user-id',
        materialsSubtotal: 50000,
        laborSubtotal: 30000,
        indirectCosts: 8000,
        contingencyPercentage: 15,
        contingencyAmount: 13200,
        subtotal: 88000,
        taxPercentage: 12,
        taxAmount: 10560,
        total: 98560,
        geographicalZone: 'GUAYAQUIL',
        currency: 'USD',
        exchangeRate: 1,
        professionalCostsTotal: 0,
        isTemplateBudget: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Ejecutar múltiples validaciones
      for (let i = 0; i < 100; i++) {
        budgetService.validateBudgetCoherence(largeBudget);
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Debe completarse en menos de 1 segundo
      expect(executionTime).toBeLessThan(1000);
    });
  });
});

// Mock helpers para pruebas
export const mockBudgetData = {
  validBudget: {
    id: 'mock-budget-id',
    name: 'Mock Budget',
    status: CalculationBudgetStatus.DRAFT,
    budgetType: BudgetType.COMPLETE_PROJECT,
    version: 1,
    projectId: 'mock-project-id',
    userId: 'mock-user-id',
    materialsSubtotal: 1000,
    laborSubtotal: 500,
    indirectCosts: 150,
    contingencyPercentage: 10,
    contingencyAmount: 165,
    subtotal: 1650,
    taxPercentage: 12,
    taxAmount: 198,
    total: 1848,
    geographicalZone: 'QUITO',
    currency: 'USD',
    exchangeRate: 1,
    professionalCostsTotal: 0,
    isTemplateBudget: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  validTemplate: {
    id: 'mock-template-id',
    name: 'Mock Template',
    description: 'A mock template for testing',
    projectType: ProjectType.RESIDENTIAL_SINGLE,
    scope: TemplateScope.PERSONAL,
    geographicalZone: 'QUITO',
    wasteFactors: {
      general: 1.05,
      concrete: 1.03,
      steel: 1.02
    },
    laborRates: {
      masterBuilder: 35,
      builder: 25,
      helper: 18
    },
    laborProductivity: {
      concretePouring: 8,
      wallConstruction: 12
    },
    indirectCosts: {
      administration: 0.08,
      utilities: 0.03
    },
    professionalFees: {
      architectural: 0.06,
      structural: 0.03
    },
    createdBy: 'mock-user-id',
    isActive: true,
    isVerified: false,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// Utilidades para testing
export const testUtils = {
  generateRandomBudget: (overrides?: Partial<any>) => ({
    ...mockBudgetData.validBudget,
    id: `test-budget-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides
  }),

  generateRandomTemplate: (overrides?: Partial<any>) => ({
    ...mockBudgetData.validTemplate,
    id: `test-template-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides
  }),

  validateBudgetTotals: (budget: any) => {
    const calculatedSubtotal = budget.materialsSubtotal + budget.laborSubtotal + 
                              budget.indirectCosts + budget.professionalCostsTotal;
    const calculatedContingency = calculatedSubtotal * (budget.contingencyPercentage / 100);
    const calculatedTax = (calculatedSubtotal + calculatedContingency) * (budget.taxPercentage / 100);
    const calculatedTotal = calculatedSubtotal + calculatedContingency + calculatedTax;

    return {
      subtotalCorrect: Math.abs(calculatedSubtotal - budget.subtotal) < 0.01,
      contingencyCorrect: Math.abs(calculatedContingency - budget.contingencyAmount) < 0.01,
      taxCorrect: Math.abs(calculatedTax - budget.taxAmount) < 0.01,
      totalCorrect: Math.abs(calculatedTotal - budget.total) < 0.01
    };
  }
};