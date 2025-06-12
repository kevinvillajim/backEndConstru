// src/domain/services/ProgressAnalyticsService.ts
import { ScheduleActivityEntity } from '../../infrastructure/database/entities/ScheduleActivityEntity';
import { ProgressTrackingEntity } from '../../infrastructure/database/entities/ProgressTrackingEntity';
import { WeatherFactorEntity } from '../../infrastructure/database/entities/WeatherFactorEntity';
import { CalculationScheduleEntity } from '../../infrastructure/database/entities/CalculationScheduleEntity';

export interface EarnedValueMetrics {
  plannedValue: number; // PV - Valor Planificado
  earnedValue: number; // EV - Valor Ganado
  actualCost: number; // AC - Costo Real
  budgetAtCompletion: number; // BAC - Presupuesto hasta la finalización
  
  // Índices de performance
  schedulePerformanceIndex: number; // SPI = EV/PV
  costPerformanceIndex: number; // CPI = EV/AC
  
  // Variaciones
  scheduleVariance: number; // SV = EV - PV
  costVariance: number; // CV = EV - AC
  
  // Proyecciones
  estimateAtCompletion: number; // EAC
  estimateToComplete: number; // ETC = EAC - AC
  varianceAtCompletion: number; // VAC = BAC - EAC
  
  // Fechas
  estimatedCompletionDate: Date;
  originalCompletionDate: Date;
  scheduleVarianceDays: number;
}

export interface ProductivityMetrics {
  overallProductivity: number; // Productividad general 0-1
  productivityByTrade: {
    [trade: string]: {
      planned: number;
      actual: number;
      efficiency: number;
      trend: 'improving' | 'stable' | 'declining';
    };
  };
  dailyProductivity: {
    date: Date;
    productivity: number;
    factors: string[];
  }[];
  weeklyTrends: {
    week: string;
    avgProductivity: number;
    peakDay: Date;
    lowestDay: Date;
  }[];
}

export interface PerformanceAlert {
  id: string;
  type: 'schedule_delay' | 'cost_overrun' | 'productivity_decline' | 'critical_path_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendations: string[];
  affectedActivities: string[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ProgressForecast {
  completionDate: {
    optimistic: Date;
    mostLikely: Date;
    pessimistic: Date;
    confidence: number;
  };
  costProjection: {
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
    confidence: number;
  };
  riskFactors: {
    weather: number;
    resources: number;
    complexity: number;
    external: number;
  };
  scenarios: {
    name: string;
    probability: number;
    completionDate: Date;
    totalCost: number;
    description: string;
  }[];
}

export class ProgressAnalyticsService {
  
  /**
   * Calcula métricas de Earned Value Management
   */
  public calculateEarnedValueMetrics(
    schedule: CalculationScheduleEntity,
    activities: ScheduleActivityEntity[],
    asOfDate: Date = new Date()
  ): EarnedValueMetrics {
    const budgetAtCompletion = activities.reduce((sum, activity) => 
      sum + activity.plannedTotalCost, 0
    );
    
    const plannedValue = this.calculatePlannedValue(activities, asOfDate);
    const earnedValue = this.calculateEarnedValue(activities, asOfDate);
    const actualCost = this.calculateActualCost(activities, asOfDate);
    
    // Índices de performance
    const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;
    const cpi = actualCost > 0 ? earnedValue / actualCost : 1;
    
    // Variaciones
    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - actualCost;
    
    // Proyecciones
    const estimateAtCompletion = this.calculateEAC(actualCost, earnedValue, budgetAtCompletion, cpi);
    const estimateToComplete = estimateAtCompletion - actualCost;
    const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion;
    
    // Fechas
    const estimatedCompletionDate = this.calculateEstimatedCompletionDate(schedule, spi);
    const scheduleVarianceDays = this.calculateScheduleVarianceDays(
      schedule.plannedEndDate, 
      estimatedCompletionDate
    );
    
    return {
      plannedValue,
      earnedValue,
      actualCost,
      budgetAtCompletion,
      schedulePerformanceIndex: spi,
      costPerformanceIndex: cpi,
      scheduleVariance,
      costVariance,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion,
      estimatedCompletionDate,
      originalCompletionDate: schedule.plannedEndDate,
      scheduleVarianceDays
    };
  }

  /**
   * Analiza productividad por trades y tendencias
   */
  public analyzeProductivityMetrics(
    activities: ScheduleActivityEntity[],
    progressReports: ProgressTrackingEntity[],
    weatherFactors?: WeatherFactorEntity[]
  ): ProductivityMetrics {
    const overallProductivity = this.calculateOverallProductivity(activities);
    const productivityByTrade = this.calculateProductivityByTrade(activities);
    const dailyProductivity = this.calculateDailyProductivity(progressReports, weatherFactors);
    const weeklyTrends = this.calculateWeeklyTrends(dailyProductivity);
    
    return {
      overallProductivity,
      productivityByTrade,
      dailyProductivity,
      weeklyTrends
    };
  }

  /**
   * Genera alertas de performance automáticas
   */
  public generatePerformanceAlerts(
    schedule: CalculationScheduleEntity,
    activities: ScheduleActivityEntity[],
    metrics: EarnedValueMetrics,
    productivity: ProductivityMetrics
  ): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    
    // Alerta de retraso de cronograma
    if (metrics.schedulePerformanceIndex < 0.9) {
      alerts.push(this.createScheduleDelayAlert(metrics, activities));
    }
    
    // Alerta de sobrecosto
    if (metrics.costPerformanceIndex < 0.9) {
      alerts.push(this.createCostOverrunAlert(metrics, activities));
    }
    
    // Alerta de productividad declinante
    if (productivity.overallProductivity < 0.8) {
      alerts.push(this.createProductivityAlert(productivity, activities));
    }
    
    // Alerta de riesgo en ruta crítica
    const criticalActivities = activities.filter(a => a.isCriticalPath);
    const delayedCriticalActivities = criticalActivities.filter(a => a.isDelayed);
    if (delayedCriticalActivities.length > 0) {
      alerts.push(this.createCriticalPathAlert(delayedCriticalActivities));
    }
    
    return alerts.sort((a, b) => this.getAlertPriority(b) - this.getAlertPriority(a));
  }

  /**
   * Genera pronósticos de finalización usando métodos estadísticos
   */
  public generateProgressForecast(
    schedule: CalculationScheduleEntity,
    activities: ScheduleActivityEntity[],
    metrics: EarnedValueMetrics,
    productivity: ProductivityMetrics,
    weatherFactors?: WeatherFactorEntity[]
  ): ProgressForecast {
    const baseCompletion = metrics.estimatedCompletionDate;
    const baseCost = metrics.estimateAtCompletion;
    
    // Calcular variaciones basadas en datos históricos
    const scheduleVariation = this.calculateScheduleVariation(activities);
    const costVariation = this.calculateCostVariation(activities);
    
    // Aplicar factores de riesgo
    const riskFactors = this.calculateRiskFactors(activities, weatherFactors);
    
    // Generar escenarios
    const scenarios = this.generateScenarios(
      baseCompletion, 
      baseCost, 
      scheduleVariation, 
      costVariation, 
      riskFactors
    );
    
    // Calcular fechas con confianza estadística
    const completionDate = {
      optimistic: this.addDays(baseCompletion, -scheduleVariation * 0.5),
      mostLikely: baseCompletion,
      pessimistic: this.addDays(baseCompletion, scheduleVariation * 1.5),
      confidence: this.calculateConfidence(metrics, productivity)
    };
    
    const costProjection = {
      optimistic: baseCost * (1 - costVariation * 0.3),
      mostLikely: baseCost,
      pessimistic: baseCost * (1 + costVariation * 0.5),
      confidence: this.calculateCostConfidence(metrics)
    };
    
    return {
      completionDate,
      costProjection,
      riskFactors,
      scenarios
    };
  }

  /**
   * Análisis de tendencias históricas
   */
  public analyzeTrends(
    activities: ScheduleActivityEntity[],
    progressReports: ProgressTrackingEntity[],
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): any {
    const trends = {
      schedule: this.analyzeScheduleTrends(activities, timeframe),
      cost: this.analyzeCostTrends(activities, timeframe),
      productivity: this.analyzeProductivityTrends(progressReports, timeframe),
      quality: this.analyzeQualityTrends(progressReports, timeframe)
    };
    
    return {
      trends,
      insights: this.generateTrendInsights(trends),
      recommendations: this.generateTrendRecommendations(trends)
    };
  }

  // Métodos privados de cálculo

  private calculatePlannedValue(activities: ScheduleActivityEntity[], asOfDate: Date): number {
    return activities.reduce((sum, activity) => {
      if (asOfDate >= activity.plannedStartDate) {
        const totalDuration = activity.plannedEndDate.getTime() - activity.plannedStartDate.getTime();
        const elapsedTime = Math.min(
          asOfDate.getTime() - activity.plannedStartDate.getTime(),
          totalDuration
        );
        const progressRatio = totalDuration > 0 ? elapsedTime / totalDuration : 0;
        return sum + (activity.plannedTotalCost * progressRatio);
      }
      return sum;
    }, 0);
  }

  private calculateEarnedValue(activities: ScheduleActivityEntity[], asOfDate: Date): number {
    return activities.reduce((sum, activity) => {
      if (activity.actualStartDate && activity.actualStartDate <= asOfDate) {
        return sum + (activity.plannedTotalCost * (activity.progressPercentage / 100));
      }
      return sum;
    }, 0);
  }

  private calculateActualCost(activities: ScheduleActivityEntity[], asOfDate: Date): number {
    return activities.reduce((sum, activity) => {
      if (activity.actualStartDate && activity.actualStartDate <= asOfDate) {
        return sum + activity.actualTotalCost;
      }
      return sum;
    }, 0);
  }

  private calculateEAC(actualCost: number, earnedValue: number, bac: number, cpi: number): number {
    // EAC = AC + (BAC - EV) / CPI
    if (cpi === 0) return bac;
    return actualCost + ((bac - earnedValue) / cpi);
  }

  private calculateEstimatedCompletionDate(schedule: CalculationScheduleEntity, spi: number): Date {
    const originalDuration = schedule.plannedEndDate.getTime() - schedule.plannedStartDate.getTime();
    const adjustedDuration = originalDuration / Math.max(spi, 0.1); // Evitar división por cero
    return new Date(schedule.plannedStartDate.getTime() + adjustedDuration);
  }

  private calculateScheduleVarianceDays(originalDate: Date, estimatedDate: Date): number {
    return Math.ceil((estimatedDate.getTime() - originalDate.getTime()) / (1000 * 3600 * 24));
  }

  private calculateOverallProductivity(activities: ScheduleActivityEntity[]): number {
    const completedActivities = activities.filter(a => a.progressPercentage > 0);
    if (completedActivities.length === 0) return 1;
    
    const totalProductivity = completedActivities.reduce((sum, activity) => {
      const plannedDuration = activity.plannedDurationDays;
      const actualDuration = activity.actualDurationDays || plannedDuration;
      return sum + (plannedDuration / Math.max(actualDuration, 0.1));
    }, 0);
    
    return totalProductivity / completedActivities.length;
  }

  private calculateProductivityByTrade(activities: ScheduleActivityEntity[]): any {
    const tradeGroups = activities.reduce((groups, activity) => {
      const trade = activity.primaryTrade;
      if (!groups[trade]) {
        groups[trade] = [];
      }
      groups[trade].push(activity);
      return groups;
    }, {} as { [key: string]: ScheduleActivityEntity[] });
    
    const result: any = {};
    
    Object.entries(tradeGroups).forEach(([trade, tradeActivities]) => {
      const completedActivities = tradeActivities.filter(a => a.progressPercentage > 0);
      
      if (completedActivities.length > 0) {
        const plannedTotal = completedActivities.reduce((sum, a) => sum + a.plannedDurationDays, 0);
        const actualTotal = completedActivities.reduce((sum, a) => sum + (a.actualDurationDays || a.plannedDurationDays), 0);
        
        const efficiency = actualTotal > 0 ? plannedTotal / actualTotal : 1;
        const trend = this.calculateTradeTrend(completedActivities);
        
        result[trade] = {
          planned: plannedTotal,
          actual: actualTotal,
          efficiency,
          trend
        };
      }
    });
    
    return result;
  }

  private calculateDailyProductivity(
    progressReports: ProgressTrackingEntity[],
    weatherFactors?: WeatherFactorEntity[]
  ): any[] {
    return progressReports.map(report => {
      const weatherFactor = weatherFactors?.find(w => 
        w.date.toDateString() === report.reportDate.toDateString()
      );
      
      const factors = [];
      if (weatherFactor) {
        if (weatherFactor.workingSuitability === 'poor' || weatherFactor.workingSuitability === 'unsuitable') {
          factors.push('Clima adverso');
        }
        if (weatherFactor.rainfall > 5) {
          factors.push('Lluvia intensa');
        }
      }
      
      if (report.issues && report.issues.length > 0) {
        factors.push('Problemas reportados');
      }
      
      return {
        date: report.reportDate,
        productivity: report.overallEfficiency || 1,
        factors
      };
    });
  }

  private calculateWeeklyTrends(dailyProductivity: any[]): any[] {
    const weeks = new Map();
    
    dailyProductivity.forEach(day => {
      const week = this.getWeekKey(day.date);
      if (!weeks.has(week)) {
        weeks.set(week, []);
      }
      weeks.get(week).push(day);
    });
    
    return Array.from(weeks.entries()).map(([week, days]) => {
      const avgProductivity = days.reduce((sum: number, day: any) => sum + day.productivity, 0) / days.length;
      const sortedDays = days.sort((a: any, b: any) => b.productivity - a.productivity);
      
      return {
        week,
        avgProductivity,
        peakDay: sortedDays[0]?.date,
        lowestDay: sortedDays[sortedDays.length - 1]?.date
      };
    });
  }

  private createScheduleDelayAlert(metrics: EarnedValueMetrics, activities: ScheduleActivityEntity[]): PerformanceAlert {
    const delayedActivities = activities.filter(a => a.isDelayed);
    
    return {
      id: `schedule_delay_${Date.now()}`,
      type: 'schedule_delay',
      severity: metrics.schedulePerformanceIndex < 0.8 ? 'critical' : 'high',
      title: 'Retraso en Cronograma Detectado',
      description: `El SPI es ${metrics.schedulePerformanceIndex.toFixed(2)}, indicando retraso de ${Math.abs(metrics.scheduleVarianceDays)} días`,
      impact: `Fecha estimada de finalización: ${metrics.estimatedCompletionDate.toLocaleDateString()}`,
      recommendations: [
        'Revisar actividades de ruta crítica',
        'Considerar reasignación de recursos',
        'Evaluar paralelización de actividades',
        'Actualizar cronograma con stakeholders'
      ],
      affectedActivities: delayedActivities.map(a => a.id),
      createdAt: new Date()
    };
  }

  private createCostOverrunAlert(metrics: EarnedValueMetrics, activities: ScheduleActivityEntity[]): PerformanceAlert {
    const overBudgetActivities = activities.filter(a => a.actualTotalCost > a.plannedTotalCost);
    
    return {
      id: `cost_overrun_${Date.now()}`,
      type: 'cost_overrun',
      severity: metrics.costPerformanceIndex < 0.8 ? 'critical' : 'high',
      title: 'Sobrecosto Detectado',
      description: `El CPI es ${metrics.costPerformanceIndex.toFixed(2)}, indicando sobrecosto de $${Math.abs(metrics.costVariance).toFixed(2)}`,
      impact: `Costo estimado final: $${metrics.estimateAtCompletion.toFixed(2)}`,
      recommendations: [
        'Revisar partidas con mayor variación',
        'Implementar controles de costo',
        'Renegociar precios con proveedores',
        'Analizar productividad por cuadrillas'
      ],
      affectedActivities: overBudgetActivities.map(a => a.id),
      createdAt: new Date()
    };
  }

  private createProductivityAlert(productivity: ProductivityMetrics, activities: ScheduleActivityEntity[]): PerformanceAlert {
    const lowProductivityTrades = Object.entries(productivity.productivityByTrade)
      .filter(([_, data]) => data.efficiency < 0.8)
      .map(([trade, _]) => trade);
    
    return {
      id: `productivity_decline_${Date.now()}`,
      type: 'productivity_decline',
      severity: productivity.overallProductivity < 0.7 ? 'critical' : 'medium',
      title: 'Decline en Productividad',
      description: `Productividad general: ${(productivity.overallProductivity * 100).toFixed(1)}%`,
      impact: `Trades afectados: ${lowProductivityTrades.join(', ')}`,
      recommendations: [
        'Capacitación adicional para cuadrillas',
        'Revisión de métodos de trabajo',
        'Mejora de herramientas y equipos',
        'Análisis de condiciones de trabajo'
      ],
      affectedActivities: activities.filter(a => lowProductivityTrades.includes(a.primaryTrade)).map(a => a.id),
      createdAt: new Date()
    };
  }

  private createCriticalPathAlert(delayedActivities: ScheduleActivityEntity[]): PerformanceAlert {
    return {
      id: `critical_path_risk_${Date.now()}`,
      type: 'critical_path_risk',
      severity: 'critical',
      title: 'Riesgo en Ruta Crítica',
      description: `${delayedActivities.length} actividades críticas con retraso`,
      impact: 'Impacto directo en fecha final del proyecto',
      recommendations: [
        'Priorizar recursos en actividades críticas',
        'Considerar trabajo en turnos extendidos',
        'Evaluar compresión de cronograma',
        'Comunicar urgencia a stakeholders'
      ],
      affectedActivities: delayedActivities.map(a => a.id),
      createdAt: new Date()
    };
  }

  private getAlertPriority(alert: PerformanceAlert): number {
    const severityPriority = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    
    const typePriority = {
      'critical_path_risk': 4,
      'schedule_delay': 3,
      'cost_overrun': 2,
      'productivity_decline': 1
    };
    
    return severityPriority[alert.severity] * 10 + typePriority[alert.type];
  }

  private calculateScheduleVariation(activities: ScheduleActivityEntity[]): number {
    const completedActivities = activities.filter(a => a.actualDurationDays > 0);
    if (completedActivities.length === 0) return 0;
    
    const variations = completedActivities.map(a => 
      Math.abs(a.actualDurationDays - a.plannedDurationDays) / a.plannedDurationDays
    );
    
    return variations.reduce((sum, v) => sum + v, 0) / variations.length;
  }

  private calculateCostVariation(activities: ScheduleActivityEntity[]): number {
    const completedActivities = activities.filter(a => a.actualTotalCost > 0);
    if (completedActivities.length === 0) return 0;
    
    const variations = completedActivities.map(a => 
      Math.abs(a.actualTotalCost - a.plannedTotalCost) / a.plannedTotalCost
    );
    
    return variations.reduce((sum, v) => sum + v, 0) / variations.length;
  }

  private calculateRiskFactors(activities: ScheduleActivityEntity[], weatherFactors?: WeatherFactorEntity[]): any {
    let weatherRisk = 0;
    if (weatherFactors) {
      const unsuitableDays = weatherFactors.filter(w => w.workingSuitability === 'unsuitable').length;
      weatherRisk = Math.min(1, unsuitableDays / weatherFactors.length);
    }
    
    const resourceRisk = activities.filter(a => a.hasResourceConflicts()).length / activities.length;
    const complexityRisk = activities.filter(a => a.priority === 'critical').length / activities.length;
    
    return {
      weather: weatherRisk,
      resources: resourceRisk,
      complexity: complexityRisk,
      external: 0.1 // Factor base para riesgos externos
    };
  }

  private generateScenarios(
    baseCompletion: Date,
    baseCost: number,
    scheduleVariation: number,
    costVariation: number,
    riskFactors: any
  ): any[] {
    return [
      {
        name: 'Escenario Optimista',
        probability: 0.2,
        completionDate: this.addDays(baseCompletion, -scheduleVariation * 30),
        totalCost: baseCost * (1 - costVariation * 0.5),
        description: 'Condiciones favorables, sin contratiempos'
      },
      {
        name: 'Escenario Más Probable',
        probability: 0.6,
        completionDate: baseCompletion,
        totalCost: baseCost,
        description: 'Condiciones normales según plan actual'
      },
      {
        name: 'Escenario Pesimista',
        probability: 0.2,
        completionDate: this.addDays(baseCompletion, scheduleVariation * 45),
        totalCost: baseCost * (1 + costVariation * 0.8),
        description: 'Múltiples contratiempos y riesgos materializados'
      }
    ];
  }

  private calculateConfidence(metrics: EarnedValueMetrics, productivity: ProductivityMetrics): number {
    let confidence = 0.8; // Base confidence
    
    // Ajustar por performance histórica
    if (metrics.schedulePerformanceIndex > 0.95) confidence += 0.1;
    else if (metrics.schedulePerformanceIndex < 0.85) confidence -= 0.2;
    
    if (productivity.overallProductivity > 0.9) confidence += 0.1;
    else if (productivity.overallProductivity < 0.8) confidence -= 0.1;
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private calculateCostConfidence(metrics: EarnedValueMetrics): number {
    let confidence = 0.8;
    
    if (metrics.costPerformanceIndex > 0.95) confidence += 0.1;
    else if (metrics.costPerformanceIndex < 0.85) confidence -= 0.2;
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private calculateTradeTrend(activities: ScheduleActivityEntity[]): 'improving' | 'stable' | 'declining' {
    // Análisis simplificado basado en actividades más recientes
    const recentActivities = activities
      .filter(a => a.actualStartDate)
      .sort((a, b) => b.actualStartDate!.getTime() - a.actualStartDate!.getTime())
      .slice(0, 3);
    
    if (recentActivities.length < 2) return 'stable';
    
    const avgEfficiency = recentActivities.reduce((sum, a) => {
      const efficiency = a.actualDurationDays > 0 ? a.plannedDurationDays / a.actualDurationDays : 1;
      return sum + efficiency;
    }, 0) / recentActivities.length;
    
    if (avgEfficiency > 1.05) return 'improving';
    if (avgEfficiency < 0.95) return 'declining';
    return 'stable';
  }

  private analyzeScheduleTrends(activities: ScheduleActivityEntity[], timeframe: string): any {
    // Implementación simplificada de análisis de tendencias
    return {
      variance: this.calculateScheduleVariation(activities),
      direction: 'stable',
      confidence: 0.75
    };
  }

  private analyzeCostTrends(activities: ScheduleActivityEntity[], timeframe: string): any {
    return {
      variance: this.calculateCostVariation(activities),
      direction: 'stable',
      confidence: 0.75
    };
  }

  private analyzeProductivityTrends(progressReports: ProgressTrackingEntity[], timeframe: string): any {
    const recentReports = progressReports.slice(-10);
    const avgEfficiency = recentReports.reduce((sum, r) => sum + (r.overallEfficiency || 1), 0) / recentReports.length;
    
    return {
      average: avgEfficiency,
      direction: avgEfficiency > 0.9 ? 'improving' : avgEfficiency < 0.8 ? 'declining' : 'stable',
      confidence: 0.8
    };
  }

  private analyzeQualityTrends(progressReports: ProgressTrackingEntity[], timeframe: string): any {
    const reportsWithQuality = progressReports.filter(r => r.qualityControl);
    const avgDefects = reportsWithQuality.length > 0 
      ? reportsWithQuality.reduce((sum, r) => sum + (r.qualityControl?.defects?.length || 0), 0) / reportsWithQuality.length
      : 0;
    
    return {
      avgDefects,
      direction: avgDefects < 1 ? 'improving' : avgDefects > 3 ? 'declining' : 'stable',
      confidence: 0.7
    };
  }

  private generateTrendInsights(trends: any): string[] {
    const insights = [];
    
    if (trends.productivity.direction === 'declining') {
      insights.push('Productividad en descenso - revisar métodos de trabajo');
    }
    
    if (trends.schedule.variance > 0.2) {
      insights.push('Alta variabilidad en cronograma - mejorar estimaciones');
    }
    
    if (trends.cost.variance > 0.15) {
      insights.push('Costos volátiles - implementar controles más estrictos');
    }
    
    return insights;
  }

  private generateTrendRecommendations(trends: any): string[] {
    const recommendations = [];
    
    if (trends.productivity.direction === 'declining') {
      recommendations.push('Implementar programa de capacitación continua');
      recommendations.push('Revisar herramientas y equipos disponibles');
    }
    
    if (trends.quality.direction === 'declining') {
      recommendations.push('Reforzar controles de calidad');
      recommendations.push('Implementar inspecciones más frecuentes');
    }
    
    return recommendations;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${year}-W${week}`;
  }
}