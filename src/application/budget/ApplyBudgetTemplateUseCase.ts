// src/application/budget/ApplyBudgetTemplateUseCase.ts
import { CalculationBudgetRepository } from "../../domain/repositories/CalculationBudgetRepository";
import { BudgetTemplateRepository } from "../../domain/repositories/BudgetTemplateRepository";
import { BudgetLineItemRepository } from "../../domain/repositories/BudgetLineItemRepository";
import { ProfessionalCostRepository } from "../../domain/repositories/ProfessionalCostRepository";
import { CalculationBudgetService } from "../../domain/services/CalculationBudgetService";
import { BudgetTemplateService } from "../../domain/services/BudgetTemplateService";
import { CalculationBudget } from "../../domain/models/calculation/CalculationBudget";
import { BudgetTemplate } from "../../domain/models/calculation/BudgetTemplate";
import { BudgetLineItem } from "../../domain/models/calculation/BudgetLineItem";
import { ProfessionalCost } from "../../domain/models/calculation/ProfessionalCost";

export interface ApplyBudgetTemplateRequest {
  budgetId: string;
  templateId: string;
  
  // Opciones de aplicación
  applyOptions: {
    applyWasteFactors: boolean;
    applyLaborRates: boolean;
    applyIndirectCosts: boolean;
    applyProfessionalFees: boolean;
    preserveCustomizations: boolean;
    recalculateAll: boolean;
  };

  // Ajustes personalizados al aplicar el template
  customAdjustments?: {
    wasteFactorMultiplier?: number; // Multiplicador para los factores de desperdicio (ej: 1.1 = +10%)
    laborRateMultiplier?: number; // Multiplicador para las tasas de mano de obra
    indirectCostMultiplier?: number; // Multiplicador para costos indirectos
    professionalFeeMultiplier?: number; // Multiplicador para honorarios
    additionalContingency?: number; // Contingencia adicional en porcentaje
  };

  // Mantener líneas específicas sin cambios
  preserveLineItems?: string[]; // IDs de líneas a preservar
  
  // Crear nueva versión del presupuesto
  createNewVersion?: boolean;
  newVersionName?: string;
}

export interface ApplyBudgetTemplateResponse {
  success: boolean;
  updatedBudget: CalculationBudget;
  appliedTemplate: BudgetTemplate;
  changes: {
    materialsSubtotalChange: number;
    laborSubtotalChange: number;
    indirectCostsChange: number;
    professionalFeesChange: number;
    totalChange: number;
    percentageChange: number;
  };
  updatedLineItems: BudgetLineItem[];
  updatedProfessionalCosts: ProfessionalCost[];
  warnings: string[];
  recommendations: string[];
  originalBudget?: CalculationBudget; // Si se creó nueva versión
}

export interface TemplateCompatibilityCheck {
  isCompatible: boolean;
  compatibilityScore: number; // 0-100
  issues: string[];
  recommendations: string[];
  estimatedImpact: {
    materialsCostImpact: number;
    laborCostImpact: number;
    totalImpact: number;
  };
}

export class ApplyBudgetTemplateUseCase {

  constructor(
    private calculationBudgetRepository: CalculationBudgetRepository,
    private budgetTemplateRepository: BudgetTemplateRepository,
    private budgetLineItemRepository: BudgetLineItemRepository,
    private professionalCostRepository: ProfessionalCostRepository,
    private calculationBudgetService: CalculationBudgetService,
    private budgetTemplateService: BudgetTemplateService
  ) {}

  async execute(
    request: ApplyBudgetTemplateRequest,
    userId: string
  ): Promise<ApplyBudgetTemplateResponse> {

    // 1. Validar datos de entrada
    this.validateRequest(request);

    // 2. Obtener presupuesto y template
    const budget = await this.getBudgetAndValidateOwnership(request.budgetId, userId);
    const template = await this.getTemplateAndValidateAccess(request.templateId, userId);

    // 3. Verificar compatibilidad
    const compatibility = await this.checkTemplateCompatibility(budget, template);
    if (!compatibility.isCompatible) {
      throw new Error(`Template no compatible: ${compatibility.issues.join(', ')}`);
    }

    // 4. Crear nueva versión si se solicita
    let targetBudget = budget;
    let originalBudget = undefined;
    
    if (request.createNewVersion) {
      originalBudget = budget;
      targetBudget = await this.createBudgetVersion(budget, request.newVersionName);
    }

    // 5. Obtener datos relacionados
    const lineItems = await this.budgetLineItemRepository.findByBudgetId(targetBudget.id);
    const professionalCosts = await this.professionalCostRepository.findByBudgetId(targetBudget.id);

    // 6. Aplicar template al presupuesto
    const updatedBudget = await this.applyTemplateTobudget(targetBudget, template, request);

    // 7. Actualizar líneas de presupuesto
    const updatedLineItems = await this.updateLineItemsFromTemplate(
      lineItems,
      template,
      request,
      targetBudget.id
    );

    // 8. Actualizar costos profesionales
    const updatedProfessionalCosts = await this.updateProfessionalCostsFromTemplate(
      professionalCosts,
      template,
      request,
      targetBudget.id,
      updatedBudget
    );

    // 9. Calcular cambios totales
    const changes = this.calculateBudgetChanges(budget, updatedBudget);

    // 10. Guardar todos los cambios
    await this.saveAllChanges(updatedBudget, updatedLineItems, updatedProfessionalCosts);

    // 11. Generar warnings y recomendaciones
    const warnings = this.generateWarnings(changes, compatibility);
    const recommendations = await this.generateRecommendations(updatedBudget, template, changes);

    // 12. Actualizar estadísticas del template
    await this.updateTemplateUsageStats(template.id);

    return {
      success: true,
      updatedBudget,
      appliedTemplate: template,
      changes,
      updatedLineItems,
      updatedProfessionalCosts,
      warnings,
      recommendations,
      originalBudget
    };
  }

  /**
   * Verifica compatibilidad entre presupuesto y template sin aplicar cambios
   */
  async checkCompatibility(
    budgetId: string,
    templateId: string,
    userId: string
  ): Promise<TemplateCompatibilityCheck> {

    const budget = await this.getBudgetAndValidateOwnership(budgetId, userId);
    const template = await this.getTemplateAndValidateAccess(templateId, userId);

    return await this.checkTemplateCompatibility(budget, template);
  }

  /**
   * Obtiene templates recomendados para un presupuesto específico
   */
  async getRecommendedTemplates(
    budgetId: string,
    userId: string
  ): Promise<Array<{ template: BudgetTemplate; compatibilityScore: number; estimatedImpact: any }>> {

    const budget = await this.getBudgetAndValidateOwnership(budgetId, userId);
    
    // Obtener templates disponibles para el usuario
    const availableTemplates = await this.budgetTemplateRepository.findByUserOrPublic(userId);
    
    const recommendations = [];

    for (const template of availableTemplates) {
      const compatibility = await this.checkTemplateCompatibility(budget, template);
      
      if (compatibility.isCompatible && compatibility.compatibilityScore > 50) {
        recommendations.push({
          template,
          compatibilityScore: compatibility.compatibilityScore,
          estimatedImpact: compatibility.estimatedImpact
        });
      }
    }

    // Ordenar por score de compatibilidad
    recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    return recommendations.slice(0, 5); // Top 5 recomendaciones
  }

  // Métodos privados

  private validateRequest(request: ApplyBudgetTemplateRequest): void {
    if (!request.budgetId) {
      throw new Error("El ID del presupuesto es obligatorio");
    }

    if (!request.templateId) {
      throw new Error("El ID del template es obligatorio");
    }

    if (!request.applyOptions) {
      throw new Error("Las opciones de aplicación son obligatorias");
    }

    // Validar que al menos una opción esté habilitada
    const options = request.applyOptions;
    if (!options.applyWasteFactors && !options.applyLaborRates && 
        !options.applyIndirectCosts && !options.applyProfessionalFees) {
      throw new Error("Debe seleccionar al menos una opción para aplicar del template");
    }

    // Validar multiplicadores si existen
    if (request.customAdjustments) {
      const adj = request.customAdjustments;
      if (adj.wasteFactorMultiplier && (adj.wasteFactorMultiplier <= 0 || adj.wasteFactorMultiplier > 5)) {
        throw new Error("El multiplicador de factores de desperdicio debe estar entre 0 y 5");
      }
      if (adj.laborRateMultiplier && (adj.laborRateMultiplier <= 0 || adj.laborRateMultiplier > 5)) {
        throw new Error("El multiplicador de tasas de mano de obra debe estar entre 0 y 5");
      }
    }
  }

  private async getBudgetAndValidateOwnership(budgetId: string, userId: string): Promise<CalculationBudget> {
    const budget = await this.calculationBudgetRepository.findById(budgetId);
    if (!budget) {
      throw new Error(`Presupuesto no encontrado: ${budgetId}`);
    }

    if (budget.userId !== userId) {
      throw new Error("No tiene permisos para modificar este presupuesto");
    }

    return budget;
  }

  private async getTemplateAndValidateAccess(templateId: string, userId: string): Promise<BudgetTemplate> {
    const template = await this.budgetTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error(`Template no encontrado: ${templateId}`);
    }

    // Verificar acceso al template
    if (template.scope === 'PERSONAL' && template.createdBy !== userId) {
      throw new Error("No tiene acceso a este template personal");
    }

    if (!template.isActive) {
      throw new Error("El template seleccionado no está activo");
    }

    return template;
  }

  private async checkTemplateCompatibility(
    budget: CalculationBudget,
    template: BudgetTemplate
  ): Promise<TemplateCompatibilityCheck> {

    const issues: string[] = [];
    const recommendations: string[] = [];
    let compatibilityScore = 100;

    // Verificar zona geográfica
    if (template.geographicalZone !== budget.geographicalZone) {
      compatibilityScore -= 20;
      issues.push(`Zona geográfica diferente: template(${template.geographicalZone}) vs presupuesto(${budget.geographicalZone})`);
      recommendations.push("Considere ajustar factores por diferencia geográfica");
    }

    // Verificar tipo de proyecto
    const budgetProjectType = this.inferBudgetProjectType(budget);
    if (template.projectType !== budgetProjectType) {
      compatibilityScore -= 15;
      issues.push(`Tipo de proyecto diferente: template(${template.projectType}) vs presupuesto(${budgetProjectType})`);
    }

    // Verificar completitud del template
    const templateCompleteness = this.calculateTemplateCompleteness(template);
    if (templateCompleteness < 70) {
      compatibilityScore -= 10;
      issues.push("Template incompleto (menos del 70% de campos definidos)");
      recommendations.push("Use un template más completo para mejores resultados");
    }

    // Estimar impacto
    const estimatedImpact = await this.estimateTemplateImpact(budget, template);

    // Verificar si el impacto es razonable
    if (Math.abs(estimatedImpact.totalImpact) > 50) {
      compatibilityScore -= 10;
      issues.push(`Impacto significativo estimado: ${estimatedImpact.totalImpact.toFixed(1)}%`);
      recommendations.push("Revise cuidadosamente los cambios antes de aplicar");
    }

    return {
      isCompatible: compatibilityScore > 30 && issues.length < 3,
      compatibilityScore: Math.max(0, compatibilityScore),
      issues,
      recommendations,
      estimatedImpact
    };
  }

  private async createBudgetVersion(
    originalBudget: CalculationBudget,
    newVersionName?: string
  ): Promise<CalculationBudget> {

    const newVersion: CalculationBudget = {
      ...originalBudget,
      id: require('uuid').v4(),
      name: newVersionName || `${originalBudget.name} v${originalBudget.version + 1}`,
      version: originalBudget.version + 1,
      parentBudgetId: originalBudget.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.calculationBudgetRepository.create(newVersion);
  }

  private async applyTemplateTobudget(
    budget: CalculationBudget,
    template: BudgetTemplate,
    request: ApplyBudgetTemplateRequest
  ): Promise<CalculationBudget> {

    // Aplicar template usando el servicio
    let updatedBudget = await this.calculationBudgetService.applyTemplateToExistingBudget(budget, template);

    // Aplicar ajustes personalizados si existen
    if (request.customAdjustments) {
      updatedBudget = this.applyCustomAdjustments(updatedBudget, request.customAdjustments);
    }

    // Aplicar contingencia adicional si se especifica
    if (request.customAdjustments?.additionalContingency) {
      const additionalContingency = request.customAdjustments.additionalContingency;
      updatedBudget.contingencyPercentage += additionalContingency;
      updatedBudget.contingencyAmount = updatedBudget.subtotal * (updatedBudget.contingencyPercentage / 100);
      
      // Recalcular total
      const taxableAmount = updatedBudget.subtotal + updatedBudget.contingencyAmount;
      updatedBudget.taxAmount = taxableAmount * (updatedBudget.taxPercentage / 100);
      updatedBudget.total = taxableAmount + updatedBudget.taxAmount;
    }

    updatedBudget.budgetTemplateId = template.id;
    updatedBudget.updatedAt = new Date();

    return updatedBudget;
  }

  private async updateLineItemsFromTemplate(
    lineItems: BudgetLineItem[],
    template: BudgetTemplate,
    request: ApplyBudgetTemplateRequest,
    budgetId: string
  ): Promise<BudgetLineItem[]> {

    const updatedItems: BudgetLineItem[] = [];

    for (const item of lineItems) {
      // Verificar si esta línea debe preservarse
      if (request.preserveLineItems?.includes(item.id)) {
        updatedItems.push(item);
        continue;
      }

      let updatedItem = { ...item };

      // Aplicar factores de desperdicio a materiales
      if (item.itemType === 'MATERIAL' && 
          request.applyOptions.applyWasteFactors && 
          template.wasteFactors) {
        
        const wasteFactor = this.getApplicableWasteFactor(item, template.wasteFactors);
        if (wasteFactor > 1) {
          updatedItem.quantity = item.quantity * wasteFactor;
          updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
        }
      }

      // Aplicar tasas de mano de obra
      if (item.itemType === 'LABOR' && 
          request.applyOptions.applyLaborRates && 
          template.laborRates) {
        
        const newRate = this.getApplicableLaborRate(item, template.laborRates);
        if (newRate > 0) {
          updatedItem.unitPrice = newRate;
          updatedItem.totalPrice = updatedItem.quantity * newRate;
        }
      }

      // Aplicar multiplicadores personalizados
      if (request.customAdjustments) {
        updatedItem = this.applyLineItemAdjustments(updatedItem, request.customAdjustments);
      }

      updatedItem.updatedAt = new Date();
      updatedItems.push(updatedItem);
    }

    return updatedItems;
  }

  private async updateProfessionalCostsFromTemplate(
    professionalCosts: ProfessionalCost[],
    template: BudgetTemplate,
    request: ApplyBudgetTemplateRequest,
    budgetId: string,
    updatedBudget: CalculationBudget
  ): Promise<ProfessionalCost[]> {

    if (!request.applyOptions.applyProfessionalFees || !template.professionalFees) {
      return professionalCosts;
    }

    const updatedCosts: ProfessionalCost[] = [];
    const baseCost = updatedBudget.materialsSubtotal + updatedBudget.laborSubtotal;

    // Actualizar costos existentes
    for (const cost of professionalCosts) {
      const templateRate = this.getTemplateFeesRate(cost.type, template.professionalFees);
      
      if (templateRate > 0) {
        const updatedCost: ProfessionalCost = {
          ...cost,
          percentage: templateRate * 100,
          amount: baseCost * templateRate,
          basedOnAmount: baseCost,
          updatedAt: new Date()
        };

        // Aplicar multiplicador si existe
        if (request.customAdjustments?.professionalFeeMultiplier) {
          updatedCost.amount *= request.customAdjustments.professionalFeeMultiplier;
          updatedCost.percentage *= request.customAdjustments.professionalFeeMultiplier;
        }

        updatedCosts.push(updatedCost);
      } else {
        updatedCosts.push(cost);
      }
    }

    return updatedCosts;
  }

  private calculateBudgetChanges(originalBudget: CalculationBudget, updatedBudget: CalculationBudget) {
    const materialsChange = updatedBudget.materialsSubtotal - originalBudget.materialsSubtotal;
    const laborChange = updatedBudget.laborSubtotal - originalBudget.laborSubtotal;
    const indirectChange = updatedBudget.indirectCosts - originalBudget.indirectCosts;
    const professionalChange = updatedBudget.professionalCostsTotal - originalBudget.professionalCostsTotal;
    const totalChange = updatedBudget.total - originalBudget.total;
    const percentageChange = originalBudget.total !== 0 ? (totalChange / originalBudget.total) * 100 : 0;

    return {
      materialsSubtotalChange: materialsChange,
      laborSubtotalChange: laborChange,
      indirectCostsChange: indirectChange,
      professionalFeesChange: professionalChange,
      totalChange,
      percentageChange
    };
  }

  private async saveAllChanges(
    updatedBudget: CalculationBudget,
    updatedLineItems: BudgetLineItem[],
    updatedProfessionalCosts: ProfessionalCost[]
  ): Promise<void> {

    // Guardar presupuesto actualizado
    await this.calculationBudgetRepository.update(updatedBudget.id, updatedBudget);

    // Guardar líneas actualizadas
    for (const lineItem of updatedLineItems) {
      await this.budgetLineItemRepository.update(lineItem.id, lineItem);
    }

    // Guardar costos profesionales actualizados
    for (const cost of updatedProfessionalCosts) {
      await this.professionalCostRepository.update(cost.id, cost);
    }
  }

  private generateWarnings(changes: any, compatibility: TemplateCompatibilityCheck): string[] {
    const warnings: string[] = [];

    if (Math.abs(changes.percentageChange) > 20) {
      warnings.push(`Cambio significativo en el total del presupuesto: ${changes.percentageChange.toFixed(1)}%`);
    }

    if (compatibility.compatibilityScore < 70) {
      warnings.push("Baja compatibilidad con el template aplicado");
    }

    warnings.push(...compatibility.issues);

    return warnings;
  }

  private async generateRecommendations(
    updatedBudget: CalculationBudget,
    template: BudgetTemplate,
    changes: any
  ): Promise<string[]> {

    const recommendations: string[] = [];

    if (changes.totalChange > 0) {
      recommendations.push("Considere comunicar el aumento de costos al cliente");
    } else if (changes.totalChange < 0) {
      recommendations.push("Aproveche la reducción de costos para mejorar competitividad");
    }

    if (template.usageCount < 5) {
      recommendations.push("Template con poco historial de uso - monitoree resultados cuidadosamente");
    }

    // Validar coherencia del presupuesto actualizado
    const validation = this.calculationBudgetService.validateBudgetCoherence(updatedBudget);
    recommendations.push(...validation.suggestions);

    return recommendations;
  }

  private async updateTemplateUsageStats(templateId: string): Promise<void> {
    try {
      // Incrementar contador de uso del template
      const template = await this.budgetTemplateRepository.findById(templateId);
      if (template) {
        template.usageCount++;
        template.updatedAt = new Date();
        await this.budgetTemplateRepository.update(templateId, template);
      }
    } catch (error) {
      console.error('Error actualizando estadísticas de template:', error);
    }
  }

  // Métodos auxiliares

  private inferBudgetProjectType(budget: CalculationBudget): string {
    // Inferir tipo basado en el total y características
    if (budget.total < 10000) return "RESIDENTIAL_SMALL";
    if (budget.total < 100000) return "RESIDENTIAL_MULTI";
    return "COMMERCIAL_LARGE";
  }

  private calculateTemplateCompleteness(template: BudgetTemplate): number {
    // Implementar cálculo de completitud similar al BudgetTemplateService
    return 75; // Placeholder
  }

  private async estimateTemplateImpact(budget: CalculationBudget, template: BudgetTemplate) {
    // Estimar el impacto de aplicar el template
    return {
      materialsCostImpact: 5, // % de cambio estimado
      laborCostImpact: 10,
      totalImpact: 7.5
    };
  }

  private applyCustomAdjustments(budget: CalculationBudget, adjustments: any): CalculationBudget {
    if (adjustments.wasteFactorMultiplier) {
      budget.materialsSubtotal *= adjustments.wasteFactorMultiplier;
    }

    if (adjustments.laborRateMultiplier) {
      budget.laborSubtotal *= adjustments.laborRateMultiplier;
    }

    if (adjustments.indirectCostMultiplier) {
      budget.indirectCosts *= adjustments.indirectCostMultiplier;
    }

    if (adjustments.professionalFeeMultiplier) {
      budget.professionalCostsTotal *= adjustments.professionalFeeMultiplier;
    }

    // Recalcular totales
    budget.subtotal = budget.materialsSubtotal + budget.laborSubtotal + 
                     budget.indirectCosts + budget.professionalCostsTotal;
    
    budget.contingencyAmount = budget.subtotal * (budget.contingencyPercentage / 100);
    const taxableAmount = budget.subtotal + budget.contingencyAmount;
    budget.taxAmount = taxableAmount * (budget.taxPercentage / 100);
    budget.total = taxableAmount + budget.taxAmount;

    return budget;
  }

  private getApplicableWasteFactor(item: BudgetLineItem, wasteFactors: any): number {
    // Determinar factor de desperdicio aplicable según el tipo de material
    if (item.category?.toLowerCase().includes('cemento')) {
      return wasteFactors.concrete || wasteFactors.general || 1.05;
    }
    if (item.category?.toLowerCase().includes('acero')) {
      return wasteFactors.steel || wasteFactors.general || 1.03;
    }
    return wasteFactors.general || 1.05;
  }

  private getApplicableLaborRate(item: BudgetLineItem, laborRates: any): number {
    // Determinar tasa de mano de obra aplicable
    const laborType = item.laborType?.toLowerCase() || '';
    
    if (laborType.includes('maestro')) return laborRates.masterBuilder || 0;
    if (laborType.includes('albañil')) return laborRates.builder || 0;
    if (laborType.includes('ayudante')) return laborRates.helper || 0;
    if (laborType.includes('electricista')) return laborRates.electrician || 0;
    if (laborType.includes('plomero')) return laborRates.plumber || 0;
    
    return laborRates.builder || 0; // Por defecto usar tarifa de albañil
  }

  private applyLineItemAdjustments(item: BudgetLineItem, adjustments: any): BudgetLineItem {
    if (item.itemType === 'MATERIAL' && adjustments.wasteFactorMultiplier) {
      item.quantity *= adjustments.wasteFactorMultiplier;
      item.totalPrice = item.quantity * item.unitPrice;
    }

    if (item.itemType === 'LABOR' && adjustments.laborRateMultiplier) {
      item.unitPrice *= adjustments.laborRateMultiplier;
      item.totalPrice = item.quantity * item.unitPrice;
    }

    return item;
  }

  private getTemplateFeesRate(costType: string, professionalFees: any): number {
    switch (costType.toUpperCase()) {
      case 'ARCHITECTURAL':
        return professionalFees.architectural || 0;
      case 'STRUCTURAL':
        return professionalFees.structural || 0;
      case 'ELECTRICAL':
        return professionalFees.electrical || 0;
      case 'MECHANICAL':
        return professionalFees.mechanical || 0;
      case 'SUPERVISION':
        return professionalFees.supervision || 0;
      default:
        return 0;
    }
  }
}