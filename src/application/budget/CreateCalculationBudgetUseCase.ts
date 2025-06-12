// src/application/budget/CreateCalculationBudgetUseCase.ts
import { CalculationBudgetRepository } from "../../domain/repositories/CalculationBudgetRepository";
import { BudgetTemplateRepository } from "../../domain/repositories/BudgetTemplateRepository";
import { CalculationResultRepository } from "../../domain/repositories/CalculationResultRepository";
import { BudgetLineItemRepository } from "../../domain/repositories/BudgetLineItemRepository";
import { ProfessionalCostRepository } from "../../domain/repositories/ProfessionalCostRepository";
import { MaterialRepository } from "../../domain/repositories/MaterialRepository";
import { CalculationBudgetService, BudgetGenerationOptions } from "../../domain/services/CalculationBudgetService";
import { BudgetTemplateService } from "../../domain/services/BudgetTemplateService";
import { CalculationBudget, BudgetType, CalculationBudgetStatus } from "../../domain/models/calculation/CalculationBudget";
import { BudgetLineItem, LineItemType, LineItemSource } from "../../domain/models/calculation/BudgetLineItem";
import { ProfessionalCost, ProfessionalService, ComplexityLevel } from "../../domain/models/calculation/ProfessionalCost";
import { v4 as uuidv4 } from "uuid";

export interface CreateCalculationBudgetRequest {
  // Datos básicos del presupuesto
  name: string;
  description?: string;
  projectId: string;
  budgetType: BudgetType;
  
  // Fuente de los datos
  calculationResultId?: string;
  budgetTemplateId?: string;
  
  // Opciones de generación
  includeLabor: boolean;
  includeProfessionalFees: boolean;
  includeIndirectCosts: boolean;
  contingencyPercentage: number;
  taxPercentage: number;
  
  // Configuración regional
  geographicalZone: string;
  currency: string;
  exchangeRate: number;
  
  // Personalización
  customization?: any;
  exportSettings?: any;
  
  // Materiales personalizados (si no viene de cálculo)
  customMaterials?: Array<{
    materialId: string;
    quantity: number;
    unitPrice?: number;
    description?: string;
  }>;
  
  // Costos de mano de obra personalizados
  customLaborCosts?: Array<{
    type: string;
    description: string;
    quantity: number;
    rate: number;
    unit: string;
  }>;
}

export interface CreateCalculationBudgetResponse {
  budget: CalculationBudget;
  lineItems: BudgetLineItem[];
  professionalCosts: ProfessionalCost[];
  validationWarnings: string[];
  recommendations: string[];
}

export class CreateCalculationBudgetUseCase {
  
  constructor(
    private calculationBudgetRepository: CalculationBudgetRepository,
    private budgetTemplateRepository: BudgetTemplateRepository,
    private calculationResultRepository: CalculationResultRepository,
    private budgetLineItemRepository: BudgetLineItemRepository,
    private professionalCostRepository: ProfessionalCostRepository,
    private materialRepository: MaterialRepository,
    private calculationBudgetService: CalculationBudgetService,
    private budgetTemplateService: BudgetTemplateService
  ) {}

  async execute(
    request: CreateCalculationBudgetRequest,
    userId: string
  ): Promise<CreateCalculationBudgetResponse> {

    // 1. Validar datos de entrada
    this.validateRequest(request);

    // 2. Obtener template si se especifica
    let template = null;
    if (request.budgetTemplateId) {
      template = await this.budgetTemplateRepository.findById(request.budgetTemplateId);
      if (!template) {
        throw new Error(`Template de presupuesto no encontrado: ${request.budgetTemplateId}`);
      }
    }

    // 3. Obtener resultado de cálculo si se especifica
    let calculationResult = null;
    if (request.calculationResultId) {
      calculationResult = await this.calculationResultRepository.findById(request.calculationResultId);
      if (!calculationResult) {
        throw new Error(`Resultado de cálculo no encontrado: ${request.calculationResultId}`);
      }
    }

    // 4. Configurar opciones de generación
    const options: BudgetGenerationOptions = {
      budgetType: request.budgetType,
      includeLabor: request.includeLabor,
      includeProfessionalFees: request.includeProfessionalFees,
      includeIndirectCosts: request.includeIndirectCosts,
      contingencyPercentage: request.contingencyPercentage,
      taxPercentage: request.taxPercentage,
      geographicalZone: request.geographicalZone,
      currency: request.currency,
      exchangeRate: request.exchangeRate,
      customization: request.customization
    };

    // 5. Generar presupuesto base
    let budget: CalculationBudget;
    
    if (calculationResult) {
      // Generar desde resultado de cálculo
      budget = await this.calculationBudgetService.generateFromCalculationResult(
        calculationResult,
        template,
        options,
        userId,
        request.projectId
      );
    } else {
      // Crear presupuesto manual
      budget = await this.createManualBudget(request, template, options, userId);
    }

    // 6. Aplicar nombre y descripción personalizados
    budget.name = request.name;
    if (request.description) {
      budget.description = request.description;
    }

    // 7. Configurar configuraciones de exportación
    if (request.exportSettings) {
      budget.exportSettings = request.exportSettings;
    }

    // 8. Guardar presupuesto en base de datos
    const savedBudget = await this.calculationBudgetRepository.create(budget);

    // 9. Crear líneas de presupuesto detalladas
    const lineItems = await this.createBudgetLineItems(savedBudget, calculationResult, request);

    // 10. Crear costos profesionales detallados
    const professionalCosts = await this.createProfessionalCosts(savedBudget, template, options);

    // 11. Validar coherencia del presupuesto creado
    const validation = this.calculationBudgetService.validateBudgetCoherence(savedBudget);
    
    // 12. Generar recomendaciones
    const recommendations = await this.generateRecommendations(savedBudget, template, validation);

    // 13. Actualizar estadísticas del template si se usó
    if (template) {
      await this.updateTemplateUsageStats(template.id);
    }

    return {
      budget: savedBudget,
      lineItems,
      professionalCosts,
      validationWarnings: validation.warnings,
      recommendations
    };
  }

  private validateRequest(request: CreateCalculationBudgetRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error("El nombre del presupuesto es obligatorio");
    }

    if (!request.projectId) {
      throw new Error("El ID del proyecto es obligatorio");
    }

    if (!request.budgetType) {
      throw new Error("El tipo de presupuesto es obligatorio");
    }

    if (!request.geographicalZone) {
      throw new Error("La zona geográfica es obligatoria");
    }

    if (request.contingencyPercentage < 0 || request.contingencyPercentage > 50) {
      throw new Error("El porcentaje de contingencia debe estar entre 0% y 50%");
    }

    if (request.taxPercentage < 0 || request.taxPercentage > 30) {
      throw new Error("El porcentaje de impuestos debe estar entre 0% y 30%");
    }

    if (request.exchangeRate <= 0) {
      throw new Error("La tasa de cambio debe ser mayor a 0");
    }

    // Validar que tenga al menos una fuente de datos
    if (!request.calculationResultId && (!request.customMaterials || request.customMaterials.length === 0)) {
      throw new Error("Debe especificar un resultado de cálculo o materiales personalizados");
    }
  }

  private async createManualBudget(
    request: CreateCalculationBudgetRequest,
    template: any,
    options: BudgetGenerationOptions,
    userId: string
  ): Promise<CalculationBudget> {

    const budgetId = uuidv4();
    const now = new Date();

    // Calcular subtotal de materiales desde materiales personalizados
    let materialsSubtotal = 0;
    if (request.customMaterials) {
      for (const customMaterial of request.customMaterials) {
        const material = await this.materialRepository.findById(customMaterial.materialId);
        // Usar propiedades correctas del modelo Material o valores por defecto
        const unitPrice = customMaterial.unitPrice || (material as any)?.price || (material as any)?.unitPrice || 0;
        materialsSubtotal += customMaterial.quantity * unitPrice;
      }
    }

    // Aplicar factores de template si existe
    if (template) {
      const wasteFactor = template.wasteFactors?.general || 1.05;
      materialsSubtotal *= wasteFactor;
    }

    // Calcular costos de mano de obra
    let laborSubtotal = 0;
    if (options.includeLabor && request.customLaborCosts) {
      laborSubtotal = request.customLaborCosts.reduce((sum, labor) => {
        return sum + (labor.quantity * labor.rate);
      }, 0);
    }

    // Calcular costos indirectos
    let indirectCosts = 0;
    if (options.includeIndirectCosts) {
      const baseCost = materialsSubtotal + laborSubtotal;
      indirectCosts = template?.indirectCosts ? 
        this.calculateIndirectFromTemplate(baseCost, template) : 
        baseCost * 0.15; // 15% estándar
    }

    // Calcular honorarios profesionales
    let professionalCostsTotal = 0;
    if (options.includeProfessionalFees) {
      const baseCost = materialsSubtotal + laborSubtotal;
      professionalCostsTotal = template?.professionalFees ? 
        this.calculateProfessionalFromTemplate(baseCost, template) : 
        baseCost * 0.12; // 12% estándar
    }

    // Calcular totales
    const subtotal = materialsSubtotal + laborSubtotal + indirectCosts + professionalCostsTotal;
    const contingencyAmount = subtotal * (options.contingencyPercentage / 100);
    const taxableAmount = subtotal + contingencyAmount;
    const taxAmount = taxableAmount * (options.taxPercentage / 100);
    const total = taxableAmount + taxAmount;

    const budget: CalculationBudget = {
      id: budgetId,
      name: request.name,
      description: request.description || "Presupuesto creado manualmente",
      status: CalculationBudgetStatus.DRAFT,
      budgetType: options.budgetType,
      version: 1,
      projectId: request.projectId,
      userId,
      budgetTemplateId: template?.id,
      materialsSubtotal,
      laborSubtotal,
      indirectCosts,
      contingencyPercentage: options.contingencyPercentage,
      contingencyAmount,
      subtotal,
      taxPercentage: options.taxPercentage,
      taxAmount,
      total,
      geographicalZone: options.geographicalZone,
      currency: options.currency,
      exchangeRate: options.exchangeRate,
      customization: options.customization,
      lastCalculatedAt: now,
      isTemplateBudget: false,
      professionalCostsTotal,
      createdAt: now,
      updatedAt: now
    };

    return budget;
  }

  private async createBudgetLineItems(
    budget: CalculationBudget,
    calculationResult: any,
    request: CreateCalculationBudgetRequest
  ): Promise<BudgetLineItem[]> {
    
    const lineItems: BudgetLineItem[] = [];

    // Crear líneas desde materiales personalizados
    if (request.customMaterials) {
      for (const customMaterial of request.customMaterials) {
        const material = await this.materialRepository.findById(customMaterial.materialId);
        // Usar propiedades correctas del modelo Material o valores por defecto
        const unitPrice = customMaterial.unitPrice || (material as any)?.price || (material as any)?.unitPrice || 0;
        const subtotal = customMaterial.quantity * unitPrice;
        
        const lineItemData: Omit<BudgetLineItem, 'id' | 'createdAt' | 'updatedAt'> = {
          description: customMaterial.description || material?.name || 'Material personalizado',
          itemType: LineItemType.MATERIAL,
          source: LineItemSource.MANUAL,
          calculationBudgetId: budget.id,
          materialId: customMaterial.materialId,
          quantity: customMaterial.quantity,
          unitOfMeasure: (material as any)?.unitOfMeasure || (material as any)?.unit || 'unidad',
          unitPrice: unitPrice,
          wastePercentage: 5, // 5% por defecto
          finalQuantity: customMaterial.quantity * 1.05, // Con desperdicio
          subtotal: subtotal,
          category: (material as any)?.categoryName || 'Materiales',
          regionalFactor: 1.0,
          difficultyFactor: 1.0,
          priceValidityDays: 30,
          displayOrder: lineItems.length + 1,
          isOptional: false,
          isAlternate: false,
          // Removed laborType as it is not part of the type definition
          specifications: undefined,
          sourceCalculationId: undefined,
          calculationParameterKey: undefined,
          subcategory: undefined,
          chapter: undefined,
          costCode: undefined,
          necReference: undefined,
          priceDate: undefined,
          priceSource: undefined,
          metadata: undefined
        };

        const savedLineItem = await this.budgetLineItemRepository.create(lineItemData);
        lineItems.push(savedLineItem);
      }
    }

    // Crear líneas desde mano de obra personalizada
    if (request.customLaborCosts) {
      for (const laborCost of request.customLaborCosts) {
        const subtotal = laborCost.quantity * laborCost.rate;
        
        const lineItemData: Omit<BudgetLineItem, 'id' | 'createdAt' | 'updatedAt'> = {
          description: laborCost.description,
          itemType: LineItemType.LABOR,
          source: LineItemSource.MANUAL,
          calculationBudgetId: budget.id,
          quantity: laborCost.quantity,
          unitOfMeasure: laborCost.unit,
          unitPrice: laborCost.rate,
          wastePercentage: 0, // Sin desperdicio para mano de obra
          finalQuantity: laborCost.quantity,
          subtotal: subtotal,
          category: 'Mano de Obra',
          regionalFactor: 1.0,
          difficultyFactor: 1.0,
          priceValidityDays: 30,
          displayOrder: lineItems.length + 1,
          isOptional: false,
          isAlternate: false,
          // Removed laborType as it is not part of the type definition
          specifications: undefined,
          materialId: undefined,
          sourceCalculationId: undefined,
          calculationParameterKey: undefined,
          subcategory: undefined,
          chapter: undefined,
          costCode: undefined,
          necReference: undefined,
          priceDate: undefined,
          priceSource: undefined,
          metadata: undefined
        };

        const savedLineItem = await this.budgetLineItemRepository.create(lineItemData);
        lineItems.push(savedLineItem);
      }
    }

    return lineItems;
  }

  private async createProfessionalCosts(
    budget: CalculationBudget,
    template: any,
    options: BudgetGenerationOptions
  ): Promise<ProfessionalCost[]> {
    
    const professionalCosts: ProfessionalCost[] = [];

    if (!options.includeProfessionalFees) {
      return professionalCosts;
    }

    const baseCost = budget.materialsSubtotal + budget.laborSubtotal;
    const fees = template?.professionalFees;

    // Honorarios arquitectónicos
    if (fees?.architectural || !template) {
      const rate = fees?.architectural || 0.06; // 6% por defecto
      const amount = baseCost * rate;
      
      const costData: Omit<ProfessionalCost, 'id' | 'createdAt' | 'updatedAt'> = {
        calculationBudgetId: budget.id,
        service: ProfessionalService.ARCHITECTURAL_DESIGN,
        description: 'Honorarios profesionales - Diseño arquitectónico',
        complexityLevel: ComplexityLevel.INTERMEDIATE,
        costType: 'ARCHITECTURAL',
        basePercentage: rate * 100,
        fixedAmount: 0,
        complexityMultiplier: 1.0,
        calculatedAmount: amount,
        amount: amount,
        percentage: rate * 100,
        basedOnAmount: baseCost,
        type: 'ARCHITECTURAL',
        ecuadorianRegulation: {
          collegeProfessional: 'Colegio de Arquitectos del Ecuador',
          minimumPercentage: 4,
          maximumPercentage: 8,
          regulationReference: 'CAE-REG-001'
        },
        includesTaxes: false,
        taxPercentage: 0,
        isApproved: false,
        hourlyRate: undefined,
        estimatedHours: undefined,
        professionalId: undefined,
        professionalName: undefined,
        professionalRegistration: undefined,
        professionalSpeciality: undefined,
        approvalDate: undefined
      };

      const savedCost = await this.professionalCostRepository.create(costData);
      professionalCosts.push(savedCost);
    }

    // Honorarios estructurales
    if (fees?.structural || !template) {
      const rate = fees?.structural || 0.03; // 3% por defecto
      const amount = baseCost * rate;
      
      const costData: Omit<ProfessionalCost, 'id' | 'createdAt' | 'updatedAt'> = {
        calculationBudgetId: budget.id,
        service: ProfessionalService.STRUCTURAL_DESIGN,
        description: 'Honorarios profesionales - Diseño estructural',
        complexityLevel: ComplexityLevel.INTERMEDIATE,
        costType: 'STRUCTURAL',
        basePercentage: rate * 100,
        fixedAmount: 0,
        complexityMultiplier: 1.0,
        calculatedAmount: amount,
        amount: amount,
        percentage: rate * 100,
        basedOnAmount: baseCost,
        type: 'STRUCTURAL',
        ecuadorianRegulation: {
          collegeProfessional: 'Colegio de Ingenieros Civiles del Ecuador',
          minimumPercentage: 2,
          maximumPercentage: 5,
          regulationReference: 'CICE-REG-002'
        },
        includesTaxes: false,
        taxPercentage: 0,
        isApproved: false,
        hourlyRate: undefined,
        estimatedHours: undefined,
        professionalId: undefined,
        professionalName: undefined,
        professionalRegistration: undefined,
        professionalSpeciality: undefined,
        approvalDate: undefined
      };

      const savedCost = await this.professionalCostRepository.create(costData);
      professionalCosts.push(savedCost);
    }

    // Supervisión de obra
    if (fees?.supervision || !template) {
      const rate = fees?.supervision || 0.03; // 3% por defecto
      const amount = baseCost * rate;
      
      const costData: Omit<ProfessionalCost, 'id' | 'createdAt' | 'updatedAt'> = {
        calculationBudgetId: budget.id,
        service: ProfessionalService.CONSTRUCTION_SUPERVISION,
        description: 'Honorarios profesionales - Supervisión de obra',
        complexityLevel: ComplexityLevel.INTERMEDIATE,
        costType: 'SUPERVISION',
        basePercentage: rate * 100,
        fixedAmount: 0,
        complexityMultiplier: 1.0,
        calculatedAmount: amount,
        amount: amount,
        percentage: rate * 100,
        basedOnAmount: baseCost,
        type: 'SUPERVISION',
        ecuadorianRegulation: {
          collegeProfessional: 'Colegio de Arquitectos del Ecuador',
          minimumPercentage: 2,
          maximumPercentage: 5,
          regulationReference: 'CAE-REG-003'
        },
        includesTaxes: false,
        taxPercentage: 0,
        isApproved: false,
        hourlyRate: undefined,
        estimatedHours: undefined,
        professionalId: undefined,
        professionalName: undefined,
        professionalRegistration: undefined,
        professionalSpeciality: undefined,
        approvalDate: undefined
      };

      const savedCost = await this.professionalCostRepository.create(costData);
      professionalCosts.push(savedCost);
    }

    return professionalCosts;
  }

  private async generateRecommendations(
    budget: CalculationBudget,
    template: any,
    validation: any
  ): Promise<string[]> {
    
    const recommendations: string[] = [];

    // Recomendaciones basadas en validación
    recommendations.push(...validation.suggestions);

    // Recomendaciones basadas en tipo de proyecto
    if (budget.budgetType === BudgetType.MATERIALS_ONLY) {
      recommendations.push("Considere incluir costos de mano de obra para un presupuesto más completo");
    }

    // Recomendaciones basadas en zona geográfica
    if (budget.geographicalZone === 'ORIENTE' || budget.geographicalZone === 'INSULAR') {
      recommendations.push("Considere costos adicionales de transporte para esta zona geográfica");
    }

    // Recomendaciones sobre contingencia
    if (budget.contingencyPercentage < 5) {
      recommendations.push("Considere aumentar el porcentaje de contingencia (recomendado: 5-15%)");
    }

    // Recomendaciones sobre template
    if (!template) {
      const templateRecommendations = await this.budgetTemplateService.recommendTemplates(
        budget.budgetType as any, // Asumir que son compatibles
        budget.geographicalZone
      );
      
      if (templateRecommendations.length > 0) {
        recommendations.push(`Considere usar el template "${templateRecommendations[0].templateName}" para mayor precisión`);
      }
    }

    return recommendations;
  }

  private async updateTemplateUsageStats(templateId: string): Promise<void> {
    try {
      // Implementar actualización de estadísticas de uso del template
      // Por ahora solo un placeholder
      console.log(`Actualizando estadísticas de uso para template: ${templateId}`);
    } catch (error) {
      console.error('Error actualizando estadísticas de template:', error);
      // No lanzar error, es solo estadística
    }
  }

  private calculateIndirectFromTemplate(baseCost: number, template: any): number {
    const indirect = template.indirectCosts;
    let rate = 0;
    
    rate += (indirect.administration || 0.08);
    rate += (indirect.utilities || 0.03);
    rate += (indirect.tools || 0.02);
    rate += (indirect.safety || 0.015);
    rate += (indirect.permits || 0.005);
    
    return baseCost * rate;
  }

  private calculateProfessionalFromTemplate(baseCost: number, template: any): number {
    const fees = template.professionalFees;
    let rate = 0;
    
    rate += (fees.architectural || 0.06);
    rate += (fees.structural || 0.03);
    rate += (fees.electrical || 0.015);
    rate += (fees.mechanical || 0.015);
    
    return baseCost * rate;
  }
}