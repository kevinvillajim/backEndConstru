// src/domain/services/BudgetTemplateService.ts
import { 
    BudgetTemplate, 
    ProjectType, 
    TemplateScope, 
    CreateBudgetTemplateDTO,
    WasteFactors,
    LaborRates,
    LaborProductivity,
    IndirectCosts,
    ProfessionalFees
  } from "../models/calculation/BudgetTemplate";
  import { CalculationResult } from "../models/calculation/CalculationResult";
  import { User } from "../models/user/User";
  import { v4 as uuidv4 } from "uuid";
  
  export interface TemplateRecommendation {
    templateId: string;
    templateName: string;
    matchScore: number; // 0-100
    matchReasons: string[];
    projectType: ProjectType;
    geographicalZone: string;
  }
  
  export interface TemplateUsageStats {
    templateId: string;
    usageCount: number;
    averageAccuracy: number;
    lastUsed: Date;
    userFeedback: number; // 1-5 stars
    successRate: number; // % de proyectos completados exitosamente
  }
  
  export interface TemplateValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    completeness: number; // 0-100%
  }
  
  export interface TemplateCustomizationOptions {
    companyName?: string;
    defaultGeographicalZone?: string;
    preferredCurrency?: string;
    customWasteFactors?: Partial<WasteFactors>;
    customLaborRates?: Partial<LaborRates>;
    brandingSettings?: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  }
  
  export class BudgetTemplateService {
  
    /**
     * Recomienda templates basado en características del proyecto
     */
    async recommendTemplates(
      projectType: ProjectType,
      geographicalZone: string,
      calculationResult?: CalculationResult,
      userId?: string
    ): Promise<TemplateRecommendation[]> {
      
      const recommendations: TemplateRecommendation[] = [];
  
      try {
        // Obtener templates disponibles
        const availableTemplates = await this.getAvailableTemplates(projectType, geographicalZone);
  
        for (const template of availableTemplates) {
          const matchScore = await this.calculateTemplateMatch(
            template,
            projectType,
            geographicalZone,
            calculationResult,
            userId
          );
  
          if (matchScore > 60) { // Solo recomendar templates con match > 60%
            const matchReasons = this.generateMatchReasons(template, projectType, matchScore);
            
            recommendations.push({
              templateId: template.id,
              templateName: template.name,
              matchScore,
              matchReasons,
              projectType: template.projectType,
              geographicalZone: template.geographicalZone
            });
          }
        }
  
        // Ordenar por score de match descendente
        recommendations.sort((a, b) => b.matchScore - a.matchScore);
  
        return recommendations.slice(0, 5); // Máximo 5 recomendaciones
  
      } catch (error) {
        console.error('Error generando recomendaciones de templates:', error);
        return [];
      }
    }
  
    /**
     * Crea un template personalizado para el usuario
     */
    async createPersonalizedTemplate(
      baseTemplateId: string,
      customization: TemplateCustomizationOptions,
      userId: string,
      name: string,
      description?: string
    ): Promise<BudgetTemplate> {
  
      // Obtener template base
      const baseTemplate = await this.getTemplateById(baseTemplateId);
      if (!baseTemplate) {
        throw new Error(`Template base no encontrado: ${baseTemplateId}`);
      }
  
      // Aplicar personalización
      const personalizedTemplate: BudgetTemplate = {
        ...baseTemplate,
        id: uuidv4(),
        name,
        description: description || `${baseTemplate.description} (Personalizado)`,
        scope: TemplateScope.PERSONAL,
        createdBy: userId,
        isActive: true,
        isVerified: false,
        usageCount: 0,
        
        // Aplicar factores personalizados
        wasteFactors: {
          ...baseTemplate.wasteFactors,
          ...customization.customWasteFactors
        },
        laborRates: {
          ...baseTemplate.laborRates,
          ...customization.customLaborRates
        },
        
        // Configurar zona geográfica
        geographicalZone: customization.defaultGeographicalZone || baseTemplate.geographicalZone,
        
        createdAt: new Date(),
        updatedAt: new Date()
      };
  
      return personalizedTemplate;
    }
  
    /**
     * Valida un template antes de guardarlo
     */
    validateTemplate(template: BudgetTemplate): TemplateValidationResult {
      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];
  
      // Validaciones obligatorias
      if (!template.name || template.name.trim().length === 0) {
        errors.push("El nombre del template es obligatorio");
      }
  
      if (!template.projectType) {
        errors.push("El tipo de proyecto es obligatorio");
      }
  
      if (!template.geographicalZone) {
        errors.push("La zona geográfica es obligatoria");
      }
  
      // Validaciones de factores de desperdicio
      if (template.wasteFactors) {
        Object.entries(template.wasteFactors).forEach(([key, value]) => {
          if (value !== undefined) {
            if (value < 1.0) {
              warnings.push(`Factor de desperdicio ${key} menor a 1.0 (${value})`);
            }
            if (value > 2.0) {
              warnings.push(`Factor de desperdicio ${key} muy alto (${value})`);
            }
          }
        });
      }
  
      // Validaciones de tasas de mano de obra
      if (template.laborRates) {
        Object.entries(template.laborRates).forEach(([key, value]) => {
          if (value !== undefined) {
            if (value < 10) {
              warnings.push(`Tasa de mano de obra ${key} muy baja: $${value}/día`);
            }
            if (value > 100) {
              warnings.push(`Tasa de mano de obra ${key} muy alta: $${value}/día`);
            }
          }
        });
      }
  
      // Validaciones de costos indirectos
      if (template.indirectCosts) {
        const totalIndirect = Object.values(template.indirectCosts)
          .filter(v => v !== undefined)
          .reduce((sum, v) => sum + (v || 0), 0);
        
        if (totalIndirect > 0.5) { // 50%
          warnings.push(`Costos indirectos totales muy altos: ${(totalIndirect * 100).toFixed(1)}%`);
        }
      }
  
      // Validaciones de honorarios profesionales
      if (template.professionalFees) {
        const totalFees = Object.values(template.professionalFees)
          .filter(v => v !== undefined)
          .reduce((sum, v) => sum + (v || 0), 0);
        
        if (totalFees > 0.25) { // 25%
          warnings.push(`Honorarios profesionales totales muy altos: ${(totalFees * 100).toFixed(1)}%`);
        }
      }
  
      // Calcular completitud
      const completeness = this.calculateTemplateCompleteness(template);
  
      // Sugerencias basadas en completitud
      if (completeness < 70) {
        suggestions.push("Considere completar más campos para mejorar la precisión del template");
      }
  
      if (!template.wasteFactors?.general) {
        suggestions.push("Agregar factor de desperdicio general para mayor precisión");
      }
  
      if (!template.laborRates?.masterBuilder) {
        suggestions.push("Agregar tasa de maestro constructor para costos más precisos");
      }
  
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        completeness
      };
    }
  
    /**
     * Genera template automático basado en histórico de proyectos del usuario
     */
    async generateTemplateFromHistory(
      userId: string,
      projectType: ProjectType,
      geographicalZone: string,
      templateName: string
    ): Promise<BudgetTemplate> {
  
      // Obtener proyectos históricos similares
      const historicalData = await this.getUserHistoricalData(userId, projectType, geographicalZone);
  
      if (historicalData.length === 0) {
        throw new Error("No hay suficientes datos históricos para generar template automático");
      }
  
      // Calcular promedios de factores
      const avgWasteFactors = this.calculateAverageWasteFactors(historicalData);
      const avgLaborRates = this.calculateAverageLaborRates(historicalData);
      const avgIndirectCosts = this.calculateAverageIndirectCosts(historicalData);
      const avgProfessionalFees = this.calculateAverageProfessionalFees(historicalData);
  
      // Crear template
      const autoTemplate: BudgetTemplate = {
        id: uuidv4(),
        name: templateName,
        description: `Template generado automáticamente basado en ${historicalData.length} proyectos similares`,
        projectType,
        scope: TemplateScope.PERSONAL,
        geographicalZone,
        wasteFactors: avgWasteFactors,
        laborRates: avgLaborRates,
        laborProductivity: this.getDefaultLaborProductivity(projectType),
        indirectCosts: avgIndirectCosts,
        professionalFees: avgProfessionalFees,
        createdBy: userId,
        isActive: true,
        isVerified: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
  
      return autoTemplate;
    }
  
    /**
     * Actualiza template basado en feedback y resultados
     */
    async updateTemplateFromFeedback(
      templateId: string,
      actualResults: any,
      userFeedback: number,
      adjustmentNotes?: string
    ): Promise<BudgetTemplate> {
  
      const template = await this.getTemplateById(templateId);
      if (!template) {
        throw new Error(`Template no encontrado: ${templateId}`);
      }
  
      // Analizar diferencias entre estimado y real
      const adjustments = this.calculateTemplateAdjustments(template, actualResults);
  
      // Aplicar ajustes graduales (no cambios drásticos)
      const updatedTemplate: BudgetTemplate = {
        ...template,
        wasteFactors: this.applyGradualAdjustments(template.wasteFactors, adjustments.wasteAdjustments),
        laborRates: this.applyGradualAdjustments(template.laborRates, adjustments.laborAdjustments),
        indirectCosts: this.applyGradualAdjustments(template.indirectCosts, adjustments.indirectAdjustments),
        updatedAt: new Date()
      };
  
      return updatedTemplate;
    }
  
    /**
     * Obtiene estadísticas de uso de un template
     */
    async getTemplateUsageStats(templateId: string): Promise<TemplateUsageStats> {
      // Implementar consulta a base de datos para estadísticas
      // Placeholder por ahora
      return {
        templateId,
        usageCount: 0,
        averageAccuracy: 0,
        lastUsed: new Date(),
        userFeedback: 0,
        successRate: 0
      };
    }
  
    // Métodos auxiliares privados
  
    private async getAvailableTemplates(projectType: ProjectType, geographicalZone: string): Promise<BudgetTemplate[]> {
      // Implementar consulta a base de datos
      // Placeholder por ahora
      return [];
    }
  
    private async getTemplateById(templateId: string): Promise<BudgetTemplate | null> {
      // Implementar consulta a base de datos
      // Placeholder por ahora
      return null;
    }
  
    private async calculateTemplateMatch(
      template: BudgetTemplate,
      projectType: ProjectType,
      geographicalZone: string,
      calculationResult?: CalculationResult,
      userId?: string
    ): Promise<number> {
      
      let score = 0;
  
      // Match por tipo de proyecto (40% del score)
      if (template.projectType === projectType) {
        score += 40;
      } else if (this.areCompatibleProjectTypes(template.projectType, projectType)) {
        score += 20;
      }
  
      // Match por zona geográfica (30% del score)
      if (template.geographicalZone === geographicalZone) {
        score += 30;
      } else if (this.areCompatibleZones(template.geographicalZone, geographicalZone)) {
        score += 15;
      }
  
      // Template verificado (10% del score)
      if (template.isVerified) {
        score += 10;
      }
  
      // Uso histórico exitoso (20% del score)
      if (template.usageCount > 5) {
        score += 20;
      } else if (template.usageCount > 1) {
        score += 10;
      }
  
      return Math.min(score, 100);
    }
  
    private generateMatchReasons(template: BudgetTemplate, projectType: ProjectType, score: number): string[] {
      const reasons: string[] = [];
  
      if (template.projectType === projectType) {
        reasons.push("Tipo de proyecto exacto");
      }
  
      if (template.isVerified) {
        reasons.push("Template verificado por expertos");
      }
  
      if (template.usageCount > 10) {
        reasons.push("Ampliamente utilizado y probado");
      }
  
      if (score > 90) {
        reasons.push("Coincidencia casi perfecta");
      }
  
      return reasons;
    }
  
    private areCompatibleProjectTypes(type1: ProjectType, type2: ProjectType): boolean {
      const compatibilityMap: { [key: string]: ProjectType[] } = {
        [ProjectType.RESIDENTIAL_SINGLE]: [ProjectType.RESIDENTIAL_MULTI],
        [ProjectType.RESIDENTIAL_MULTI]: [ProjectType.RESIDENTIAL_SINGLE],
        [ProjectType.COMMERCIAL_SMALL]: [ProjectType.COMMERCIAL_LARGE],
        [ProjectType.COMMERCIAL_LARGE]: [ProjectType.COMMERCIAL_SMALL]
      };
  
      return compatibilityMap[type1]?.includes(type2) || false;
    }
  
    private areCompatibleZones(zone1: string, zone2: string): boolean {
      const regionalGroups = [
        ['QUITO', 'SIERRA'],
        ['GUAYAQUIL', 'COSTA'],
        ['CUENCA', 'SIERRA']
      ];
  
      return regionalGroups.some(group => 
        group.includes(zone1) && group.includes(zone2)
      );
    }
  
    private calculateTemplateCompleteness(template: BudgetTemplate): number {
      const totalFields = 20; // Número total de campos importantes
      let completedFields = 0;
  
      // Campos básicos
      if (template.name) completedFields++;
      if (template.description) completedFields++;
      if (template.projectType) completedFields++;
      if (template.geographicalZone) completedFields++;
  
      // Factores de desperdicio
      if (template.wasteFactors?.general) completedFields++;
      if (template.wasteFactors?.concrete) completedFields++;
      if (template.wasteFactors?.steel) completedFields++;
  
      // Tasas de mano de obra
      if (template.laborRates?.masterBuilder) completedFields++;
      if (template.laborRates?.builder) completedFields++;
      if (template.laborRates?.helper) completedFields++;
  
      // Productividad de mano de obra
      if (template.laborProductivity?.concretePouring) completedFields++;
      if (template.laborProductivity?.wallConstruction) completedFields++;
  
      // Costos indirectos
      if (template.indirectCosts?.administration) completedFields++;
      if (template.indirectCosts?.utilities) completedFields++;
      if (template.indirectCosts?.tools) completedFields++;
  
      // Honorarios profesionales
      if (template.professionalFees?.architectural) completedFields++;
      if (template.professionalFees?.structural) completedFields++;
      if (template.professionalFees?.supervision) completedFields++;
  
      // Cumplimiento NEC
      if (template.necCompliance?.seismicZone) completedFields++;
      if (template.necCompliance?.soilType) completedFields++;
  
      return (completedFields / totalFields) * 100;
    }
  
    private async getUserHistoricalData(userId: string, projectType: ProjectType, geographicalZone: string): Promise<any[]> {
      // Implementar consulta a proyectos históricos del usuario
      // Placeholder por ahora
      return [];
    }
  
    private calculateAverageWasteFactors(historicalData: any[]): WasteFactors {
      // Implementar cálculo de promedios
      return {
        general: 1.05,
        concrete: 1.03,
        steel: 1.02
      };
    }
  
    private calculateAverageLaborRates(historicalData: any[]): LaborRates {
      // Implementar cálculo de promedios
      return {
        masterBuilder: 35,
        builder: 25,
        helper: 18
      };
    }
  
    private calculateAverageIndirectCosts(historicalData: any[]): IndirectCosts {
      // Implementar cálculo de promedios
      return {
        administration: 0.08,
        utilities: 0.03,
        tools: 0.02
      };
    }
  
    private calculateAverageProfessionalFees(historicalData: any[]): ProfessionalFees {
      // Implementar cálculo de promedios
      return {
        architectural: 0.06,
        structural: 0.03,
        supervision: 0.03
      };
    }
  
    private getDefaultLaborProductivity(projectType: ProjectType): LaborProductivity {
      const defaults: { [key in ProjectType]: LaborProductivity } = {
        [ProjectType.RESIDENTIAL_SINGLE]: {
          concretePouring: 8, // m³/día
          wallConstruction: 12, // m²/día
          tileInstallation: 6, // m²/día
          paintingInterior: 15, // m²/día
          paintingExterior: 12 // m²/día
        },
        [ProjectType.RESIDENTIAL_MULTI]: {
          concretePouring: 10,
          wallConstruction: 15,
          tileInstallation: 8,
          paintingInterior: 18,
          paintingExterior: 15
        },
        [ProjectType.COMMERCIAL_SMALL]: {
          concretePouring: 12,
          wallConstruction: 18,
          tileInstallation: 10,
          paintingInterior: 20,
          paintingExterior: 18
        },
        [ProjectType.COMMERCIAL_LARGE]: {
          concretePouring: 15,
          wallConstruction: 20,
          tileInstallation: 12,
          paintingInterior: 25,
          paintingExterior: 20
        },
        [ProjectType.INDUSTRIAL]: {
          concretePouring: 20,
          wallConstruction: 25,
          tileInstallation: 8,
          paintingInterior: 30,
          paintingExterior: 25
        },
        [ProjectType.INFRASTRUCTURE]: {
          concretePouring: 25,
          wallConstruction: 30,
          tileInstallation: 5,
          paintingInterior: 20,
          paintingExterior: 15
        },
        [ProjectType.RENOVATION]: {
          concretePouring: 6,
          wallConstruction: 8,
          tileInstallation: 4,
          paintingInterior: 10,
          paintingExterior: 8
        },
        [ProjectType.SPECIALIZED]: {
          concretePouring: 10,
          wallConstruction: 12,
          tileInstallation: 6,
          paintingInterior: 15,
          paintingExterior: 12
        }
      };
  
      return defaults[projectType];
    }
  
    private calculateTemplateAdjustments(template: BudgetTemplate, actualResults: any): any {
      // Implementar análisis de diferencias
      return {
        wasteAdjustments: {},
        laborAdjustments: {},
        indirectAdjustments: {}
      };
    }
  
    private applyGradualAdjustments(original: any, adjustments: any): any {
      // Implementar ajustes graduales (máximo 10% de cambio por iteración)
      return original;
    }
  }