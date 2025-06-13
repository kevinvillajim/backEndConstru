// src/application/schedule/PredictProjectDelaysScheduleUseCase.ts
import { CalculationScheduleRepository } from '../../domain/repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../../domain/repositories/ScheduleActivityRepository';
import { ProgressTrackingRepository } from '../../domain/repositories/ProgressTrackingRepository';
import { WeatherFactorRepository } from '../../domain/repositories/WeatherFactorRepository';

export interface DelayPredictionRequest {
  scheduleId: string;
  predictionHorizon: 'short' | 'medium' | 'long'; // 1 week, 1 month, 3 months
  includeFactors: {
    weather: boolean;
    productivity: boolean;
    resources: boolean;
    dependencies: boolean;
    qualityIssues: boolean;
    externalFactors: boolean;
  };
  confidenceLevel: 0.8 | 0.9 | 0.95;
  scenarioAnalysis?: boolean;
}

export interface DelayPredictionResponse {
  scheduleId: string;
  predictionDate: Date;
  predictions: {
    mostLikely: {
      delayDays: number;
      completionDate: Date;
      confidence: number;
      affectedActivities: string[];
    };
    optimistic: {
      delayDays: number;
      completionDate: Date;
      probability: number;
    };
    pessimistic: {
      delayDays: number;
      completionDate: Date;
      probability: number;
    };
  };
  riskFactors: {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    probability: number;
    mitigation: string;
  }[];
  earlyWarnings: {
    activity: string;
    warning: string;
    daysUntilImpact: number;
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    estimatedImpact: string;
    timeframe: string;
  }[];
  scenarios?: {
    name: string;
    description: string;
    delayDays: number;
    probability: number;
    actions: string[];
  }[];
}

export class PredictProjectDelaysScheduleUseCase {
  constructor(
    private scheduleRepository: CalculationScheduleRepository,
    private activityRepository: ScheduleActivityRepository,
    private progressRepository: ProgressTrackingRepository,
    private weatherRepository: WeatherFactorRepository
  ) {}

  async execute(request: DelayPredictionRequest): Promise<DelayPredictionResponse> {
    // 1. Obtener datos del proyecto
    const schedule = await this.scheduleRepository.findById(request.scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const activities = await this.activityRepository.findByScheduleId(request.scheduleId);
    const progressReports = await this.progressRepository.findByScheduleId(request.scheduleId);

    // 2. Recopilar datos históricos para el modelo
    const historicalData = await this.gatherHistoricalData(request, activities, progressReports);

    // 3. Calcular métricas actuales
    const currentMetrics = this.calculateCurrentMetrics(activities, progressReports);

    // 4. Aplicar modelo de predicción
    const predictions = await this.generatePredictions(request, historicalData, currentMetrics);

    // 5. Identificar factores de riesgo
    const riskFactors = await this.identifyRiskFactors(request, schedule, activities, progressReports);

    // 6. Generar alertas tempranas
    const earlyWarnings = this.generateEarlyWarnings(activities, progressReports, riskFactors);

    // 7. Crear recomendaciones
    const recommendations = this.generatePredictionRecommendations(predictions, riskFactors, earlyWarnings);

    // 8. Análisis de escenarios (opcional)
    const scenarios = request.scenarioAnalysis ? 
      await this.performScenarioAnalysis(request, schedule, activities, riskFactors) : 
      undefined;

    return {
      scheduleId: request.scheduleId,
      predictionDate: new Date(),
      predictions,
      riskFactors,
      earlyWarnings,
      recommendations,
      scenarios
    };
  }

  private async gatherHistoricalData(
    request: DelayPredictionRequest,
    activities: any[],
    progressReports: any[]
  ): Promise<any> {
    // Recopilar datos históricos relevantes
    const historicalData = {
      productivityTrends: this.analyzeProductivityTrends(progressReports),
      weatherPatterns: request.includeFactors.weather ? 
        await this.analyzeWeatherPatterns(request.scheduleId) : null,
      qualityTrends: this.analyzeQualityTrends(progressReports),
      resourceUtilization: this.analyzeResourceUtilization(activities, progressReports),
      dependencyDelays: this.analyzeDependencyDelays(activities),
      seasonalFactors: this.analyzeSeasonalFactors(progressReports)
    };

    return historicalData;
  }

  private calculateCurrentMetrics(activities: any[], progressReports: any[]): any {
    const activeActivities = activities.filter(a => a.status === 'IN_PROGRESS');
    const recentReports = progressReports.filter(r => 
      new Date(r.reportDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    return {
      currentSPI: this.calculateCurrentSPI(activities),
      currentCPI: this.calculateCurrentCPI(activities),
      averageProductivity: this.calculateAverageProductivity(recentReports),
      resourceUtilization: this.calculateResourceUtilization(activeActivities),
      qualityIndex: this.calculateQualityIndex(recentReports),
      safetyIndex: this.calculateSafetyIndex(recentReports),
      weatherImpact: this.calculateCurrentWeatherImpact(recentReports),
      criticalPathHealth: this.assessCriticalPathHealth(activities)
    };
  }

  private async generatePredictions(
    request: DelayPredictionRequest,
    historicalData: any,
    currentMetrics: any
  ): Promise<any> {
    // Modelo de predicción simplificado - en producción usaría machine learning
    const baselineDelay = this.calculateBaselineDelay(currentMetrics);
    const riskAdjustment = this.calculateRiskAdjustment(historicalData, currentMetrics);
    
    // Predicción más probable
    const mostLikelyDelay = Math.max(0, baselineDelay + riskAdjustment);
    
    // Cálculo de intervalos de confianza
    const standardDeviation = this.estimateDelayStandardDeviation(historicalData);
    const confidenceMultiplier = this.getConfidenceMultiplier(request.confidenceLevel);
    
    const optimisticDelay = Math.max(0, mostLikelyDelay - (confidenceMultiplier * standardDeviation));
    const pessimisticDelay = mostLikelyDelay + (confidenceMultiplier * standardDeviation);
    
    // Fechas de finalización
    const originalEndDate = new Date(); // Obtener de schedule
    const mostLikelyDate = new Date(originalEndDate.getTime() + (mostLikelyDelay * 24 * 60 * 60 * 1000));
    const optimisticDate = new Date(originalEndDate.getTime() + (optimisticDelay * 24 * 60 * 60 * 1000));
    const pessimisticDate = new Date(originalEndDate.getTime() + (pessimisticDelay * 24 * 60 * 60 * 1000));

    return {
      mostLikely: {
        delayDays: mostLikelyDelay,
        completionDate: mostLikelyDate,
        confidence: request.confidenceLevel,
        affectedActivities: this.identifyAffectedActivities(currentMetrics)
      },
      optimistic: {
        delayDays: optimisticDelay,
        completionDate: optimisticDate,
        probability: (1 - request.confidenceLevel) / 2
      },
      pessimistic: {
        delayDays: pessimisticDelay,
        completionDate: pessimisticDate,
        probability: (1 - request.confidenceLevel) / 2
      }
    };
  }

  private async identifyRiskFactors(
    request: DelayPredictionRequest,
    schedule: any,
    activities: any[],
    progressReports: any[]
  ): Promise<any[]> {
    const riskFactors = [];

    // Factor de productividad
    if (request.includeFactors.productivity) {
      const productivityRisk = this.assessProductivityRisk(progressReports);
      if (productivityRisk.impact !== 'low') {
        riskFactors.push({
          factor: 'Productividad laboral',
          impact: productivityRisk.impact,
          probability: productivityRisk.probability,
          mitigation: 'Implementar capacitación y incentivos para mejorar productividad'
        });
      }
    }

    // Factor climático
    if (request.includeFactors.weather) {
      const weatherRisk = await this.assessWeatherRisk(schedule.geographicalZone);
      if (weatherRisk.impact !== 'low') {
        riskFactors.push({
          factor: 'Condiciones climáticas',
          impact: weatherRisk.impact,
          probability: weatherRisk.probability,
          mitigation: 'Implementar medidas de protección y cronograma flexible'
        });
      }
    }

    // Factor de recursos
    if (request.includeFactors.resources) {
      const resourceRisk = this.assessResourceRisk(activities);
      if (resourceRisk.impact !== 'low') {
        riskFactors.push({
          factor: 'Disponibilidad de recursos',
          impact: resourceRisk.impact,
          probability: resourceRisk.probability,
          mitigation: 'Asegurar contratos con proveedores alternativos'
        });
      }
    }

    // Factor de dependencias
    if (request.includeFactors.dependencies) {
      const dependencyRisk = this.assessDependencyRisk(activities);
      if (dependencyRisk.impact !== 'low') {
        riskFactors.push({
          factor: 'Dependencias críticas',
          impact: dependencyRisk.impact,
          probability: dependencyRisk.probability,
          mitigation: 'Revisar y optimizar secuencia de actividades'
        });
      }
    }

    // Factor de calidad
    if (request.includeFactors.qualityIssues) {
      const qualityRisk = this.assessQualityRisk(progressReports);
      if (qualityRisk.impact !== 'low') {
        riskFactors.push({
          factor: 'Problemas de calidad',
          impact: qualityRisk.impact,
          probability: qualityRisk.probability,
          mitigation: 'Implementar controles de calidad más estrictos'
        });
      }
    }

    return riskFactors;
  }

  private generateEarlyWarnings(activities: any[], progressReports: any[], riskFactors: any[]): any[] {
    const warnings = [];

    // Actividades con riesgo de retraso
    const riskyActivities = activities.filter(a => 
      a.status === 'IN_PROGRESS' && this.calculateActivityRisk(a, progressReports) > 0.6
    );

    for (const activity of riskyActivities) {
      const daysUntilImpact = this.calculateDaysUntilImpact(activity);
      warnings.push({
        activity: activity.name,
        warning: 'Actividad en riesgo de retraso basado en progreso actual',
        daysUntilImpact,
        severity: daysUntilImpact < 7 ? 'high' : daysUntilImpact < 14 ? 'medium' : 'low'
      });
    }

    // Advertencias basadas en factores de riesgo
    for (const risk of riskFactors.filter(r => r.impact === 'high')) {
      warnings.push({
        activity: 'Proyecto general',
        warning: `Riesgo alto detectado: ${risk.factor}`,
        daysUntilImpact: this.estimateDaysUntilRiskImpact(risk),
        severity: 'high'
      });
    }

    return warnings;
  }

  private generatePredictionRecommendations(predictions: any, riskFactors: any[], earlyWarnings: any[]): any[] {
    const recommendations = [];

    // Recomendaciones basadas en predicción
    if (predictions.mostLikely.delayDays > 5) {
      recommendations.push({
        action: 'Implementar plan de recuperación de cronograma',
        priority: 'high',
        estimatedImpact: `Reducir retraso en ${Math.ceil(predictions.mostLikely.delayDays * 0.3)} días`,
        timeframe: 'Inmediato'
      });
    }

    // Recomendaciones por factores de riesgo
    const highRiskFactors = riskFactors.filter(r => r.impact === 'high');
    for (const risk of highRiskFactors) {
      recommendations.push({
        action: risk.mitigation,
        priority: 'high',
        estimatedImpact: 'Reducir probabilidad de retraso',
        timeframe: 'Esta semana'
      });
    }

    // Recomendaciones preventivas
    if (earlyWarnings.some(w => w.severity === 'high')) {
      recommendations.push({
        action: 'Incrementar frecuencia de monitoreo de actividades críticas',
        priority: 'medium',
        estimatedImpact: 'Detección temprana de problemas',
        timeframe: 'Inmediato'
      });
    }

    return recommendations;
  }

  private async performScenarioAnalysis(
    request: DelayPredictionRequest,
    schedule: any,
    activities: any[],
    riskFactors: any[]
  ): Promise<any[]> {
    const scenarios = [];

    // Escenario base
    scenarios.push({
      name: 'Escenario Base',
      description: 'Continuación con condiciones actuales',
      delayDays: 0,
      probability: 0.4,
      actions: ['Mantener monitoreo regular']
    });

    // Escenario de mejora
    scenarios.push({
      name: 'Escenario Optimizado',
      description: 'Implementación de todas las recomendaciones',
      delayDays: -3, // Adelanto
      probability: 0.3,
      actions: [
        'Optimizar recursos',
        'Implementar mejores prácticas',
        'Aumentar supervisión'
      ]
    });

    // Escenario de riesgo
    const highRiskFactors = riskFactors.filter(r => r.impact === 'high');
    if (highRiskFactors.length > 0) {
      scenarios.push({
        name: 'Escenario de Riesgo',
        description: 'Materialización de riesgos principales',
        delayDays: highRiskFactors.length * 7, // 7 días por riesgo alto
        probability: 0.2,
        actions: [
          'Activar planes de contingencia',
          'Reasignar recursos críticos',
          'Comunicar con stakeholders'
        ]
      });
    }

    // Escenario extremo
    scenarios.push({
      name: 'Escenario Extremo',
      description: 'Múltiples problemas simultáneos',
      delayDays: 21,
      probability: 0.1,
      actions: [
        'Revisión completa del proyecto',
        'Renegociación de fechas',
        'Recursos de emergencia'
      ]
    });

    return scenarios;
  }

  // Helper methods for analysis
  private analyzeProductivityTrends(progressReports: any[]): any {
    // Analyze productivity trends from historical data
    return {
      averageProductivity: progressReports.reduce((sum, r) => sum + (r.productivityRate || 0), 0) / progressReports.length,
      trend: 'stable', // 'improving', 'declining', 'stable'
      volatility: 0.1
    };
  }

  private async analyzeWeatherPatterns(scheduleId: string): Promise<any> {
    const weatherData = await this.weatherRepository.findByScheduleId(scheduleId);
    return {
      averageImpact: weatherData.reduce((sum, w) => sum + w.productivityFactor, 0) / weatherData.length,
      rainyDaysProbability: 0.3,
      seasonalVariation: 0.2
    };
  }

  private analyzeQualityTrends(progressReports: any[]): any {
    const qualityScores = progressReports.map(r => r.qualityScore || 100);
    return {
      averageQuality: qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length,
      trend: 'stable',
      issueFrequency: progressReports.filter(r => (r.qualityIssues || []).length > 0).length / progressReports.length
    };
  }

  private analyzeResourceUtilization(activities: any[], progressReports: any[]): any {
    return {
      averageUtilization: 0.8,
      conflicts: 0.1,
      availability: 0.9
    };
  }

  private analyzeDependencyDelays(activities: any[]): any {
    return {
      delayedDependencies: activities.filter(a => a.status === 'DELAYED').length,
      criticalPathDelays: 0,
      averageDelayImpact: 2.5
    };
  }

  private analyzeSeasonalFactors(progressReports: any[]): any {
    return {
      monthlyVariation: [1, 1, 0.9, 0.8, 0.7, 0.7, 0.8, 0.8, 0.9, 1, 1, 1],
      currentSeasonImpact: 1.0
    };
  }

  private calculateCurrentSPI(activities: any[]): number {
    const totalEV = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const totalPV = activities.reduce((sum, a) => sum + (a.plannedTotalCost || 0), 0);
    return totalPV > 0 ? totalEV / totalPV : 1;
  }

  private calculateCurrentCPI(activities: any[]): number {
    const totalEV = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const totalAC = activities.reduce((sum, a) => sum + (a.actualTotalCost || 0), 0);
    return totalAC > 0 ? totalEV / totalAC : 1;
  }

  private calculateAverageProductivity(recentReports: any[]): number {
    return recentReports.reduce((sum, r) => sum + (r.productivityRate || 0), 0) / recentReports.length;
  }

  private calculateResourceUtilization(activeActivities: any[]): number {
    // Simplified calculation
    return 0.75;
  }

  private calculateQualityIndex(recentReports: any[]): number {
    return recentReports.reduce((sum, r) => sum + (r.qualityScore || 100), 0) / recentReports.length;
  }

  private calculateSafetyIndex(recentReports: any[]): number {
    return recentReports.reduce((sum, r) => sum + (r.safetyScore || 100), 0) / recentReports.length;
  }

  private calculateCurrentWeatherImpact(recentReports: any[]): number {
    return recentReports.reduce((sum, r) => sum + (r.weatherConditions?.workability === 'poor' ? 0.5 : 1), 0) / recentReports.length;
  }

  private assessCriticalPathHealth(activities: any[]): number {
    const criticalActivities = activities.filter(a => a.isCriticalPath);
    const onTimeActivities = criticalActivities.filter(a => !this.isActivityDelayed(a));
    return criticalActivities.length > 0 ? onTimeActivities.length / criticalActivities.length : 1;
  }

  private calculateBaselineDelay(currentMetrics: any): number {
    // Simple baseline calculation based on current performance
    const spiImpact = (1 - currentMetrics.currentSPI) * 10; // days
    const qualityImpact = (100 - currentMetrics.qualityIndex) * 0.1; // days
    return Math.max(0, spiImpact + qualityImpact);
  }

  private calculateRiskAdjustment(historicalData: any, currentMetrics: any): number {
    let adjustment = 0;
    
    // Weather adjustment
    if (currentMetrics.weatherImpact < 0.8) {
      adjustment += 5;
    }
    
    // Productivity adjustment
    if (currentMetrics.averageProductivity < historicalData.productivityTrends.averageProductivity * 0.8) {
      adjustment += 3;
    }
    
    return adjustment;
  }

  private estimateDelayStandardDeviation(historicalData: any): number {
    // Simplified standard deviation estimation
    return 5; // days
  }

  private getConfidenceMultiplier(confidenceLevel: number): number {
    const multipliers = {
      0.8: 1.28,
      0.9: 1.645,
      0.95: 1.96
    };
    return multipliers[confidenceLevel];
  }

  private identifyAffectedActivities(currentMetrics: any): string[] {
    // Identify activities most likely to be affected by delays
    return ['Activity 1', 'Activity 2']; // Placeholder
  }

  private assessProductivityRisk(progressReports: any[]): any {
    const avgProductivity = this.calculateAverageProductivity(progressReports);
    if (avgProductivity < 0.5) {
      return { impact: 'high', probability: 0.8 };
    } else if (avgProductivity < 0.7) {
      return { impact: 'medium', probability: 0.6 };
    }
    return { impact: 'low', probability: 0.3 };
  }

  private async assessWeatherRisk(geographicalZone: string): Promise<any> {
    // Assess weather risk based on geographical zone and season
    const riskLevels = {
      'COSTA': { impact: 'high', probability: 0.7 },
      'SIERRA': { impact: 'medium', probability: 0.5 },
      'ORIENTE': { impact: 'high', probability: 0.8 }
    };
    return riskLevels[geographicalZone] || { impact: 'medium', probability: 0.5 };
  }

  private assessResourceRisk(activities: any[]): any {
    const resourceConflicts = activities.filter(a => this.hasResourceConflict(a)).length;
    const riskRatio = resourceConflicts / activities.length;
    
    if (riskRatio > 0.3) {
      return { impact: 'high', probability: 0.9 };
    } else if (riskRatio > 0.1) {
      return { impact: 'medium', probability: 0.6 };
    }
    return { impact: 'low', probability: 0.2 };
  }

  private assessDependencyRisk(activities: any[]): any {
    const criticalActivities = activities.filter(a => a.isCriticalPath);
    const delayedCritical = criticalActivities.filter(a => this.isActivityDelayed(a));
    
    if (delayedCritical.length > 0) {
      return { impact: 'high', probability: 0.8 };
    }
    return { impact: 'low', probability: 0.2 };
  }

  private assessQualityRisk(progressReports: any[]): any {
    const qualityIndex = this.calculateQualityIndex(progressReports);
    if (qualityIndex < 70) {
      return { impact: 'high', probability: 0.7 };
    } else if (qualityIndex < 85) {
      return { impact: 'medium', probability: 0.4 };
    }
    return { impact: 'low', probability: 0.1 };
  }

  private calculateActivityRisk(activity: any, progressReports: any[]): number {
    // Calculate risk score for individual activity
    let risk = 0;
    
    if (this.isActivityDelayed(activity)) risk += 0.4;
    if (activity.isCriticalPath) risk += 0.3;
    if (activity.progressPercentage < this.getExpectedProgress(activity)) risk += 0.3;
    
    return Math.min(1, risk);
  }

  private calculateDaysUntilImpact(activity: any): number {
    // Calculate how many days until the delay impacts the project
    if (activity.isCriticalPath) return 0;
    return Math.max(0, Math.floor(Math.random() * 14)); // Simplified calculation
  }

  private estimateDaysUntilRiskImpact(risk: any): number {
    // Estimate when risk factor will impact the project
    return Math.floor(Math.random() * 30) + 1; // 1-30 days
  }

  private hasResourceConflict(activity: any): boolean {
    // Check if activity has resource conflicts
    return false; // Simplified
  }

  private isActivityDelayed(activity: any): boolean {
    // Check if activity is currently delayed
    if (activity.status === 'COMPLETED') {
      return activity.actualEndDate > activity.plannedEndDate;
    }
    
    const expectedProgress = this.getExpectedProgress(activity);
    return activity.progressPercentage < expectedProgress;
  }

  private getExpectedProgress(activity: any): number {
    // Calculate expected progress for current date
    const now = new Date();
    if (now < activity.plannedStartDate) return 0;
    if (now > activity.plannedEndDate) return 100;
    
    const totalDuration = activity.plannedEndDate.getTime() - activity.plannedStartDate.getTime();
    const elapsed = now.getTime() - activity.plannedStartDate.getTime();
    
    return (elapsed / totalDuration) * 100;
  }
}