// src/domain/services/BudgetPricingService.ts
import { Material } from "../models/material/Material";
import { BudgetLineItem } from "../models/calculation/BudgetLineItem";
import { GeographicalZone } from "../models/calculation/GeographicalZone";

export interface PriceSource {
  id: string;
  name: string;
  type: 'IPCO' | 'SUPPLIER' | 'HISTORICAL' | 'MANUAL';
  reliability: number; // 0-1
  lastUpdated: Date;
}

export interface MaterialPriceInfo {
  materialId: string;
  currentPrice: number;
  currency: string;
  priceSource: PriceSource;
  geographicalZone?: string;
  unit: string;
  priceHistory?: PriceHistoryEntry[];
  supplierPrices?: SupplierPrice[];
}

export interface PriceHistoryEntry {
  date: Date;
  price: number;
  source: string;
  changePercentage?: number;
}

export interface SupplierPrice {
  supplierId: string;
  supplierName: string;
  price: number;
  minimumQuantity?: number;
  deliveryTime?: number;
  lastQuoted: Date;
}

export interface PriceUpdateResult {
  updatedCount: number;
  errors: string[];
  warnings: string[];
  significantChanges: MaterialPriceChange[];
}

export interface MaterialPriceChange {
  materialId: string;
  materialName: string;
  oldPrice: number;
  newPrice: number;
  changePercentage: number;
  changeType: 'INCREASE' | 'DECREASE' | 'STABLE';
}

export interface GeographicalPriceAdjustment {
  zone: string;
  factor: number;
  description: string;
}

export class BudgetPricingService {

  /**
   * Actualiza precios desde fuentes externas (IPCO Ecuador)
   */
  async updatePricesFromIPCO(geographicalZone: string): Promise<PriceUpdateResult> {
    const result: PriceUpdateResult = {
      updatedCount: 0,
      errors: [],
      warnings: [],
      significantChanges: []
    };

    try {
      // Simular conexión con IPCO Ecuador
      const ipcoData = await this.fetchIPCOData(geographicalZone);
      
      for (const ipcoItem of ipcoData) {
        try {
          const currentPrice = await this.getCurrentMaterialPrice(ipcoItem.materialCode);
          const newPrice = this.applyGeographicalAdjustment(ipcoItem.price, geographicalZone);
          
          if (currentPrice) {
            const changePercentage = this.calculatePriceChange(currentPrice, newPrice);
            
            // Detectar cambios significativos (>10%)
            if (Math.abs(changePercentage) > 10) {
              result.significantChanges.push({
                materialId: ipcoItem.materialCode,
                materialName: ipcoItem.materialName,
                oldPrice: currentPrice,
                newPrice: newPrice,
                changePercentage,
                changeType: changePercentage > 0 ? 'INCREASE' : 'DECREASE'
              });
            }
          }
          
          result.updatedCount++;
          
        } catch (error) {
          result.errors.push(`Error actualizando ${ipcoItem.materialCode}: ${error.message}`);
        }
      }
      
    } catch (error) {
      result.errors.push(`Error conectando con IPCO: ${error.message}`);
    }

    return result;
  }

  /**
   * Obtiene información de precios actual de un material
   */
  async getMaterialPriceInfo(materialId: string, geographicalZone?: string): Promise<MaterialPriceInfo | null> {
    try {
      // Obtener precio base del material
      const basePrice = await this.getCurrentMaterialPrice(materialId);
      if (!basePrice) return null;

      // Aplicar ajuste geográfico si se especifica
      let adjustedPrice = basePrice;
      if (geographicalZone) {
        adjustedPrice = this.applyGeographicalAdjustment(basePrice, geographicalZone);
      }

      // Obtener histórico de precios
      const priceHistory = await this.getMaterialPriceHistory(materialId);

      // Obtener precios de proveedores
      const supplierPrices = await this.getSupplierPrices(materialId);

      const priceInfo: MaterialPriceInfo = {
        materialId,
        currentPrice: adjustedPrice,
        currency: 'USD',
        priceSource: {
          id: 'IPCO_EC',
          name: 'IPCO Ecuador',
          type: 'IPCO',
          reliability: 0.95,
          lastUpdated: new Date()
        },
        geographicalZone,
        unit: 'm²', // Este debería venir del material
        priceHistory,
        supplierPrices
      };

      return priceInfo;

    } catch (error) {
      console.error(`Error obteniendo precio para material ${materialId}:`, error);
      return null;
    }
  }

  /**
   * Compara precios entre múltiples proveedores
   */
  async compareMaterialPrices(materialId: string, geographicalZone: string): Promise<MaterialPriceInfo[]> {
    const priceComparisons: MaterialPriceInfo[] = [];

    try {
      // Precio IPCO
      const ipcoPrice = await this.getMaterialPriceInfo(materialId, geographicalZone);
      if (ipcoPrice) {
        priceComparisons.push(ipcoPrice);
      }

      // Precios de proveedores
      const supplierPrices = await this.getSupplierPrices(materialId);
      
      for (const supplierPrice of supplierPrices) {
        const priceInfo: MaterialPriceInfo = {
          materialId,
          currentPrice: supplierPrice.price,
          currency: 'USD',
          priceSource: {
            id: supplierPrice.supplierId,
            name: supplierPrice.supplierName,
            type: 'SUPPLIER',
            reliability: 0.8,
            lastUpdated: supplierPrice.lastQuoted
          },
          geographicalZone,
          unit: 'm²'
        };
        
        priceComparisons.push(priceInfo);
      }

      // Ordenar por precio (menor a mayor)
      priceComparisons.sort((a, b) => a.currentPrice - b.currentPrice);

    } catch (error) {
      console.error(`Error comparando precios para material ${materialId}:`, error);
    }

    return priceComparisons;
  }

  /**
   * Actualiza precios masivamente para una lista de materiales
   */
  async bulkUpdateMaterialPrices(
    materialIds: string[], 
    geographicalZone: string,
    forceUpdate: boolean = false
  ): Promise<PriceUpdateResult> {
    
    const result: PriceUpdateResult = {
      updatedCount: 0,
      errors: [],
      warnings: [],
      significantChanges: []
    };

    for (const materialId of materialIds) {
      try {
        const currentPrice = await this.getCurrentMaterialPrice(materialId);
        const newPriceInfo = await this.getMaterialPriceInfo(materialId, geographicalZone);
        
        if (!newPriceInfo) {
          result.warnings.push(`No se encontró información de precio para material ${materialId}`);
          continue;
        }

        // Verificar si necesita actualización
        if (!forceUpdate && currentPrice) {
          const timeSinceLastUpdate = Date.now() - newPriceInfo.priceSource.lastUpdated.getTime();
          const hoursOld = timeSinceLastUpdate / (1000 * 60 * 60);
          
          if (hoursOld < 24) {
            result.warnings.push(`Precio de ${materialId} actualizado recientemente, omitiendo`);
            continue;
          }
        }

        // Detectar cambios significativos
        if (currentPrice) {
          const changePercentage = this.calculatePriceChange(currentPrice, newPriceInfo.currentPrice);
          
          if (Math.abs(changePercentage) > 5) {
            result.significantChanges.push({
              materialId,
              materialName: `Material ${materialId}`,
              oldPrice: currentPrice,
              newPrice: newPriceInfo.currentPrice,
              changePercentage,
              changeType: changePercentage > 0 ? 'INCREASE' : 'DECREASE'
            });
          }
        }

        // Actualizar precio
        await this.updateMaterialPrice(materialId, newPriceInfo.currentPrice, newPriceInfo.priceSource);
        result.updatedCount++;

      } catch (error) {
        result.errors.push(`Error procesando material ${materialId}: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Aplica factores de ajuste por zona geográfica
   */
  applyGeographicalAdjustment(basePrice: number, geographicalZone: string): number {
    const adjustments = this.getGeographicalAdjustments();
    const adjustment = adjustments.find(adj => adj.zone === geographicalZone);
    
    return basePrice * (adjustment?.factor || 1.0);
  }

  /**
   * Obtiene factores de ajuste por zona geográfica para Ecuador
   */
  getGeographicalAdjustments(): GeographicalPriceAdjustment[] {
    return [
      {
        zone: 'QUITO',
        factor: 1.15,
        description: 'Zona metropolitana de Quito - Mayor costo logístico'
      },
      {
        zone: 'GUAYAQUIL',
        factor: 1.10,
        description: 'Zona metropolitana de Guayaquil - Puerto principal'
      },
      {
        zone: 'CUENCA',
        factor: 1.05,
        description: 'Cuenca - Centro de distribución regional'
      },
      {
        zone: 'COSTA',
        factor: 1.0,
        description: 'Región Costa - Precio base'
      },
      {
        zone: 'SIERRA',
        factor: 1.08,
        description: 'Región Sierra - Transporte adicional'
      },
      {
        zone: 'ORIENTE',
        factor: 1.25,
        description: 'Región Oriente - Mayor dificultad logística'
      },
      {
        zone: 'INSULAR',
        factor: 1.40,
        description: 'Región Insular - Transporte marítimo'
      }
    ];
  }

  /**
   * Analiza tendencias de precios
   */
  async analyzePriceTrends(materialId: string, daysBack: number = 90): Promise<any> {
    const history = await this.getMaterialPriceHistory(materialId, daysBack);
    
    if (history.length < 2) {
      return {
        trend: 'INSUFFICIENT_DATA',
        message: 'No hay suficientes datos históricos para análisis'
      };
    }

    // Calcular tendencia
    const oldestPrice = history[0].price;
    const newestPrice = history[history.length - 1].price;
    const overallChange = this.calculatePriceChange(oldestPrice, newestPrice);

    // Calcular volatilidad
    const priceChanges = history.slice(1).map((entry, index) => {
      return this.calculatePriceChange(history[index].price, entry.price);
    });

    const volatility = this.calculateStandardDeviation(priceChanges);

    // Determinar tendencia
    let trend = 'STABLE';
    if (overallChange > 5) trend = 'INCREASING';
    else if (overallChange < -5) trend = 'DECREASING';

    return {
      trend,
      overallChangePercentage: overallChange,
      volatility,
      dataPoints: history.length,
      recommendation: this.generatePriceRecommendation(trend, overallChange, volatility)
    };
  }

  // Métodos auxiliares privados

  private async fetchIPCOData(geographicalZone: string): Promise<any[]> {
    // Simular datos de IPCO Ecuador
    // En implementación real, esto haría una llamada HTTP al servicio IPCO
    return [
      {
        materialCode: 'CEM-001',
        materialName: 'Cemento Portland Tipo I',
        price: 8.50,
        unit: 'saco 50kg',
        lastUpdated: new Date()
      },
      {
        materialCode: 'ACE-001',
        materialName: 'Acero de refuerzo fy=4200',
        price: 0.85,
        unit: 'kg',
        lastUpdated: new Date()
      }
    ];
  }

  private async getCurrentMaterialPrice(materialId: string): Promise<number | null> {
    // Implementar consulta a base de datos de materiales
    // Placeholder por ahora
    return 10.0;
  }

  private async getMaterialPriceHistory(materialId: string, daysBack: number = 90): Promise<PriceHistoryEntry[]> {
    // Implementar consulta al histórico de precios
    // Placeholder por ahora
    return [];
  }

  private async getSupplierPrices(materialId: string): Promise<SupplierPrice[]> {
    // Implementar consulta a precios de proveedores
    // Placeholder por ahora
    return [];
  }

  private async updateMaterialPrice(materialId: string, newPrice: number, source: PriceSource): Promise<void> {
    // Implementar actualización en base de datos
    // Placeholder por ahora
  }

  private calculatePriceChange(oldPrice: number, newPrice: number): number {
    if (oldPrice === 0) return newPrice === 0 ? 0 : 100;
    return ((newPrice - oldPrice) / oldPrice) * 100;
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  private generatePriceRecommendation(trend: string, changePercentage: number, volatility: number): string {
    if (trend === 'INCREASING' && changePercentage > 10) {
      return 'Considere acelerar las compras debido a la tendencia alcista de precios';
    }
    
    if (trend === 'DECREASING' && changePercentage < -10) {
      return 'Considere postergar compras no urgentes debido a la tendencia bajista';
    }
    
    if (volatility > 15) {
      return 'Alta volatilidad de precios - monitoree frecuentemente y considere contratos fijos';
    }
    
    return 'Precios estables - continúe con estrategia de compras normal';
  }
}