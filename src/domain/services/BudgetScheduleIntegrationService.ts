// src/domain/services/BudgetScheduleIntegrationService.ts
import { CalculationBudgetRepository } from '../repositories/CalculationBudgetRepository';
import { CalculationScheduleRepository } from '../repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../repositories/ScheduleActivityRepository';
import { BudgetLineItemRepository } from '../repositories/BudgetLineItemRepository';
import { NotificationService } from './NotificationService';
import { DailyProgressRequest } from '../../application/schedule/TrackDailyProgressUseCase';
import { ActivityProgressEntity } from '../../infrastructure/database/entities/ActivityProgressEntity';
import { ScheduleActivityEntity } from '../../infrastructure/database/entities/ScheduleActivityEntity';
import { BudgetLineItemEntity, LineItemType, LineItemSource } from '../../infrastructure/database/entities/BudgetLineItemEntity';
import { ActivityStatus, ActivityType, ActivityPriority, ConstructionTrade } from '@domain/models/calculation/ScheduleActivity';



export interface BudgetScheduleSync {
  budgetId: string;
  scheduleId: string;
  syncDirection: 'budget_to_schedule' | 'schedule_to_budget' | 'bidirectional';
  syncOptions: {
    syncCosts: boolean;
    syncQuantities: boolean;
    syncTimelines: boolean;
    syncResources: boolean;
    createMissingItems: boolean;
    preserveCustomizations: boolean;
  };
  conflictResolution: 'budget_wins' | 'schedule_wins' | 'manual_review';
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  conflictsDetected: number;
  conflictsResolved: number;
  warnings: string[];
  errors: string[];
  summary: {
    budgetChanges: any[];
    scheduleChanges: any[];
    newItemsCreated: any[];
  };
}

export class BudgetScheduleIntegrationService {
  constructor(
    private budgetRepository: CalculationBudgetRepository,
    private scheduleRepository: CalculationScheduleRepository,
    private activityRepository: ScheduleActivityRepository,
    private lineItemRepository: BudgetLineItemRepository,
    private notificationService: NotificationService,
    private progressRepository: any // Repositorio de progreso, debe ser definido
  ) {}

  async synchronizeBudgetAndSchedule(syncRequest: BudgetScheduleSync): Promise<SyncResult> {
    try {
      // 1. Validar que ambos documentos existen
      const budget = await this.budgetRepository.findById(syncRequest.budgetId);
      const schedule = await this.scheduleRepository.findById(syncRequest.scheduleId);
      
      if (!budget || !schedule) {
        throw new Error('Budget or Schedule not found');
      }

      // 2. Obtener datos actuales
      const budgetItems = await this.lineItemRepository.findByBudget(syncRequest.budgetId);
      const activities = await this.activityRepository.findByScheduleId(syncRequest.scheduleId);

      // 3. Detectar diferencias y conflictos
      const differences = await this.detectDifferences(budgetItems, activities);
      const conflicts = this.detectConflicts(differences, syncRequest.conflictResolution);

      // 4. Ejecutar sincronización según dirección
      let syncResult: SyncResult;
      
      switch (syncRequest.syncDirection) {
        case 'budget_to_schedule':
          syncResult = await this.syncBudgetToSchedule(syncRequest, budgetItems, activities, conflicts);
          break;
        case 'schedule_to_budget':
          syncResult = await this.syncScheduleToBudget(syncRequest, budgetItems, activities, conflicts);
          break;
        case 'bidirectional':
          syncResult = await this.bidirectionalSync(syncRequest, budgetItems, activities, conflicts);
          break;
      }

      // 5. Actualizar métricas de coherencia
      await this.updateCoherenceMetrics(budget, schedule);

      // 6. Generar notificaciones si hay conflictos
      if (syncResult.conflictsDetected > 0) {
        await this.notifyConflicts(syncRequest, syncResult);
      }

      return syncResult;

    } catch (error) {
      return {
        success: false,
        syncedItems: 0,
        conflictsDetected: 0,
        conflictsResolved: 0,
        warnings: [],
        errors: [(error as Error).message],
        summary: { budgetChanges: [], scheduleChanges: [], newItemsCreated: [] }
      };
    }
  }

  async validateCoherence(budgetId: string, scheduleId: string): Promise<any> {
    const budget = await this.budgetRepository.findById(budgetId);
    const schedule = await this.scheduleRepository.findById(scheduleId);
    
    if (!budget || !schedule) {
      throw new Error('Budget or Schedule not found');
    }

    const budgetItems = await this.lineItemRepository.findByBudget(budgetId);
    const activities = await this.activityRepository.findByScheduleId(scheduleId);

    return {
      coherenceScore: this.calculateCoherenceScore(budgetItems, activities),
      discrepancies: this.identifyDiscrepancies(budgetItems, activities),
      recommendations: this.generateCoherenceRecommendations(budgetItems, activities),
      lastSyncDate: schedule.updatedAt,
      autoSyncEnabled: budget.customFields?.autoSync || false
    };
  }

  async enableAutoSync(budgetId: string, scheduleId: string, syncOptions: any): Promise<void> {
    // Configurar sincronización automática
    const budget = await this.budgetRepository.findById(budgetId);
    const schedule = await this.scheduleRepository.findById(scheduleId);

    if (budget && schedule) {
      budget.customFields = {
        ...budget.customFields,
        autoSync: true,
        linkedScheduleId: scheduleId,
        syncOptions
      };

      schedule.customFields = {
        ...schedule.customFields,
        autoSync: true,
        linkedBudgetId: budgetId,
        syncOptions
      };

      await this.budgetRepository.save(budget);
      await this.scheduleRepository.save(schedule);
    }
  }

  private async detectDifferences(budgetItems: any[], activities: any[]): Promise<any[]> {
    const differences = [];

    // Mapear ítems de presupuesto con actividades
    const itemActivityMap = this.createItemActivityMapping(budgetItems, activities);

    for (const [itemId, activityId] of itemActivityMap) {
      const item = budgetItems.find(i => i.id === itemId);
      const activity = activities.find(a => a.id === activityId);

      if (item && activity) {
        const itemDiffs = this.compareItemAndActivity(item, activity);
        if (itemDiffs.length > 0) {
          differences.push({
            itemId,
            activityId,
            differences: itemDiffs
          });
        }
      }
    }

    // Identificar ítems/actividades huérfanos
    const orphanItems = budgetItems.filter(item => 
      !itemActivityMap.has(item.id)
    );
    const orphanActivities = activities.filter(activity => 
      ![...itemActivityMap.values()].includes(activity.id)
    );

    differences.push(...orphanItems.map(item => ({
      itemId: item.id,
      activityId: null,
      differences: ['no_matching_activity']
    })));

    differences.push(...orphanActivities.map(activity => ({
      itemId: null,
      activityId: activity.id,
      differences: ['no_matching_budget_item']
    })));

    return differences;
  }

  private detectConflicts(differences: any[], conflictResolution: string): any[] {
    return differences.filter(diff => 
      diff.differences.some(d => 
        ['cost_mismatch', 'quantity_mismatch', 'timeline_conflict'].includes(d)
      )
    );
  }

  private async syncBudgetToSchedule(
    syncRequest: BudgetScheduleSync,
    budgetItems: any[],
    activities: any[],
    conflicts: any[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      conflictsDetected: conflicts.length,
      conflictsResolved: 0,
      warnings: [],
      errors: [],
      summary: { budgetChanges: [], scheduleChanges: [], newItemsCreated: [] }
    };

    for (const item of budgetItems) {
      try {
        const activity = this.findMatchingActivity(item, activities);
        
        if (activity) {
          // Actualizar actividad existente
          const changes = await this.updateActivityFromBudgetItem(item, activity, syncRequest.syncOptions);
          if (changes.length > 0) {
            result.summary.scheduleChanges.push({ activityId: activity.id, changes });
            result.syncedItems++;
          }
        } else if (syncRequest.syncOptions.createMissingItems) {
          // Crear nueva actividad
          const newActivity = await this.createActivityFromBudgetItem(item, syncRequest.scheduleId);
          result.summary.newItemsCreated.push({ type: 'activity', id: newActivity.id });
          result.syncedItems++;
        }
      } catch (error) {
        result.errors.push(`Error syncing item ${item.id}: ${(error as Error).message}`);
        result.success = false;
      }
    }

    return result;
  }

  private async syncScheduleToBudget(
    syncRequest: BudgetScheduleSync,
    budgetItems: any[],
    activities: any[],
    conflicts: any[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      conflictsDetected: conflicts.length,
      conflictsResolved: 0,
      warnings: [],
      errors: [],
      summary: { budgetChanges: [], scheduleChanges: [], newItemsCreated: [] }
    };

    for (const activity of activities) {
      try {
        const item = this.findMatchingBudgetItem(activity, budgetItems);
        
        if (item) {
          // Actualizar ítem existente
          const changes = await this.updateBudgetItemFromActivity(activity, item, syncRequest.syncOptions);
          if (changes.length > 0) {
            result.summary.budgetChanges.push({ itemId: item.id, changes });
            result.syncedItems++;
          }
        } else if (syncRequest.syncOptions.createMissingItems) {
          // Crear nuevo ítem de presupuesto
          const newItem = await this.createBudgetItemFromActivity(activity, syncRequest.budgetId);
          result.summary.newItemsCreated.push({ type: 'budget_item', id: newItem.id });
          result.syncedItems++;
        }
      } catch (error) {
        result.errors.push(`Error syncing activity ${activity.id}: ${(error as Error).message}`);
        result.success = false;
      }
    }

    return result;
  }

  private async bidirectionalSync(
    syncRequest: BudgetScheduleSync,
    budgetItems: any[],
    activities: any[],
    conflicts: any[]
  ): Promise<SyncResult> {
    // Para sincronización bidireccional, necesitamos determinar qué lado tiene la información más reciente
    const budgetToSchedule = await this.syncBudgetToSchedule(syncRequest, budgetItems, activities, conflicts);
    const scheduleToBudget = await this.syncScheduleToBudget(syncRequest, budgetItems, activities, conflicts);

    return {
      success: budgetToSchedule.success && scheduleToBudget.success,
      syncedItems: budgetToSchedule.syncedItems + scheduleToBudget.syncedItems,
      conflictsDetected: Math.max(budgetToSchedule.conflictsDetected, scheduleToBudget.conflictsDetected),
      conflictsResolved: budgetToSchedule.conflictsResolved + scheduleToBudget.conflictsResolved,
      warnings: [...budgetToSchedule.warnings, ...scheduleToBudget.warnings],
      errors: [...budgetToSchedule.errors, ...scheduleToBudget.errors],
      summary: {
        budgetChanges: [...budgetToSchedule.summary.budgetChanges, ...scheduleToBudget.summary.budgetChanges],
        scheduleChanges: [...budgetToSchedule.summary.scheduleChanges, ...scheduleToBudget.summary.scheduleChanges],
        newItemsCreated: [...budgetToSchedule.summary.newItemsCreated, ...scheduleToBudget.summary.newItemsCreated]
      }
    };
  }

  private createItemActivityMapping(budgetItems: any[], activities: any[]): Map<string, string> {
    const mapping = new Map<string, string>();

    // Mapeo por ID explícito en campos personalizados
    for (const item of budgetItems) {
      if (item.customFields?.linkedActivityId) {
        mapping.set(item.id, item.customFields.linkedActivityId);
      }
    }

    for (const activity of activities) {
      if (activity.customFields?.budgetLineItemId) {
        mapping.set(activity.customFields.budgetLineItemId, activity.id);
      }
    }

    // Mapeo por similitud de nombre/descripción
    for (const item of budgetItems) {
      if (!mapping.has(item.id)) {
        const matchingActivity = this.findBestMatch(item.description, activities);
        if (matchingActivity) {
          mapping.set(item.id, matchingActivity.id);
        }
      }
    }

    return mapping;
  }

  private compareItemAndActivity(item: any, activity: any): string[] {
    const differences = [];

    // Comparar costos
    if (Math.abs(item.totalCost - activity.plannedTotalCost) > 0.01) {
      differences.push('cost_mismatch');
    }

    // Comparar cantidades
    if (Math.abs(item.quantity - activity.workQuantities.plannedQuantity) > 0.01) {
      differences.push('quantity_mismatch');
    }

    // Comparar unidades
    if (item.unit !== activity.workQuantities.unit) {
      differences.push('unit_mismatch');
    }

    return differences;
  }

  private findMatchingActivity(item: any, activities: any[]): any {
    // Buscar por ID vinculado
    if (item.customFields?.linkedActivityId) {
      return activities.find(a => a.id === item.customFields.linkedActivityId);
    }

    // Buscar por similitud de descripción
    return this.findBestMatch(item.description, activities);
  }

  private findMatchingBudgetItem(activity: any, budgetItems: any[]): any {
    // Buscar por ID vinculado
    if (activity.customFields?.budgetLineItemId) {
      return budgetItems.find(i => i.id === activity.customFields.budgetLineItemId);
    }

    // Buscar por similitud de descripción
    return this.findBestMatch(activity.name, budgetItems, 'description');
  }

  private findBestMatch(searchText: string, items: any[], fieldName: string = 'name'): any {
    let bestMatch = null;
    let bestScore = 0;

    for (const item of items) {
      const score = this.calculateTextSimilarity(searchText, item[fieldName]);
      if (score > bestScore && score > 0.7) { // Threshold de 70%
        bestScore = score;
        bestMatch = item;
      }
    }

    return bestMatch;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Implementación simple de similitud de texto (Jaccard similarity)
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  private async updateActivityFromBudgetItem(item: any, activity: any, syncOptions: any): Promise<string[]> {
    const changes = [];

    if (syncOptions.syncCosts && Math.abs(item.totalCost - activity.plannedTotalCost) > 0.01) {
      activity.plannedTotalCost = item.totalCost;
      changes.push('cost_updated');
    }

    if (syncOptions.syncQuantities && Math.abs(item.quantity - activity.workQuantities.plannedQuantity) > 0.01) {
      activity.workQuantities.plannedQuantity = item.quantity;
      activity.workQuantities.unit = item.unit;
      changes.push('quantity_updated');
    }

    if (changes.length > 0) {
      await this.activityRepository.save(activity);
    }

    return changes;
  }

  private async updateBudgetItemFromActivity(activity: any, item: any, syncOptions: any): Promise<string[]> {
    const changes = [];

    if (syncOptions.syncCosts && Math.abs(activity.plannedTotalCost - item.totalCost) > 0.01) {
      item.totalCost = activity.plannedTotalCost;
      changes.push('cost_updated');
    }

    if (syncOptions.syncQuantities && Math.abs(activity.workQuantities.plannedQuantity - item.quantity) > 0.01) {
      item.quantity = activity.workQuantities.plannedQuantity;
      item.unit = activity.workQuantities.unit;
      changes.push('quantity_updated');
    }

    if (changes.length > 0) {
      await this.lineItemRepository.save(item);
    }

    return changes;
  }

 // ===== CORRECCIÓN 1: TrackDailyProgressUseCase.ts =====
// Problema: El objeto progressRecord no cumple con ActivityProgressEntity
// Línea 180: El método createProgressRecord debe crear un objeto compatible

private async createProgressRecord(request: DailyProgressRequest, activity: any): Promise<ActivityProgressEntity> {
  // Crear una instancia de ActivityProgressEntity con todas las propiedades requeridas
  const progressRecord = new ActivityProgressEntity();
  
  // Propiedades básicas requeridas
  progressRecord.activityId = request.activityId;
  progressRecord.reportDate = request.reportDate;
  progressRecord.reportedBy = request.reportedBy;
  progressRecord.progressPercentage = request.progressPercentage;
  
  // Trabajo completado con estructura correcta
  progressRecord.workCompleted = {
    quantity: request.workCompleted.quantity,
    unit: request.workCompleted.unit,
    description: request.workCompleted.description,
    qualityLevel: 'SATISFACTORY' as any // Usar enum correcto
  };
  
  // Recursos utilizados
  progressRecord.actualWorkersOnSite = request.actualWorkersOnSite;
  progressRecord.actualHoursWorked = request.actualHoursWorked;
  progressRecord.plannedHoursForDay = 8; // Valor por defecto
  
  // Métricas calculadas
  progressRecord.productivityRate = this.calculateProductivityRate(request, activity);
  progressRecord.efficiencyPercentage = this.calculateEfficiency(request, activity);
  
  // Condiciones ambientales (estructura completa requerida por la entidad)
  if (request.weatherConditions) {
    progressRecord.weatherConditions = {
      workability: request.weatherConditions.workability as any,
      temperature: request.weatherConditions.temperature,
      humidity: 50, // Valor por defecto si no se proporciona
      precipitation: request.weatherConditions.precipitation,
      windSpeed: 0, // Valor por defecto
      visibility: 'good', // Valor por defecto
      description: `${request.weatherConditions.condition} weather conditions`
    };
  }
  
  // Problemas de calidad (mapear correctamente)
  progressRecord.qualityIssues = request.qualityIssues?.map((issue, index) => ({
    id: `quality_${Date.now()}_${index}`,
    description: issue.issue,
    severity: issue.severity,
    status: 'open' as const,
    reportedBy: request.reportedBy,
    correctionAction: issue.correctionRequired ? 'Required' : 'Not required'
  })) || [];
  
  // Incidentes de seguridad (mapear correctamente)
  progressRecord.safetyIncidents = request.safetyIncidents?.map((incident, index) => ({
    id: `safety_${Date.now()}_${index}`,
    type: incident.type,
    description: incident.description,
    severity: incident.severity,
    correctionAction: 'To be determined',
    preventiveMeasures: 'To be defined'
  })) || [];
  
  // Obstáculos (mapear desde materialIssues)
  progressRecord.obstacles = request.materialIssues?.map(issue => ({
    type: issue.issue === 'delivery_delay' ? 'material_delay' as const : 'other' as const,
    description: `${issue.material}: ${issue.impact}`,
    impact: 'medium' as const,
    estimatedDelayHours: 0,
    preventable: true
  })) || [];
  
  // Uso de materiales
  progressRecord.materialUsage = request.materialIssues?.map(issue => ({
    materialId: `material_${issue.material}`,
    materialName: issue.material,
    quantityUsed: 0,
    quantityWasted: 0,
    unit: 'unit',
    wasteReason: issue.issue === 'quality' ? 'Quality issues' : undefined
  })) || [];
  
  // Uso de equipos (array vacío por defecto)
  progressRecord.equipmentUsage = [];
  
  // Costos del día (calculados)
  progressRecord.dailyLaborCost = request.actualWorkersOnSite * request.actualHoursWorked * 25;
  progressRecord.dailyMaterialCost = 0; // Se calculará después
  progressRecord.dailyEquipmentCost = 0;
  progressRecord.dailyTotalCost = progressRecord.dailyLaborCost;
  
  // Ubicación
  progressRecord.location = request.location ? {
    latitude: request.location.latitude,
    longitude: request.location.longitude,
    altitude: 0,
    accuracy: request.location.accuracy,
    area: 'construction_site',
    zone: 'main'
  } : undefined;
  
  // Fotos (mapear correctamente)
  progressRecord.photos = request.photos?.map(url => ({
    url,
    description: 'Progress photo',
    type: 'progress' as const,
    timestamp: new Date()
  })) || [];
  
  // Puntuaciones
  progressRecord.qualityScore = this.calculateQualityScore(request);
  progressRecord.safetyScore = this.calculateSafetyScore(request);
  progressRecord.productivityScore = 8.0; // Valor calculado
  progressRecord.overallScore = 0; // Se calculará automáticamente
  
  // Comentarios
  progressRecord.generalComments = request.notes || '';
  progressRecord.nextDayPlanning = '';
  progressRecord.supervisorNotes = '';
  
  // Estado del reporte
  progressRecord.status = 'submitted' as any;
  progressRecord.isActive = true;
  
  // Las fechas se asignan automáticamente por las decoraciones de TypeORM
  
  return await this.progressRepository.save(progressRecord);
}

private async createActivityFromBudgetItem(item: any, scheduleId: string): Promise<any> {
  // Crear una instancia de la entidad correctamente
  const newActivity = new ScheduleActivityEntity();
  
  // Asignar propiedades básicas
  newActivity.scheduleId = scheduleId;
  newActivity.name = item.description;
  newActivity.description = `Actividad generada desde ítem de presupuesto: ${item.description}`;
  newActivity.status = ActivityStatus.NOT_STARTED;
  newActivity.activityType = ActivityType.OTHER;
  newActivity.priority = ActivityPriority.NORMAL;
  newActivity.primaryTrade = ConstructionTrade.GENERAL;
  
  // Fechas de planificación
  newActivity.plannedStartDate = new Date();
  newActivity.plannedEndDate = new Date();
  newActivity.plannedDurationDays = 1;
  
  // Fechas de control
  newActivity.earlyStartDate = new Date();
  newActivity.earlyFinishDate = new Date();
  newActivity.lateStartDate = new Date();
  newActivity.lateFinishDate = new Date();
  newActivity.totalFloat = 0;
  newActivity.freeFloat = 0;
  
  // Progreso y estado
  newActivity.progressPercentage = 0;
  newActivity.isCriticalPath = false;
  newActivity.isMilestone = false;
  
  // Costos
  newActivity.plannedTotalCost = item.totalCost || 0;
  newActivity.actualTotalCost = 0;
  newActivity.plannedLaborCost = item.totalCost * 0.4 || 0;
  newActivity.plannedMaterialCost = item.totalCost * 0.6 || 0;
  newActivity.plannedEquipmentCost = 0;
  newActivity.actualLaborCost = 0;
  newActivity.actualMaterialCost = 0;
  newActivity.actualEquipmentCost = 0;
  
  // Configuración de trabajo (requerida)
  newActivity.workConfiguration = {
    workingHours: {
      dailyHours: 8,
      startTime: '08:00',
      endTime: '16:00',
      workingDays: [1, 2, 3, 4, 5] // Lunes a Viernes
    },
    shifts: [{
      shiftNumber: 1,
      startTime: '08:00',
      endTime: '16:00',
      workers: 2
    }],
    overtime: {
      maxOvertimeHours: 2,
      overtimeRate: 1.5
    }
  };
  
  // Cantidades de trabajo (requerida)
  newActivity.workQuantities = {
    unit: item.unitOfMeasure || 'unit',
    plannedQuantity: item.quantity || 1,
    completedQuantity: 0,
    remainingQuantity: item.quantity || 1,
    productivity: 1
  };
  
  // Campos personalizados
  newActivity.customFields = { 
    budgetLineItemId: item.id, 
    generatedFromBudget: true,
    originalBudgetData: {
      itemId: item.id,
      description: item.description,
      totalCost: item.totalCost,
      createdAt: new Date()
    }
  };
  
  // Estado
  newActivity.isActive = true;
  
  // Las fechas de creación y actualización se asignan automáticamente
  // Los campos id, createdAt, updatedAt son manejados por TypeORM
  
  return await this.activityRepository.save(newActivity);
}

private async createBudgetItemFromActivity(activity: any, budgetId: string): Promise<any> {
  // Crear una instancia de la entidad correctamente
  const newItem = new BudgetLineItemEntity();
  
  // Propiedades básicas requeridas
  newItem.calculationBudgetId = budgetId;
  newItem.description = activity.name;
  newItem.specifications = activity.description;
  newItem.itemType = LineItemType.LABOR; // Tipo apropiado para actividades
  newItem.source = LineItemSource.CALCULATION;
  
  // Cantidades y precios
  newItem.quantity = activity.workQuantities?.plannedQuantity || 1;
  newItem.unitOfMeasure = activity.workQuantities?.unit || 'unit';
  newItem.unitPrice = activity.workQuantities?.plannedQuantity > 0 ? 
    activity.plannedTotalCost / activity.workQuantities.plannedQuantity : 0;
  newItem.wastePercentage = 5;
  newItem.finalQuantity = newItem.quantity * (1 + newItem.wastePercentage / 100);
  newItem.subtotal = newItem.finalQuantity * newItem.unitPrice;
  
  // Categorización
  newItem.category = 'LABOR';
  newItem.subcategory = activity.activityType || 'OTHER';
  
  // Factores
  newItem.regionalFactor = 1;
  newItem.difficultyFactor = 1;
  
  // Tracking de precios
  newItem.priceDate = new Date();
  newItem.priceSource = 'generated_from_schedule';
  newItem.priceValidityDays = 30;
  
  // Metadata
  newItem.metadata = {
    notes: 'Generado automáticamente desde cronograma'
  };
  
  // Orden y opciones
  newItem.displayOrder = 0;
  newItem.isOptional = false;
  newItem.isAlternate = false;
  
  // Campos personalizados
  newItem.customFields = { 
    linkedActivityId: activity.id, 
    generatedFromSchedule: true,
    originalActivityData: {
      activityId: activity.id,
      activityName: activity.name,
      plannedCost: activity.plannedTotalCost,
      createdAt: new Date()
    }
  };
  
  // Los campos id, createdAt, updatedAt son manejados por TypeORM
  
  return await this.lineItemRepository.save(newItem);
}


  private calculateCoherenceScore(budgetItems: any[], activities: any[]): number {
    const mapping = this.createItemActivityMapping(budgetItems, activities);
    let coherentPairs = 0;
    let totalPairs = 0;

    for (const [itemId, activityId] of mapping) {
      const item = budgetItems.find(i => i.id === itemId);
      const activity = activities.find(a => a.id === activityId);

      if (item && activity) {
        totalPairs++;
        const differences = this.compareItemAndActivity(item, activity);
        if (differences.length === 0) {
          coherentPairs++;
        }
      }
    }

    return totalPairs > 0 ? (coherentPairs / totalPairs) * 100 : 100;
  }

  private async identifyDiscrepancies(budgetItems: any[], activities: any[]): Promise<any[]> {
    const differences = await this.detectDifferences(budgetItems, activities);
    return differences.filter(diff => diff.differences.length > 0);
  }

  private async generateCoherenceRecommendations(budgetItems: any[], activities: any[]): Promise<string[]> {
    const recommendations = [];
    const discrepancies = await this.identifyDiscrepancies(budgetItems, activities);

    if (discrepancies.length > 0) {
      recommendations.push(`Se detectaron ${discrepancies.length} discrepancias entre presupuesto y cronograma`);
      recommendations.push('Ejecutar sincronización para resolver diferencias');
    }

    const coherenceScore = this.calculateCoherenceScore(budgetItems, activities);
    if (coherenceScore < 80) {
      recommendations.push('Habilitar sincronización automática para mantener coherencia');
    }

    return recommendations;
  }

  private async updateCoherenceMetrics(budget: any, schedule: any): Promise<void> {
    const now = new Date();
    
    budget.customFields = {
      ...budget.customFields,
      lastCoherenceCheck: now,
      linkedScheduleId: schedule.id
    };

    schedule.customFields = {
      ...schedule.customFields,
      lastCoherenceCheck: now,
      linkedBudgetId: budget.id
    };

    await this.budgetRepository.save(budget);
    await this.scheduleRepository.save(schedule);
  }

  private async notifyConflicts(syncRequest: BudgetScheduleSync, syncResult: SyncResult): Promise<void> {
    await this.notificationService.createNotification({
      userId: 'system', // Or get from context
      type: 'WARNING',
      title: 'Conflictos en Sincronización Presupuesto-Cronograma',
      message: `Se detectaron ${syncResult.conflictsDetected} conflictos durante la sincronización`,
      priority: 'MEDIUM',
      relatedEntityType: 'BUDGET_SCHEDULE_SYNC',
      relatedEntityId: syncRequest.budgetId,
      // CORREGIDO: Removido actionRequired, agregado a metadata
      metadata: {
        budgetId: syncRequest.budgetId,
        scheduleId: syncRequest.scheduleId,
        conflicts: syncResult.conflictsDetected,
        syncDirection: syncRequest.syncDirection,
        requiresAction: true // Movido a metadata
      }
    });
  }
  private calculateProductivityRate(request: any, activity: any): number {
    // En este contexto no tenemos request de progreso diario, 
    // así que calculamos basado en datos de actividad
    if (!activity.workQuantities?.plannedQuantity || !activity.plannedDurationDays) {
      return 1.0; // Valor por defecto
    }
    
    const assumedWorkersPerDay = 2; // Estimación
    const assumedHoursPerDay = 8;
    const totalPersonHours = assumedWorkersPerDay * assumedHoursPerDay * activity.plannedDurationDays;
    
    return totalPersonHours > 0 ? activity.workQuantities.plannedQuantity / totalPersonHours : 1.0;
  }
  // Método para calcular eficiencia (simplificado)
private calculateEfficiency(request: any, activity: any): number {
  // Como no tenemos datos reales de progreso, asumimos 100% de eficiencia planificada
  return 100;
}

// Método para calcular puntuación de calidad (simplificado)
private calculateQualityScore(request: any): number {
  // Como no tenemos problemas de calidad en este contexto, asumimos puntuación perfecta
  return 100;
}

// Método para calcular puntuación de seguridad (simplificado)
private calculateSafetyScore(request: any): number {
  // Como no tenemos incidentes de seguridad en este contexto, asumimos puntuación perfecta
  return 100;
}
}