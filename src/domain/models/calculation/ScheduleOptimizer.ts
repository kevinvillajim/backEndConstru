// ===== ScheduleOptimizer.ts (Domain Model) =====
import { ScheduleActivityEntity } from '../../../infrastructure/database/entities/ScheduleActivityEntity';
import { ResourceAssignmentEntity } from '../../../infrastructure/database/entities/ResourceAssignmentEntity';
import { WorkforceEntity } from '../../../infrastructure/database/entities/WorkforceEntity';
import { EquipmentEntity } from '../../../infrastructure/database/entities/EquipmentEntity';

export interface OptimizationObjective {
  minimizeDuration: number; // peso 0-100
  minimizeCost: number; // peso 0-100
  maximizeQuality: number; // peso 0-100
  balanceResources: number; // peso 0-100
}

export interface OptimizationConstraints {
  maxProjectDuration: number; // días
  maxBudget: number;
  availableWorkforce: WorkforceEntity[];
  availableEquipment: EquipmentEntity[];
  fixedMilestones: {
    activityId: string;
    date: Date;
    flexibility: number; // días de flexibilidad
  }[];
  workingCalendar: {
    workingDays: number[]; // 0-6, domingo=0
    holidays: Date[];
    seasonalAdjustments: {
      startDate: Date;
      endDate: Date;
      productivityFactor: number;
    }[];
  };
  qualityRequirements: {
    activityId: string;
    minDuration: number; // días mínimos para calidad
    inspectionTime: number;
  }[];
}

export interface OptimizationResult {
  originalDuration: number;
  optimizedDuration: number;
  durationSaving: number;
  originalCost: number;
  optimizedCost: number;
  costSaving: number;
  qualityScore: number; // 0-100
  resourceUtilization: number; // 0-100
  optimizationActions: OptimizationAction[];
  risks: OptimizationRisk[];
  feasibilityScore: number; // 0-100
}

export interface OptimizationAction {
  type: 'parallel_execution' | 'resource_reallocation' | 'duration_adjustment' | 'sequence_change';
  description: string;
  affectedActivities: string[];
  impact: {
    durationChange: number;
    costChange: number;
    qualityImpact: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  implementation: {
    effort: 'low' | 'medium' | 'high';
    prerequisites: string[];
    timeline: number; // días para implementar
  };
}

export interface OptimizationRisk {
  description: string;
  probability: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface ResourceLevelingResult {
  leveledSchedule: ScheduleActivityEntity[];
  resourceProfile: {
    date: Date;
    resources: {
      [resourceType: string]: {
        required: number;
        available: number;
        utilization: number;
      };
    };
  }[];
  overallocation: {
    resourceType: string;
    dates: Date[];
    excessDemand: number;
  }[];
  recommendations: string[];
}

export class ScheduleOptimizer {
  
  constructor(
    private activities: ScheduleActivityEntity[],
    private constraints: OptimizationConstraints
  ) {}

  // Optimización principal con algoritmo genético simplificado
  public optimize(objective: OptimizationObjective): OptimizationResult {
    const originalMetrics = this.calculateCurrentMetrics();
    
    // 1. Generar alternativas de cronograma
    const alternatives = this.generateScheduleAlternatives();
    
    // 2. Evaluar cada alternativa
    const evaluatedAlternatives = alternatives.map(alt => ({
      schedule: alt,
      score: this.evaluateSchedule(alt, objective),
      metrics: this.calculateScheduleMetrics(alt)
    }));
    
    // 3. Seleccionar mejor alternativa
    const bestAlternative = evaluatedAlternatives.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    // 4. Generar acciones de optimización
    const actions = this.generateOptimizationActions(this.activities, bestAlternative.schedule);
    
    // 5. Analizar riesgos
    const risks = this.analyzeOptimizationRisks(bestAlternative.schedule, actions);
    
    return {
      originalDuration: originalMetrics.duration,
      optimizedDuration: bestAlternative.metrics.duration,
      durationSaving: originalMetrics.duration - bestAlternative.metrics.duration,
      originalCost: originalMetrics.cost,
      optimizedCost: bestAlternative.metrics.cost,
      costSaving: originalMetrics.cost - bestAlternative.metrics.cost,
      qualityScore: bestAlternative.metrics.quality,
      resourceUtilization: bestAlternative.metrics.resourceUtilization,
      optimizationActions: actions,
      risks: risks,
      feasibilityScore: this.calculateFeasibilityScore(bestAlternative.schedule)
    };
  }

  // Nivelación de recursos (Resource Leveling)
  public levelResources(): ResourceLevelingResult {
    const leveledActivities = [...this.activities];
    const resourceProfile = this.generateResourceProfile(leveledActivities);
    const overallocations = this.identifyOverallocations(resourceProfile);
    
    // Aplicar técnicas de nivelación
    this.applyResourceSmoothing(leveledActivities, overallocations);
    this.applyResourceLimitedScheduling(leveledActivities);
    
    const finalProfile = this.generateResourceProfile(leveledActivities);
    const finalOverallocations = this.identifyOverallocations(finalProfile);
    
    return {
      leveledSchedule: leveledActivities,
      resourceProfile: finalProfile,
      overallocation: finalOverallocations,
      recommendations: this.generateLevelingRecommendations(finalOverallocations)
    };
  }

  // Balanceo de línea de trabajo (Line of Balance)
  public balanceWorkflow(): ScheduleActivityEntity[] {
    const balancedActivities = [...this.activities];
    
    // Identificar trabajos repetitivos
    const repetitiveWorks = this.identifyRepetitiveActivities(balancedActivities);
    
    // Aplicar técnica Line of Balance
    repetitiveWorks.forEach(workGroup => {
      this.applyLineOfBalance(workGroup);
    });
    
    return balancedActivities;
  }

  // Optimización de ruta crítica
  public optimizeCriticalPath(): OptimizationAction[] {
    const criticalActivities = this.activities.filter(a => a.isCriticalPath);
    const actions: OptimizationAction[] = [];
    
    // 1. Compresión de cronograma (Schedule Compression)
    const compressionActions = this.applyCrashing(criticalActivities);
    actions.push(...compressionActions);
    
    // 2. Ejecución rápida (Fast Tracking)
    const fastTrackActions = this.applyFastTracking(criticalActivities);
    actions.push(...fastTrackActions);
    
    // 3. Reasignación de recursos
    const resourceActions = this.reallocateCriticalResources(criticalActivities);
    actions.push(...resourceActions);
    
    return actions;
  }

  // Análisis What-If
  public analyzeWhatIf(scenarios: {
    description: string;
    changes: {
      activityId: string;
      durationChange?: number;
      costChange?: number;
      resourceChange?: any;
    }[];
  }[]): any[] {
    return scenarios.map(scenario => {
      const modifiedActivities = this.applyScenarioChanges(scenario.changes);
      const metrics = this.calculateScheduleMetrics(modifiedActivities);
      const impact = this.calculateScenarioImpact(metrics);
      
      return {
        scenario: scenario.description,
        metrics,
        impact,
        recommendations: this.generateScenarioRecommendations(impact)
      };
    });
  }

  // Métodos privados de implementación

  private generateScheduleAlternatives(): ScheduleActivityEntity[][] {
    const alternatives: ScheduleActivityEntity[][] = [];
    
    // Alternativa 1: Cronograma original
    alternatives.push([...this.activities]);
    
    // Alternativa 2: Máxima paralelización
    alternatives.push(this.maximizeParallelization([...this.activities]));
    
    // Alternativa 3: Optimización de recursos
    alternatives.push(this.optimizeResourceUtilization([...this.activities]));
    
    // Alternativa 4: Minimización de riesgos
    alternatives.push(this.minimizeRiskExposure([...this.activities]));
    
    // Alternativa 5: Balanceada
    alternatives.push(this.createBalancedSchedule([...this.activities]));
    
    return alternatives;
  }

  private maximizeParallelization(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    // Identificar actividades que pueden ejecutarse en paralelo
    const parallelCandidates = this.findParallelizationOpportunities(activities);
    
    parallelCandidates.forEach(group => {
      // Modificar dependencias para permitir ejecución paralela
      const baseActivity = group[0];
      for (let i = 1; i < group.length; i++) {
        const activity = group[i];
        // Cambiar predecessors para que inicien al mismo tiempo que baseActivity
        activity.predecessors = baseActivity.predecessors ? [...baseActivity.predecessors] : [];
      }
    });
    
    // Recalcular fechas
    this.recalculateScheduleDates(activities);
    
    return activities;
  }

  private optimizeResourceUtilization(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    // Suavizar picos de demanda de recursos
    const resourceDemand = this.calculateResourceDemandProfile(activities);
    const peaks = this.identifyResourcePeaks(resourceDemand);
    
    peaks.forEach(peak => {
      // Redistribuir actividades para suavizar el pico
      this.redistributeActivitiesAroundPeak(activities, peak);
    });
    
    this.recalculateScheduleDates(activities);
    
    return activities;
  }

  private minimizeRiskExposure(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    // Añadir buffers en actividades críticas
    const criticalActivities = activities.filter(a => a.isCriticalPath);
    
    criticalActivities.forEach(activity => {
      // Añadir 10% de buffer
      activity.plannedDurationDays = Math.ceil(activity.plannedDurationDays * 1.1);
    });
    
    // Programar actividades sensibles al clima en períodos favorables
    this.scheduleWeatherSensitiveActivities(activities);
    
    this.recalculateScheduleDates(activities);
    
    return activities;
  }

  private createBalancedSchedule(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    // Combinación balanceada de todas las estrategias
    
    // 1. Paralelización moderada
    const limitedParallel = this.findParallelizationOpportunities(activities).slice(0, 2);
    limitedParallel.forEach(group => {
      if (group.length === 2) { // Solo grupos pequeños
        const [first, second] = group;
        second.predecessors = first.predecessors ? [...first.predecessors] : [];
      }
    });
    
    // 2. Buffer moderado solo en actividades muy críticas
    const criticalActivities = activities.filter(a => a.isCriticalPath && a.totalFloat === 0);
    criticalActivities.forEach(activity => {
      activity.plannedDurationDays = Math.ceil(activity.plannedDurationDays * 1.05); // 5% buffer
    });
    
    // 3. Suavizado ligero de recursos
    this.applyLightResourceSmoothing(activities);
    
    this.recalculateScheduleDates(activities);
    
    return activities;
  }

  private evaluateSchedule(activities: ScheduleActivityEntity[], objective: OptimizationObjective): number {
    const metrics = this.calculateScheduleMetrics(activities);
    
    // Normalizar métricas (0-100)
    const normalizedDuration = Math.max(0, 100 - (metrics.duration / this.constraints.maxProjectDuration * 100));
    const normalizedCost = Math.max(0, 100 - (metrics.cost / this.constraints.maxBudget * 100));
    const normalizedQuality = metrics.quality;
    const normalizedResources = metrics.resourceUtilization;
    
    // Calcular score ponderado
    const score = (
      normalizedDuration * (objective.minimizeDuration / 100) +
      normalizedCost * (objective.minimizeCost / 100) +
      normalizedQuality * (objective.maximizeQuality / 100) +
      normalizedResources * (objective.balanceResources / 100)
    ) / 4;
    
    return score;
  }

  private calculateCurrentMetrics(): any {
    return this.calculateScheduleMetrics(this.activities);
  }

  private calculateScheduleMetrics(activities: ScheduleActivityEntity[]): any {
    const duration = activities.reduce((max, activity) => {
      const activityEnd = activity.plannedEndDate.getTime();
      return Math.max(max, activityEnd);
    }, 0);
    
    const startDate = activities.reduce((min, activity) => {
      const activityStart = activity.plannedStartDate.getTime();
      return Math.min(min, activityStart);
    }, Date.now());
    
    const totalDuration = Math.ceil((duration - startDate) / (1000 * 3600 * 24));
    const totalCost = activities.reduce((sum, activity) => sum + activity.plannedTotalCost, 0);
    
    // Calcular calidad basada en duraciones vs mínimas
    const qualityScore = this.calculateQualityScore(activities);
    
    // Calcular utilización de recursos
    const resourceUtilization = this.calculateResourceUtilizationScore(activities);
    
    return {
      duration: totalDuration,
      cost: totalCost,
      quality: qualityScore,
      resourceUtilization
    };
  }

  private calculateQualityScore(activities: ScheduleActivityEntity[]): number {
    // Score basado en si las actividades tienen tiempo suficiente para calidad
    let totalScore = 0;
    let count = 0;
    
    activities.forEach(activity => {
      const qualityReq = this.constraints.qualityRequirements.find(q => q.activityId === activity.id);
      if (qualityReq) {
        const score = Math.min(100, (activity.plannedDurationDays / qualityReq.minDuration) * 100);
        totalScore += score;
        count++;
      }
    });
    
    return count > 0 ? totalScore / count : 80; // Default 80 si no hay requisitos específicos
  }

  private calculateResourceUtilizationScore(activities: ScheduleActivityEntity[]): number {
    const profile = this.generateResourceProfile(activities);
    
    // Calcular varianza en utilización (menor varianza = mejor score)
    const utilizationValues = profile.map(day => {
      const totalUtilization = Object.values(day.resources).reduce((sum, resource: any) => 
        sum + (resource.utilization || 0), 0);
      return Number(totalUtilization) / Math.max(1, Object.keys(day.resources).length);
    });
    
    const average = utilizationValues.reduce((sum, val) => sum + val, 0) / Math.max(1, utilizationValues.length);
    const variance = utilizationValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / Math.max(1, utilizationValues.length);
    
    // Convertir varianza en score (menor varianza = mayor score)
    return Math.max(0, 100 - variance);
  }

  private generateResourceProfile(activities: ScheduleActivityEntity[]): any[] {
    const profile = [];
    const startDate = new Date(Math.min(...activities.map(a => a.plannedStartDate.getTime())));
    const endDate = new Date(Math.max(...activities.map(a => a.plannedEndDate.getTime())));
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayProfile = {
        date: new Date(date),
        resources: {}
      };
      
      // Calcular demanda de recursos para este día
      activities.forEach(activity => {
        if (date >= activity.plannedStartDate && date <= activity.plannedEndDate) {
          const trade = activity.primaryTrade;
          if (!dayProfile.resources[trade]) {
            dayProfile.resources[trade] = { required: 0, available: 10, utilization: 0 }; // Simplified
          }
          dayProfile.resources[trade].required += 1;
        }
      });
      
      // Calcular utilización
      Object.values(dayProfile.resources).forEach((resource: any) => {
        resource.utilization = Math.min(100, (resource.required / resource.available) * 100);
      });
      
      profile.push(dayProfile);
    }
    
    return profile;
  }

  private findParallelizationOpportunities(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[][] {
    const opportunities: ScheduleActivityEntity[][] = [];
    
    // Buscar actividades que pueden ejecutarse en paralelo
    const groupsByTrade = this.groupActivitiesByTrade(activities);
    
    Object.values(groupsByTrade).forEach((tradeActivities: ScheduleActivityEntity[]) => {
      if (tradeActivities.length > 1) {
        // Verificar si pueden ejecutarse en paralelo
        const parallelCandidates = this.findParallelCandidatesInTrade(tradeActivities);
        if (parallelCandidates.length > 1) {
          opportunities.push(parallelCandidates);
        }
      }
    });
    
    return opportunities;
  }

  private groupActivitiesByTrade(activities: ScheduleActivityEntity[]): Record<string, ScheduleActivityEntity[]> {
    return activities.reduce((groups: Record<string, ScheduleActivityEntity[]>, activity) => {
      const trade = activity.primaryTrade;
      if (!groups[trade]) {
        groups[trade] = [];
      }
      groups[trade].push(activity);
      return groups;
    }, {});
  }

  private calculateTradeProductivity(activities: ScheduleActivityEntity[]): any {
    const productivities = activities.map(activity => {
      const planned = activity.workQuantities?.plannedQuantity || 1;
      const completed = activity.workQuantities?.completedQuantity || 0;
      const progress = activity.progressPercentage / 100;
      const expected = planned * progress;
      
      return expected > 0 ? completed / expected : 1;
    });
    
    const averageProductivity = productivities.reduce((sum, p) => sum + p, 0) / productivities.length;
    const bestProductivity = Math.max(...productivities);
    const worstProductivity = Math.min(...productivities);
    
    return {
      trade: activities[0].primaryTrade,
      averageProductivity,
      bestDay: { date: new Date(), productivity: bestProductivity }, // Simplificado
      worstDay: { date: new Date(), productivity: worstProductivity }, // Simplificado
      trend: this.calculateTradeTrend(activities)
    };
  }
  calculateTradeTrend(activities: ScheduleActivityEntity[]) {
    throw new Error('Method not implemented.');
  }

  private findParallelCandidatesInTrade(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    // Simplificado: buscar actividades consecutivas del mismo trade
    return activities.filter((activity, index) => {
      if (index === 0) return true;
      
      const prevActivity = activities[index - 1];
      const hasPredecessorDependency = activity.predecessors?.some(p => p.activityId === prevActivity.id);
      
      return !hasPredecessorDependency; // Pueden ejecutarse en paralelo si no dependen directamente
    });
  }

  private identifyOverallocations(resourceProfile: any[]): any[] {
    const overallocations = [];
    
    resourceProfile.forEach(day => {
      Object.entries(day.resources).forEach(([resourceType, resource]: [string, any]) => {
        if (resource.utilization > 100) {
          overallocations.push({
            resourceType,
            dates: [day.date],
            excessDemand: resource.required - resource.available
          });
        }
      });
    });
    
    // Consolidar overallocations consecutivos
    return this.consolidateConsecutiveOverallocations(overallocations);
  }

  private consolidateConsecutiveOverallocations(overallocations: any[]): any[] {
    // Agrupa overallocations consecutivos del mismo recurso
    const consolidated = [];
    const processed = new Set();
    
    overallocations.forEach((overallocation, index) => {
      if (processed.has(index)) return;
      
      const group = {
        resourceType: overallocation.resourceType,
        dates: [overallocation.dates[0]],
        excessDemand: overallocation.excessDemand
      };
      
      // Buscar overallocations consecutivos
      for (let i = index + 1; i < overallocations.length; i++) {
        const next = overallocations[i];
        if (next.resourceType === group.resourceType) {
          const lastDate = group.dates[group.dates.length - 1];
          const nextDate = next.dates[0];
          const dayDifference = Math.abs(nextDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
          
          if (dayDifference <= 1) {
            group.dates.push(nextDate);
            group.excessDemand = Math.max(group.excessDemand, next.excessDemand);
            processed.add(i);
          }
        }
      }
      
      consolidated.push(group);
      processed.add(index);
    });
    
    return consolidated;
  }

  private applyResourceSmoothing(activities: ScheduleActivityEntity[], overallocations: any[]): void {
    overallocations.forEach(overallocation => {
      // Buscar actividades que pueden moverse dentro de su holgura
      const affectedActivities = activities.filter(activity => 
        activity.primaryTrade === overallocation.resourceType &&
        overallocation.dates.some(date => 
          date >= activity.plannedStartDate && date <= activity.plannedEndDate
        ) &&
        activity.totalFloat > 0
      );
      
      // Mover actividades con holgura
      affectedActivities.forEach(activity => {
        if (activity.totalFloat > 0) {
          // Mover la actividad hacia adelante en su holgura
          const movedays = Math.min(activity.totalFloat, 2);
          activity.plannedStartDate = new Date(activity.plannedStartDate.getTime() + (movedays * 24 * 60 * 60 * 1000));
          activity.plannedEndDate = new Date(activity.plannedEndDate.getTime() + (movedays * 24 * 60 * 60 * 1000));
        }
      });
    });
  }

  private applyResourceLimitedScheduling(activities: ScheduleActivityEntity[]): void {
    // Implementar programación limitada por recursos
    // Reorganizar actividades respetando límites de recursos disponibles
    
    const sortedActivities = [...activities].sort((a, b) => {
      // Priorizar actividades críticas
      if (a.isCriticalPath && !b.isCriticalPath) return -1;
      if (!a.isCriticalPath && b.isCriticalPath) return 1;
      
      // Luego por fecha de inicio temprana
      return a.earlyStartDate.getTime() - b.earlyStartDate.getTime();
    });
    
    const resourceCalendar = new Map();
    
    sortedActivities.forEach(activity => {
      const resourceType = activity.primaryTrade;
      const requiredResource = 1; // Simplificado
      
      // Buscar primera fecha disponible para este recurso
      let startDate = activity.earlyStartDate;
      while (!this.isResourceAvailable(resourceCalendar, resourceType, startDate, activity.plannedDurationDays, requiredResource)) {
        startDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000));
      }
      
      // Reservar recurso
      this.reserveResource(resourceCalendar, resourceType, startDate, activity.plannedDurationDays, requiredResource);
      
      // Actualizar fechas de la actividad
      activity.plannedStartDate = startDate;
      activity.plannedEndDate = new Date(startDate.getTime() + (activity.plannedDurationDays * 24 * 60 * 60 * 1000));
    });
  }

  private isResourceAvailable(resourceCalendar: Map<string, any>, resourceType: string, startDate: Date, duration: number, required: number): boolean {
    const maxAvailable = 10; // Simplificado
    
    for (let i = 0; i < duration; i++) {
      const checkDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateKey = checkDate.toISOString().split('T')[0];
      const key = `${resourceType}_${dateKey}`;
      
      const used = resourceCalendar.get(key) || 0;
      if (used + required > maxAvailable) {
        return false;
      }
    }
    
    return true;
  }

  private reserveResource(resourceCalendar: Map<string, any>, resourceType: string, startDate: Date, duration: number, required: number): void {
    for (let i = 0; i < duration; i++) {
      const reserveDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateKey = reserveDate.toISOString().split('T')[0];
      const key = `${resourceType}_${dateKey}`;
      
      const current = resourceCalendar.get(key) || 0;
      resourceCalendar.set(key, current + required);
    }
  }

  private recalculateScheduleDates(activities: ScheduleActivityEntity[]): void {
    // Recalcular fechas usando algoritmo CPM
    // Esta es una versión simplificada
    
    // Forward pass
    activities.forEach(activity => {
      if (!activity.predecessors || activity.predecessors.length === 0) {
        // Mantener fecha de inicio si ya está establecida
        if (!activity.plannedStartDate) {
          activity.plannedStartDate = new Date();
        }
      } else {
        let latestPredecessorFinish = new Date(0);
        
        activity.predecessors.forEach(pred => {
          const predecessor = activities.find(a => a.id === pred.activityId);
          if (predecessor && predecessor.plannedEndDate) {
            const finishWithLag = new Date(predecessor.plannedEndDate.getTime() + (pred.lagDays * 24 * 60 * 60 * 1000));
            if (finishWithLag > latestPredecessorFinish) {
              latestPredecessorFinish = finishWithLag;
            }
          }
        });
        
        if (latestPredecessorFinish.getTime() > 0) {
          activity.plannedStartDate = latestPredecessorFinish;
        }
      }
      
      activity.plannedEndDate = new Date(activity.plannedStartDate.getTime() + (activity.plannedDurationDays * 24 * 60 * 60 * 1000));
    });
  }

  private generateOptimizationActions(original: ScheduleActivityEntity[], optimized: ScheduleActivityEntity[]): OptimizationAction[] {
    const actions: OptimizationAction[] = [];
    
    // Comparar cronogramas y generar acciones
    original.forEach((origActivity, index) => {
      const optActivity = optimized[index];
      
      if (origActivity.plannedDurationDays !== optActivity.plannedDurationDays) {
        actions.push({
          type: 'duration_adjustment',
          description: `Adjust duration of ${origActivity.name} from ${origActivity.plannedDurationDays} to ${optActivity.plannedDurationDays} days`,
          affectedActivities: [origActivity.id],
          impact: {
            durationChange: optActivity.plannedDurationDays - origActivity.plannedDurationDays,
            costChange: 0,
            qualityImpact: optActivity.plannedDurationDays > origActivity.plannedDurationDays ? 'Improved' : 'Monitor closely',
            riskLevel: 'medium'
          },
          implementation: {
            effort: 'low',
            prerequisites: ['Resource availability confirmation'],
            timeline: 1
          }
        });
      }
    });
    
    return actions;
  }

  private analyzeOptimizationRisks(schedule: ScheduleActivityEntity[], actions: OptimizationAction[]): OptimizationRisk[] {
    const risks: OptimizationRisk[] = [];
    
    // Riesgos por compresión de cronograma
    const compressedActivities = actions.filter(a => a.impact.durationChange < 0);
    if (compressedActivities.length > 0) {
      risks.push({
        description: 'Schedule compression may impact quality',
        probability: 60,
        impact: 'medium',
        mitigation: 'Increase quality control inspections'
      });
    }
    
    // Riesgos por paralelización
    const parallelActions = actions.filter(a => a.type === 'parallel_execution');
    if (parallelActions.length > 0) {
      risks.push({
        description: 'Parallel execution increases coordination complexity',
        probability: 40,
        impact: 'medium',
        mitigation: 'Enhance communication protocols and daily coordination meetings'
      });
    }
    
    return risks;
  }

  private calculateFeasibilityScore(schedule: ScheduleActivityEntity[]): number {
    let score = 100;
    
    // Penalizar por sobreposiciones de recursos
    const overallocations = this.identifyOverallocations(this.generateResourceProfile(schedule));
    score -= overallocations.length * 10;
    
    // Penalizar por compresión excesiva
    const compressedActivities = schedule.filter(a => a.plannedDurationDays < 1);
    score -= compressedActivities.length * 15;
    
    // Penalizar por dependencias complejas
    const complexActivities = schedule.filter(a => a.predecessors && a.predecessors.length > 3);
    score -= complexActivities.length * 5;
    
    return Math.max(0, score);
  }

  // Métodos adicionales simplificados para completar la implementación
  
  private applyCrashing(activities: ScheduleActivityEntity[]): OptimizationAction[] {
    // Crashing: agregar recursos para reducir duración
    return activities.map(activity => ({
      type: 'resource_reallocation',
      description: `Add resources to crash ${activity.name}`,
      affectedActivities: [activity.id],
      impact: {
        durationChange: -1,
        costChange: activity.plannedTotalCost * 0.2,
        qualityImpact: 'Monitor for quality impact',
        riskLevel: 'medium'
      },
      implementation: {
        effort: 'medium',
        prerequisites: ['Additional resource availability'],
        timeline: 2
      }
    }));
  }

  private applyFastTracking(activities: ScheduleActivityEntity[]): OptimizationAction[] {
    // Fast tracking: ejecutar actividades en paralelo
    const candidates = activities.filter((activity, index) => index > 0);
    
    return candidates.map(activity => ({
      type: 'parallel_execution',
      description: `Execute ${activity.name} in parallel with predecessor`,
      affectedActivities: [activity.id],
      impact: {
        durationChange: -2,
        costChange: 0,
        qualityImpact: 'Requires careful coordination',
        riskLevel: 'high'
      },
      implementation: {
        effort: 'high',
        prerequisites: ['Coordination protocol', 'Risk assessment'],
        timeline: 3
      }
    }));
  }

  private reallocateCriticalResources(activities: ScheduleActivityEntity[]): OptimizationAction[] {
    return activities.map(activity => ({
      type: 'resource_reallocation',
      description: `Prioritize resources for critical activity ${activity.name}`,
      affectedActivities: [activity.id],
      impact: {
        durationChange: 0,
        costChange: 0,
        qualityImpact: 'Improved focus on critical path',
        riskLevel: 'low'
      },
      implementation: {
        effort: 'low',
        prerequisites: ['Resource manager approval'],
        timeline: 1
      }
    }));
  }

  private applyScenarioChanges(changes: any[]): ScheduleActivityEntity[] {
    const modifiedActivities = [...this.activities];
    
    changes.forEach(change => {
      const activity = modifiedActivities.find(a => a.id === change.activityId);
      if (activity) {
        if (change.durationChange) {
          activity.plannedDurationDays += change.durationChange;
        }
        if (change.costChange) {
          activity.plannedTotalCost += change.costChange;
        }
      }
    });
    
    this.recalculateScheduleDates(modifiedActivities);
    
    return modifiedActivities;
  }

  private calculateScenarioImpact(metrics: any): any {
    const originalMetrics = this.calculateCurrentMetrics();
    
    return {
      durationImpact: metrics.duration - originalMetrics.duration,
      costImpact: metrics.cost - originalMetrics.cost,
      qualityImpact: metrics.quality - originalMetrics.quality,
      riskLevel: this.assessScenarioRisk(metrics, originalMetrics)
    };
  }

  private assessScenarioRisk(newMetrics: any, originalMetrics: any): string {
    const durationIncrease = (newMetrics.duration - originalMetrics.duration) / originalMetrics.duration;
    const costIncrease = (newMetrics.cost - originalMetrics.cost) / originalMetrics.cost;
    
    if (durationIncrease > 0.2 || costIncrease > 0.2) return 'high';
    if (durationIncrease > 0.1 || costIncrease > 0.1) return 'medium';
    return 'low';
  }

  private generateScenarioRecommendations(impact: any): string[] {
    const recommendations = [];
    
    if (impact.durationImpact > 5) {
      recommendations.push('Consider resource reallocation to mitigate schedule impact');
    }
    
    if (impact.costImpact > 10000) {
      recommendations.push('Review budget allocation and seek cost optimization opportunities');
    }
    
    if (impact.riskLevel === 'high') {
      recommendations.push('Implement additional risk mitigation measures');
    }
    
    return recommendations;
  }

  private generateLevelingRecommendations(overallocations: any[]): string[] {
    const recommendations = [];
    
    if (overallocations.length === 0) {
      recommendations.push('Resource allocation is well balanced');
    } else {
      recommendations.push('Consider hiring additional resources for overallocated periods');
      recommendations.push('Evaluate subcontracting opportunities for peak demand');
      recommendations.push('Review activity sequences to reduce resource conflicts');
    }
    
    return recommendations;
  }

  // Métodos auxiliares adicionales
  
  private identifyRepetitiveActivities(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[][] {
    // Identificar grupos de actividades repetitivas (ej: pisos, apartamentos)
    const groups = new Map();
    
    activities.forEach(activity => {
      const basePattern = this.extractActivityPattern(activity.name);
      if (!groups.has(basePattern)) {
        groups.set(basePattern, []);
      }
      groups.get(basePattern).push(activity);
    });
    
    // Filtrar solo grupos con múltiples actividades
    return Array.from(groups.values()).filter(group => group.length > 1);
  }

  private extractActivityPattern(activityName: string): string {
    // Extraer patrón base removiendo números y sufijos específicos
    return activityName.replace(/\d+|piso|apartamento|unidad/gi, '').trim();
  }

  private applyLineOfBalance(workGroup: ScheduleActivityEntity[]): void {
    // Aplicar técnica Line of Balance para trabajo repetitivo
    const sortedGroup = workGroup.sort((a, b) => 
      a.plannedStartDate.getTime() - b.plannedStartDate.getTime()
    );
    
    // Calcular ritmo óptimo de trabajo
    const totalDuration = sortedGroup.reduce((sum, activity) => sum + activity.plannedDurationDays, 0);
    const averageDuration = totalDuration / sortedGroup.length;
    
    // Redistribuir para mantener ritmo constante
    sortedGroup.forEach((activity, index) => {
      if (index > 0) {
        const previousActivity = sortedGroup[index - 1];
        const idealStart = new Date(previousActivity.plannedStartDate.getTime() + (averageDuration * 0.8 * 24 * 60 * 60 * 1000));
        
        if (idealStart > activity.plannedStartDate) {
          activity.plannedStartDate = idealStart;
          activity.plannedEndDate = new Date(idealStart.getTime() + (activity.plannedDurationDays * 24 * 60 * 60 * 1000));
        }
      }
    });
  }

  private calculateResourceDemandProfile(activities: ScheduleActivityEntity[]): Map<string, Map<string, number>> {
    // Calcular perfil de demanda de recursos a lo largo del tiempo
    const profile = new Map<string, Map<string, number>>();
    
    activities.forEach(activity => {
      const startTime = activity.plannedStartDate.getTime();
      const endTime = activity.plannedEndDate.getTime();
      const resourceType = activity.primaryTrade;
      
      for (let time = startTime; time <= endTime; time += 24 * 60 * 60 * 1000) {
        const dateKey = new Date(time).toISOString().split('T')[0];
        
        if (!profile.has(dateKey)) {
          profile.set(dateKey, new Map<string, number>());
        }
        
        const dayProfile = profile.get(dateKey)!;
        const currentDemand = dayProfile.get(resourceType) || 0;
        dayProfile.set(resourceType, currentDemand + 1);
      }
    });
    
    return profile;
  }

  private identifyResourcePeaks(resourceDemand: Map<string, Map<string, number>>): any[] {
    const peaks: any[] = [];
    const threshold = 5; // Más de 5 recursos del mismo tipo en un día
    
    resourceDemand.forEach((dayProfile, date) => {
      dayProfile.forEach((demand, resourceType) => {
        if (demand > threshold) {
          peaks.push({
            date: new Date(date),
            resourceType,
            demand,
            excess: demand - threshold
          });
        }
      });
    });
    
    return peaks;
  }

  private redistributeActivitiesAroundPeak(activities: ScheduleActivityEntity[], peak: any): void {
    // Redistribuir actividades alrededor de un pico de demanda
    const affectedActivities = activities.filter(activity => 
      activity.primaryTrade === peak.resourceType &&
      activity.plannedStartDate <= peak.date &&
      activity.plannedEndDate >= peak.date &&
      activity.totalFloat > 0
    );
    
    // Mover algunas actividades antes o después del pico
    const toMove = Math.min(affectedActivities.length, peak.excess);
    
    for (let i = 0; i < toMove; i++) {
      const activity = affectedActivities[i];
      const moveDirection = i % 2 === 0 ? -1 : 1; // Alternar antes/después
      const moveDays = Math.min(activity.totalFloat, 2) * moveDirection;
      
      activity.plannedStartDate = new Date(activity.plannedStartDate.getTime() + (moveDays * 24 * 60 * 60 * 1000));
      activity.plannedEndDate = new Date(activity.plannedEndDate.getTime() + (moveDays * 24 * 60 * 60 * 1000));
    }
  }

  private scheduleWeatherSensitiveActivities(activities: ScheduleActivityEntity[]): void {
    // Programar actividades sensibles al clima en períodos favorables
    const weatherSensitive = ['CONCRETE', 'PAINTING', 'ROOFING'];
    
    activities.forEach(activity => {
      if (weatherSensitive.includes(activity.primaryTrade)) {
        // Buscar período con mejor clima (simplificado)
        const bestPeriod = this.findBestWeatherPeriod(activity.plannedStartDate, activity.plannedDurationDays);
        
        if (bestPeriod && activity.totalFloat > 0) {
          const daysToMove = Math.floor((bestPeriod.getTime() - activity.plannedStartDate.getTime()) / (24 * 60 * 60 * 1000));
          const maxMove = Math.min(Math.abs(daysToMove), activity.totalFloat);
          
          if (maxMove > 0) {
            const moveDirection = daysToMove > 0 ? 1 : -1;
            activity.plannedStartDate = new Date(activity.plannedStartDate.getTime() + (maxMove * moveDirection * 24 * 60 * 60 * 1000));
            activity.plannedEndDate = new Date(activity.plannedEndDate.getTime() + (maxMove * moveDirection * 24 * 60 * 60 * 1000));
          }
        }
      }
    });
  }

  private findBestWeatherPeriod(around: Date, duration: number): Date | null {
    // Simplificado: buscar período con mejor clima cerca de la fecha
    // En implementación real, consultaría datos meteorológicos
    
    // Por ahora, sugerir evitar enero-marzo (época lluviosa en Ecuador)
    const month = around.getMonth();
    
    if (month >= 0 && month <= 2) { // Enero-Marzo
      // Sugerir mover a abril si es posible
      return new Date(around.getFullYear(), 3, around.getDate());
    }
    
    return null; // Período actual es aceptable
  }

  private applyLightResourceSmoothing(activities: ScheduleActivityEntity[]): void {
    // Suavizado ligero de recursos
    const resourceProfile = this.generateResourceProfile(activities);
    const minorPeaks = this.identifyResourcePeaks(resourceProfile).filter(peak => peak.excess <= 2);
    
    minorPeaks.forEach(peak => {
      const affectedActivities = activities.filter(activity => 
        activity.primaryTrade === peak.resourceType &&
        activity.plannedStartDate <= peak.date &&
        activity.plannedEndDate >= peak.date &&
        activity.totalFloat > 0
      );
      
      // Mover solo una actividad con menor impacto
      if (affectedActivities.length > 0) {
        const activityToMove = affectedActivities.reduce((min, current) => 
          current.totalFloat > min.totalFloat ? current : min
        );
        
        const moveDays = Math.min(activityToMove.totalFloat, 1);
        activityToMove.plannedStartDate = new Date(activityToMove.plannedStartDate.getTime() + (moveDays * 24 * 60 * 60 * 1000));
        activityToMove.plannedEndDate = new Date(activityToMove.plannedEndDate.getTime() + (moveDays * 24 * 60 * 60 * 1000));
      }
    });
  }
}