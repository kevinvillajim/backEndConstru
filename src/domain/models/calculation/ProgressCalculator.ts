// ===== ProgressCalculator.ts (Domain Model) =====
import { ScheduleActivityEntity } from '../../../infrastructure/database/entities/ScheduleActivityEntity';
import { ProgressTrackingEntity } from '../../../infrastructure/database/entities/ProgressTrackingEntity';
import { WeatherFactorEntity } from '../../../infrastructure/database/entities/WeatherFactorEntity';
import { ResourceAssignmentEntity } from '../../../infrastructure/database/entities/ResourceAssignmentEntity';

export interface ProgressMetrics {
  physicalProgress: number; // % de avance físico
  timeProgress: number; // % de tiempo transcurrido
  costProgress: number; // % de costo gastado
  schedulePerformanceIndex: number; // SPI
  costPerformanceIndex: number; // CPI
  scheduleVariance: number; // SV en días
  costVariance: number; // CV en moneda
  estimateAtCompletion: number; // EAC
  estimateToComplete: number; // ETC
  varianceAtCompletion: number; // VAC
}

export interface ProgressForecast {
  estimatedCompletionDate: Date;
  confidenceLevel: number; // 0-100
  probabilityOfOnTimeCompletion: number; // 0-100
  criticalPathStatus: 'on_track' | 'at_risk' | 'delayed';
  projectedCostOverrun: number;
  projectedScheduleOverrun: number; // días
  keyRisks: {
    description: string;
    impact: 'low' | 'medium' | 'high';
    probability: number;
  }[];
}

export interface CurveSData {
  planned: {
    date: Date;
    cumulativeProgress: number;
    cumulativeCost: number;
  }[];
  actual: {
    date: Date;
    cumulativeProgress: number;
    cumulativeCost: number;
  }[];
  forecast: {
    date: Date;
    cumulativeProgress: number;
    cumulativeCost: number;
  }[];
}

export interface ProductivityAnalysis {
  overallProductivity: number; // ratio actual vs planned
  productivityTrends: {
    period: string;
    productivity: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  productivityByTrade: {
    trade: string;
    averageProductivity: number;
    bestDay: { date: Date; productivity: number };
    worstDay: { date: Date; productivity: number };
    trend: 'improving' | 'stable' | 'declining';
  }[];
  productivityFactors: {
    factor: string;
    impact: number; // correlation coefficient
    recommendation: string;
  }[];
}

export interface EarnedValueAnalysis {
  plannedValue: number; // PV
  earnedValue: number; // EV
  actualCost: number; // AC
  budgetAtCompletion: number; // BAC
  schedulePerformanceIndex: number; // SPI = EV/PV
  costPerformanceIndex: number; // CPI = EV/AC
  scheduleVariance: number; // SV = EV - PV
  costVariance: number; // CV = EV - AC
  estimateAtCompletion: number; // EAC
  estimateToComplete: number; // ETC = EAC - AC
  varianceAtCompletion: number; // VAC = BAC - EAC
  toCompletePerformanceIndex: number; // TCPI
}

export interface ProgressAlert {
  id: string;
  type: 'schedule_delay' | 'cost_overrun' | 'quality_issue' | 'resource_conflict' | 'weather_impact';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedActivities: string[];
  impact: {
    scheduleImpact: number; // días
    costImpact: number;
    qualityImpact: string;
  };
  recommendedActions: string[];
  triggerDate: Date;
  escalationLevel: number; // 0-3
  isAcknowledged: boolean;
  isResolved: boolean;
}

export class ProgressCalculator {
  
  constructor(
    private activities: ScheduleActivityEntity[],
    private progressReports: ProgressTrackingEntity[],
    private weatherFactors?: WeatherFactorEntity[]
  ) {}

  // Cálculo de métricas principales de progreso
  public calculateProgressMetrics(asOfDate: Date = new Date()): ProgressMetrics {
    const physicalProgress = this.calculatePhysicalProgress(asOfDate);
    const timeProgress = this.calculateTimeProgress(asOfDate);
    const costProgress = this.calculateCostProgress(asOfDate);
    
    const earnedValue = this.calculateEarnedValue(asOfDate);
    const plannedValue = this.calculatePlannedValue(asOfDate);
    const actualCost = this.calculateActualCost(asOfDate);
    
    const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;
    const cpi = actualCost > 0 ? earnedValue / actualCost : 1;
    
    const scheduleVariance = this.calculateScheduleVarianceInDays(asOfDate);
    const costVariance = earnedValue - actualCost;
    
    const budgetAtCompletion = this.calculateBudgetAtCompletion();
    const estimateAtCompletion = this.calculateEstimateAtCompletion(actualCost, earnedValue, budgetAtCompletion, cpi);
    const estimateToComplete = estimateAtCompletion - actualCost;
    const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion;

    return {
      physicalProgress,
      timeProgress,
      costProgress,
      schedulePerformanceIndex: spi,
      costPerformanceIndex: cpi,
      scheduleVariance,
      costVariance,
      estimateAtCompletion,
      estimateToComplete,
      varianceAtCompletion
    };
  }

  // Generación de pronósticos basados en tendencias
  public generateProgressForecast(asOfDate: Date = new Date()): ProgressForecast {
    const currentMetrics = this.calculateProgressMetrics(asOfDate);
    const productivityTrends = this.analyzeProductivityTrends();
    
    // Calcular fecha estimada de finalización
    const estimatedCompletionDate = this.calculateEstimatedCompletionDate(currentMetrics, productivityTrends);
    
    // Calcular nivel de confianza basado en variabilidad histórica
    const confidenceLevel = this.calculateConfidenceLevel(productivityTrends);
    
    // Probabilidad de completar a tiempo
    const probabilityOfOnTimeCompletion = this.calculateOnTimeProbability(estimatedCompletionDate);
    
    // Estado de ruta crítica
    const criticalPathStatus = this.assessCriticalPathStatus(currentMetrics);
    
    // Proyecciones de sobrecosto y retraso
    const projectedCostOverrun = Math.max(0, currentMetrics.estimateAtCompletion - this.calculateBudgetAtCompletion());
    const projectedScheduleOverrun = this.calculateProjectedScheduleOverrun(estimatedCompletionDate);
    
    // Identificar riesgos clave
    const keyRisks = this.identifyKeyRisks(currentMetrics, productivityTrends);

    return {
      estimatedCompletionDate,
      confidenceLevel,
      probabilityOfOnTimeCompletion,
      criticalPathStatus,
      projectedCostOverrun,
      projectedScheduleOverrun,
      keyRisks
    };
  }

  // Generación de curvas S de progreso
  public generateCurveS(startDate?: Date, endDate?: Date): CurveSData {
    const projectStart = startDate || this.getProjectStartDate();
    const projectEnd = endDate || this.getProjectEndDate();
    
    const planned = this.generatePlannedCurve(projectStart, projectEnd);
    const actual = this.generateActualCurve(projectStart);
    const forecast = this.generateForecastCurve(projectStart, projectEnd);

    return { planned, actual, forecast };
  }

  // Análisis detallado de productividad
  public analyzeProductivity(): ProductivityAnalysis {
    const overallProductivity = this.calculateOverallProductivity();
    const productivityTrends = this.analyzeProductivityTrends();
    const productivityByTrade = this.analyzeProductivityByTrade();
    const productivityFactors = this.identifyProductivityFactors();

    return {
      overallProductivity,
      productivityTrends,
      productivityByTrade,
      productivityFactors
    };
  }

  // Análisis de valor ganado completo
  public performEarnedValueAnalysis(asOfDate: Date = new Date()): EarnedValueAnalysis {
    const plannedValue = this.calculatePlannedValue(asOfDate);
    const earnedValue = this.calculateEarnedValue(asOfDate);
    const actualCost = this.calculateActualCost(asOfDate);
    const budgetAtCompletion = this.calculateBudgetAtCompletion();
    
    const spi = plannedValue > 0 ? earnedValue / plannedValue : 1;
    const cpi = actualCost > 0 ? earnedValue / actualCost : 1;
    
    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - actualCost;
    
    const estimateAtCompletion = this.calculateEstimateAtCompletion(actualCost, earnedValue, budgetAtCompletion, cpi);
    const estimateToComplete = estimateAtCompletion - actualCost;
    const varianceAtCompletion = budgetAtCompletion - estimateAtCompletion;
    
    const workRemaining = budgetAtCompletion - earnedValue;
    const tcpi = workRemaining > 0 && (budgetAtCompletion - actualCost) > 0 ? 
      workRemaining / (budgetAtCompletion - actualCost) : 1;

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
      toCompletePerformanceIndex: tcpi
    };
  }

  // Sistema de alertas predictivas
  public generateProgressAlerts(asOfDate: Date = new Date()): ProgressAlert[] {
    const alerts: ProgressAlert[] = [];
    const metrics = this.calculateProgressMetrics(asOfDate);
    
    // Alerta de retraso en cronograma
    if (metrics.schedulePerformanceIndex < 0.9) {
      alerts.push(this.createScheduleDelayAlert(metrics));
    }
    
    // Alerta de sobrecosto
    if (metrics.costPerformanceIndex < 0.9) {
      alerts.push(this.createCostOverrunAlert(metrics));
    }
    
    // Alertas de actividades críticas
    const criticalActivityAlerts = this.checkCriticalActivities();
    alerts.push(...criticalActivityAlerts);
    
    // Alertas climáticas
    if (this.weatherFactors) {
      const weatherAlerts = this.checkWeatherImpacts(asOfDate);
      alerts.push(...weatherAlerts);
    }
    
    // Alertas de recursos
    const resourceAlerts = this.checkResourceConflicts();
    alerts.push(...resourceAlerts);

    return alerts.sort((a, b) => b.escalationLevel - a.escalationLevel);
  }

  // Métodos privados de cálculo

  private calculatePhysicalProgress(asOfDate: Date): number {
    let totalPlannedWork = 0;
    let totalCompletedWork = 0;

    this.activities.forEach(activity => {
      const activityWeight = activity.plannedTotalCost || 1;
      totalPlannedWork += activityWeight;
      
      if (activity.actualStartDate && activity.actualStartDate <= asOfDate) {
        totalCompletedWork += activityWeight * (activity.progressPercentage / 100);
      }
    });

    return totalPlannedWork > 0 ? (totalCompletedWork / totalPlannedWork) * 100 : 0;
  }

  private calculateTimeProgress(asOfDate: Date): number {
    const projectStart = this.getProjectStartDate();
    const projectEnd = this.getProjectEndDate();
    
    const totalDuration = projectEnd.getTime() - projectStart.getTime();
    const elapsedTime = asOfDate.getTime() - projectStart.getTime();
    
    return totalDuration > 0 ? Math.min(100, (elapsedTime / totalDuration) * 100) : 0;
  }

  private calculateCostProgress(asOfDate: Date): number {
    const totalBudget = this.calculateBudgetAtCompletion();
    const spentCost = this.calculateActualCost(asOfDate);
    
    return totalBudget > 0 ? (spentCost / totalBudget) * 100 : 0;
  }

  private calculateEarnedValue(asOfDate: Date): number {
    let earnedValue = 0;

    this.activities.forEach(activity => {
      if (activity.actualStartDate && activity.actualStartDate <= asOfDate) {
        earnedValue += (activity.plannedTotalCost || 0) * (activity.progressPercentage / 100);
      }
    });

    return earnedValue;
  }

  private calculatePlannedValue(asOfDate: Date): number {
    let plannedValue = 0;

    this.activities.forEach(activity => {
      if (activity.plannedStartDate <= asOfDate) {
        // Calcular progreso planificado a la fecha
        const activityDuration = activity.plannedEndDate.getTime() - activity.plannedStartDate.getTime();
        const elapsedTime = Math.min(
          asOfDate.getTime() - activity.plannedStartDate.getTime(),
          activityDuration
        );
        
        const plannedProgress = activityDuration > 0 ? Math.min(1, elapsedTime / activityDuration) : 0;
        plannedValue += (activity.plannedTotalCost || 0) * plannedProgress;
      }
    });

    return plannedValue;
  }

  private calculateActualCost(asOfDate: Date): number {
    let actualCost = 0;

    this.activities.forEach(activity => {
      if (activity.actualStartDate && activity.actualStartDate <= asOfDate) {
        actualCost += activity.actualTotalCost || 0;
      }
    });

    return actualCost;
  }

  private calculateBudgetAtCompletion(): number {
    return this.activities.reduce((total, activity) => total + (activity.plannedTotalCost || 0), 0);
  }

  private calculateEstimateAtCompletion(actualCost: number, earnedValue: number, budgetAtCompletion: number, cpi: number): number {
    // EAC = AC + (BAC - EV) / CPI
    if (cpi === 0) return budgetAtCompletion;
    return actualCost + ((budgetAtCompletion - earnedValue) / cpi);
  }

  private calculateScheduleVarianceInDays(asOfDate: Date): number {
    const metrics = this.calculateProgressMetrics(asOfDate);
    const plannedValue = this.calculatePlannedValue(asOfDate);
    const earnedValue = this.calculateEarnedValue(asOfDate);
    
    if (plannedValue === 0) return 0;
    
    const scheduleVarianceRatio = (earnedValue - plannedValue) / plannedValue;
    const projectDurationDays = this.getProjectDurationInDays();
    
    return scheduleVarianceRatio * projectDurationDays;
  }

  private getProjectStartDate(): Date {
    const startDates = this.activities.map(a => a.plannedStartDate).filter(d => d);
    return startDates.length > 0 ? new Date(Math.min(...startDates.map(d => d.getTime()))) : new Date();
  }

  private getProjectEndDate(): Date {
    const endDates = this.activities.map(a => a.plannedEndDate).filter(d => d);
    return endDates.length > 0 ? new Date(Math.max(...endDates.map(d => d.getTime()))) : new Date();
  }

  private getProjectDurationInDays(): number {
    const start = this.getProjectStartDate();
    const end = this.getProjectEndDate();
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  }

  private calculateEstimatedCompletionDate(metrics: ProgressMetrics, trends: any): Date {
    const currentProgress = metrics.physicalProgress;
    const remainingWork = 100 - currentProgress;
    
    // Calcular tasa de progreso promedio
    const averageProgressRate = this.calculateAverageProgressRate();
    
    // Ajustar por tendencias de productividad
    const trendAdjustment = trends.productivityTrends.length > 0 ? 
      trends.productivityTrends[trends.productivityTrends.length - 1].productivity : 1;
    
    const adjustedProgressRate = averageProgressRate * trendAdjustment;
    
    // Calcular días restantes
    const remainingDays = adjustedProgressRate > 0 ? remainingWork / adjustedProgressRate : 365;
    
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + Math.ceil(remainingDays));
    
    return estimatedCompletion;
  }

  private calculateAverageProgressRate(): number {
    // Calcular tasa promedio de progreso por día
    const sortedReports = this.progressReports.sort((a, b) => a.reportDate.getTime() - b.reportDate.getTime());
    
    if (sortedReports.length < 2) return 1; // Default
    
    const firstReport = sortedReports[0];
    const lastReport = sortedReports[sortedReports.length - 1];
    
    const progressChange = lastReport.overallProgress - firstReport.overallProgress;
    const daysDifference = Math.ceil((lastReport.reportDate.getTime() - firstReport.reportDate.getTime()) / (1000 * 3600 * 24));
    
    return daysDifference > 0 ? progressChange / daysDifference : 1;
  }

  private calculateConfidenceLevel(trends: any): number {
    // Calcular nivel de confianza basado en consistencia de tendencias
    if (trends.productivityTrends.length < 3) return 60;
    
    const recentTrends = trends.productivityTrends.slice(-5);
    const variance = this.calculateVariance(recentTrends.map(t => t.productivity));
    
    // Menor varianza = mayor confianza
    return Math.max(40, Math.min(95, 100 - (variance * 50)));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  private calculateOnTimeProbability(estimatedCompletion: Date): number {
    const plannedCompletion = this.getProjectEndDate();
    const daysDifference = Math.ceil((estimatedCompletion.getTime() - plannedCompletion.getTime()) / (1000 * 3600 * 24));
    
    if (daysDifference <= 0) return 90; // Adelantado
    if (daysDifference <= 5) return 70; // Ligeramente retrasado
    if (daysDifference <= 15) return 40; // Moderadamente retrasado
    return 10; // Significativamente retrasado
  }

  private assessCriticalPathStatus(metrics: ProgressMetrics): 'on_track' | 'at_risk' | 'delayed' {
    if (metrics.schedulePerformanceIndex >= 0.95) return 'on_track';
    if (metrics.schedulePerformanceIndex >= 0.85) return 'at_risk';
    return 'delayed';
  }

  private calculateProjectedScheduleOverrun(estimatedCompletion: Date): number {
    const plannedCompletion = this.getProjectEndDate();
    return Math.max(0, Math.ceil((estimatedCompletion.getTime() - plannedCompletion.getTime()) / (1000 * 3600 * 24)));
  }

  private identifyKeyRisks(metrics: ProgressMetrics, trends: any): any[] {
    const risks = [];
    
    if (metrics.schedulePerformanceIndex < 0.9) {
      risks.push({
        description: 'Schedule performance below target',
        impact: 'high',
        probability: 80
      });
    }
    
    if (metrics.costPerformanceIndex < 0.9) {
      risks.push({
        description: 'Cost performance below target',
        impact: 'high',
        probability: 75
      });
    }
    
    if (trends.overallProductivity < 0.8) {
      risks.push({
        description: 'Low productivity trend',
        impact: 'medium',
        probability: 70
      });
    }
    
    return risks;
  }

  private generatePlannedCurve(startDate: Date, endDate: Date): any[] {
    const curve = [];
    const totalBudget = this.calculateBudgetAtCompletion();
    
    // Generar puntos diarios de la curva planificada
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const plannedValue = this.calculatePlannedValue(new Date(date));
      const plannedProgress = totalBudget > 0 ? (plannedValue / totalBudget) * 100 : 0;
      
      curve.push({
        date: new Date(date),
        cumulativeProgress: plannedProgress,
        cumulativeCost: plannedValue
      });
    }
    
    return curve;
  }

  private generateActualCurve(startDate: Date): any[] {
    const curve = [];
    const totalBudget = this.calculateBudgetAtCompletion();
    
    // Usar reportes de progreso reales
    const sortedReports = this.progressReports.sort((a, b) => a.reportDate.getTime() - b.reportDate.getTime());
    
    sortedReports.forEach(report => {
      const actualCost = this.calculateActualCost(report.reportDate);
      const actualProgress = report.overallProgress;
      
      curve.push({
        date: new Date(report.reportDate),
        cumulativeProgress: actualProgress,
        cumulativeCost: actualCost
      });
    });
    
    return curve;
  }

  private generateForecastCurve(startDate: Date, endDate: Date): any[] {
    const curve = [];
    const currentMetrics = this.calculateProgressMetrics();
    const forecast = this.generateProgressForecast();
    
    // Extender desde el punto actual hasta la finalización proyectada
    const today = new Date();
    const forecastEnd = forecast.estimatedCompletionDate;
    
    const remainingProgress = 100 - currentMetrics.physicalProgress;
    const remainingDays = Math.ceil((forecastEnd.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const dailyProgressRate = remainingDays > 0 ? remainingProgress / remainingDays : 0;
    
    let currentProgress = currentMetrics.physicalProgress;
    let currentCost = this.calculateActualCost(today);
    
    for (let date = new Date(today); date <= forecastEnd; date.setDate(date.getDate() + 1)) {
      curve.push({
        date: new Date(date),
        cumulativeProgress: Math.min(100, currentProgress),
        cumulativeCost: currentCost
      });
      
      currentProgress += dailyProgressRate;
      currentCost += currentMetrics.estimateToComplete / remainingDays;
    }
    
    return curve;
  }

  private calculateOverallProductivity(): number {
    const plannedWork = this.activities.reduce((sum, activity) => {
      return sum + (activity.workQuantities?.plannedQuantity || 1);
    }, 0);
    
    const completedWork = this.activities.reduce((sum, activity) => {
      return sum + (activity.workQuantities?.completedQuantity || 0);
    }, 0);
    
    const timeElapsed = this.calculateTimeProgress(new Date()) / 100;
    const expectedWork = plannedWork * timeElapsed;
    
    return expectedWork > 0 ? completedWork / expectedWork : 1;
  }

  private analyzeProductivityTrends(): any[] {
    // Analizar tendencias de productividad por períodos
    const trends = [];
    const sortedReports = this.progressReports.sort((a, b) => a.reportDate.getTime() - b.reportDate.getTime());
    
    // Agrupar por semanas
    const weeklyGroups = this.groupReportsByWeek(sortedReports);
    
    weeklyGroups.forEach((reports, week) => {
      const weekProductivity = this.calculateWeekProductivity(reports);
      trends.push({
        period: week,
        productivity: weekProductivity,
        trend: this.determineTrend(trends, weekProductivity)
      });
    });
    
    return trends;
  }

  private groupReportsByWeek(reports: ProgressTrackingEntity[]): Map<string, ProgressTrackingEntity[]> {
    const groups = new Map();
    
    reports.forEach(report => {
      const week = this.getWeekKey(report.reportDate);
      if (!groups.has(week)) {
        groups.set(week, []);
      }
      groups.get(week).push(report);
    });
    
    return groups;
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
    return `${year}-W${week}`;
  }

  private calculateWeekProductivity(reports: ProgressTrackingEntity[]): number {
    if (reports.length === 0) return 1;
    
    const avgEfficiency = reports.reduce((sum, report) => {
      return sum + (report.overallEfficiency || 1);
    }, 0) / reports.length;
    
    return avgEfficiency;
  }

  private determineTrend(previousTrends: any[], currentProductivity: number): 'improving' | 'stable' | 'declining' {
    if (previousTrends.length === 0) return 'stable';
    
    const lastProductivity = previousTrends[previousTrends.length - 1].productivity;
    const difference = currentProductivity - lastProductivity;
    
    if (difference > 0.05) return 'improving';
    if (difference < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * MÉTODO CORREGIDO - Método helper para validar y convertir unknown a ScheduleActivityEntity[]
   * FIX para línea 726: No se puede asignar un argumento de tipo "unknown" al parámetro de tipo "ScheduleActivityEntity[]"
   */
  private validateAndConvertToActivityArray(data: unknown): ScheduleActivityEntity[] {
    // Verificar si data es un array
    if (!Array.isArray(data)) {
      console.warn('Expected array but received:', typeof data);
      return [];
    }

    // Filtrar y validar cada elemento del array
    const validActivities: ScheduleActivityEntity[] = [];
    
    for (const item of data) {
      if (this.isValidScheduleActivityEntity(item)) {
        validActivities.push(item as ScheduleActivityEntity);
      } else {
        console.warn('Invalid ScheduleActivityEntity found:', item);
      }
    }

    return validActivities;
  }

  /**
   * Type guard para verificar si un objeto es ScheduleActivityEntity
   */
  private isValidScheduleActivityEntity(obj: any): obj is ScheduleActivityEntity {
    return obj &&
           typeof obj === 'object' &&
           typeof obj.id === 'string' &&
           typeof obj.name === 'string' &&
           obj.hasOwnProperty('plannedStartDate') &&
           obj.hasOwnProperty('plannedEndDate') &&
           obj.hasOwnProperty('status');
  }

  /**
   * MÉTODO CORREGIDO - Método seguro para parsear datos de actividades
   * Este método reemplaza el uso directo de unknown que causaba el error en línea 726
   */
  private parseActivityData(rawData: unknown): ScheduleActivityEntity[] {
    try {
      // Si rawData es string, intentar parsearlo como JSON
      if (typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        return this.validateAndConvertToActivityArray(parsed);
      }
      
      // Si es un objeto, verificar si tiene la estructura esperada
      if (typeof rawData === 'object' && rawData !== null) {
        // Si es un objeto con una propiedad que contiene el array
        if ('activities' in rawData) {
          return this.validateAndConvertToActivityArray((rawData as any).activities);
        }
        
        // Si es directamente un array
        if (Array.isArray(rawData)) {
          return this.validateAndConvertToActivityArray(rawData);
        }
      }
      
      console.warn('Unable to parse activity data:', rawData);
      return [];
    } catch (error) {
      console.error('Error parsing activity data:', error);
      return [];
    }
  }

  /**
   * MÉTODO CORREGIDO - Método que usa el parseActivityData para evitar el error de tipo unknown
   * Este método reemplaza la llamada problemática en línea 726
   */
  public processActivitiesFromUnknownSource(unknownData: unknown): ScheduleActivityEntity[] {
    // En lugar de pasar directamente unknown a un parámetro que espera ScheduleActivityEntity[]
    // usamos el método de parsing seguro
    return this.parseActivityData(unknownData);
  }

  private analyzeProductivityByTrade(): any[] {
    const tradeAnalysis: any[] = [];
    
    try {
      const tradeGroups = this.groupActivitiesByTrade();
      
      Object.entries(tradeGroups).forEach(([trade, activities]) => {
        if (this.isValidActivityArray(activities)) {
          const tradeProductivity = this.calculateTradeProductivity(activities);
          tradeAnalysis.push(tradeProductivity);
        }
      });
    } catch (error) {
      console.error('Error in analyzeProductivityByTrade:', error);
    }
    
    return tradeAnalysis;
  }

  // Helper method to validate activity array
  private isValidActivityArray(activities: unknown): activities is ScheduleActivityEntity[] {
    return Array.isArray(activities) && 
      activities.length > 0 && 
      activities.every(activity => this.isScheduleActivityEntity(activity));
  }

  private isScheduleActivityEntity(obj: any): obj is ScheduleActivityEntity {
    return obj && 
      typeof obj === 'object' && 
      typeof obj.id === 'string' && 
      typeof obj.name === 'string' && 
      obj.hasOwnProperty('plannedStartDate') && 
      obj.hasOwnProperty('plannedEndDate');
  }

// Safe method to filter and validate activities
private validateActivities(activities: unknown[]): ScheduleActivityEntity[] {
  return activities.filter((activity): activity is ScheduleActivityEntity => 
    this.isScheduleActivityEntity(activity)
  );
}

private groupActivitiesByTrade(): Record<string, ScheduleActivityEntity[]> {
  const groups: Record<string, ScheduleActivityEntity[]> = {};
  
  this.activities.forEach(activity => {
    const trade = activity.primaryTrade;
    if (!groups[trade]) {
      groups[trade] = [];
    }
    groups[trade].push(activity);
  });
  
  return groups;
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
      bestDay: { date: new Date(), productivity: bestProductivity },
      worstDay: { date: new Date(), productivity: worstProductivity },
      trend: this.calculateTradeTrend(activities)
    };
  }

  private calculateTradeTrend(activities: ScheduleActivityEntity[]): 'improving' | 'stable' | 'declining' {
    // Análisis simplificado de tendencia por trade
    const recentActivities = activities.filter(a => a.actualStartDate && 
      a.actualStartDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
    );
    
    if (recentActivities.length === 0) return 'stable';
    
    const avgProgress = recentActivities.reduce((sum, a) => sum + a.progressPercentage, 0) / recentActivities.length;
    
    if (avgProgress > 80) return 'improving';
    if (avgProgress < 50) return 'declining';
    return 'stable';
  }

  private identifyProductivityFactors(): any[] {
    const factors = [];
    
    // Factor climático
    if (this.weatherFactors && this.weatherFactors.length > 0) {
      const weatherImpact = this.calculateWeatherProductivityCorrelation();
      factors.push({
        factor: 'Weather Conditions',
        impact: weatherImpact,
        recommendation: weatherImpact < -0.3 ? 'Schedule weather-sensitive activities during favorable periods' : 'Weather impact is manageable'
      });
    }
    
    // Factor de recursos
    const resourceImpact = this.calculateResourceProductivityCorrelation();
    factors.push({
      factor: 'Resource Availability',
      impact: resourceImpact,
      recommendation: resourceImpact < -0.2 ? 'Improve resource planning and allocation' : 'Resource allocation is adequate'
    });
    
    // Factor de calidad
    const qualityImpact = this.calculateQualityProductivityCorrelation();
    factors.push({
      factor: 'Quality Control',
      impact: qualityImpact,
      recommendation: qualityImpact < -0.2 ? 'Enhance quality control processes to reduce rework' : 'Quality management is effective'
    });
    
    return factors;
  }

  private calculateWeatherProductivityCorrelation(): number {
    // Correlación simplificada entre clima y productividad
    if (!this.weatherFactors || this.weatherFactors.length === 0) return 0;
    
    const weatherProductivity = this.weatherFactors.map(w => w.productivityFactor);
    const avgWeatherProductivity = weatherProductivity.reduce((sum, p) => sum + p, 0) / weatherProductivity.length;
    
    return (avgWeatherProductivity - 1) * 2; // Normalizar a -1 a 1
  }

  private calculateResourceProductivityCorrelation(): number {
    // Análisis simplificado de correlación recursos-productividad
    const activitiesWithResources = this.activities.filter(a => a.resourceAssignments && a.resourceAssignments.length > 0);
    
    if (activitiesWithResources.length === 0) return 0;
    
    const resourceUtilization = activitiesWithResources.reduce((sum, activity) => {
      const assignments = activity.resourceAssignments || [];
      const avgUtilization = assignments.reduce((util, assignment) => 
        util + (assignment.allocationPercentage / 100), 0) / assignments.length;
      return sum + avgUtilization;
    }, 0) / activitiesWithResources.length;
    
    return (resourceUtilization - 0.8) * 2; // Óptimo alrededor del 80%
  }

  private calculateQualityProductivityCorrelation(): number {
    // Correlación entre control de calidad y productividad
    const reportsWithQuality = this.progressReports.filter(r => r.qualityControl);
    
    if (reportsWithQuality.length === 0) return 0;
    
    const avgDefects = reportsWithQuality.reduce((sum, report) => {
      const defects = report.qualityControl?.defects || [];
      return sum + defects.length;
    }, 0) / reportsWithQuality.length;
    
    // Más defectos = menor correlación (impacto negativo)
    return Math.max(-1, 0.5 - (avgDefects * 0.1));
  }

  private createScheduleDelayAlert(metrics: ProgressMetrics): ProgressAlert {
    const severity = metrics.schedulePerformanceIndex < 0.8 ? 'critical' : 
                   metrics.schedulePerformanceIndex < 0.85 ? 'high' : 'medium';
    
    return {
      id: `schedule_delay_${Date.now()}`,
      type: 'schedule_delay',
      severity,
      title: 'Schedule Performance Below Target',
      description: `Schedule Performance Index is ${metrics.schedulePerformanceIndex.toFixed(2)}, indicating project is behind schedule`,
      affectedActivities: this.activities.filter(a => a.isCriticalPath).map(a => a.id),
      impact: {
        scheduleImpact: Math.abs(metrics.scheduleVariance),
        costImpact: 0,
        qualityImpact: 'Potential quality impact due to schedule pressure'
      },
      recommendedActions: [
        'Review critical path activities',
        'Consider resource reallocation',
        'Evaluate parallel execution opportunities',
        'Update project timeline'
      ],
      triggerDate: new Date(),
      escalationLevel: severity === 'critical' ? 3 : severity === 'high' ? 2 : 1,
      isAcknowledged: false,
      isResolved: false
    };
  }

  private createCostOverrunAlert(metrics: ProgressMetrics): ProgressAlert {
    const severity = metrics.costPerformanceIndex < 0.8 ? 'critical' : 
                   metrics.costPerformanceIndex < 0.85 ? 'high' : 'medium';
    
    return {
      id: `cost_overrun_${Date.now()}`,
      type: 'cost_overrun',
      severity,
      title: 'Cost Performance Below Target',
      description: `Cost Performance Index is ${metrics.costPerformanceIndex.toFixed(2)}, indicating cost overrun`,
      affectedActivities: this.activities.filter(a => a.actualTotalCost > (a.plannedTotalCost || 0)).map(a => a.id),
      impact: {
        scheduleImpact: 0,
        costImpact: Math.abs(metrics.costVariance),
        qualityImpact: 'Review budget allocation and cost controls'
      },
      recommendedActions: [
        'Review actual costs vs planned',
        'Identify cost overrun sources',
        'Implement cost control measures',
        'Update budget forecast'
      ],
      triggerDate: new Date(),
      escalationLevel: severity === 'critical' ? 3 : severity === 'high' ? 2 : 1,
      isAcknowledged: false,
      isResolved: false
    };
  }

  private checkCriticalActivities(): ProgressAlert[] {
    const alerts = [];
    const criticalActivities = this.activities.filter(a => a.isCriticalPath);
    
    criticalActivities.forEach(activity => {
      if (activity.isDelayed) {
        alerts.push({
          id: `critical_delay_${activity.id}`,
          type: 'schedule_delay',
          severity: 'high',
          title: `Critical Activity Delayed: ${activity.name}`,
          description: `Critical path activity is delayed, impacting overall project schedule`,
          affectedActivities: [activity.id],
          impact: {
            scheduleImpact: activity.durationVariance,
            costImpact: activity.costVariance,
            qualityImpact: 'Critical path delay affects entire project'
          },
          recommendedActions: [
            'Prioritize resources for this activity',
            'Consider crashing or fast-tracking',
            'Update project schedule',
            'Communicate with stakeholders'
          ],
          triggerDate: new Date(),
          escalationLevel: 3,
          isAcknowledged: false,
          isResolved: false
        });
      }
    });
    
    return alerts;
  }

  private checkWeatherImpacts(asOfDate: Date): ProgressAlert[] {
    const alerts = [];
    
    if (!this.weatherFactors) return alerts;
    
    // Verificar pronóstico de clima adverso en próximos días
    const upcomingWeather = this.weatherFactors.filter(w => 
      w.date >= asOfDate && 
      w.date <= new Date(asOfDate.getTime() + 7 * 24 * 60 * 60 * 1000) &&
      w.workingSuitability === 'unsuitable'
    );
    
    if (upcomingWeather.length > 0) {
      alerts.push({
        id: `weather_impact_${Date.now()}`,
        type: 'weather_impact',
        severity: 'medium',
        title: 'Adverse Weather Forecast',
        description: `Unsuitable weather conditions forecasted for ${upcomingWeather.length} days`,
        affectedActivities: this.activities
          .filter(a => ['CONCRETE', 'PAINTING', 'ROOFING'].includes(a.primaryTrade))
          .map(a => a.id),
        impact: {
          scheduleImpact: upcomingWeather.length,
          costImpact: 0,
          qualityImpact: 'Weather may affect quality of outdoor work'
        },
        recommendedActions: [
          'Reschedule weather-sensitive activities',
          'Prepare weather protection measures',
          'Focus on indoor activities',
          'Update schedule based on weather forecast'
        ],
        triggerDate: new Date(),
        escalationLevel: 1,
        isAcknowledged: false,
        isResolved: false
      });
    }
    
    return alerts;
  }

  private checkResourceConflicts(): ProgressAlert[] {
    const alerts = [];
    
    // Análisis simplificado de conflictos de recursos
    const concurrentActivities = this.findConcurrentActivities();
    const resourceConflicts = this.identifyResourceConflicts(concurrentActivities);
    
    resourceConflicts.forEach(conflict => {
      alerts.push({
        id: `resource_conflict_${Date.now()}`,
        type: 'resource_conflict',
        severity: 'medium',
        title: `Resource Conflict: ${conflict.resourceType}`,
        description: `Multiple activities require the same resource simultaneously`,
        affectedActivities: conflict.activities,
        impact: {
          scheduleImpact: 2,
          costImpact: 0,
          qualityImpact: 'Resource conflicts may delay activities'
        },
        recommendedActions: [
          'Reschedule conflicting activities',
          'Secure additional resources',
          'Optimize resource allocation',
          'Consider activity sequencing'
        ],
        triggerDate: new Date(),
        escalationLevel: 2,
        isAcknowledged: false,
        isResolved: false
      });
    });
    
    return alerts;
  }

  private findConcurrentActivities(): ScheduleActivityEntity[][] {
    const concurrent = [];
    
    for (let i = 0; i < this.activities.length; i++) {
      for (let j = i + 1; j < this.activities.length; j++) {
        const activity1 = this.activities[i];
        const activity2 = this.activities[j];
        
        // Verificar solapamiento temporal
        if (this.activitiesOverlap(activity1, activity2)) {
          concurrent.push([activity1, activity2]);
        }
      }
    }
    
    return concurrent;
  }

  private activitiesOverlap(activity1: ScheduleActivityEntity, activity2: ScheduleActivityEntity): boolean {
    return activity1.plannedStartDate < activity2.plannedEndDate && 
           activity2.plannedStartDate < activity1.plannedEndDate;
  }

  private identifyResourceConflicts(concurrentActivities: ScheduleActivityEntity[][]): any[] {
    const conflicts = [];
    
    concurrentActivities.forEach(pair => {
      const [activity1, activity2] = pair;
      
      if (activity1.primaryTrade === activity2.primaryTrade) {
        conflicts.push({
          resourceType: activity1.primaryTrade,
          activities: [activity1.id, activity2.id]
        });
      }
    });
    
    return conflicts;
  }
}