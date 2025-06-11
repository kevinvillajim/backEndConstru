// src/domain/services/CalculationBudgetService.ts
import { CalculationBudget, BudgetType, CalculationBudgetStatus, CreateCalculationBudgetDTO } from "../models/calculation/CalculationBudget";
import { CalculationResult } from "../models/calculation/CalculationResult";
import { BudgetTemplate } from "../models/calculation/BudgetTemplate";
import { BudgetLineItem } from "../models/calculation/BudgetLineItem";
import { ProfessionalCost } from "../models/calculation/ProfessionalCost";
import { Material } from "../models/material/Material";
import { GeographicalZone } from "../models/calculation/GeographicalZone";
import { v4 as uuidv4 } from "uuid";

export interface BudgetGenerationOptions {
  budgetType: BudgetType;
  includeLabor: boolean;
  includeProfessionalFees: boolean;
  includeIndirectCosts: boolean;
  contingencyPercentage: number;
  taxPercentage: number;
  geographicalZone: string;
  currency: string;
  exchangeRate: number;
  customization?: any;
}

export interface BudgetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class CalculationBudgetService {
  
  /**
   * Genera un presupuesto automáticamente desde un resultado de cálculo
   */
  async generateFromCalculationResult(
    calculationResult: CalculationResult,
    template: BudgetTemplate | null,
    options: BudgetGenerationOptions,
    userId: string,
    projectId: string
  ): Promise<CalculationBudget> {
    
    const budgetId = uuidv4();
    const now = new Date();

    // 1. Calcular subtotales de materiales desde el resultado
    const materialsSubtotal = this.calculateMaterialsSubtotal(calculationResult);

    // 2. Aplicar factores del template si existe
    const adjustedMaterialsSubtotal = template ? 
      this.applyTemplateFactors(materialsSubtotal, template) : 
      materialsSubtotal;

    // 3. Calcular costos de mano de obra
    const laborSubtotal = options.includeLabor ? 
      this.calculateLaborCosts(calculationResult, template, options.geographicalZone) : 
      0;

    // 4. Calcular costos indirectos
    const indirectCosts = options.includeIndirectCosts ? 
      this.calculateIndirectCosts(adjustedMaterialsSubtotal, laborSubtotal, template) : 
      0;

    // 5. Calcular honorarios profesionales
    const professionalCostsTotal = options.includeProfessionalFees ? 
      this.calculateProfessionalFees(adjustedMaterialsSubtotal, laborSubtotal, template) : 
      0;

    // 6. Calcular subtotal
    const subtotal = adjustedMaterialsSubtotal + laborSubtotal + indirectCosts + professionalCostsTotal;

    // 7. Calcular contingencia
    const contingencyAmount = subtotal * (options.contingencyPercentage / 100);

    // 8. Calcular impuestos
    const taxableAmount = subtotal + contingencyAmount;
    const taxAmount = taxableAmount * (options.taxPercentage / 100);

    // 9. Total final
    const total = taxableAmount + taxAmount;

    // 10. Crear el presupuesto
    const budget: CalculationBudget = {
      id: budgetId,
      name: `Presupuesto - ${calculationResult.templateName || 'Sin plantilla'}`,
      description: `Generado automáticamente desde cálculo: ${calculationResult.id}`,
      status: CalculationBudgetStatus.DRAFT,
      budgetType: options.budgetType,
      version: 1,
      projectId,
      userId,
      calculationResultId: calculationResult.id,
      budgetTemplateId: template?.id,
      materialsSubtotal: adjustedMaterialsSubtotal,
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

  /**
   * Aplica un template a un presupuesto existente
   */
  async applyTemplateToExistingBudget(
    budget: CalculationBudget,
    template: BudgetTemplate
  ): Promise<CalculationBudget> {
    
    // 1. Recalcular con factores del template
    const adjustedMaterialsSubtotal = this.applyTemplateFactors(budget.materialsSubtotal, template);

    // 2. Recalcular mano de obra con productividades del template
    const laborSubtotal = template.laborRates ? 
      this.calculateLaborFromTemplate(budget, template) : 
      budget.laborSubtotal;

    // 3. Recalcular costos indirectos
    const indirectCosts = template.indirectCosts ? 
      this.calculateIndirectFromTemplate(adjustedMaterialsSubtotal, laborSubtotal, template) : 
      budget.indirectCosts;

    // 4. Recalcular honorarios profesionales
    const professionalCostsTotal = template.professionalFees ? 
      this.calculateProfessionalFromTemplate(adjustedMaterialsSubtotal, laborSubtotal, template) : 
      budget.professionalCostsTotal;

    // 5. Recalcular totales
    const subtotal = adjustedMaterialsSubtotal + laborSubtotal + indirectCosts + professionalCostsTotal;
    const contingencyAmount = subtotal * (budget.contingencyPercentage / 100);
    const taxableAmount = subtotal + contingencyAmount;
    const taxAmount = taxableAmount * (budget.taxPercentage / 100);
    const total = taxableAmount + taxAmount;

    // 6. Actualizar presupuesto
    const updatedBudget: CalculationBudget = {
      ...budget,
      budgetTemplateId: template.id,
      materialsSubtotal: adjustedMaterialsSubtotal,
      laborSubtotal,
      indirectCosts,
      contingencyAmount,
      subtotal,
      taxAmount,
      total,
      professionalCostsTotal,
      lastCalculatedAt: new Date(),
      updatedAt: new Date()
    };

    return updatedBudget;
  }

  /**
   * Valida la coherencia de un presupuesto
   */
  validateBudgetCoherence(budget: CalculationBudget): BudgetValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validaciones básicas
    if (budget.materialsSubtotal < 0) {
      errors.push("El subtotal de materiales no puede ser negativo");
    }

    if (budget.laborSubtotal < 0) {
      errors.push("El subtotal de mano de obra no puede ser negativo");
    }

    if (budget.contingencyPercentage < 0 || budget.contingencyPercentage > 50) {
      warnings.push("El porcentaje de contingencia parece estar fuera del rango típico (0-50%)");
    }

    if (budget.taxPercentage < 0 || budget.taxPercentage > 30) {
      warnings.push("El porcentaje de impuestos parece estar fuera del rango típico para Ecuador (0-30%)");
    }

    // Validaciones de coherencia
    const calculatedSubtotal = budget.materialsSubtotal + budget.laborSubtotal + 
                              budget.indirectCosts + budget.professionalCostsTotal;
    
    if (Math.abs(calculatedSubtotal - budget.subtotal) > 0.01) {
      errors.push("El subtotal no coincide con la suma de sus componentes");
    }

    const calculatedContingency = budget.subtotal * (budget.contingencyPercentage / 100);
    if (Math.abs(calculatedContingency - budget.contingencyAmount) > 0.01) {
      errors.push("El monto de contingencia no coincide con el porcentaje aplicado");
    }

    // Sugerencias
    if (budget.laborSubtotal === 0 && budget.materialsSubtotal > 1000) {
      suggestions.push("Considere incluir costos de mano de obra para un presupuesto más completo");
    }

    if (budget.indirectCosts === 0) {
      suggestions.push("Considere incluir costos indirectos (administración, herramientas, etc.)");
    }

    if (budget.contingencyPercentage === 0) {
      suggestions.push("Considere incluir un porcentaje de contingencia (típicamente 5-15%)");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Compara dos versiones de presupuesto
   */
  compareBudgetVersions(originalBudget: CalculationBudget, updatedBudget: CalculationBudget) {
    const differences = {
      materialsChange: {
        absolute: updatedBudget.materialsSubtotal - originalBudget.materialsSubtotal,
        percentage: this.calculatePercentageChange(originalBudget.materialsSubtotal, updatedBudget.materialsSubtotal)
      },
      laborChange: {
        absolute: updatedBudget.laborSubtotal - originalBudget.laborSubtotal,
        percentage: this.calculatePercentageChange(originalBudget.laborSubtotal, updatedBudget.laborSubtotal)
      },
      indirectChange: {
        absolute: updatedBudget.indirectCosts - originalBudget.indirectCosts,
        percentage: this.calculatePercentageChange(originalBudget.indirectCosts, updatedBudget.indirectCosts)
      },
      totalChange: {
        absolute: updatedBudget.total - originalBudget.total,
        percentage: this.calculatePercentageChange(originalBudget.total, updatedBudget.total)
      }
    };

    return differences;
  }

  // Métodos auxiliares privados

  private calculateMaterialsSubtotal(calculationResult: CalculationResult): number {
    // Extraer información de materiales desde el resultado del cálculo
    if (!calculationResult.results || typeof calculationResult.results !== 'object') {
      return 0;
    }

    let total = 0;
    const results = calculationResult.results as any;

    // Buscar campos que contengan información de materiales
    Object.keys(results).forEach(key => {
      if (key.toLowerCase().includes('costo') || key.toLowerCase().includes('precio')) {
        const value = parseFloat(results[key]);
        if (!isNaN(value)) {
          total += value;
        }
      }
    });

    return total;
  }

  private applyTemplateFactors(materialsCost: number, template: BudgetTemplate): number {
    // Aplicar factor de desperdicio general
    const wasteFactor = template.wasteFactors?.general || 1.05; // 5% por defecto
    return materialsCost * wasteFactor;
  }

  private calculateLaborCosts(
    calculationResult: CalculationResult, 
    template: BudgetTemplate | null, 
    geographicalZone: string
  ): number {
    if (!template?.laborRates) {
      // Calcular con tasas estándar para Ecuador
      return this.calculateStandardLaborCosts(calculationResult, geographicalZone);
    }

    // Usar tasas del template
    return this.calculateTemplatedLaborCosts(calculationResult, template);
  }

  private calculateStandardLaborCosts(calculationResult: CalculationResult, geographicalZone: string): number {
    // Factores estándar para Ecuador por zona geográfica
    const zoneFactor = this.getGeographicalLaborFactor(geographicalZone);
    const baseLaborRate = 25.0; // USD por día estándar
    
    // Estimar días de trabajo basado en complejidad del cálculo
    const estimatedDays = this.estimateLaborDays(calculationResult);
    
    return baseLaborRate * zoneFactor * estimatedDays;
  }

  private calculateTemplatedLaborCosts(calculationResult: CalculationResult, template: BudgetTemplate): number {
    const laborRates = template.laborRates!;
    const estimatedDays = this.estimateLaborDays(calculationResult);
    
    // Combinar diferentes tipos de trabajadores
    const masterBuilderCost = (laborRates.masterBuilder || 35) * estimatedDays * 0.3;
    const builderCost = (laborRates.builder || 25) * estimatedDays * 0.5;
    const helperCost = (laborRates.helper || 18) * estimatedDays * 0.2;
    
    return masterBuilderCost + builderCost + helperCost;
  }

  private calculateIndirectCosts(materialsCost: number, laborCost: number, template: BudgetTemplate | null): number {
    const baseCost = materialsCost + laborCost;
    
    if (!template?.indirectCosts) {
      // Porcentajes estándar para Ecuador
      return baseCost * 0.15; // 15% estándar
    }

    const indirect = template.indirectCosts;
    let indirectRate = 0;
    
    indirectRate += (indirect.administration || 0.08);
    indirectRate += (indirect.utilities || 0.03);
    indirectRate += (indirect.tools || 0.02);
    indirectRate += (indirect.safety || 0.015);
    indirectRate += (indirect.permits || 0.005);
    
    return baseCost * indirectRate;
  }

  private calculateProfessionalFees(materialsCost: number, laborCost: number, template: BudgetTemplate | null): number {
    const baseCost = materialsCost + laborCost;
    
    if (!template?.professionalFees) {
      // Porcentajes estándar según colegio de arquitectos de Ecuador
      return baseCost * 0.12; // 12% estándar
    }

    const fees = template.professionalFees;
    let feeRate = 0;
    
    feeRate += (fees.architectural || 0.06);
    feeRate += (fees.structural || 0.03);
    feeRate += (fees.electrical || 0.015);
    feeRate += (fees.mechanical || 0.015);
    
    return baseCost * feeRate;
  }

  private calculateLaborFromTemplate(budget: CalculationBudget, template: BudgetTemplate): number {
    // Implementar lógica específica para recalcular mano de obra desde template
    return budget.laborSubtotal * 1.1; // Placeholder
  }

  private calculateIndirectFromTemplate(materialsCost: number, laborCost: number, template: BudgetTemplate): number {
    return this.calculateIndirectCosts(materialsCost, laborCost, template);
  }

  private calculateProfessionalFromTemplate(materialsCost: number, laborCost: number, template: BudgetTemplate): number {
    return this.calculateProfessionalFees(materialsCost, laborCost, template);
  }

  private getGeographicalLaborFactor(zone: string): number {
    const factors: { [key: string]: number } = {
      'QUITO': 1.2,
      'GUAYAQUIL': 1.15,
      'CUENCA': 1.1,
      'COSTA': 1.0,
      'SIERRA': 1.05,
      'ORIENTE': 0.9
    };
    
    return factors[zone.toUpperCase()] || 1.0;
  }

  private estimateLaborDays(calculationResult: CalculationResult): number {
    // Estimar días de trabajo basado en el resultado del cálculo
    const results = calculationResult.results as any;
    
    // Buscar indicadores de complejidad
    let complexity = 1;
    
    if (results.area && typeof results.area === 'number') {
      complexity = Math.max(1, results.area / 10); // 1 día cada 10 m²
    }
    
    if (results.volume && typeof results.volume === 'number') {
      complexity = Math.max(complexity, results.volume / 20); // 1 día cada 20 m³
    }
    
    return Math.min(Math.max(complexity, 1), 365); // Entre 1 y 365 días
  }

  private calculatePercentageChange(original: number, updated: number): number {
    if (original === 0) return updated === 0 ? 0 : 100;
    return ((updated - original) / original) * 100;
  }
}