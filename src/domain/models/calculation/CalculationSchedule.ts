// ===== CalculationSchedule.ts (Domain Model) =====
import { ScheduleActivityEntity } from '../../../infrastructure/database/entities/ScheduleActivityEntity';
import { CalculationBudgetEntity } from '../../../infrastructure/database/entities/CalculationBudgetEntity';
import { WeatherFactorEntity } from '../../../infrastructure/database/entities/WeatherFactorEntity';

export interface ScheduleGenerationOptions {
  optimizeFor: 'time' | 'cost' | 'quality' | 'balanced';
  allowParallelActivities: boolean;
  includeWeatherFactors: boolean;
  includeBufferTime: boolean;
  bufferPercentage: number;
  maxResourceUtilization: number;
  prioritizeCriticalPath: boolean;
}

export interface CriticalPathAnalysis {
  activities: string[]; // IDs de actividades en ruta crítica
  totalDuration: number;
  floatActivities: {
    activityId: string;
    totalFloat: number;
    freeFloat: number;
  }[];
  bottlenecks: {
    resourceType: string;
    constraint: string;
    impactDays: number;
  }[];
}

export interface ResourceOptimization {
  currentUtilization: {
    workforce: { [trade: string]: number };
    equipment: { [type: string]: number };
  };
  recommendedAdjustments: {
    activityId: string;
    adjustment: 'increase' | 'decrease' | 'redistribute';
    resourceType: string;
    impact: string;
  }[];
  costSavingOpportunities: {
    description: string;
    potentialSaving: number;
    implementationEffort: 'low' | 'medium' | 'high';
  }[];
}

export interface ScheduleRisk {
  riskId: string;
  type: 'weather' | 'resource' | 'dependency' | 'quality' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  impact: {
    durationDays: number;
    cost: number;
    qualityImpact: string;
  };
  mitigation: {
    strategy: string;
    cost: number;
    effectiveness: number; // 0-100
  };
  contingency: {
    action: string;
    triggerCondition: string;
    responsibility: string;
  };
}

export class CalculationSchedule {
  constructor(
    public id: string,
    public name: string,
    public projectId: string,
    public calculationBudgetId?: string
  ) {}

  // Generación de cronograma desde presupuesto
  public static generateFromBudget(
    budget: CalculationBudgetEntity,
    template: any,
    options: ScheduleGenerationOptions
  ): ScheduleActivityEntity[] {
    const activities: ScheduleActivityEntity[] = [];
    
    // 1. Extraer actividades del presupuesto
    const budgetItems = budget.lineItems || [];
    
    // 2. Crear actividades base por categoría de materiales/trabajo
    budgetItems.forEach((item, index) => {
      const activity = new ScheduleActivityEntity();
      activity.id = `act_${index}`;
      activity.name = item.description || `Actividad ${index + 1}`;
      activity.activityType = this.determineActivityType(item);
      activity.primaryTrade = this.determinePrimaryTrade(item);
      
      // Calcular duración basada en cantidades y rendimientos
      const duration = this.calculateActivityDuration(item, template);
      activity.plannedDurationDays = duration;
      
      // Calcular costos
      activity.plannedLaborCost = item.laborCost || 0;
      activity.plannedMaterialCost = item.materialCost || 0;
      activity.plannedEquipmentCost = item.equipmentCost || 0;
      activity.plannedTotalCost = item.totalCost || 0;
      
      activities.push(activity);
    });
    
    // 3. Establecer dependencias lógicas
    this.establishDependencies(activities, template);
    
    // 4. Calcular fechas con algoritmo CPM
    this.calculateScheduleDates(activities, new Date());
    
    // 5. Optimizar según opciones
    if (options.optimizeFor === 'time') {
      this.optimizeForTime(activities);
    } else if (options.optimizeFor === 'cost') {
      this.optimizeForCost(activities);
    }
    
    return activities;
  }

  private static determineActivityType(budgetItem: any): string {
    // Lógica para determinar tipo de actividad basado en item del presupuesto
    const description = (budgetItem.description || '').toLowerCase();
    
    if (description.includes('excavac') || description.includes('movimiento')) return 'CONSTRUCTION';
    if (description.includes('hormig') || description.includes('concrete')) return 'CONSTRUCTION';
    if (description.includes('instalac') || description.includes('tubería')) return 'INSTALLATION';
    if (description.includes('inspecc') || description.includes('control')) return 'INSPECTION';
    if (description.includes('entrega') || description.includes('suministro')) return 'DELIVERY';
    
    return 'CONSTRUCTION';
  }

  private static determinePrimaryTrade(budgetItem: any): string {
    const description = (budgetItem.description || '').toLowerCase();
    
    if (description.includes('excavac')) return 'EXCAVATION';
    if (description.includes('hormig') || description.includes('concrete')) return 'CONCRETE';
    if (description.includes('mampost') || description.includes('ladrillo')) return 'MASONRY';
    if (description.includes('acero') || description.includes('hierro')) return 'STEEL';
    if (description.includes('madera') || description.includes('carpint')) return 'CARPENTRY';
    if (description.includes('electric') || description.includes('cable')) return 'ELECTRICAL';
    if (description.includes('tubería') || description.includes('plomer')) return 'PLUMBING';
    if (description.includes('pintura') || description.includes('acabado')) return 'PAINTING';
    
    return 'CONSTRUCTION';
  }

  private static calculateActivityDuration(budgetItem: any, template: any): number {
    // Calcular duración basada en cantidades y rendimientos del template
    const quantity = budgetItem.quantity || 1;
    const unit = budgetItem.unit || 'm2';
    
    // Rendimientos estándar por tipo de trabajo (cantidad por día)
    const standardProductivity = {
      'EXCAVATION': { 'm3': 50, 'm2': 100 },
      'CONCRETE': { 'm3': 15, 'm2': 80 },
      'MASONRY': { 'm2': 25, 'm3': 10 },
      'STEEL': { 'kg': 200, 'ton': 0.5 },
      'CARPENTRY': { 'm2': 20, 'ml': 50 },
      'ELECTRICAL': { 'pto': 8, 'ml': 100 },
      'PLUMBING': { 'pto': 6, 'ml': 80 },
      'PAINTING': { 'm2': 150 }
    };

    const trade = this.determinePrimaryTrade(budgetItem);
    const productivity = standardProductivity[trade]?.[unit] || 10;
    
    const baseDuration = Math.ceil(quantity / productivity);
    
    // Aplicar factores del template
    const complexityFactor = template?.complexityFactor || 1.0;
    const geographicalFactor = template?.geographicalFactor || 1.0;
    
    return Math.max(1, baseDuration * complexityFactor * geographicalFactor);
  }

  private static establishDependencies(activities: ScheduleActivityEntity[], template: any): void {
    // Establecer dependencias lógicas de construcción
    const sequenceMap = {
      'EXCAVATION': [],
      'CONCRETE': ['EXCAVATION'],
      'MASONRY': ['CONCRETE'],
      'STEEL': ['CONCRETE'],
      'CARPENTRY': ['MASONRY', 'STEEL'],
      'ELECTRICAL': ['MASONRY'],
      'PLUMBING': ['MASONRY'],
      'PAINTING': ['CARPENTRY', 'ELECTRICAL', 'PLUMBING']
    };

    activities.forEach(activity => {
      const dependencies = sequenceMap[activity.primaryTrade] || [];
      activity.predecessors = [];
      
      dependencies.forEach(depTrade => {
        const predecessor = activities.find(a => a.primaryTrade === depTrade);
        if (predecessor) {
          activity.predecessors.push({
            activityId: predecessor.id,
            dependencyType: 'FS',
            lagDays: 0
          });
        }
      });
    });
  }

  private static calculateScheduleDates(activities: ScheduleActivityEntity[], projectStart: Date): void {
    // Algoritmo CPM simplificado
    
    // Forward Pass - Calcular fechas tempranas
    activities.forEach(activity => {
      if (!activity.predecessors || activity.predecessors.length === 0) {
        // Actividad inicial
        activity.earlyStartDate = new Date(projectStart);
      } else {
        // Calcular basado en predecessores
        let latestFinish = new Date(projectStart);
        
        activity.predecessors.forEach(pred => {
          const predActivity = activities.find(a => a.id === pred.activityId);
          if (predActivity && predActivity.earlyFinishDate) {
            const finishWithLag = new Date(predActivity.earlyFinishDate);
            finishWithLag.setDate(finishWithLag.getDate() + pred.lagDays);
            
            if (finishWithLag > latestFinish) {
              latestFinish = finishWithLag;
            }
          }
        });
        
        activity.earlyStartDate = latestFinish;
      }
      
      // Calcular fecha de finalización temprana
      activity.earlyFinishDate = new Date(activity.earlyStartDate);
      activity.earlyFinishDate.setDate(activity.earlyFinishDate.getDate() + activity.plannedDurationDays);
    });

    // Backward Pass - Calcular fechas tardías
    const projectEnd = activities.reduce((latest, activity) => {
      return activity.earlyFinishDate > latest ? activity.earlyFinishDate : latest;
    }, new Date(projectStart));

    // Calcular holguras
    activities.forEach(activity => {
      if (!activity.lateFinishDate) {
        activity.lateFinishDate = new Date(projectEnd);
      }
      
      activity.lateStartDate = new Date(activity.lateFinishDate);
      activity.lateStartDate.setDate(activity.lateStartDate.getDate() - activity.plannedDurationDays);
      
      // Calcular holguras
      const earlyStart = activity.earlyStartDate.getTime();
      const lateStart = activity.lateStartDate.getTime();
      activity.totalFloat = Math.floor((lateStart - earlyStart) / (1000 * 3600 * 24));
      
      // Marcar ruta crítica
      activity.isCriticalPath = activity.totalFloat === 0;
      
      // Asignar fechas planificadas
      activity.plannedStartDate = activity.earlyStartDate;
      activity.plannedEndDate = activity.earlyFinishDate;
    });
  }

  private static optimizeForTime(activities: ScheduleActivityEntity[]): void {
    // Optimizar para reducir duración total
    
    // 1. Identificar actividades que pueden ejecutarse en paralelo
    activities.forEach(activity => {
      if (activity.isCriticalPath) {
        // Buscar oportunidades de paralelización en ruta crítica
        activity.priority = 'CRITICAL';
      }
    });

    // 2. Recalcular con paralelización donde sea posible
    this.enableParallelExecution(activities);
  }

  private static optimizeForCost(activities: ScheduleActivityEntity[]): void {
    // Optimizar para reducir costos
    
    // 1. Nivelar recursos para evitar picos
    // 2. Buscar oportunidades de compartir recursos
    // 3. Ajustar duraciones para optimizar uso de recursos
  }

  private static enableParallelExecution(activities: ScheduleActivityEntity[]): void {
    // Identificar actividades que pueden ejecutarse en paralelo
    const parallelCandidates = {
      'ELECTRICAL': ['PLUMBING'], // Instalaciones pueden ir en paralelo
      'MASONRY': ['STEEL'], // Mampostería y acero estructural
    };

    Object.entries(parallelCandidates).forEach(([trade, parallelTrades]) => {
      const mainActivity = activities.find(a => a.primaryTrade === trade);
      if (mainActivity) {
        parallelTrades.forEach(parallelTrade => {
          const parallelActivity = activities.find(a => a.primaryTrade === parallelTrade);
          if (parallelActivity) {
            // Modificar dependencias para permitir ejecución paralela
            parallelActivity.predecessors = parallelActivity.predecessors?.filter(
              p => p.activityId !== mainActivity.id
            ) || [];
          }
        });
      }
    });
  }

  // Análisis de ruta crítica
  public analyzeCriticalPath(activities: ScheduleActivityEntity[]): CriticalPathAnalysis {
    const criticalActivities = activities.filter(a => a.isCriticalPath);
    const totalDuration = activities.reduce((max, activity) => {
      const duration = Math.floor((activity.plannedEndDate.getTime() - activity.plannedStartDate.getTime()) / (1000 * 3600 * 24));
      return Math.max(max, duration);
    }, 0);

    const floatActivities = activities
      .filter(a => !a.isCriticalPath && a.totalFloat > 0)
      .map(a => ({
        activityId: a.id,
        totalFloat: a.totalFloat,
        freeFloat: a.freeFloat
      }));

    // Identificar cuellos de botella de recursos
    const bottlenecks = this.identifyResourceBottlenecks(activities);

    return {
      activities: criticalActivities.map(a => a.id),
      totalDuration,
      floatActivities,
      bottlenecks
    };
  }

  private identifyResourceBottlenecks(activities: ScheduleActivityEntity[]): any[] {
    // Análisis simplificado de recursos
    const resourceDemand = {};
    
    activities.forEach(activity => {
      const trade = activity.primaryTrade;
      if (!resourceDemand[trade]) {
        resourceDemand[trade] = [];
      }
      resourceDemand[trade].push({
        activityId: activity.id,
        startDate: activity.plannedStartDate,
        endDate: activity.plannedEndDate,
        demand: 1 // Simplificado
      });
    });

    const bottlenecks = [];
    Object.entries(resourceDemand).forEach(([trade, demands]: [string, any[]]) => {
      // Verificar solapamientos
      const overlaps = this.findResourceOverlaps(demands);
      if (overlaps.length > 0) {
        bottlenecks.push({
          resourceType: trade,
          constraint: 'Resource conflict detected',
          impactDays: overlaps.length
        });
      }
    });

    return bottlenecks;
  }

  private findResourceOverlaps(demands: any[]): any[] {
    const overlaps = [];
    
    for (let i = 0; i < demands.length; i++) {
      for (let j = i + 1; j < demands.length; j++) {
        const demand1 = demands[i];
        const demand2 = demands[j];
        
        // Verificar si hay solapamiento temporal
        if (demand1.startDate < demand2.endDate && demand2.startDate < demand1.endDate) {
          overlaps.push({
            activity1: demand1.activityId,
            activity2: demand2.activityId,
            overlapDays: this.calculateOverlapDays(demand1, demand2)
          });
        }
      }
    }
    
    return overlaps;
  }

  private calculateOverlapDays(demand1: any, demand2: any): number {
    const start = demand1.startDate > demand2.startDate ? demand1.startDate : demand2.startDate;
    const end = demand1.endDate < demand2.endDate ? demand1.endDate : demand2.endDate;
    
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  }

  // Optimización de recursos
  public optimizeResources(activities: ScheduleActivityEntity[]): ResourceOptimization {
    // Calcular utilización actual
    const currentUtilization = this.calculateResourceUtilization(activities);
    
    // Generar recomendaciones
    const recommendations = this.generateResourceRecommendations(activities, currentUtilization);
    
    // Identificar oportunidades de ahorro
    const savings = this.identifyCostSavingOpportunities(activities);

    return {
      currentUtilization,
      recommendedAdjustments: recommendations,
      costSavingOpportunities: savings
    };
  }

  private calculateResourceUtilization(activities: ScheduleActivityEntity[]): any {
    // Cálculo simplificado de utilización
    const utilization = {
      workforce: {},
      equipment: {}
    };

    activities.forEach(activity => {
      const trade = activity.primaryTrade;
      if (!utilization.workforce[trade]) {
        utilization.workforce[trade] = 0;
      }
      utilization.workforce[trade] += activity.plannedDurationDays;
    });

    return utilization;
  }

  private generateResourceRecommendations(activities: ScheduleActivityEntity[], utilization: any): any[] {
    const recommendations = [];
    
    // Ejemplo de recomendaciones basadas en utilización
    Object.entries(utilization.workforce).forEach(([trade, days]: [string, number]) => {
      if (days > 30) { // Más de 30 días de trabajo
        recommendations.push({
          activityId: activities.find(a => a.primaryTrade === trade)?.id,
          adjustment: 'increase',
          resourceType: trade,
          impact: 'Reduce duration by adding workers'
        });
      }
    });

    return recommendations;
  }

  private identifyCostSavingOpportunities(activities: ScheduleActivityEntity[]): any[] {
    const opportunities = [];
    
    // Buscar actividades con alto costo que pueden optimizarse
    activities.forEach(activity => {
      if (activity.plannedTotalCost > 10000) { // Actividades costosas
        opportunities.push({
          description: `Optimize high-cost activity: ${activity.name}`,
          potentialSaving: activity.plannedTotalCost * 0.1, // 10% estimado
          implementationEffort: 'medium'
        });
      }
    });

    return opportunities;
  }

  // Análisis de riesgos
  public analyzeRisks(
    activities: ScheduleActivityEntity[], 
    weatherFactors: WeatherFactorEntity[]
  ): ScheduleRisk[] {
    const risks: ScheduleRisk[] = [];

    // Riesgos climáticos
    const weatherRisks = this.analyzeWeatherRisks(activities, weatherFactors);
    risks.push(...weatherRisks);

    // Riesgos de recursos
    const resourceRisks = this.analyzeResourceRisks(activities);
    risks.push(...resourceRisks);

    // Riesgos de dependencias
    const dependencyRisks = this.analyzeDependencyRisks(activities);
    risks.push(...dependencyRisks);

    return risks;
  }

  private analyzeWeatherRisks(activities: ScheduleActivityEntity[], weatherFactors: WeatherFactorEntity[]): ScheduleRisk[] {
    const risks: ScheduleRisk[] = [];
    
    // Análisis de actividades sensibles al clima
    const weatherSensitiveActivities = activities.filter(a => 
      ['CONCRETE', 'PAINTING', 'EXCAVATION'].includes(a.primaryTrade)
    );

    weatherSensitiveActivities.forEach(activity => {
      const relevantWeather = weatherFactors.filter(w => 
        w.date >= activity.plannedStartDate && w.date <= activity.plannedEndDate
      );

      const rainyDays = relevantWeather.filter(w => w.isRainyDay).length;
      const unsuitableDays = relevantWeather.filter(w => w.workingSuitability === 'unsuitable').length;

      if (rainyDays > 2 || unsuitableDays > 1) {
        risks.push({
          riskId: `weather_${activity.id}`,
          type: 'weather',
          severity: unsuitableDays > 2 ? 'high' : 'medium',
          probability: 70,
          impact: {
            durationDays: Math.max(rainyDays, unsuitableDays),
            cost: activity.plannedTotalCost * 0.1,
            qualityImpact: 'Potential quality issues due to weather conditions'
          },
          mitigation: {
            strategy: 'Schedule weather-sensitive activities during dry season',
            cost: 0,
            effectiveness: 80
          },
          contingency: {
            action: 'Provide weather protection or reschedule',
            triggerCondition: 'Forecast shows >2 consecutive rainy days',
            responsibility: 'Project Manager'
          }
        });
      }
    });

    return risks;
  }

  private analyzeResourceRisks(activities: ScheduleActivityEntity[]): ScheduleRisk[] {
    const risks: ScheduleRisk[] = [];
    
    // Buscar actividades críticas con recursos limitados
    const criticalActivities = activities.filter(a => a.isCriticalPath);
    
    criticalActivities.forEach(activity => {
      // Simulación de riesgo de disponibilidad de recursos
      risks.push({
        riskId: `resource_${activity.id}`,
        type: 'resource',
        severity: 'medium',
        probability: 30,
        impact: {
          durationDays: 2,
          cost: activity.plannedTotalCost * 0.05,
          qualityImpact: 'Potential delays due to resource unavailability'
        },
        mitigation: {
          strategy: 'Secure backup resources and early procurement',
          cost: activity.plannedTotalCost * 0.02,
          effectiveness: 85
        },
        contingency: {
          action: 'Activate backup resource plan',
          triggerCondition: 'Primary resource unavailable 48h before start',
          responsibility: 'Resource Manager'
        }
      });
    });

    return risks;
  }

  private analyzeDependencyRisks(activities: ScheduleActivityEntity[]): ScheduleRisk[] {
    const risks: ScheduleRisk[] = [];
    
    // Buscar actividades con múltiples dependencias
    activities.forEach(activity => {
      if (activity.predecessors && activity.predecessors.length > 2) {
        risks.push({
          riskId: `dependency_${activity.id}`,
          type: 'dependency',
          severity: 'medium',
          probability: 40,
          impact: {
            durationDays: 1,
            cost: 0,
            qualityImpact: 'Schedule coordination complexity'
          },
          mitigation: {
            strategy: 'Implement robust progress tracking',
            cost: 0,
            effectiveness: 70
          },
          contingency: {
            action: 'Fast-track non-critical dependencies',
            triggerCondition: 'Any predecessor shows >1 day delay',
            responsibility: 'Project Coordinator'
          }
        });
      }
    });

    return risks;
  }
}