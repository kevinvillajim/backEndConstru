// src/infrastructure/jobs/ScheduleUpdateJob.ts
import { CalculationScheduleRepository } from '../../domain/repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../../domain/repositories/ScheduleActivityRepository';
import { ProgressTrackingRepository } from '../../domain/repositories/ProgressTrackingRepository';
import { NotificationService } from '../../domain/services/NotificationService';
import { BudgetScheduleIntegrationService } from '../../domain/services/BudgetScheduleIntegrationService';

export class ScheduleUpdateJob {
  constructor(
    private scheduleRepository: CalculationScheduleRepository,
    private activityRepository: ScheduleActivityRepository,
    private progressRepository: ProgressTrackingRepository,
    private notificationService: NotificationService,
    private budgetScheduleService: BudgetScheduleIntegrationService
  ) {}

  async execute(): Promise<void> {
    console.log('Starting Schedule Update Job...');
    
    try {
      // 1. Obtener cronogramas activos
      const activeSchedules = await this.scheduleRepository.findByFilters(
        { status: 'ACTIVE', isActive: true },
        { page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }
      );

      console.log(`Found ${activeSchedules.length} active schedules to update`);

      // 2. Procesar cada cronograma
      for (const schedule of activeSchedules) {
        await this.updateSchedule(schedule);
      }

      // 3. Ejecutar sincronización automática
      await this.executeBudgetScheduleSync();

      // 4. Limpiar datos antiguos
      await this.cleanupOldData();

      console.log('Schedule Update Job completed successfully');

    } catch (error) {
      console.error('Error in Schedule Update Job:', error);
      await this.notificationService.createNotification({
        userId: 'system',
        type: 'ERROR',
        title: 'Error en Job de Actualización de Cronogramas',
        message: `Error en ejecución automática: ${(error as Error).message}`,
        priority: 'HIGH',
        relatedEntityType: 'SYSTEM_JOB',
        relatedEntityId: 'schedule_update_job'
      });
    }
  }

  private async updateSchedule(schedule: any): Promise<void> {
    try {
      console.log(`Updating schedule: ${schedule.id}`);

      // 1. Obtener actividades del cronograma
      const activities = await this.activityRepository.findByScheduleId(schedule.id);
      
      // 2. Recalcular métricas de performance
      const updatedMetrics = await this.recalculatePerformanceMetrics(activities);
      
      // 3. Actualizar fechas proyectadas
      const updatedDates = await this.updateProjectedDates(activities);
      
      // 4. Verificar alertas automáticas
      const alerts = await this.checkAutomaticAlerts(schedule, activities);
      
      // 5. Actualizar estado del cronograma
      const updatedSchedule = {
        ...schedule,
        performanceMetrics: updatedMetrics,
        estimatedCompletionDate: updatedDates.estimatedCompletion,
        actualCompletionDate: updatedDates.actualCompletion,
        lastAutoUpdate: new Date(),
        customFields: {
          ...schedule.customFields,
          autoUpdateResults: {
            metricsUpdated: !!updatedMetrics,
            datesUpdated: !!updatedDates,
            alertsGenerated: alerts.length,
            updateTimestamp: new Date()
          }
        },
        updatedAt: new Date()
      };

      await this.scheduleRepository.save(updatedSchedule);

      // 6. Enviar alertas si es necesario
      if (alerts.length > 0) {
        await this.sendScheduleAlerts(schedule.id, alerts);
      }

      console.log(`Schedule ${schedule.id} updated successfully`);

    } catch (error) {
      console.error(`Error updating schedule ${schedule.id}:`, error);
    }
  }

  private async recalculatePerformanceMetrics(activities: any[]): Promise<any> {
    if (activities.length === 0) return null;

    const totalPlannedCost = activities.reduce((sum, a) => sum + (a.plannedTotalCost || 0), 0);
    const totalEarnedValue = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const totalActualCost = activities.reduce((sum, a) => sum + (a.actualTotalCost || 0), 0);

    const spi = totalPlannedCost > 0 ? totalEarnedValue / totalPlannedCost : 1;
    const cpi = totalActualCost > 0 ? totalEarnedValue / totalActualCost : 1;
    const eac = totalActualCost + ((totalPlannedCost - totalEarnedValue) / cpi);

    return {
      plannedValue: totalPlannedCost,
      earnedValue: totalEarnedValue,
      actualCost: totalActualCost,
      schedulePerformanceIndex: spi,
      costPerformanceIndex: cpi,
      estimateAtCompletion: eac,
      scheduleVariance: totalEarnedValue - totalPlannedCost,
      costVariance: totalEarnedValue - totalActualCost,
      lastCalculated: new Date()
    };
  }

  private async updateProjectedDates(activities: any[]): Promise<any> {
    const inProgressActivities = activities.filter(a => 
      a.status === 'IN_PROGRESS' && a.progressPercentage > 0
    );

    if (inProgressActivities.length === 0) {
      return { estimatedCompletion: null, actualCompletion: null };
    }

    // Calcular tasa de progreso promedio
    const progressRates = inProgressActivities.map(activity => {
      const startDate = activity.actualStartDate || activity.plannedStartDate;
      const daysElapsed = this.daysBetween(startDate, new Date());
      return daysElapsed > 0 ? activity.progressPercentage / daysElapsed : 0;
    });

    const avgProgressRate = progressRates.reduce((sum, rate) => sum + rate, 0) / progressRates.length;

    // Calcular trabajo restante
    const remainingWork = activities.reduce((sum, a) => sum + (100 - a.progressPercentage), 0);

    // Proyectar fecha de finalización
    const estimatedDaysRemaining = avgProgressRate > 0 ? remainingWork / avgProgressRate : 0;
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + Math.ceil(estimatedDaysRemaining));

    // Verificar si ya está completado
    const completedActivities = activities.filter(a => a.status === 'COMPLETED');
    const actualCompletion = completedActivities.length === activities.length ? 
      new Date(Math.max(...completedActivities.map(a => a.actualEndDate?.getTime() || 0))) : 
      null;

    return {
      estimatedCompletion,
      actualCompletion,
      estimatedDaysRemaining: Math.ceil(estimatedDaysRemaining)
    };
  }

  private async checkAutomaticAlerts(schedule: any, activities: any[]): Promise<any[]> {
    const alerts = [];

    // Alerta por actividades retrasadas
    const delayedActivities = activities.filter(a => this.isActivityDelayed(a));
    if (delayedActivities.length > 0) {
      alerts.push({
        type: 'SCHEDULE_DELAY',
        severity: delayedActivities.some(a => a.isCriticalPath) ? 'HIGH' : 'MEDIUM',
        message: `${delayedActivities.length} actividades retrasadas detectadas`,
        affectedActivities: delayedActivities.map(a => a.id),
        details: {
          totalDelayedActivities: delayedActivities.length,
          criticalPathAffected: delayedActivities.some(a => a.isCriticalPath),
          maxDelay: Math.max(...delayedActivities.map(a => this.calculateActivityDelay(a)))
        }
      });
    }

    // Alerta por varianza de costos
    const costVariance = this.calculateCostVariancePercentage(activities);
    if (Math.abs(costVariance) > 15) {
      alerts.push({
        type: 'COST_VARIANCE',
        severity: Math.abs(costVariance) > 25 ? 'HIGH' : 'MEDIUM',
        message: `Varianza de costos significativa: ${costVariance.toFixed(1)}%`,
        variance: costVariance,
        details: {
          variancePercentage: costVariance,
          thresholdExceeded: Math.abs(costVariance) > 25,
          impactLevel: Math.abs(costVariance) > 25 ? 'high' : 'medium'
        }
      });
    }

    // Alerta por baja productividad
    try {
      const recentReports = await this.progressRepository.findByScheduleId(schedule.id, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      });

      const avgProductivity = this.calculateAverageProductivity(recentReports);
      if (avgProductivity < 0.5) {
        alerts.push({
          type: 'LOW_PRODUCTIVITY',
          severity: avgProductivity < 0.3 ? 'HIGH' : 'MEDIUM',
          message: `Productividad baja detectada: ${avgProductivity.toFixed(2)} unidades/hora-persona`,
          productivity: avgProductivity,
          details: {
            currentProductivity: avgProductivity,
            threshold: 0.5,
            reportsPeriod: '7 days',
            reportsAnalyzed: recentReports.length
          }
        });
      }
    } catch (error) {
      console.error('Error calculating productivity alerts:', error);
    }

    return alerts;
  }
  private calculateActivityDelay(activity: any): number {
    if (activity.status === 'COMPLETED') {
      const plannedEnd = activity.plannedEndDate.getTime();
      const actualEnd = activity.actualEndDate.getTime();
      return Math.max(0, (actualEnd - plannedEnd) / (24 * 60 * 60 * 1000));
    }
    
    const expectedProgress = this.getExpectedProgress(activity);
    const actualProgress = activity.progressPercentage;
    const progressDelay = Math.max(0, expectedProgress - actualProgress);
    
    // Convertir retraso de progreso a días estimados
    const totalDuration = this.daysBetween(activity.plannedStartDate, activity.plannedEndDate);
    return (progressDelay / 100) * totalDuration;
  }

  private async executeBudgetScheduleSync(): Promise<void> {
    console.log('Executing automatic budget-schedule synchronization...');

    try {
      // CORREGIDO: Obtener cronogramas con sincronización automática habilitada
      const autoSyncSchedules = await this.scheduleRepository.findByFilters(
        { 'customFields.autoSync': true, isActive: true },
        { page: 1, limit: 50, sortBy: 'updatedAt', sortOrder: 'desc' }
      );

      for (const schedule of autoSyncSchedules) {
        if (schedule.customFields?.linkedBudgetId) {
          const syncRequest = {
            budgetId: schedule.customFields.linkedBudgetId,
            scheduleId: schedule.id,
            syncDirection: 'bidirectional' as const,
            syncOptions: schedule.customFields.syncOptions || {
              syncCosts: true,
              syncQuantities: true,
              syncTimelines: false,
              syncResources: false,
              createMissingItems: false,
              preserveCustomizations: true
            },
            conflictResolution: 'schedule_wins' as const
          };

          await this.budgetScheduleService.synchronizeBudgetAndSchedule(syncRequest);
          console.log(`Auto-sync completed for schedule ${schedule.id}`);
        }
      }

    } catch (error) {
      console.error('Error in budget-schedule auto-sync:', error);
    }
  }

  private async cleanupOldData(): Promise<void> {
    console.log('Cleaning up old data...');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 días atrás

      // Limpiar reportes de progreso antiguos (mantener solo los últimos 90 días)
      try {
        await this.progressRepository.deleteOlderThan(cutoffDate);
        console.log('Old progress reports cleaned up');
      } catch (error) {
        console.error('Error cleaning progress reports:', error);
      }

      // Limpiar logs de actualizaciones automáticas antiguos
      try {
        const oldSchedules = await this.scheduleRepository.findByFilters(
          { 'customFields.lastAutoUpdate': { $lt: cutoffDate } },
          { page: 1, limit: 100, sortBy: 'updatedAt', sortOrder: 'asc' }
        );

        for (const schedule of oldSchedules) {
          if (schedule.customFields?.autoUpdateResults) {
            // Limpiar resultados de actualizaciones automáticas muy antiguas
            delete schedule.customFields.autoUpdateResults;
            await this.scheduleRepository.save(schedule);
          }
        }
        console.log(`Cleaned up auto-update results for ${oldSchedules.length} schedules`);
      } catch (error) {
        console.error('Error cleaning schedule auto-update results:', error);
      }

      console.log('Old data cleanup completed');

    } catch (error) {
      console.error('Error in data cleanup:', error);
    }
  }

  private async sendScheduleAlerts(scheduleId: string, alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      await this.notificationService.createNotification({
        userId: 'system', // Should be replaced with actual user IDs
        type: 'ALERT',
        title: 'Alerta Automática de Cronograma',
        message: alert.message,
        priority: alert.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
        relatedEntityType: 'CALCULATION_SCHEDULE',
        relatedEntityId: scheduleId,
        // CORREGIDO: Removido actionRequired, agregado a metadata
        metadata: {
          alertType: alert.type,
          alertData: alert,
          severity: alert.severity,
          requiresAction: alert.severity === 'HIGH'
        }
      });
    }
  }

  private daysBetween(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private isActivityDelayed(activity: any): boolean {
    if (activity.status === 'COMPLETED') {
      return activity.actualEndDate > activity.plannedEndDate;
    }
    
    const expectedProgress = this.getExpectedProgress(activity);
    return activity.progressPercentage < expectedProgress;
  }

  private getExpectedProgress(activity: any): number {
    const now = new Date();
    if (now < activity.plannedStartDate) return 0;
    if (now > activity.plannedEndDate) return 100;
    
    const totalDuration = activity.plannedEndDate.getTime() - activity.plannedStartDate.getTime();
    const elapsed = now.getTime() - activity.plannedStartDate.getTime();
    
    return (elapsed / totalDuration) * 100;
  }

  private calculateCostVariancePercentage(activities: any[]): number {
    const totalEV = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const totalAC = activities.reduce((sum, a) => sum + (a.actualTotalCost || 0), 0);
    
    return totalEV > 0 ? ((totalEV - totalAC) / totalEV) * 100 : 0;
  }

  private calculateAverageProductivity(progressReports: any[]): number {
    if (progressReports.length === 0) return 0;
    
    const productivityValues = progressReports.map(r => r.productivityRate || 0);
    return productivityValues.reduce((sum, p) => sum + p, 0) / productivityValues.length;
  }
}