// src/domain/services/BudgetScheduleIntegrationService.ts
import { CalculationBudgetRepository } from '../repositories/CalculationBudgetRepository';
import { CalculationScheduleRepository } from '../repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../repositories/ScheduleActivityRepository';
import { BudgetLineItemRepository } from '../repositories/BudgetLineItemRepository';
import { NotificationService } from './NotificationService';

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
    private notificationService: NotificationService
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

  private async createActivityFromBudgetItem(item: any, scheduleId: string): Promise<any> {
    // CORREGIDO: Crear actividad con todas las propiedades requeridas por ScheduleActivityEntity
    const newActivity = {
      // Propiedades básicas requeridas
      id: '', // Generado por el repositorio
      scheduleId,
      name: item.description,
      description: `Actividad generada desde ítem de presupuesto: ${item.description}`,
      status: 'NOT_STARTED',
      activityType: 'OTHER',
      priority: 'NORMAL',
      primaryTrade: 'GENERAL',
      
      // Fechas de planificación
      plannedStartDate: new Date(),
      plannedEndDate: new Date(),
      plannedDurationDays: 1,
      
      // Fechas reales (inicialmente nulas)
      actualStartDate: null,
      actualEndDate: null,
      actualDurationDays: 0,
      
      // PROPIEDADES AGREGADAS para ScheduleActivityEntity
      earlyStartDate: new Date(),
      earlyFinishDate: new Date(),
      lateStartDate: new Date(),
      lateFinishDate: new Date(),
      totalFloat: 0,
      freeFloat: 0,
      
      // Progreso y costos
      progressPercentage: 0,
      plannedTotalCost: item.totalCost,
      actualTotalCost: 0,
      earnedValue: 0,
      costVariance: 0,
      scheduleVariance: 0,
      
      // Cantidades de trabajo
      workQuantities: {
        plannedQuantity: item.quantity,
        completedQuantity: 0,
        unit: item.unit,
        wastePercentage: 5
      },
      
      // Requerimientos y dependencias
      qualityRequirements: [],
      safetyRequirements: [],
      deliverables: [item.description],
      predecessors: [],
      successors: [],
      resourceRequirements: { 
        workforce: [], 
        equipment: [], 
        materials: [{
          materialId: item.id,
          quantity: item.quantity,
          unit: item.unit,
          description: item.description
        }]
      },
      
      // Propiedades de cronograma
      isCriticalPath: false,
      bufferDays: 0,
      slack: 0,
      
      // PROPIEDADES ADICIONALES requeridas
      baselineStartDate: new Date(),
      baselineEndDate: new Date(),
      baselineDuration: 1,
      baselineCost: item.totalCost,
      
      // Ubicación y contexto
      location: {
        area: 'general',
        floor: 'ground',
        zone: 'main',
        coordinates: { x: 0, y: 0, z: 0 }
      },
      
      // Riesgos y dependencias
      risks: [],
      technicalDependencies: [],
      externalDependencies: [],
      
      // Métricas de performance
      performanceMetrics: {
        productivityRate: 0,
        qualityScore: 100,
        safetyScore: 100,
        costEfficiency: 1.0
      },
      
      // Configuración y validación
      milestoneType: null,
      isTemplate: false,
      templateId: null,
      validationRules: [],
      approvalRequirements: [],
      
      // Estado y seguimiento
      currentPhase: 'PLANNING',
      phaseCompletionPercentage: 0,
      lastStatusUpdate: new Date(),
      nextReviewDate: null,
      
      // Campos personalizados y metadatos
      customFields: { 
        budgetLineItemId: item.id, 
        generatedFromBudget: true,
        originalBudgetData: {
          itemId: item.id,
          description: item.description,
          totalCost: item.totalCost,
          createdAt: new Date()
        }
      },
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Calcular fechas de finalización
    const endDate = new Date(newActivity.plannedStartDate);
    endDate.setDate(endDate.getDate() + newActivity.plannedDurationDays);
    newActivity.plannedEndDate = endDate;
    newActivity.earlyFinishDate = endDate;
    newActivity.lateFinishDate = endDate;
    newActivity.baselineEndDate = endDate;

    return await this.activityRepository.save(newActivity);
  }

  private async createBudgetItemFromActivity(activity: any, budgetId: string): Promise<any> {
    // CORREGIDO: Crear ítem de presupuesto con todas las propiedades requeridas por BudgetLineItemEntity
    const newItem = {
      // Propiedades básicas requeridas
      id: '', // Generado por el repositorio
      budgetId,
      description: activity.name,
      quantity: activity.workQuantities.plannedQuantity,
      unit: activity.workQuantities.unit,
      unitCost: activity.workQuantities.plannedQuantity > 0 ? 
        activity.plannedTotalCost / activity.workQuantities.plannedQuantity : 0,
      totalCost: activity.plannedTotalCost,
      
      // Costos por categoría
      materialCost: activity.plannedTotalCost * 0.6, // Estimación
      laborCost: activity.plannedTotalCost * 0.4, // Estimación
      equipmentCost: 0,
      subcontractorCost: 0,
      
      // Categorización
      category: 'OTHER',
      subcategory: activity.activityType,
      specifications: activity.description,
      
      // PROPIEDADES AGREGADAS para BudgetLineItemEntity
      itemType: 'ACTIVITY_BASED',
      source: 'SCHEDULE_INTEGRATION',
      calculationBudgetId: budgetId,
      
      // Propiedades técnicas
      wastePercentage: 5,
      contingencyPercentage: 10,
      overheadPercentage: 15,
      profitMargin: 12,
      
      // Análisis de precios unitarios
      unitPriceAnalysis: {
        materials: activity.plannedTotalCost * 0.6,
        labor: activity.plannedTotalCost * 0.4,
        equipment: 0,
        overhead: activity.plannedTotalCost * 0.15,
        profit: activity.plannedTotalCost * 0.12
      },
      
      // Información de mercado
      marketPrices: {
        currentPrice: activity.plannedTotalCost / Math.max(1, activity.workQuantities.plannedQuantity),
        lastUpdate: new Date(),
        source: 'generated_from_schedule',
        reliability: 'estimated'
      },
      
      // Escalación y ajustes
      escalationFactors: {
        materials: 1.0,
        labor: 1.0,
        equipment: 1.0,
        general: 1.0
      },
      
      // Ubicación geográfica
      geographicalZone: 'SIERRA', // Valor por defecto
      locationFactors: {
        transportation: 1.0,
        availability: 1.0,
        climatic: 1.0
      },
      
      // Referencias y estándares
      measurementCriteria: activity.workQuantities.unit,
      qualityStandards: activity.qualityRequirements || [],
      necReferences: [],
      
      // Estado y validación
      isActive: true,
      isTemplate: false,
      validationStatus: 'PENDING',
      approvalStatus: 'DRAFT',
      
      // Información del proveedor
      preferredSuppliers: [],
      alternativeSuppliers: [],
      
      // Fechas y vigencia
      priceValidityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      lastPriceUpdate: new Date(),
      
      // Análisis de riesgo
      riskFactors: {
        priceVolatility: 'LOW',
        supplyAvailability: 'HIGH',
        qualityRisk: 'LOW',
        deliveryRisk: 'LOW'
      },
      
      // Datos históricos
      historicalData: {
        hasHistoricalPrices: false,
        averageHistoricalPrice: 0,
        priceVariance: 0,
        lastUsedDate: null
      },
      
      // Referencias de proyecto
      projectReferences: [],
      
      // Campos personalizados y metadatos
      customFields: { 
        linkedActivityId: activity.id, 
        generatedFromSchedule: true,
        originalActivityData: {
          activityId: activity.id,
          activityName: activity.name,
          plannedCost: activity.plannedTotalCost,
          createdAt: new Date()
        }
      },
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };

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
}