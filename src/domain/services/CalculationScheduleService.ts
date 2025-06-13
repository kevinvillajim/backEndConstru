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
          if (Array.isArray(groupActivities)) {
            optimizations[complexity] = this.optimizeHighComplexityActivities(groupActivities);
          } else {
            console.warn(`Group activities for complexity "${complexity}" are not an array.`);
            optimizations[complexity] = { error: 'Invalid group activities' };
          }
          break;
        case 'medium':
          if (Array.isArray(groupActivities)) {
            optimizations[complexity] = this.optimizeMediumComplexityActivities(groupActivities);
          } else {
            console.warn(`Group activities for complexity "${complexity}" are not an array.`);
            optimizations[complexity] = { error: 'Invalid group activities' };
          }
          break;
        case 'low':
          if (Array.isArray(groupActivities)) {
            optimizations[complexity] = this.optimizeLowComplexityActivities(groupActivities);
          } else {
            console.warn(`Group activities for complexity "${complexity}" are not an array.`);
            optimizations[complexity] = { error: 'Invalid group activities' };
          }
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

  // MÉTODO CORREGIDO: extractTechnicalActivities con validación de tipos
  private extractTechnicalActivities(calculationResult: any): any[] {
    const activities: any[] = [];

    try {
      // Validar que calculationResult y calculationResult.calculations existan
      if (!calculationResult || !calculationResult.calculations) {
        console.warn('Calculation result or calculations not found, creating basic activities');
        return this.createBasicActivitiesFromResults(calculationResult?.results || {});
      }

      // Extraer actividades de cálculos estructurales - CON VALIDACIÓN EXPLÍCITA DE TIPO
      const structuralData = calculationResult.calculations.structural;
      if (this.isValidCalculationData(structuralData)) {
        const structuralActivities = this.extractStructuralActivities(structuralData as any);
        if (Array.isArray(structuralActivities)) {
          activities.push(...structuralActivities);
        }
      }

      // Extraer actividades de cálculos de materiales - CON VALIDACIÓN EXPLÍCITA DE TIPO
      const materialsData = calculationResult.calculations.materials;
      if (this.isValidCalculationData(materialsData)) {
        const materialActivities = this.extractMaterialActivities(materialsData as any);
        if (Array.isArray(materialActivities)) {
          activities.push(...materialActivities);
        }
      }

      // Extraer actividades de instalaciones - CON VALIDACIÓN EXPLÍCITA DE TIPO
      const installationsData = calculationResult.calculations.installations;
      if (this.isValidCalculationData(installationsData)) {
        const installationActivities = this.extractInstallationActivities(installationsData as any);
        if (Array.isArray(installationActivities)) {
          activities.push(...installationActivities);
        }
      }

      // Si no hay datos específicos, crear actividades básicas desde el resultado
      if (activities.length === 0 && calculationResult?.results) {
        activities.push(...this.createBasicActivitiesFromResults(calculationResult.results));
      }

    } catch (error) {
      console.warn('Error extracting technical activities:', error);
      // Devolver al menos una actividad básica para evitar errores
      activities.push(this.createDefaultActivity(calculationResult));
    }

    return activities;
  }

  // MÉTODO AUXILIAR: Validar que los datos de cálculo sean válidos
  private isValidCalculationData(data: unknown): data is Record<string, any> {
    return data != null && typeof data === 'object' && !Array.isArray(data);
  }

  // MÉTODO CORREGIDO: extractStructuralActivities con validación robusta
  private extractStructuralActivities(structuralCalc: unknown): any[] {
    const activities: any[] = [];

    try {
      // Validar entrada con type guard
      if (!this.isValidCalculationData(structuralCalc)) {
        console.warn('Invalid structural calculation data');
        return activities;
      }

      // Cast seguro después de validación
      const structuralData = structuralCalc as Record<string, any>;

      // Actividades de fundación
      if (this.isValidCalculationData(structuralData.foundation)) {
        const foundationData = structuralData.foundation as Record<string, any>;
        // Acceso directo con cast explícito
        const foundationCompliance = foundationData.necCompliance;
        
        activities.push({
          name: 'Excavación y preparación de fundación',
          type: 'FOUNDATION',
          duration: this.calculateFoundationDuration(foundationData),
          dependencies: [],
          technicalRequirements: foundationData.specifications || {},
          necReferences: this.ensureArray(foundationCompliance as any)
        });
      }

      // Actividades estructurales
      if (structuralData.columns || structuralData.beams) {
        activities.push({
          name: 'Construcción de estructura',
          type: 'STRUCTURE',
          duration: this.calculateStructureDuration(structuralData),
          dependencies: ['foundation'],
          technicalRequirements: this.combineStructuralRequirements(structuralData),
          necReferences: this.extractNECReferences(structuralData)
        });
      }

    } catch (error) {
      console.warn('Error extracting structural activities:', error);
    }

    return activities;
  }

  // MÉTODO CORREGIDO: extractMaterialActivities con validación robusta
  private extractMaterialActivities(materialCalc: unknown): any[] {
    const activities: any[] = [];

    try {
      // Validar entrada con type guard
      if (!this.isValidCalculationData(materialCalc)) {
        console.warn('Invalid material calculation data');
        return activities;
      }

      // Cast seguro después de validación
      const materialData = materialCalc as Record<string, any>;

      // Acceso directo con cast explícito
      const materialsValue = materialData.materials;
      const materials = this.ensureArray(materialsValue as any);
      
      activities.push(...materials.map(material => ({
        name: `Suministro e instalación de ${material?.name || 'Material'}`,
        type: 'MATERIAL_INSTALLATION',
        duration: this.calculateMaterialDuration(material),
        dependencies: this.determineMaterialDependencies(material),
        technicalRequirements: material?.specifications || {},
        quantityRequired: material?.quantity || 1,
        unit: material?.unit || 'unit'
      })));

    } catch (error) {
      console.warn('Error extracting material activities:', error);
    }

    return activities;
  }

  // MÉTODO CORREGIDO: extractInstallationActivities con validación robusta
  private extractInstallationActivities(installationCalc: unknown): any[] {
    const activities: any[] = [];

    try {
      // Validar entrada con type guard
      if (!this.isValidCalculationData(installationCalc)) {
        console.warn('Invalid installation calculation data');
        return activities;
      }

      // Cast seguro después de validación
      const installationData = installationCalc as Record<string, any>;
  
      // Instalaciones eléctricas con acceso directo y cast explícito
      const electricalValue = installationData.electrical;
      if (electricalValue) {
        const electricalData = this.ensureArray(electricalValue as any);
        
        activities.push(...electricalData.map((electrical: any) => ({
          name: 'Instalaciones eléctricas',
          type: 'ELECTRICAL',
          duration: this.calculateElectricalDuration(electrical),
          dependencies: ['structure'],
          technicalRequirements: electrical?.specifications || {}
        })));
      }
  
      // Instalaciones sanitarias con acceso directo y cast explícito
      const plumbingValue = installationData.plumbing;
      if (plumbingValue) {
        const plumbingData = this.ensureArray(plumbingValue as any);
        
        activities.push(...plumbingData.map((plumbing: any) => ({
          name: 'Instalaciones sanitarias',
          type: 'PLUMBING', 
          duration: this.calculatePlumbingDuration(plumbing),
          dependencies: ['structure'],
          technicalRequirements: plumbing?.specifications || {}
        })));
      }

    } catch (error) {
      console.warn('Error extracting installation activities:', error);
    }
  
    return activities;
  }

  // MÉTODO MEJORADO: ensureArray con validación más robusta
  private ensureArray(value: unknown): any[] {
    // Si ya es un array, devolverlo
    if (Array.isArray(value)) {
      return value;
    }
    
    // Si es null o undefined, devolver array vacío
    if (value == null) {
      return [];
    }
    
    // Si es un objeto, intentar convertirlo
    if (typeof value === 'object') {
      // Si tiene una propiedad que parece ser un array
      if ('items' in value && Array.isArray((value as any).items)) {
        return (value as any).items;
      }
      
      // Si tiene propiedades numéricas como un array-like object
      const keys = Object.keys(value);
      if (keys.length > 0 && keys.every(key => !isNaN(Number(key)))) {
        return Object.values(value);
      }
      
      // Convertir objeto a array de sus valores
      return Object.values(value).filter(item => item != null);
    }
    
    // Si es un valor primitivo, envolverlo en array
    return [value];
  }

  // MÉTODO AUXILIAR: Obtener valor de forma segura con tipo específico
  private safeGet(obj: any, path: string, defaultValue: any = null): any {
    try {
      const result = path.split('.').reduce((current, key) => current?.[key], obj);
      return result !== undefined ? result : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private createBasicActivitiesFromResults(results: any): any[] {
    const activities: any[] = [];
    
    if (results && typeof results === 'object') {
      Object.entries(results).forEach(([key, value]) => {
        if (typeof value === 'number' && value > 0) {
          activities.push({
            name: `Actividad para ${key}`,
            type: 'OTHER',
            duration: Math.ceil(value / 10), // Estimación simple
            dependencies: [],
            technicalRequirements: { [key]: value },
            data: { [key]: value }
          });
        }
      });
    }
    
    return activities;
  }

  // NUEVO MÉTODO: Crear actividad por defecto
  private createDefaultActivity(calculationResult: any): any {
    return {
      name: `Actividad del cálculo ${calculationResult?.name || 'Sin nombre'}`,
      type: 'OTHER',
      duration: 1,
      dependencies: [],
      technicalRequirements: {},
      quantityRequired: 1,
      unit: 'unit'
    };
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
    // Validar entrada
    if (!foundation || typeof foundation !== 'object') return 1;
    
    // Calcular duración basada en complejidad de fundación
    const volume = foundation.volume || 10; // Valor por defecto
    return Math.ceil(volume * 0.5); // días
  }

  private calculateStructureDuration(structural: any): number {
    // Validar entrada
    if (!structural || typeof structural !== 'object') return 15;
    
    // Calcular duración basada en elementos estructurales
    const complexity = this.assessStructuralComplexity(structural);
    return Math.ceil(15 * complexity);
  }

  private calculateMaterialDuration(material: any): number {
    // Validar entrada
    if (!material || typeof material !== 'object') return 1;
    
    // Calcular duración basada en cantidad y tipo de material
    const quantity = material.quantity || 1;
    const complexity = this.getMaterialComplexity(material.type);
    return Math.ceil(quantity * 0.1 * complexity);
  }

  private calculateElectricalDuration(electrical: any): number {
    // Validar entrada
    if (!electrical || typeof electrical !== 'object') return 10;
    
    const complexity = electrical.complexity || 1;
    return Math.ceil(10 * complexity);
  }

  private calculatePlumbingDuration(plumbing: any): number {
    // Validar entrada
    if (!plumbing || typeof plumbing !== 'object') return 8;
    
    const complexity = plumbing.complexity || 1;
    return Math.ceil(8 * complexity);
  }

  // MÉTODOS AUXILIARES AGREGADOS
  private assessStructuralComplexity(structural: any): number {
    let complexity = 1;
    
    if (structural.columns) complexity += 0.3;
    if (structural.beams) complexity += 0.3;
    if (structural.slabs) complexity += 0.2;
    if (structural.specialElements) complexity += 0.5;
    
    return complexity;
  }

  private getMaterialComplexity(materialType: string): number {
    const complexityMap = {
      'concrete': 1.2,
      'steel': 1.5,
      'wood': 1.0,
      'brick': 0.8,
      'default': 1.0
    };
    
    return complexityMap[materialType] || complexityMap['default'];
  }

  private combineStructuralRequirements(structural: any): any {
    return {
      combined: true,
      requirements: Object.keys(structural).map(key => ({
        element: key,
        specifications: structural[key]?.specifications || {},
        necCompliance: structural[key]?.necCompliance || []
      }))
    };
  }

  private extractNECReferences(structural: any): string[] {
    const references: string[] = [];
    
    try {
      // Acceso directo con validación y casting explícito
      if (structural?.foundation?.necCompliance) {
        const foundationCompliance = structural.foundation.necCompliance;
        // Cast explícito para evitar error de tipo unknown
        references.push(...this.ensureArray(foundationCompliance as any));
      }
      
      if (structural?.columns?.necCompliance) {
        const columnsCompliance = structural.columns.necCompliance;
        // Cast explícito para evitar error de tipo unknown
        references.push(...this.ensureArray(columnsCompliance as any));  
      }
      
      if (structural?.beams?.necCompliance) {
        const beamsCompliance = structural.beams.necCompliance;
        // Cast explícito para evitar error de tipo unknown
        references.push(...this.ensureArray(beamsCompliance as any));
      }
      
      // Filtrar solo strings válidos
      const validReferences = references.filter(ref => 
        typeof ref === 'string' && ref.trim().length > 0
      );
      
      // Agregar referencias por defecto si no hay ninguna
      if (validReferences.length === 0) {
        validReferences.push('NEC-SE-DS', 'NEC-SE-HM');
      }
      
      return validReferences;
      
    } catch (error) {
      console.warn('Error extracting NEC references:', error);
      return ['NEC-SE-DS', 'NEC-SE-HM']; // Referencias por defecto
    }
  }

  private determineMaterialDependencies(material: any): string[] {
    const dependencies: string[] = [];
    
    if (!material || typeof material !== 'object') {
      return dependencies;
    }
    
    const materialType = material.type || material.materialType || '';
    
    // Dependencias basadas en tipo de material
    switch (materialType.toLowerCase()) {
      case 'concrete':
      case 'concreto':
        dependencies.push('foundation', 'formwork');
        break;
      case 'steel':
      case 'acero':
        dependencies.push('structure');
        break;
      case 'finishing':
      case 'acabados':
        dependencies.push('structure', 'installations');
        break;
      case 'masonry':
      case 'mamposteria':
        dependencies.push('foundation');
        break;
      default:
        // Sin dependencias específicas para tipos desconocidos
        break;
    }
    
    return dependencies;
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