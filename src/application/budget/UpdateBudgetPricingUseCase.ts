// src/application/budget/UpdateBudgetPricingUseCase.ts
import { CalculationBudgetRepository } from "../../domain/repositories/CalculationBudgetRepository";
import { BudgetLineItemRepository } from "../../domain/repositories/BudgetLineItemRepository";
import { MaterialRepository } from "../../domain/repositories/MaterialRepository";
import { NotificationRepository } from "../../domain/repositories/NotificationRepository";
import { BudgetPricingService, PriceUpdateResult, MaterialPriceChange } from "../../domain/services/BudgetPricingService";
import { CalculationBudget } from "../../domain/models/calculation/CalculationBudget";
import { BudgetLineItem, LineItemType } from "../../domain/models/calculation/BudgetLineItem";
import { NotificationType, NotificationPriority } from "../../infrastructure/database/entities/NotificationEntity";
import { v4 as uuidv4 } from "uuid";

export interface UpdateBudgetPricingRequest {
  budgetId: string;
  updateSource: 'IPCO' | 'SUPPLIER' | 'MANUAL' | 'ALL';
  forceUpdate?: boolean;
  specificMaterials?: string[]; // IDs de materiales específicos a actualizar
  priceAdjustments?: Array<{
    materialId: string;
    newPrice: number;
    reason?: string;
  }>;
  notifyUser?: boolean;
  recalculateTotals?: boolean;
}

export interface UpdateBudgetPricingResponse {
  success: boolean;
  updatedBudget: CalculationBudget;
  priceUpdateResult: PriceUpdateResult;
  updatedLineItems: BudgetLineItem[];
  totalImpact: {
    oldTotal: number;
    newTotal: number;
    difference: number;
    percentageChange: number;
  };
  notifications: string[];
  recommendations: string[];
}

export interface PriceComparisonResult {
  materialId: string;
  materialName: string;
  currentPrice: number;
  availablePrices: Array<{
    source: string;
    price: number;
    reliability: number;
    lastUpdated: Date;
  }>;
  recommendation: 'KEEP_CURRENT' | 'UPDATE_TO_LOWEST' | 'UPDATE_TO_MOST_RELIABLE' | 'NEEDS_REVIEW';
  estimatedSavings?: number;
}

export class UpdateBudgetPricingUseCase {

  constructor(
    private calculationBudgetRepository: CalculationBudgetRepository,
    private budgetLineItemRepository: BudgetLineItemRepository,
    private materialRepository: MaterialRepository,
    private notificationRepository: NotificationRepository,
    private budgetPricingService: BudgetPricingService
  ) {}

  async execute(
    request: UpdateBudgetPricingRequest,
    userId: string
  ): Promise<UpdateBudgetPricingResponse> {

    // 1. Validar y obtener el presupuesto
    const budget = await this.validateAndGetBudget(request.budgetId, userId);
    const originalTotal = budget.total;

    // 2. Obtener líneas de presupuesto que contienen materiales
    const lineItems = await this.budgetLineItemRepository.findByBudget(request.budgetId);
    const materialLineItems = lineItems.filter(item => item.itemType === LineItemType.MATERIAL && item.materialId);

    if (materialLineItems.length === 0) {
      throw new Error("No hay materiales en este presupuesto para actualizar precios");
    }

    // 3. Determinar materiales a actualizar
    const materialsToUpdate = this.determineMaterialsToUpdate(materialLineItems, request);

    // 4. Obtener comparaciones de precios
    const priceComparisons = await this.getPriceComparisons(materialsToUpdate, budget.geographicalZone);

    // 5. Aplicar actualizaciones de precios
    const priceUpdateResult = await this.applyPriceUpdates(
      budget,
      materialLineItems,
      priceComparisons,
      request
    );

    // 6. Recalcular totales del presupuesto si se solicita
    const updatedBudget = request.recalculateTotals !== false ? 
      await this.recalculateBudgetTotals(budget, materialLineItems) : 
      budget;

    // 7. Guardar cambios en base de datos
    await this.calculationBudgetRepository.update(updatedBudget.id, updatedBudget);

    // 8. Calcular impacto total
    const totalImpact = this.calculateTotalImpact(originalTotal, updatedBudget.total);

    // 9. Generar notificaciones si se solicita
    const notifications = request.notifyUser !== false ? 
      await this.generateNotifications(updatedBudget, priceUpdateResult, totalImpact, userId) : 
      [];

    // 10. Generar recomendaciones
    const recommendations = this.generateRecommendations(priceUpdateResult, totalImpact, priceComparisons);

    return {
      success: true,
      updatedBudget,
      priceUpdateResult,
      updatedLineItems: materialLineItems,
      totalImpact,
      notifications,
      recommendations
    };
  }

  /**
   * Compara precios disponibles para el presupuesto sin actualizar
   */
  async comparePricesOnly(
    budgetId: string,
    userId: string
  ): Promise<PriceComparisonResult[]> {

    const budget = await this.validateAndGetBudget(budgetId, userId);
    const lineItems = await this.budgetLineItemRepository.findByBudget(budgetId);
    const materialLineItems = lineItems.filter(item => item.itemType === LineItemType.MATERIAL && item.materialId);

    const comparisons: PriceComparisonResult[] = [];

    for (const lineItem of materialLineItems) {
      const materialPrices = await this.budgetPricingService.compareMaterialPrices(
        lineItem.materialId!,
        budget.geographicalZone
      );

      if (materialPrices.length > 0) {
        const currentPrice = lineItem.unitPrice;
        const lowestPrice = Math.min(...materialPrices.map(p => p.currentPrice));
        const mostReliablePrice = materialPrices
          .sort((a, b) => b.priceSource.reliability - a.priceSource.reliability)[0]
          .currentPrice;

        let recommendation: PriceComparisonResult['recommendation'] = 'KEEP_CURRENT';
        let estimatedSavings = 0;

        if (lowestPrice < currentPrice * 0.9) { // 10% de ahorro
          recommendation = 'UPDATE_TO_LOWEST';
          estimatedSavings = (currentPrice - lowestPrice) * lineItem.quantity;
        } else if (mostReliablePrice < currentPrice * 0.95 && mostReliablePrice !== currentPrice) {
          recommendation = 'UPDATE_TO_MOST_RELIABLE';
          estimatedSavings = (currentPrice - mostReliablePrice) * lineItem.quantity;
        } else if (Math.abs(currentPrice - lowestPrice) / currentPrice > 0.15) { // Diferencia > 15%
          recommendation = 'NEEDS_REVIEW';
        }

        const material = await this.materialRepository.findById(lineItem.materialId!);

        comparisons.push({
          materialId: lineItem.materialId!,
          materialName: material?.name || lineItem.description || 'Material desconocido',
          currentPrice,
          availablePrices: materialPrices.map(mp => ({
            source: mp.priceSource.name,
            price: mp.currentPrice,
            reliability: mp.priceSource.reliability,
            lastUpdated: mp.priceSource.lastUpdated
          })),
          recommendation,
          estimatedSavings: estimatedSavings > 0 ? estimatedSavings : undefined
        });
      }
    }

    return comparisons;
  }

  /**
   * Programa actualizaciones automáticas periódicas
   */
  async scheduleAutomaticUpdates(
    budgetId: string,
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    userId: string
  ): Promise<void> {
    
    const budget = await this.validateAndGetBudget(budgetId, userId);
    
    // Implementar lógica de programación
    // Por ahora solo guardamos la preferencia en el presupuesto
    budget.customization = {
      ...budget.customization,
      automaticPriceUpdates: {
        enabled: true,
        frequency,
        lastUpdate: new Date()
      }
    };

    await this.calculationBudgetRepository.update(budget.id, budget);
  }

  // Métodos privados

  private async validateAndGetBudget(budgetId: string, userId: string): Promise<CalculationBudget> {
    if (!budgetId || !userId) {
      throw new Error("ID de presupuesto y usuario son obligatorios");
    }

    const budget = await this.calculationBudgetRepository.findById(budgetId);
    if (!budget) {
      throw new Error(`Presupuesto no encontrado: ${budgetId}`);
    }

    if (budget.userId !== userId) {
      throw new Error("No tiene permisos para modificar este presupuesto");
    }

    return budget;
  }

  private determineMaterialsToUpdate(
    materialLineItems: BudgetLineItem[],
    request: UpdateBudgetPricingRequest
  ): string[] {
    
    if (request.specificMaterials && request.specificMaterials.length > 0) {
      return request.specificMaterials;
    }

    return materialLineItems
      .filter(item => item.materialId)
      .map(item => item.materialId!);
  }

  private async getPriceComparisons(
    materialIds: string[],
    geographicalZone: string
  ): Promise<Map<string, any[]>> {
    
    const comparisons = new Map<string, any[]>();

    for (const materialId of materialIds) {
      try {
        const prices = await this.budgetPricingService.compareMaterialPrices(materialId, geographicalZone);
        comparisons.set(materialId, prices);
      } catch (error) {
        console.error(`Error obteniendo precios para material ${materialId}:`, error);
        comparisons.set(materialId, []);
      }
    }

    return comparisons;
  }

  private async applyPriceUpdates(
    budget: CalculationBudget,
    materialLineItems: BudgetLineItem[],
    priceComparisons: Map<string, any[]>,
    request: UpdateBudgetPricingRequest
  ): Promise<PriceUpdateResult> {
    
    const result: PriceUpdateResult = {
      updatedCount: 0,
      errors: [],
      warnings: [],
      significantChanges: []
    };

    for (const lineItem of materialLineItems) {
      if (!lineItem.materialId) continue;

      try {
        let newPrice = lineItem.unitPrice;
        let priceSource = 'CURRENT';

        // Verificar si hay ajuste manual específico
        const manualAdjustment = request.priceAdjustments?.find(
          adj => adj.materialId === lineItem.materialId
        );

        if (manualAdjustment) {
          newPrice = manualAdjustment.newPrice;
          priceSource = 'MANUAL';
        } else {
          // Determinar nuevo precio según fuente solicitada
          const availablePrices = priceComparisons.get(lineItem.materialId!) || [];
          
          if (availablePrices.length > 0) {
            switch (request.updateSource) {
              case 'IPCO':
                const ipcoPrice = availablePrices.find(p => p.priceSource.type === 'IPCO');
                if (ipcoPrice) {
                  newPrice = ipcoPrice.currentPrice;
                  priceSource = 'IPCO';
                }
                break;
              
              case 'SUPPLIER':
                const supplierPrice = availablePrices.find(p => p.priceSource.type === 'SUPPLIER');
                if (supplierPrice) {
                  newPrice = supplierPrice.currentPrice;
                  priceSource = 'SUPPLIER';
                }
                break;
              
              case 'ALL':
                // Usar el precio más confiable
                const mostReliable = availablePrices
                  .sort((a, b) => b.priceSource.reliability - a.priceSource.reliability)[0];
                if (mostReliable) {
                  newPrice = mostReliable.currentPrice;
                  priceSource = mostReliable.priceSource.name;
                }
                break;
            }
          }
        }

        // Verificar si el precio cambió significativamente
        if (newPrice !== lineItem.unitPrice) {
          const changePercentage = ((newPrice - lineItem.unitPrice) / lineItem.unitPrice) * 100;
          
          // Solo actualizar si el cambio es significativo o se fuerza la actualización
          if (Math.abs(changePercentage) > 1 || request.forceUpdate) {
            
            // Detectar cambios significativos (> 5%)
            if (Math.abs(changePercentage) > 5) {
              const material = await this.materialRepository.findById(lineItem.materialId!);
              result.significantChanges.push({
                materialId: lineItem.materialId!,
                materialName: material?.name || lineItem.description || 'Material',
                oldPrice: lineItem.unitPrice,
                newPrice,
                changePercentage,
                changeType: changePercentage > 0 ? 'INCREASE' : 'DECREASE'
              });
            }

            // Actualizar línea del presupuesto
            lineItem.unitPrice = newPrice;
            lineItem.subtotal = lineItem.quantity * newPrice;
            lineItem.updatedAt = new Date();
            
            // Agregar nota sobre la fuente del precio
            lineItem.notes = `Precio actualizado desde ${priceSource} el ${new Date().toLocaleDateString()}`;

            await this.budgetLineItemRepository.update(lineItem.id, lineItem);
            result.updatedCount++;
          }
        }

      } catch (error) {
        result.errors.push(`Error actualizando precio de ${lineItem.materialId}: ${error.message}`);
      }
    }

    return result;
  }

  private async recalculateBudgetTotals(
    budget: CalculationBudget,
    updatedLineItems: BudgetLineItem[]
  ): Promise<CalculationBudget> {
    
    // Recalcular subtotal de materiales
    const materialItems = updatedLineItems.filter(item => item.itemType === LineItemType.MATERIAL);
    const newMaterialsSubtotal = materialItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Mantener otros subtotales iguales por ahora
    const newSubtotal = newMaterialsSubtotal + budget.laborSubtotal + 
                       budget.indirectCosts + budget.professionalCostsTotal;

    // Recalcular contingencia y impuestos
    const newContingencyAmount = newSubtotal * (budget.contingencyPercentage / 100);
    const newTaxableAmount = newSubtotal + newContingencyAmount;
    const newTaxAmount = newTaxableAmount * (budget.taxPercentage / 100);
    const newTotal = newTaxableAmount + newTaxAmount;

    // Actualizar presupuesto
    budget.materialsSubtotal = newMaterialsSubtotal;
    budget.subtotal = newSubtotal;
    budget.contingencyAmount = newContingencyAmount;
    budget.taxAmount = newTaxAmount;
    budget.total = newTotal;
    budget.lastCalculatedAt = new Date();
    budget.updatedAt = new Date();

    return budget;
  }

  private calculateTotalImpact(oldTotal: number, newTotal: number) {
    const difference = newTotal - oldTotal;
    const percentageChange = oldTotal !== 0 ? (difference / oldTotal) * 100 : 0;

    return {
      oldTotal,
      newTotal,
      difference,
      percentageChange
    };
  }

  private async generateNotifications(
    budget: CalculationBudget,
    priceUpdateResult: PriceUpdateResult,
    totalImpact: any,
    userId: string
  ): Promise<string[]> {
    
    const notifications: string[] = [];

    try {
      // Notificación general de actualización
      if (priceUpdateResult.updatedCount > 0) {
        const notification = {
          id: uuidv4(),
          userId,
          type: NotificationType.BUDGET_UPDATE,
          title: 'Precios de Presupuesto Actualizados',
          message: `Se actualizaron ${priceUpdateResult.updatedCount} materiales en "${budget.name}". ` +
                  `Impacto total: ${totalImpact.difference >= 0 ? '+' : ''}$${totalImpact.difference.toFixed(2)} ` +
                  `(${totalImpact.percentageChange >= 0 ? '+' : ''}${totalImpact.percentageChange.toFixed(1)}%)`,
          priority: Math.abs(totalImpact.percentageChange) > 10 ? 
                   NotificationPriority.HIGH : NotificationPriority.MEDIUM,
          data: {
            budgetId: budget.id,
            updatedCount: priceUpdateResult.updatedCount,
            totalImpact
          },
          isRead: false,
          createdAt: new Date()
        };

        await this.notificationRepository.create(notification);
        notifications.push(notification.message);
      }

      // Notificaciones para cambios significativos
      for (const significantChange of priceUpdateResult.significantChanges) {
        if (Math.abs(significantChange.changePercentage) > 15) {
          const notification = {
            id: uuidv4(),
            userId,
            type: NotificationType.PRICE_ALERT,
            title: 'Cambio Significativo de Precio',
            message: `${significantChange.materialName}: ` +
                    `${significantChange.changeType === 'INCREASE' ? 'Aumento' : 'Disminución'} ` +
                    `del ${Math.abs(significantChange.changePercentage).toFixed(1)}% ` +
                    `($${significantChange.oldPrice.toFixed(2)} → $${significantChange.newPrice.toFixed(2)})`,
            priority: NotificationPriority.HIGH,
            data: {
              budgetId: budget.id,
              materialId: significantChange.materialId,
              priceChange: significantChange
            },
            isRead: false,
            createdAt: new Date()
          };

          await this.notificationRepository.create(notification);
          notifications.push(notification.message);
        }
      }

    } catch (error) {
      console.error('Error generando notificaciones:', error);
      notifications.push('Error generando notificaciones de actualización');
    }

    return notifications;
  }

  private generateRecommendations(
    priceUpdateResult: PriceUpdateResult,
    totalImpact: any,
    priceComparisons: Map<string, any[]>
  ): string[] {
    
    const recommendations: string[] = [];

    // Recomendaciones basadas en el impacto total
    if (totalImpact.percentageChange > 10) {
      recommendations.push("Considere revisar el presupuesto con su cliente debido al aumento significativo de costos");
    } else if (totalImpact.percentageChange < -10) {
      recommendations.push("Aproveche la reducción de costos para mejorar su competitividad");
    }

    // Recomendaciones sobre frecuencia de actualización
    if (priceUpdateResult.significantChanges.length > 3) {
      recommendations.push("Configure actualizaciones automáticas semanales debido a la alta volatilidad de precios");
    }

    // Recomendaciones sobre fuentes de precios
    const supplierPricesAvailable = Array.from(priceComparisons.values())
      .some(prices => prices.some(p => p.priceSource.type === 'SUPPLIER'));
    
    if (supplierPricesAvailable) {
      recommendations.push("Compare precios con proveedores alternativos para posibles ahorros");
    }

    // Recomendaciones sobre errores
    if (priceUpdateResult.errors.length > 0) {
      recommendations.push("Verifique manualmente los materiales que no pudieron actualizarse");
    }

    return recommendations;
  }
}