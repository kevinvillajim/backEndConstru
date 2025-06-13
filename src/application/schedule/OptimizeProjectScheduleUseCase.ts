// src/application/schedule/OptimizeProjectScheduleUseCase.ts

import { CalculationScheduleRepository } from '../../domain/repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../../domain/repositories/ScheduleActivityRepository';
import { ScheduleActivityEntity } from '../../infrastructure/database/entities/ScheduleActivityEntity';


export interface OptimizeScheduleRequest {
    scheduleId: string;
    optimizationGoals: {
      minimizeDuration: boolean;
      minimizeCost: boolean;
      maximizeResourceUtilization: boolean;
      minimizeRisk: boolean;
    };
    constraints: {
      maxDuration?: number;
      maxBudget?: number;
      availableResources?: any[];
      fixedActivities?: string[]; // IDs de actividades que no se pueden mover
    };
    scenarios?: {
      name: string;
      parameters: any;
    }[];
  }
  
  export interface OptimizeScheduleResponse {
    originalSchedule: any;
    optimizedSchedule: any;
    improvements: {
      durationReduction: number;
      costReduction: number;
      resourceEfficiencyGain: number;
    };
    recommendedActions: {
      action: string;
      impact: string;
      priority: 'high' | 'medium' | 'low';
    }[];
    alternativeScenarios?: any[];
  }
  
  export class OptimizeProjectScheduleUseCase {
    constructor(
      private scheduleRepository: CalculationScheduleRepository,
      private activityRepository: ScheduleActivityRepository
    ) {}
  
    async execute(request: OptimizeScheduleRequest): Promise<OptimizeScheduleResponse> {
      // 1. Obtener cronograma actual
      const originalSchedule = await this.scheduleRepository.findById(request.scheduleId);
      if (!originalSchedule) {
        throw new Error('Schedule not found');
      }
  
      const activities = await this.activityRepository.findByScheduleId(request.scheduleId);
  
      // 2. Crear copia para optimización
      const optimizedSchedule = { ...originalSchedule };
      const optimizedActivities = activities.map(a => ({ ...a }));
  
      // 3. Aplicar algoritmos de optimización
      if (request.optimizationGoals.minimizeDuration) {
        this.optimizeForDuration(optimizedSchedule, optimizedActivities, request.constraints);
      }
  
      if (request.optimizationGoals.minimizeCost) {
        this.optimizeForCost(optimizedSchedule, optimizedActivities, request.constraints);
      }
  
      if (request.optimizationGoals.maximizeResourceUtilization) {
        this.optimizeForResources(optimizedSchedule, optimizedActivities, request.constraints);
      }
  
      // 4. Calcular mejoras
      const improvements = this.calculateImprovements(originalSchedule, optimizedSchedule, activities, optimizedActivities);
  
      // 5. Generar recomendaciones
      const recommendedActions = this.generateOptimizationRecommendations(originalSchedule, optimizedSchedule, improvements);
  
      // 6. Procesar escenarios alternativos si se solicitan
      const alternativeScenarios = request.scenarios ? 
        await this.processAlternativeScenarios(originalSchedule, activities, request.scenarios) : 
        undefined;
  
      return {
        originalSchedule,
        optimizedSchedule,
        improvements,
        recommendedActions,
        alternativeScenarios
      };
    }
  
    private optimizeForDuration(schedule: any, activities: ScheduleActivityEntity[], constraints: any): void {
      // Fast-tracking: Identificar actividades que se pueden paralelizar
      const criticalPath = activities.filter(a => a.isCriticalPath);
      
      for (const activity of criticalPath) {
        // Buscar actividades que se pueden ejecutar en paralelo
        const parallelCandidates = activities.filter(a => 
          !a.isCriticalPath && 
          !activity.predecessors.includes(a.id) &&
          !a.predecessors.includes(activity.id)
        );
  
        // Ajustar fechas para paralelización
        for (const candidate of parallelCandidates) {
          if (this.canParallelize(activity, candidate)) {
            candidate.plannedStartDate = activity.plannedStartDate;
          }
        }
      }
  
      // Crashing: Agregar recursos para reducir duración
      for (const activity of criticalPath) {
        if (this.canCrash(activity, constraints)) {
          const originalDuration = activity.plannedDurationDays;
          activity.plannedDurationDays = Math.max(1, originalDuration * 0.8); // Reducir 20%
          
          // Ajustar costo por recursos adicionales
          activity.plannedTotalCost *= 1.3; // Incrementar 30% por recursos extra
        }
      }
    }
  
    private optimizeForCost(schedule: any, activities: ScheduleActivityEntity[], constraints: any): void {
      // Optimización de recursos para reducir costos
      const resourceGroups = this.groupActivitiesByResource(activities);
      
      for (const [resource, resourceActivities] of resourceGroups) {
        // Nivelar recursos para evitar picos costosos
        this.levelResources(resourceActivities);
        
        // Buscar oportunidades de compartir recursos
        this.optimizeResourceSharing(resourceActivities);
      }
    }
  
    private optimizeForResources(schedule: any, activities: ScheduleActivityEntity[], constraints: any): void {
      // Resource leveling algorithm
      const resourceCalendar = this.buildResourceCalendar(activities);
      
      // Identificar conflictos de recursos
      const conflicts = this.identifyResourceConflicts(resourceCalendar);
      
      // Resolver conflictos moviendo actividades no críticas
      for (const conflict of conflicts) {
        this.resolveResourceConflict(conflict, activities);
      }
    }
  
    private canParallelize(activity1: ScheduleActivity, activity2: ScheduleActivity): boolean {
      // Verificar si dos actividades pueden ejecutarse en paralelo
      return !this.hasResourceConflict(activity1, activity2) &&
             !this.hasDependencyConflict(activity1, activity2);
    }
  
    private canCrash(activity: ScheduleActivity, constraints: any): boolean {
      // Verificar si una actividad puede ser "crashed" (acelerada con más recursos)
      return activity.plannedDurationDays > 1 && 
             (!constraints.maxBudget || activity.plannedTotalCost * 1.3 <= constraints.maxBudget);
    }
  
    private hasResourceConflict(activity1: ScheduleActivity, activity2: ScheduleActivity): boolean {
      // Verificar conflictos de recursos entre actividades
      const resources1 = activity1.resourceRequirements?.workforce || [];
      const resources2 = activity2.resourceRequirements?.workforce || [];
      
      return resources1.some(r1 => 
        resources2.some(r2 => r1.trade === r2.trade)
      );
    }
  
    private hasDependencyConflict(activity1: ScheduleActivity, activity2: ScheduleActivity): boolean {
      // Verificar conflictos de dependencias
      return activity1.predecessors.includes(activity2.id) ||
             activity2.predecessors.includes(activity1.id) ||
             activity1.successors.includes(activity2.id) ||
             activity2.successors.includes(activity1.id);
    }
  
    private groupActivitiesByResource(activities: ScheduleActivity[]): Map<string, ScheduleActivity[]> {
      const groups = new Map<string, ScheduleActivity[]>();
      
      for (const activity of activities) {
        const resources = activity.resourceRequirements?.workforce || [];
        for (const resource of resources) {
          const key = resource.trade;
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(activity);
        }
      }
      
      return groups;
    }
  
    private levelResources(activities: ScheduleActivity[]): void {
      // Resource leveling algorithm - simplified implementation
      activities.sort((a, b) => a.plannedStartDate.getTime() - b.plannedStartDate.getTime());
      
      for (let i = 1; i < activities.length; i++) {
        const current = activities[i];
        const previous = activities[i - 1];
        
        // Si hay solapamiento, mover la actividad actual
        if (current.plannedStartDate < previous.plannedEndDate) {
          const delay = previous.plannedEndDate.getTime() - current.plannedStartDate.getTime();
          current.plannedStartDate = new Date(previous.plannedEndDate);
          current.plannedEndDate = new Date(current.plannedEndDate.getTime() + delay);
        }
      }
    }
  
    private optimizeResourceSharing(activities: ScheduleActivity[]): void {
      // Implementar lógica para optimizar el compartir recursos entre actividades
      // Por ahora implementation básica
    }
  
    private buildResourceCalendar(activities: ScheduleActivity[]): Map<string, any[]> {
      const calendar = new Map<string, any[]>();
      
      for (const activity of activities) {
        const resources = activity.resourceRequirements?.workforce || [];
        for (const resource of resources) {
          const key = resource.trade;
          if (!calendar.has(key)) {
            calendar.set(key, []);
          }
          
          calendar.get(key)!.push({
            activityId: activity.id,
            startDate: activity.plannedStartDate,
            endDate: activity.plannedEndDate,
            quantity: resource.quantity
          });
        }
      }
      
      return calendar;
    }
  
    private identifyResourceConflicts(resourceCalendar: Map<string, any[]>): any[] {
      const conflicts: any[] = [];
      
      for (const [resource, assignments] of resourceCalendar) {
        // Ordenar por fecha de inicio
        assignments.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        
        for (let i = 0; i < assignments.length - 1; i++) {
          const current = assignments[i];
          const next = assignments[i + 1];
          
          // Verificar solapamiento
          if (current.endDate > next.startDate) {
            conflicts.push({
              resource,
              conflictingActivities: [current.activityId, next.activityId],
              overlapDays: (current.endDate.getTime() - next.startDate.getTime()) / (24 * 60 * 60 * 1000)
            });
          }
        }
      }
      
      return conflicts;
    }
  
    private resolveResourceConflict(conflict: any, activities: ScheduleActivity[]): void {
      // Resolver conflicto moviendo la actividad no crítica
      const activity1 = activities.find(a => a.id === conflict.conflictingActivities[0]);
      const activity2 = activities.find(a => a.id === conflict.conflictingActivities[1]);
      
      if (activity1 && activity2) {
        if (!activity1.isCriticalPath && activity2.isCriticalPath) {
          // Mover activity1 después de activity2
          this.rescheduleActivity(activity1, activity2.plannedEndDate);
        } else if (activity1.isCriticalPath && !activity2.isCriticalPath) {
          // Mover activity2 después de activity1
          this.rescheduleActivity(activity2, activity1.plannedEndDate);
        }
      }
    }
  
    private rescheduleActivity(activity: ScheduleActivity, newStartDate: Date): void {
      const duration = activity.plannedDurationDays * 24 * 60 * 60 * 1000;
      activity.plannedStartDate = newStartDate;
      activity.plannedEndDate = new Date(newStartDate.getTime() + duration);
    }
  
    private calculateImprovements(
      originalSchedule: any, 
      optimizedSchedule: any, 
      originalActivities: ScheduleActivity[], 
      optimizedActivities: ScheduleActivity[]
    ): any {
      const originalDuration = originalSchedule.estimatedDurationDays;
      const optimizedDuration = Math.max(...optimizedActivities.map(a => 
        (a.plannedEndDate.getTime() - optimizedActivities[0].plannedStartDate.getTime()) / (24 * 60 * 60 * 1000)
      ));
      
      const originalCost = originalActivities.reduce((sum, a) => sum + a.plannedTotalCost, 0);
      const optimizedCost = optimizedActivities.reduce((sum, a) => sum + a.plannedTotalCost, 0);
      
      return {
        durationReduction: Math.max(0, originalDuration - optimizedDuration),
        costReduction: Math.max(0, originalCost - optimizedCost),
        resourceEfficiencyGain: this.calculateResourceEfficiency(optimizedActivities) - 
                               this.calculateResourceEfficiency(originalActivities)
      };
    }
  
    private calculateResourceEfficiency(activities: ScheduleActivity[]): number {
      // Simplified resource efficiency calculation
      return activities.length > 0 ? 
        activities.filter(a => a.resourceRequirements?.workforce?.length > 0).length / activities.length * 100 : 
        0;
    }
  
    private generateOptimizationRecommendations(originalSchedule: any, optimizedSchedule: any, improvements: any): any[] {
      const recommendations: any[] = [];
      
      if (improvements.durationReduction > 0) {
        recommendations.push({
          action: `Implementar paralelización de actividades para reducir ${improvements.durationReduction} días`,
          impact: `Reducción del ${((improvements.durationReduction / originalSchedule.estimatedDurationDays) * 100).toFixed(1)}% en duración`,
          priority: 'high' as const
        });
      }
      
      if (improvements.costReduction > 0) {
        recommendations.push({
          action: `Optimizar asignación de recursos para reducir costos`,
          impact: `Ahorro de $${improvements.costReduction.toFixed(2)}`,
          priority: 'medium' as const
        });
      }
      
      if (improvements.resourceEfficiencyGain > 5) {
        recommendations.push({
          action: `Implementar nivelación de recursos`,
          impact: `Mejora del ${improvements.resourceEfficiencyGain.toFixed(1)}% en eficiencia de recursos`,
          priority: 'medium' as const
        });
      }
      
      return recommendations;
    }
  
    private async processAlternativeScenarios(schedule: any, activities: ScheduleActivity[], scenarios: any[]): Promise<any[]> {
      const results = [];
      
      for (const scenario of scenarios) {
        // Procesar cada escenario alternativo
        const scenarioResult = await this.processScenario(schedule, activities, scenario);
        results.push({
          name: scenario.name,
          ...scenarioResult
        });
      }
      
      return results;
    }
  
    private async processScenario(schedule: any, activities: ScheduleActivity[], scenario: any): Promise<any> {
      // Implementar procesamiento de escenarios what-if
      return {
        estimatedDuration: schedule.estimatedDurationDays,
        estimatedCost: activities.reduce((sum, a) => sum + a.plannedTotalCost, 0),
        riskLevel: 'medium',
        feasibility: 'high'
      };
    }
  }