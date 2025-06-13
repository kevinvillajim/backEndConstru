// src/domain/services/CalculationScheduleService.ts
import { CalculationTemplateRepository } from '../repositories/CalculationTemplateRepository';
import { CalculationResultRepository } from '../repositories/CalculationResultRepository';
import { ScheduleTemplateRepository } from '../repositories/ScheduleTemplateRepository';
import { ScheduleActivityRepository } from '../repositories/ScheduleActivityRepository';

export interface ScheduleFromCalculationRequest {
  calculationResultId: string;
  templateId?: string;
  projectStartDate: Date;
  optimizeForTime?: boolean;
  optimizeForCost?: boolean;
  includeBuffers?: boolean;
  customParameters?: {
    workingDaysPerWeek: number;
    dailyWorkingHours: number;
    productivityFactors: Record<string, number>;
    resourceAvailability: Record<string, number>;
  };
}

export interface TechnicalValidation {
  isValid: boolean;
  validationResults: {
    structuralSequence: boolean;
    resourceFeasibility: boolean;
    technicalDependencies: boolean;
    necCompliance: boolean;
  };
  warnings: string[];
  criticalIssues: string[];
  recommendations: string[];
}

export class CalculationScheduleService {
  constructor(
    private calculationTemplateRepository: CalculationTemplateRepository,
    private calculationResultRepository: CalculationResultRepository,
    private scheduleTemplateRepository: ScheduleTemplateRepository,
    private activityRepository: ScheduleActivityRepository
  ) {}

  async generateScheduleFromCalculation(request: ScheduleFromCalculationRequest): Promise<any> {
    // 1. Obtener resultado de cálculo
    const calculationResult = await this.calculationResultRepository.findById(request.calculationResultId);
    if (!calculationResult) {
      throw new Error('Calculation result not found');
    }

    // 2. Determinar template apropiado
    const template = await this.selectOptimalTemplate(calculationResult, request.templateId);

    // 3. Extraer actividades técnicas del cálculo
    const technicalActivities = this.extractTechnicalActivities(calculationResult);

    // 4. Validar factibilidad técnica
    const validation = await this.validateTechnicalFeasibility(technicalActivities, calculationResult);
    if (!validation.isValid) {
      throw new Error(`Technical validation failed: ${validation.criticalIssues.join(', ')}`);
    }

    // 5. Generar cronograma optimizado
    const schedule = await this.createOptimizedSchedule(
      calculationResult,
      template,
      technicalActivities,
      request
    );

    // 6. Aplicar ajustes por especialidad
    const adjustedSchedule = await this.applySpecialtyAdjustments(schedule, calculationResult);

    return {
      schedule: adjustedSchedule,
      technicalValidation: validation,
      optimizationApplied: {
        timeOptimization: request.optimizeForTime,
        costOptimization: request.optimizeForCost,
        buffersIncluded: request.includeBuffers
      },
      integrationMetadata: {
        sourceCalculationId: request.calculationResultId,
        templateUsed: template.id,
        generationDate: new Date(),
        technicalComplexity: this.assessTechnicalComplexity(calculationResult)
      }
    };
  }

  async validateTechnicalFeasibility(activities: any[], calculationResult: any): Promise<TechnicalValidation> {
    const validationResults = {
      structuralSequence: this.validateStructuralSequence(activities, calculationResult),
      resourceFeasibility: this.validateResourceFeasibility(activities, calculationResult),
      technicalDependencies: this.validateTechnicalDependencies(activities, calculationResult),
      necCompliance: await this.validateNECCompliance(activities, calculationResult)
    };

    const warnings = [];
    const criticalIssues = [];
    const recommendations = [];

    // Evaluar resultados de validación
    if (!validationResults.structuralSequence) {
      criticalIssues.push('Secuencia estructural inválida detectada');
      recommendations.push('Revisar orden de actividades estructurales');
    }

    if (!validationResults.resourceFeasibility) {
      warnings.push('Recursos insuficientes para algunas actividades');
      recommendations.push('Ajustar disponibilidad de recursos o cronograma');
    }

    if (!validationResults.technicalDependencies) {
      criticalIssues.push('Dependencias técnicas no satisfechas');
      recommendations.push('Revisar requisitos técnicos entre actividades');
    }

    if (!validationResults.necCompliance) {
      criticalIssues.push('Incumplimiento de normativa NEC detectado');
      recommendations.push('Ajustar actividades para cumplir normativa ecuatoriana');
    }

    return {
      isValid: criticalIssues.length === 0,
      validationResults,
      warnings,
      criticalIssues,
      recommendations
    };
  }

  async optimizeByTechnicalComplexity(scheduleId: string, complexityFactors: any): Promise<any> {
    const activities = await this.activityRepository.findByScheduleId(scheduleId);
    
    // Clasificar actividades por complejidad técnica
    const complexityGroups = this.groupActivitiesByComplexity(activities, complexityFactors);
    
    // Aplicar optimizaciones específicas por grupo
    const optimizations = {};
    
    for (const [complexity, groupActivities] of Object.entries(complexityGroups)) {
      switch (complexity) {
        case 'high':
          optimizations[complexity] = this.optimizeHighComplexityActivities(groupActivities);
          break;
        case 'medium':
          optimizations[complexity] = this.optimizeMediumComplexityActivities(groupActivities);
          break;
        case 'low':
          optimizations[complexity] = this.optimizeLowComplexityActivities(groupActivities);
          break;
      }
    }

    return {
      originalSchedule: { activities },
      optimizedGroups: optimizations,
      complexityAnalysis: complexityFactors,
      recommendations: this.generateComplexityRecommendations(complexityGroups)
    };
  }

  private async selectOptimalTemplate(calculationResult: any, templateId?: string): Promise<any> {
    if (templateId) {
      return await this.scheduleTemplateRepository.findById(templateId);
    }

    // Selección automática basada en características del cálculo
    const filters = {
      constructionType: calculationResult.projectType,
      geographicalZone: calculationResult.geographicalZone,
      scope: 'SYSTEM',
      isVerified: true
    };

    const templates = await this.scheduleTemplateRepository.findByFilters(filters);
    
    // Seleccionar el template más apropiado basado en similitud
    return this.selectBestTemplate(templates, calculationResult);
  }

  private extractTechnicalActivities(calculationResult: any): any[] {
    const activities = [];

    // Extraer actividades de cálculos estructurales
    if (calculationResult.calculations?.structural) {
      activities.push(...this.extractStructuralActivities(calculationResult.calculations.structural));
    }

    // Extraer actividades de cálculos de materiales
    if (calculationResult.calculations?.materials) {
      activities.push(...this.extractMaterialActivities(calculationResult.calculations.materials));
    }

    // Extraer actividades de instalaciones
    if (calculationResult.calculations?.installations) {
      activities.push(...this.extractInstallationActivities(calculationResult.calculations.installations));
    }

    return activities;
  }

  private extractStructuralActivities(structuralCalc: any): any[] {
    const activities = [];

    // Actividades de fundación
    if (structuralCalc.foundation) {
      activities.push({
        name: 'Excavación y preparación de fundación',
        type: 'FOUNDATION',
        duration: this.calculateFoundationDuration(structuralCalc.foundation),
        dependencies: [],
        technicalRequirements: structuralCalc.foundation.specifications,
        necReferences: structuralCalc.foundation.necCompliance
      });
    }

    // Actividades estructurales
    if (structuralCalc.columns || structuralCalc.beams) {
      activities.push({
        name: 'Construcción de estructura',
        type: 'STRUCTURE',
        duration: this.calculateStructureDuration(structuralCalc),
        dependencies: ['foundation'],
        technicalRequirements: this.combineStructuralRequirements(structuralCalc),
        necReferences: this.extractNECReferences(structuralCalc)
      });
    }

    return activities;
  }

  private extractMaterialActivities(materialCalc: any): any[] {
    return materialCalc.materials?.map(material => ({
      name: `Suministro e instalación de ${material.name}`,
      type: 'MATERIAL_INSTALLATION',
      duration: this.calculateMaterialDuration(material),
      dependencies: this.determineMaterialDependencies(material),
      technicalRequirements: material.specifications,
      quantityRequired: material.quantity,
      unit: material.unit
    })) || [];
  }

  private extractInstallationActivities(installationCalc: any): any[] {
    const activities = [];

    // Instalaciones eléctricas
    if (installationCalc.electrical) {
      activities.push({
        name: 'Instalaciones eléctricas',
        type: 'ELECTRICAL',
        duration: this.calculateElectricalDuration(installationCalc.electrical),
        dependencies: ['structure'],
        technicalRequirements: installationCalc.electrical.specifications
      });
    }

    // Instalaciones sanitarias
    if (installationCalc.plumbing) {
      activities.push({
        name: 'Instalaciones sanitarias',
        type: 'PLUMBING',
        duration: this.calculatePlumbingDuration(installationCalc.plumbing),
        dependencies: ['structure'],
        technicalRequirements: installationCalc.plumbing.specifications
      });
    }

    return activities;
  }

  private validateStructuralSequence(activities: any[], calculationResult: any): boolean {
    // Validar que la secuencia estructural sea técnicamente viable
    const structuralOrder = ['foundation', 'columns', 'beams', 'slabs', 'roof'];
    const structuralActivities = activities.filter(a => 
      structuralOrder.includes(a.type?.toLowerCase())
    );

    // Verificar orden correcto
    for (let i = 1; i < structuralActivities.length; i++) {
      const currentIndex = structuralOrder.indexOf(structuralActivities[i].type?.toLowerCase());
      const previousIndex = structuralOrder.indexOf(structuralActivities[i-1].type?.toLowerCase());
      
      if (currentIndex < previousIndex) {
        return false; // Orden incorrecto
      }
    }

    return true;
  }

  private validateResourceFeasibility(activities: any[], calculationResult: any): boolean {
    // Validar que los recursos requeridos sean factibles
    const totalResourceDemand = this.calculateTotalResourceDemand(activities);
    const availableResources = this.getAvailableResources(calculationResult);
    
    return this.compareResourceDemandVsAvailability(totalResourceDemand, availableResources);
  }

  private validateTechnicalDependencies(activities: any[], calculationResult: any): boolean {
    // Validar que todas las dependencias técnicas estén satisfechas
    for (const activity of activities) {
      if (activity.technicalRequirements) {
        const satisfied = this.checkTechnicalRequirements(
          activity.technicalRequirements, 
          calculationResult
        );
        if (!satisfied) return false;
      }
    }
    return true;
  }

  private async validateNECCompliance(activities: any[], calculationResult: any): Promise<boolean> {
    // Validar cumplimiento de normativa NEC para cada actividad
    for (const activity of activities) {
      if (activity.necReferences) {
        const compliant = await this.checkNECCompliance(activity.necReferences, calculationResult);
        if (!compliant) return false;
      }
    }
    return true;
  }

  // Helper methods
  private selectBestTemplate(templates: any[], calculationResult: any): any {
    // Implementar lógica de selección del mejor template
    return templates[0]; // Simplified
  }

  private calculateFoundationDuration(foundation: any): number {
    // Calcular duración basada en complejidad de fundación
    return Math.ceil(foundation.volume * 0.5); // días
  }

  private calculateStructureDuration(structural: any): number {
    // Calcular duración basada en elementos estructurales
    return 15; // Simplified
  }

  private calculateMaterialDuration(material: any): number {
    // Calcular duración basada en cantidad y tipo de material
    return Math.ceil(material.quantity * 0.1); // días
  }

  private calculateElectricalDuration(electrical: any): number {
    return 10; // Simplified
  }

  private calculatePlumbingDuration(plumbing: any): number {
    return 8; // Simplified
  }

  private combineStructuralRequirements(structural: any): any {
    return { combined: true }; // Simplified
  }

  private extractNECReferences(structural: any): string[] {
    return ['NEC-SE-DS', 'NEC-SE-HM']; // Simplified
  }

  private determineMaterialDependencies(material: any): string[] {
    return []; // Simplified
  }

  private calculateTotalResourceDemand(activities: any[]): any {
    return { workforce: 100, equipment: 50 }; // Simplified
  }

  private getAvailableResources(calculationResult: any): any {
    return { workforce: 150, equipment: 75 }; // Simplified
  }

  private compareResourceDemandVsAvailability(demand: any, availability: any): boolean {
    return demand.workforce <= availability.workforce && demand.equipment <= availability.equipment;
  }

  private checkTechnicalRequirements(requirements: any, calculationResult: any): boolean {
    return true; // Simplified
  }

  private async checkNECCompliance(necReferences: string[], calculationResult: any): Promise<boolean> {
    return true; // Simplified
  }

  private async createOptimizedSchedule(
    calculationResult: any,
    template: any,
    activities: any[],
    request: ScheduleFromCalculationRequest
  ): Promise<any> {
    // Crear cronograma optimizado combinando template y actividades técnicas
    return {
      id: 'generated-schedule',
      name: `Cronograma - ${calculationResult.name}`,
      activities: activities,
      estimatedDuration: activities.reduce((sum, a) => sum + a.duration, 0),
      optimizations: {
        timeOptimized: request.optimizeForTime,
        costOptimized: request.optimizeForCost
      }
    };
  }

  private async applySpecialtyAdjustments(schedule: any, calculationResult: any): Promise<any> {
    // Aplicar ajustes específicos por especialidad
    return schedule; // Simplified
  }

  private assessTechnicalComplexity(calculationResult: any): string {
    // Evaluar complejidad técnica del proyecto
    return 'medium'; // Simplified
  }

  private groupActivitiesByComplexity(activities: any[], complexityFactors: any): any {
    return {
      high: activities.filter(a => this.isHighComplexity(a, complexityFactors)),
      medium: activities.filter(a => this.isMediumComplexity(a, complexityFactors)),
      low: activities.filter(a => this.isLowComplexity(a, complexityFactors))
    };
  }

  private isHighComplexity(activity: any, factors: any): boolean {
    return activity.type === 'STRUCTURE' || activity.type === 'FOUNDATION';
  }

  private isMediumComplexity(activity: any, factors: any): boolean {
    return activity.type === 'ELECTRICAL' || activity.type === 'PLUMBING';
  }

  private isLowComplexity(activity: any, factors: any): boolean {
    return !this.isHighComplexity(activity, factors) && !this.isMediumComplexity(activity, factors);
  }

  private optimizeHighComplexityActivities(activities: any[]): any {
    return { optimized: true, approach: 'conservative_scheduling' };
  }

  private optimizeMediumComplexityActivities(activities: any[]): any {
    return { optimized: true, approach: 'balanced_optimization' };
  }

  private optimizeLowComplexityActivities(activities: any[]): any {
    return { optimized: true, approach: 'aggressive_scheduling' };
  }

  private generateComplexityRecommendations(complexityGroups: any): string[] {
    const recommendations = [];
    
    if (complexityGroups.high?.length > 0) {
      recommendations.push('Asignar recursos especializados para actividades de alta complejidad');
    }
    
    if (complexityGroups.medium?.length > complexityGroups.low?.length) {
      recommendations.push('Considerar paralelización de actividades de complejidad media');
    }
    
    return recommendations;
  }
}