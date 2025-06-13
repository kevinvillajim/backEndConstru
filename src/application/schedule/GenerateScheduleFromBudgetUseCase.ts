// src/application/schedule/GenerateScheduleFromBudgetUseCase.ts
import { CalculationBudgetRepository } from '../../domain/repositories/CalculationBudgetRepository';
import { CalculationScheduleRepository } from '../../domain/repositories/CalculationScheduleRepository';
import { ScheduleTemplateRepository } from '../../domain/repositories/ScheduleTemplateRepository';
import { ScheduleActivityRepository } from '../../domain/repositories/ScheduleActivityRepository';
import { CalculationSchedule } from '../../domain/models/calculation/CalculationSchedule';
import { ScheduleActivity, ActivityType, ActivityStatus, ActivityPriority, ConstructionTrade, ActivityDependency } from '../../domain/models/calculation/ScheduleActivity';
import { CalculationScheduleEntity, ScheduleStatus } from '../../infrastructure/database/entities/CalculationScheduleEntity';
import { ScheduleActivityEntity } from '../../infrastructure/database/entities/ScheduleActivityEntity';

export interface GenerateScheduleRequest {
  budgetId: string;
  templateId?: string;
  projectStartDate: Date;
  workingDaysPerWeek?: number;
  dailyWorkingHours?: number;
  includeWeatherBuffer?: boolean;
  customActivities?: {
    name: string;
    duration: number;
    dependencies?: string[];
  }[];
}

export interface GenerateScheduleResponse {
  schedule: CalculationSchedule;
  activities: ScheduleActivity[];
  criticalPath: string[];
  estimatedCompletionDate: Date;
  totalDuration: number;
  recommendations: string[];
}

export class GenerateScheduleFromBudgetUseCase {
  constructor(
    private budgetRepository: CalculationBudgetRepository,
    private scheduleRepository: CalculationScheduleRepository,
    private templateRepository: ScheduleTemplateRepository,
    private activityRepository: ScheduleActivityRepository
  ) {}

  async execute(request: GenerateScheduleRequest): Promise<GenerateScheduleResponse> {
    // 1. Obtener el presupuesto
    const budget = await this.budgetRepository.findById(request.budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }

    // 2. Obtener template apropiado
    let template;
    if (request.templateId) {
      template = await this.templateRepository.findById(request.templateId);
    } else {
      // Buscar template por tipo de construcción y zona
      const templates = await this.templateRepository.findByFilters({
        constructionType: budget.projectType,
        geographicalZone: budget.geographicalZone,
        scope: 'SYSTEM',
        isVerified: true
      });
      template = templates[0]; // Usar el primer template verificado
    }

    if (!template) {
      throw new Error('No suitable template found');
    }

    // 3. Crear cronograma base
    const scheduleEntity = await this.createScheduleEntityFromBudget(budget, template, request);

    // 4. Generar actividades basadas en el presupuesto
    const activityEntities = await this.generateActivityEntitiesFromBudget(
      budget, 
      template, 
      scheduleEntity.id, 
      request
    );

    // 5. Calcular dependencias y fechas
    const scheduledActivityEntities = this.calculateActivityDates(activityEntities, request.projectStartDate);

    // 6. Identificar ruta crítica
    const criticalPath = this.calculateCriticalPath(scheduledActivityEntities);

    // 7. Generar recomendaciones
    const recommendations = this.generateRecommendations(budget, template, scheduledActivityEntities);

    // 8. Guardar en base de datos
    const savedSchedule = await this.scheduleRepository.save(scheduleEntity);
    const savedActivities = await this.activityRepository.saveMany(scheduledActivityEntities);

    const estimatedCompletionDate = new Date(request.projectStartDate);
    estimatedCompletionDate.setDate(
      estimatedCompletionDate.getDate() + scheduleEntity.totalPlannedDuration
    );

    // 9. Convertir entidades a modelos de dominio para la respuesta
    const schedule = this.convertScheduleEntityToDomain(savedSchedule);
    const activities = savedActivities.map(entity => this.convertActivityEntityToDomain(entity));

    return {
      schedule,
      activities,
      criticalPath,
      estimatedCompletionDate,
      totalDuration: scheduleEntity.totalPlannedDuration,
      recommendations
    };
  }

  private async createScheduleEntityFromBudget(budget: any, template: any, request: GenerateScheduleRequest): Promise<CalculationScheduleEntity> {
    const scheduleEntity = new CalculationScheduleEntity();
    
    scheduleEntity.name = `Cronograma - ${budget.name}`;
    scheduleEntity.description = `Cronograma generado automáticamente desde presupuesto`;
    scheduleEntity.status = ScheduleStatus.DRAFT;
    scheduleEntity.constructionType = budget.projectType;
    scheduleEntity.geographicalZone = budget.geographicalZone;
    scheduleEntity.projectId = budget.projectId;
    scheduleEntity.calculationBudgetId = budget.id;
    scheduleEntity.totalScheduleCost = budget.total;
    scheduleEntity.totalPlannedDuration = template.estimatedDurationDays;
    scheduleEntity.plannedStartDate = request.projectStartDate;
    scheduleEntity.plannedEndDate = new Date(request.projectStartDate.getTime() + (template.estimatedDurationDays * 24 * 60 * 60 * 1000));
    scheduleEntity.progressPercentage = 0;
    scheduleEntity.actualSpentCost = 0;
    scheduleEntity.costVariancePercentage = 0;
    scheduleEntity.totalPlannedDuration = template.estimatedDurationDays;
    scheduleEntity.totalActualDuration = 0;
    scheduleEntity.isOptimized = false;
    scheduleEntity.isActive = true;
    scheduleEntity.createdAt = new Date();
    scheduleEntity.updatedAt = new Date();

    // Configurar factores climáticos
    scheduleEntity.climateFactors = {
      rainySeasonImpact: request.includeWeatherBuffer ? 15 : 0,
      temperatureRange: { min: 15, max: 30 },
      humidityImpact: 5,
      altitudeAdjustment: 0
    };

    // Configurar factores laborales
    scheduleEntity.laborFactors = {
      standardWorkHours: request.dailyWorkingHours || 8,
      overtimeMultiplier: 1.5,
      weekendMultiplier: 2.0,
      holidayList: [],
      productivityFactors: template.standardResources?.workforce || {}
    };

    // Configurar restricciones de recursos
    scheduleEntity.resourceConstraints = {
      maxConcurrentActivities: 5,
      criticalResourceLimits: {},
      bufferTimePercentage: request.includeWeatherBuffer ? 15 : 0
    };

    // Configurar alertas
    scheduleEntity.alertSettings = {
      delayThresholdDays: 2,
      budgetVarianceAlerts: true,
      criticalPathMonitoring: true,
      resourceConflictAlerts: true,
      weatherImpactAlerts: request.includeWeatherBuffer || false
    };

    return scheduleEntity;
  }

  private async generateActivityEntitiesFromBudget(
    budget: any, 
    template: any, 
    scheduleId: string, 
    request: GenerateScheduleRequest
  ): Promise<ScheduleActivityEntity[]> {
    const activities: ScheduleActivityEntity[] = [];
    
    // Crear actividades basadas en los ítems del presupuesto
    for (const lineItem of budget.lineItems || []) {
      const activity = this.createActivityEntityFromBudgetItem(lineItem, scheduleId, template);
      activities.push(activity);
    }

    // Agregar actividades personalizadas si las hay
    if (request.customActivities) {
      for (const customActivity of request.customActivities) {
        const activity = this.createCustomActivityEntity(customActivity, scheduleId);
        activities.push(activity);
      }
    }

    // Agregar actividades de template que no están en el presupuesto
    const templateActivities = await this.getTemplateActivities(template.id);
    for (const templateActivity of templateActivities) {
      if (!activities.find(a => a.name.toLowerCase().includes(templateActivity.name.toLowerCase()))) {
        const activity = this.createActivityEntityFromTemplate(templateActivity, scheduleId);
        activities.push(activity);
      }
    }

    return activities;
  }

  private createActivityEntityFromBudgetItem(lineItem: any, scheduleId: string, template: any): ScheduleActivityEntity {
    const activity = new ScheduleActivityEntity();
    
    // Determinar tipo de actividad basado en la descripción del ítem
    const activityType = this.determineActivityType(lineItem.description);
    const trade = this.determinePrimaryTrade(lineItem.description);
    
    // Calcular duración basada en cantidad y productividad
    const duration = this.calculateActivityDuration(lineItem, template);

    activity.scheduleId = scheduleId;
    activity.name = lineItem.description;
    activity.description = `Actividad generada desde ítem de presupuesto: ${lineItem.description}`;
    activity.status = ActivityStatus.NOT_STARTED;
    activity.activityType = activityType;
    activity.priority = ActivityPriority.NORMAL;
    activity.primaryTrade = trade;
    activity.plannedStartDate = new Date();
    activity.plannedEndDate = new Date();
    activity.plannedDurationDays = duration;
    activity.actualStartDate = null;
    activity.actualEndDate = null;
    activity.actualDurationDays = 0;
    activity.progressPercentage = 0;
    activity.plannedTotalCost = lineItem.subtotal || lineItem.totalCost || 0;
    activity.actualTotalCost = 0;
    activity.plannedLaborCost = 0;
    activity.plannedMaterialCost = lineItem.subtotal || 0;
    activity.plannedEquipmentCost = 0;
    activity.actualLaborCost = 0;
    activity.actualMaterialCost = 0;
    activity.actualEquipmentCost = 0;
    activity.earlyStartDate = null;
    activity.earlyFinishDate = null;
    activity.lateStartDate = null;
    activity.lateFinishDate = null;
    activity.totalFloat = 0;
    activity.freeFloat = 0;
    activity.isCriticalPath = false;
    activity.isMilestone = false;
    activity.isActive = true;
    activity.createdAt = new Date();
    activity.updatedAt = new Date();

    // Configurar cantidades de trabajo
    activity.workQuantities = {
      plannedQuantity: lineItem.quantity || 1,
      completedQuantity: 0,
      unit: lineItem.unitOfMeasure || 'unit',
      remainingQuantity: lineItem.quantity || 1,
      productivity: 1.0
    };

    // Configurar trabajo
    activity.workConfiguration = {
      workingHours: {
        dailyHours: 8,
        startTime: '08:00',
        endTime: '17:00',
        workingDays: [1, 2, 3, 4, 5, 6] // Lunes a Sábado
      },
      shifts: [{
        shiftNumber: 1,
        startTime: '08:00',
        endTime: '17:00',
        workers: 2
      }],
      overtime: {
        maxOvertimeHours: 2,
        overtimeRate: 1.5
      }
    };

    // Configurar dependencias (inicialmente vacías)
    activity.predecessors = [];
    activity.successors = [];

    // Configurar factores ambientales
    activity.environmentalFactors = {
      weatherSensitive: lineItem.description.toLowerCase().includes('exterior') || 
                       lineItem.description.toLowerCase().includes('pintura'),
      seasonalAdjustments: [],
      workingConditions: {
        indoorWork: !lineItem.description.toLowerCase().includes('exterior'),
        heightWork: lineItem.description.toLowerCase().includes('altura') || 
                   lineItem.description.toLowerCase().includes('techo'),
        noiseSensitive: false,
        dustSensitive: false
      }
    };

    // Configurar ubicación
    activity.location = {
      area: 'General',
      floor: '1',
      zone: 'A',
      coordinates: { x: 0, y: 0, z: 0 }
    };

    // Configurar campos personalizados
    activity.customFields = {
      budgetLineItemId: lineItem.id,
      materialCost: lineItem.subtotal || 0,
      laborCost: 0,
      fromBudget: true
    };

    return activity;
  }

  private determineActivityType(description: string): ActivityType {
    const desc = description.toLowerCase();
    
    if (desc.includes('excavación') || desc.includes('movimiento de tierra')) {
      return ActivityType.EXCAVATION;
    } else if (desc.includes('fundación') || desc.includes('cimiento')) {
      return ActivityType.FOUNDATION;
    } else if (desc.includes('estructura') || desc.includes('columnas') || desc.includes('vigas')) {
      return ActivityType.STRUCTURE;
    } else if (desc.includes('mampostería') || desc.includes('paredes') || desc.includes('muros')) {
      return ActivityType.MASONRY;
    } else if (desc.includes('techo') || desc.includes('cubierta')) {
      return ActivityType.ROOFING;
    } else if (desc.includes('eléctrico') || desc.includes('electricidad')) {
      return ActivityType.ELECTRICAL;
    } else if (desc.includes('plomería') || desc.includes('sanitarios') || desc.includes('agua')) {
      return ActivityType.PLUMBING;
    } else if (desc.includes('acabado') || desc.includes('pintura') || desc.includes('piso')) {
      return ActivityType.FINISHING;
    } else if (desc.includes('limpieza')) {
      return ActivityType.CLEANUP;
    }
    
    return ActivityType.OTHER;
  }

  private determinePrimaryTrade(description: string): ConstructionTrade {
    const desc = description.toLowerCase();
    
    if (desc.includes('albañil') || desc.includes('mampostería')) {
      return ConstructionTrade.MASONRY;
    } else if (desc.includes('eléctrico') || desc.includes('electricista')) {
      return ConstructionTrade.ELECTRICAL;
    } else if (desc.includes('plomero') || desc.includes('plomería')) {
      return ConstructionTrade.PLUMBING;
    } else if (desc.includes('carpintero') || desc.includes('madera')) {
      return ConstructionTrade.CARPENTRY;
    } else if (desc.includes('pintor') || desc.includes('pintura')) {
      return ConstructionTrade.PAINTING;
    } else if (desc.includes('soldador') || desc.includes('hierro')) {
      return ConstructionTrade.WELDING;
    }
    
    return ConstructionTrade.GENERAL;
  }

  private calculateActivityDuration(lineItem: any, template: any): number {
    // Buscar productividad en el template
    const workforce = template.standardResources?.workforce || {};
    const trade = this.determinePrimaryTrade(lineItem.description);
    
    const tradeConfig = workforce[trade.toLowerCase()];
    if (tradeConfig && tradeConfig.productivity) {
      // Duración = cantidad / (productividad * trabajadores * horas diarias)
      const workersPerDay = tradeConfig.minWorkers;
      const dailyProductivity = tradeConfig.productivity * workersPerDay;
      return Math.ceil((lineItem.quantity || 1) / dailyProductivity);
    }
    
    // Estimación por defecto basada en costo
    // Actividades más caras generalmente toman más tiempo
    const costRatio = (lineItem.subtotal || lineItem.totalCost || 1000) / 1000;
    return Math.max(1, Math.ceil(costRatio * 0.5)); // Mínimo 1 día
  }

  private createCustomActivityEntity(customActivity: any, scheduleId: string): ScheduleActivityEntity {
    const activity = new ScheduleActivityEntity();
    
    activity.scheduleId = scheduleId;
    activity.name = customActivity.name;
    activity.description = `Actividad personalizada: ${customActivity.name}`;
    activity.status = ActivityStatus.NOT_STARTED;
    activity.activityType = ActivityType.OTHER;
    activity.priority = ActivityPriority.NORMAL;
    activity.primaryTrade = ConstructionTrade.GENERAL;
    activity.plannedStartDate = new Date();
    activity.plannedEndDate = new Date();
    activity.plannedDurationDays = customActivity.duration;
    activity.actualStartDate = null;
    activity.actualEndDate = null;
    activity.actualDurationDays = 0;
    activity.progressPercentage = 0;
    activity.plannedTotalCost = 0;
    activity.actualTotalCost = 0;
    activity.plannedLaborCost = 0;
    activity.plannedMaterialCost = 0;
    activity.plannedEquipmentCost = 0;
    activity.actualLaborCost = 0;
    activity.actualMaterialCost = 0;
    activity.actualEquipmentCost = 0;
    activity.earlyStartDate = null;
    activity.earlyFinishDate = null;
    activity.lateStartDate = null;
    activity.lateFinishDate = null;
    activity.totalFloat = 0;
    activity.freeFloat = 0;
    activity.isCriticalPath = false;
    activity.isMilestone = false;
    activity.isActive = true;
    activity.createdAt = new Date();
    activity.updatedAt = new Date();

    activity.workQuantities = {
      plannedQuantity: 1,
      completedQuantity: 0,
      unit: 'global',
      remainingQuantity: 1,
      productivity: 1.0
    };

    activity.workConfiguration = {
      workingHours: {
        dailyHours: 8,
        startTime: '08:00',
        endTime: '17:00',
        workingDays: [1, 2, 3, 4, 5, 6]
      },
      shifts: [{
        shiftNumber: 1,
        startTime: '08:00',
        endTime: '17:00',
        workers: 1
      }],
      overtime: {
        maxOvertimeHours: 2,
        overtimeRate: 1.5
      }
    };

    // Configurar dependencias desde customActivity
    activity.predecessors = (customActivity.dependencies || []).map((depId: string) => ({
      activityId: depId,
      dependencyType: 'FS' as const,
      lagDays: 0
    }));
    activity.successors = [];

    // Configurar factores ambientales
    activity.environmentalFactors = {
      weatherSensitive: false,
      seasonalAdjustments: [],
      workingConditions: {
        indoorWork: true,
        heightWork: false,
        noiseSensitive: false,
        dustSensitive: false
      }
    };

    activity.location = {
      area: 'General',
      floor: '1',
      zone: 'A',
      coordinates: { x: 0, y: 0, z: 0 }
    };

    activity.customFields = { 
      isCustomActivity: true 
    };

    return activity;
  }

  private async getTemplateActivities(templateId: string): Promise<any[]> {
    // Implementar lógica para obtener actividades del template
    // Por ahora retornamos array vacío
    return [];
  }

  private createActivityEntityFromTemplate(templateActivity: any, scheduleId: string): ScheduleActivityEntity {
    const activity = new ScheduleActivityEntity();
    
    activity.scheduleId = scheduleId;
    activity.name = templateActivity.name;
    activity.description = templateActivity.description;
    activity.status = ActivityStatus.NOT_STARTED;
    activity.activityType = templateActivity.type || ActivityType.OTHER;
    activity.priority = ActivityPriority.NORMAL;
    activity.primaryTrade = templateActivity.primaryTrade || ConstructionTrade.GENERAL;
    activity.plannedStartDate = new Date();
    activity.plannedEndDate = new Date();
    activity.plannedDurationDays = templateActivity.estimatedDurationDays;
    activity.actualStartDate = null;
    activity.actualEndDate = null;
    activity.actualDurationDays = 0;
    activity.progressPercentage = 0;
    activity.plannedTotalCost = templateActivity.estimatedCost || 0;
    activity.actualTotalCost = 0;
    activity.plannedLaborCost = 0;
    activity.plannedMaterialCost = 0;
    activity.plannedEquipmentCost = 0;
    activity.actualLaborCost = 0;
    activity.actualMaterialCost = 0;
    activity.actualEquipmentCost = 0;
    activity.earlyStartDate = null;
    activity.earlyFinishDate = null;
    activity.lateStartDate = null;
    activity.lateFinishDate = null;
    activity.totalFloat = Math.ceil(templateActivity.estimatedDurationDays * (templateActivity.bufferPercentage || 0) / 100);
    activity.freeFloat = 0;
    activity.isCriticalPath = false;
    activity.isMilestone = false;
    activity.isActive = true;
    activity.createdAt = new Date();
    activity.updatedAt = new Date();

    activity.workQuantities = {
      plannedQuantity: 1,
      completedQuantity: 0,
      unit: 'global',
      remainingQuantity: 1,
      productivity: 1.0
    };

    activity.workConfiguration = {
      workingHours: {
        dailyHours: 8,
        startTime: '08:00',
        endTime: '17:00',
        workingDays: [1, 2, 3, 4, 5, 6]
      },
      shifts: [{
        shiftNumber: 1,
        startTime: '08:00',
        endTime: '17:00',
        workers: 2
      }],
      overtime: {
        maxOvertimeHours: 2,
        overtimeRate: 1.5
      }
    };

    activity.predecessors = (templateActivity.predecessors || []).map((depId: string) => ({
      activityId: depId,
      dependencyType: 'FS' as const,
      lagDays: 0
    }));
    activity.successors = (templateActivity.successors || []).map((depId: string) => ({
      activityId: depId,
      dependencyType: 'FS' as const,
      lagDays: 0
    }));

    // Configurar factores ambientales
    activity.environmentalFactors = {
      weatherSensitive: templateActivity.weatherSensitive || false,
      seasonalAdjustments: templateActivity.seasonalAdjustments || [],
      workingConditions: {
        indoorWork: templateActivity.indoorWork !== false,
        heightWork: templateActivity.heightWork || false,
        noiseSensitive: templateActivity.noiseSensitive || false,
        dustSensitive: templateActivity.dustSensitive || false
      }
    };

    activity.location = {
      area: 'General',
      floor: '1',
      zone: 'A',
      coordinates: { x: 0, y: 0, z: 0 }
    };

    // Configurar control de calidad si está disponible en el template
    if (templateActivity.qualityChecks) {
      activity.qualityControl = {
        inspectionRequired: true,
        inspectionPoints: templateActivity.qualityChecks.map((check: any) => check.checkName),
        qualityStandards: templateActivity.qualityChecks.map((check: any) => check.description),
        testingRequired: templateActivity.qualityChecks.some((check: any) => check.required),
        approvalRequired: true,
        reworkProbability: 0.05
      };
    }

    activity.customFields = { 
      fromTemplate: true,
      templateActivityId: templateActivity.id
    };

    return activity;
  }

  private calculateActivityDates(activities: ScheduleActivityEntity[], startDate: Date): ScheduleActivityEntity[] {
    // Ordenar actividades por dependencias (topological sort)
    const sortedActivities = this.topologicalSort(activities);
    
    let currentDate = new Date(startDate);
    
    for (const activity of sortedActivities) {
      // Calcular fecha de inicio basada en predecesores
      const startDateForActivity = this.calculateEarliestStartDate(activity, sortedActivities, currentDate);
      
      activity.plannedStartDate = startDateForActivity;
      
      // Calcular fecha de fin
      const endDate = new Date(startDateForActivity);
      endDate.setDate(endDate.getDate() + activity.plannedDurationDays);
      activity.plannedEndDate = endDate;
      
      // Actualizar fecha actual si esta actividad termina más tarde
      if (endDate > currentDate) {
        currentDate = new Date(endDate);
      }
    }
    
    return sortedActivities;
  }

  private topologicalSort(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    // Implementación simple de topological sort
    const sorted: ScheduleActivityEntity[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();
    
    const visit = (activity: ScheduleActivityEntity) => {
      if (temp.has(activity.id)) {
        throw new Error('Circular dependency detected');
      }
      if (visited.has(activity.id)) {
        return;
      }
      
      temp.add(activity.id);
      
      // Visitar predecesores primero
      if (activity.predecessors) {
        for (const pred of activity.predecessors) {
          const predActivity = activities.find(a => a.id === pred.activityId);
          if (predActivity) {
            visit(predActivity);
          }
        }
      }
      
      temp.delete(activity.id);
      visited.add(activity.id);
      sorted.push(activity);
    };
    
    for (const activity of activities) {
      if (!visited.has(activity.id)) {
        visit(activity);
      }
    }
    
    return sorted;
  }

  private calculateEarliestStartDate(
    activity: ScheduleActivityEntity, 
    allActivities: ScheduleActivityEntity[], 
    projectStartDate: Date
  ): Date {
    let earliestStart = new Date(projectStartDate);
    
    if (activity.predecessors) {
      for (const pred of activity.predecessors) {
        const predecessor = allActivities.find(a => a.id === pred.activityId);
        if (predecessor && predecessor.plannedEndDate) {
          const predEndDate = new Date(predecessor.plannedEndDate);
          predEndDate.setDate(predEndDate.getDate() + pred.lagDays);
          if (predEndDate > earliestStart) {
            earliestStart = predEndDate;
          }
        }
      }
    }
    
    return earliestStart;
  }

  private calculateCriticalPath(activities: ScheduleActivityEntity[]): string[] {
    // Implementación simplificada del Critical Path Method
    const criticalPath: string[] = [];
    
    // Calcular forward pass (earliest times)
    for (const activity of activities) {
      // Ya calculado en calculateActivityDates
    }
    
    // Calcular backward pass (latest times) 
    const projectEndDate = Math.max(...activities.map(a => a.plannedEndDate.getTime()));
    
    for (let i = activities.length - 1; i >= 0; i--) {
      const activity = activities[i];
      // Calcular latest start/finish dates
      // Si total slack = 0, está en ruta crítica
      if (this.calculateTotalSlack(activity, activities) === 0) {
        activity.isCriticalPath = true;
        criticalPath.unshift(activity.id);
      }
    }
    
    return criticalPath;
  }

  private calculateTotalSlack(activity: ScheduleActivityEntity, allActivities: ScheduleActivityEntity[]): number {
    // Simplified slack calculation
    // Total Slack = Latest Start - Earliest Start
    // Por ahora retornamos 0 para simplificar
    return 0;
  }

  private generateRecommendations(budget: any, template: any, activities: ScheduleActivityEntity[]): string[] {
    const recommendations: string[] = [];
    
    // Recomendación por duración total
    const totalDuration = Math.max(...activities.map(a => a.plannedEndDate.getTime())) - 
                         Math.min(...activities.map(a => a.plannedStartDate.getTime()));
    const durationDays = totalDuration / (24 * 60 * 60 * 1000);
    
    if (durationDays > template.estimatedDurationDays * 1.2) {
      recommendations.push('El cronograma generado excede la duración estimada del template en más del 20%. Considere revisar las dependencias y duraciones de actividades.');
    }
    
    // Recomendación por actividades críticas
    const criticalActivities = activities.filter(a => a.isCriticalPath);
    if (criticalActivities.length > activities.length * 0.3) {
      recommendations.push('Más del 30% de las actividades están en la ruta crítica. Considere paralelizar actividades o agregar recursos.');
    }
    
    // Recomendación por recursos
    const resourceConflicts = this.detectResourceConflicts(activities);
    if (resourceConflicts.length > 0) {
      recommendations.push(`Se detectaron ${resourceConflicts.length} conflictos de recursos. Revise la asignación de personal y equipos.`);
    }
    
    return recommendations;
  }

  private detectResourceConflicts(activities: ScheduleActivityEntity[]): any[] {
    // Simplified resource conflict detection
    return [];
  }

  // Métodos de conversión entre entidades y modelos de dominio
  private convertScheduleEntityToDomain(entity: CalculationScheduleEntity): CalculationSchedule {
    const schedule = new CalculationSchedule();
    
    schedule.id = entity.id;
    schedule.name = entity.name;
    schedule.description = entity.description;
    schedule.status = entity.status;
    schedule.constructionType = entity.constructionType;
    schedule.geographicalZone = entity.geographicalZone;
    schedule.projectId = entity.projectId;
    schedule.calculationBudgetId = entity.calculationBudgetId;
    schedule.plannedStartDate = entity.plannedStartDate;
    schedule.plannedEndDate = entity.plannedEndDate;
    schedule.actualStartDate = entity.actualStartDate;
    schedule.actualEndDate = entity.actualEndDate;
    schedule.progressPercentage = entity.progressPercentage;
    schedule.totalPlannedDuration = entity.totalPlannedDuration;
    schedule.totalActualDuration = entity.totalActualDuration;
    schedule.estimatedDurationDays = entity.totalPlannedDuration;
    schedule.climateFactors = entity.climateFactors;
    schedule.laborFactors = entity.laborFactors;
    schedule.resourceConstraints = entity.resourceConstraints;
    schedule.alertSettings = entity.alertSettings;
    schedule.totalScheduleCost = entity.totalScheduleCost;
    schedule.actualSpentCost = entity.actualSpentCost;
    schedule.costVariancePercentage = entity.costVariancePercentage;
    schedule.baseTemplateId = entity.baseTemplateId;
    schedule.isOptimized = entity.isOptimized;
    schedule.optimizationParameters = entity.optimizationParameters;
    schedule.criticalPath = entity.criticalPath;
    schedule.customFields = entity.customFields;
    schedule.isActive = entity.isActive;
    schedule.createdAt = entity.createdAt;
    schedule.updatedAt = entity.updatedAt;
    
    return schedule;
  }

  private convertActivityEntityToDomain(entity: ScheduleActivityEntity): ScheduleActivity {
    return {
      id: entity.id,
      scheduleId: entity.scheduleId,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      activityType: entity.activityType,
      priority: entity.priority,
      primaryTrade: entity.primaryTrade,
      plannedStartDate: entity.plannedStartDate,
      plannedEndDate: entity.plannedEndDate,
      plannedDurationDays: entity.plannedDurationDays,
      actualStartDate: entity.actualStartDate,
      actualEndDate: entity.actualEndDate,
      actualDurationDays: entity.actualDurationDays,
      earlyStartDate: entity.earlyStartDate,
      earlyFinishDate: entity.earlyFinishDate,
      lateStartDate: entity.lateStartDate,
      lateFinishDate: entity.lateFinishDate,
      totalFloat: entity.totalFloat,
      freeFloat: entity.freeFloat,
      progressPercentage: entity.progressPercentage,
      isCriticalPath: entity.isCriticalPath,
      isMilestone: entity.isMilestone,
      workConfiguration: entity.workConfiguration,
      workQuantities: entity.workQuantities,
      plannedLaborCost: entity.plannedLaborCost,
      plannedMaterialCost: entity.plannedMaterialCost,
      plannedEquipmentCost: entity.plannedEquipmentCost,
      plannedTotalCost: entity.plannedTotalCost,
      actualLaborCost: entity.actualLaborCost,
      actualMaterialCost: entity.actualMaterialCost,
      actualEquipmentCost: entity.actualEquipmentCost,
      actualTotalCost: entity.actualTotalCost,
      predecessors: entity.predecessors,
      successors: entity.successors,
      alertConfiguration: entity.alertConfiguration,
      environmentalFactors: entity.environmentalFactors,
      qualityControl: entity.qualityControl,
      location: entity.location ? {
        ...entity.location,
        indoorWork: entity.location.area !== 'Exterior' && 
                   !entity.name.toLowerCase().includes('exterior') &&
                   !entity.description?.toLowerCase().includes('exterior')
      } : undefined,
      resourceRequirements: entity.getResourceRequirements(),
      customFields: entity.customFields,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }
}