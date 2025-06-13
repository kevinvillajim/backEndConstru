// src/infrastructure/jobs/PerformanceAnalysisJob.ts
import { CalculationScheduleRepository } from '../../domain/repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../../domain/repositories/ScheduleActivityRepository';
import { ProgressTrackingRepository } from '../../domain/repositories/ProgressTrackingRepository';
import { NotificationService } from '../../domain/services/NotificationService';
import { CalculationScheduleEntity } from '@infrastructure/database/entities/CalculationScheduleEntity';

export interface PerformanceAnalysisResult {
  scheduleId: string;
  analysisDate: Date;
  kpis: {
    schedulePerformance: number;
    costPerformance: number;
    qualityIndex: number;
    productivityIndex: number;
    safetyIndex: number;
  };
  trends: {
    progressTrend: 'improving' | 'declining' | 'stable';
    costTrend: 'improving' | 'declining' | 'stable';
    qualityTrend: 'improving' | 'declining' | 'stable';
  };
  benchmarks: {
    industryComparison: 'above' | 'below' | 'average';
    historicalComparison: 'better' | 'worse' | 'similar';
  };
  recommendations: string[];
  alerts: any[];
}

export class PerformanceAnalysisJob {
  constructor(
    private scheduleRepository: CalculationScheduleRepository,
    private activityRepository: ScheduleActivityRepository,
    private progressRepository: ProgressTrackingRepository,
    private notificationService: NotificationService
  ) {}

  async execute(): Promise<void> {
    console.log('Starting Performance Analysis Job...');
    
    try {
      // 1. Obtener cronogramas activos
      const activeSchedules = await this.scheduleRepository.findByFilters(
        { status: 'ACTIVE', isActive: true },
        { page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' } // CORREGIDO: Agregado segundo parámetro
      );

      console.log(`Analyzing performance for ${activeSchedules.length} schedules`);

      // 2. Procesar análisis para cada cronograma
      const analysisResults = [];
      for (const schedule of activeSchedules) {
        const result = await this.analyzeSchedulePerformance(schedule);
        analysisResults.push(result);
      }

      // 3. Generar reporte consolidado
      const consolidatedReport = await this.generateConsolidatedReport(analysisResults);

      // 4. Enviar notificaciones por problemas críticos
      await this.sendCriticalAlerts(analysisResults);

      // 5. Actualizar métricas históricas
      await this.updateHistoricalMetrics(analysisResults);

      console.log('Performance Analysis Job completed successfully');

    } catch (error) {
      console.error('Error in Performance Analysis Job:', error);
      await this.notificationService.createNotification({
        userId: 'system',
        type: 'ERROR',
        title: 'Error en Análisis de Performance',
        message: `Error en análisis automático: ${(error as Error).message}`,
        priority: 'HIGH',
        relatedEntityType: 'SYSTEM_JOB',
        relatedEntityId: 'performance_analysis_job'
      });
    }
  }

  private async updateSchedule(schedule: CalculationScheduleEntity): Promise<void> {
    try {
      console.log(`Updating performance metrics for schedule: ${schedule.id}`);

      // Obtener actividades del cronograma
      const activities = await this.activityRepository.findByScheduleId(schedule.id);
      
      // Recalcular métricas de rendimiento
      const kpis = this.calculateKPIs(activities, []);
      
      // Actualizar el cronograma con las nuevas métricas
      schedule.customFields = {
        ...schedule.customFields,
        performanceMetrics: kpis,
        lastPerformanceUpdate: new Date()
      };
      
      await this.scheduleRepository.save(schedule);
      
      console.log(`Schedule ${schedule.id} performance metrics updated`);
      
    } catch (error) {
      console.error(`Error updating schedule ${schedule.id}:`, error);
    }
  }

  private async analyzeSchedulePerformance(schedule: any): Promise<PerformanceAnalysisResult> {
    console.log(`Analyzing performance for schedule: ${schedule.id}`);

    // 1. Obtener datos necesarios
    const activities = await this.activityRepository.findByScheduleId(schedule.id);
    const progressReports = await this.progressRepository.findByScheduleId(schedule.id, {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    });

    // 2. Calcular KPIs principales
    const kpis = this.calculateKPIs(activities, progressReports);

    // 3. Analizar tendencias
    const trends = await this.analyzeTrends(schedule.id, progressReports);

    // 4. Realizar benchmarking
    const benchmarks = await this.performBenchmarking(schedule, activities, kpis);

    // 5. Generar recomendaciones
    const recommendations = this.generateRecommendations(kpis, trends, benchmarks);

    // 6. Identificar alertas
    const alerts = this.identifyAlerts(kpis, trends);

    return {
      scheduleId: schedule.id,
      analysisDate: new Date(),
      kpis,
      trends,
      benchmarks,
      recommendations,
      alerts
    };
  }

  private calculateKPIs(activities: any[], progressReports: any[]): any {
    // Schedule Performance Index
    const totalEV = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const totalPV = activities.reduce((sum, a) => sum + (a.plannedTotalCost || 0), 0);
    const schedulePerformance = totalPV > 0 ? totalEV / totalPV : 1;

    // Cost Performance Index
    const totalAC = activities.reduce((sum, a) => sum + (a.actualTotalCost || 0), 0);
    const costPerformance = totalAC > 0 ? totalEV / totalAC : 1;

    // Quality Index
    const qualityScores = progressReports.map(r => r.qualityScore || 100);
    const qualityIndex = qualityScores.length > 0 ? 
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 100;

    // Productivity Index
    const productivityValues = progressReports.map(r => r.productivityRate || 0);
    const productivityIndex = productivityValues.length > 0 ?
      productivityValues.reduce((sum, p) => sum + p, 0) / productivityValues.length : 0;

    // Safety Index
    const safetyScores = progressReports.map(r => r.safetyScore || 100);
    const safetyIndex = safetyScores.length > 0 ?
      safetyScores.reduce((sum, score) => sum + score, 0) / safetyScores.length : 100;

    return {
      schedulePerformance: Math.round(schedulePerformance * 100) / 100,
      costPerformance: Math.round(costPerformance * 100) / 100,
      qualityIndex: Math.round(qualityIndex * 100) / 100,
      productivityIndex: Math.round(productivityIndex * 100) / 100,
      safetyIndex: Math.round(safetyIndex * 100) / 100
    };
  }

  private async analyzeTrends(scheduleId: string, recentReports: any[]): Promise<any> {
    // Obtener reportes históricos para comparación
    const historicalReports = await this.progressRepository.findByScheduleId(scheduleId, {
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Last 60 days
      endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)    // 30-60 days ago
    });

    // Calcular métricas históricas
    const historicalProductivity = this.calculateAverageProductivity(historicalReports);
    const recentProductivity = this.calculateAverageProductivity(recentReports);

    const historicalQuality = this.calculateAverageQuality(historicalReports);
    const recentQuality = this.calculateAverageQuality(recentReports);

    // Determinar tendencias
    const progressTrend = this.determineTrend(historicalProductivity, recentProductivity);
    const qualityTrend = this.determineTrend(historicalQuality, recentQuality);

    // Cost trend requiere datos de actividades
    const costTrend = 'stable'; // Simplified

    return {
      progressTrend,
      costTrend,
      qualityTrend
    };
  }

  private async performBenchmarking(schedule: any, activities: any[], kpis: any): Promise<any> {
    // Industry benchmarking (simplified)
    const industryBenchmarks = {
      schedulePerformance: 0.95,
      costPerformance: 1.0,
      qualityIndex: 90,
      productivityIndex: 0.75,
      safetyIndex: 95
    };

    // Comparar con benchmarks de la industria
    const industryComparison = this.compareWithBenchmarks(kpis, industryBenchmarks);

    // Historical comparison (simplified)
    const historicalComparison = 'similar'; // Would need historical data

    return {
      industryComparison,
      historicalComparison
    };
  }

  private generateRecommendations(kpis: any, trends: any, benchmarks: any): string[] {
    const recommendations = [];

    // Recomendaciones basadas en KPIs
    if (kpis.schedulePerformance < 0.9) {
      recommendations.push('Implementar medidas para mejorar adherencia al cronograma');
    }

    if (kpis.costPerformance < 0.95) {
      recommendations.push('Revisar control de costos y optimizar uso de recursos');
    }

    if (kpis.qualityIndex < 85) {
      recommendations.push('Fortalecer controles de calidad y procesos de inspección');
    }

    if (kpis.productivityIndex < 0.6) {
      recommendations.push('Evaluar capacitación adicional para mejorar productividad');
    }

    if (kpis.safetyIndex < 90) {
      recommendations.push('Reforzar medidas de seguridad y capacitación');
    }

    // Recomendaciones basadas en tendencias
    if (trends.progressTrend === 'declining') {
      recommendations.push('Investigar causas de declive en progreso y tomar medidas correctivas');
    }

    if (trends.qualityTrend === 'declining') {
      recommendations.push('Implementar plan de mejora de calidad inmediato');
    }

    // Recomendaciones basadas en benchmarks
    if (benchmarks.industryComparison === 'below') {
      recommendations.push('Analizar mejores prácticas de la industria para mejora');
    }

    return recommendations;
  }

  private identifyAlerts(kpis: any, trends: any): any[] {
    const alerts = [];

    // Alertas críticas por KPIs bajos
    if (kpis.schedulePerformance < 0.8) {
      alerts.push({
        type: 'CRITICAL_SCHEDULE_PERFORMANCE',
        severity: 'HIGH', // CORREGIDO: Cambiar de 'CRITICAL' a 'HIGH'
        message: `Performance de cronograma crítico: ${(kpis.schedulePerformance * 100).toFixed(1)}%`
      });
    }

    if (kpis.costPerformance < 0.8) {
      alerts.push({
        type: 'CRITICAL_COST_PERFORMANCE',
        severity: 'HIGH', // CORREGIDO: Cambiar de 'CRITICAL' a 'HIGH'
        message: `Performance de costos crítico: ${(kpis.costPerformance * 100).toFixed(1)}%`
      });
    }

    if (kpis.safetyIndex < 80) {
      alerts.push({
        type: 'CRITICAL_SAFETY_ISSUE',
        severity: 'HIGH', // CORREGIDO: Cambiar de 'CRITICAL' a 'HIGH'
        message: `Índice de seguridad crítico: ${kpis.safetyIndex.toFixed(1)}%`
      });
    }

    // Alertas por tendencias negativas
    if (trends.progressTrend === 'declining') {
      alerts.push({
        type: 'DECLINING_PROGRESS_TREND',
        severity: 'MEDIUM',
        message: 'Tendencia de progreso en declive detectada'
      });
    }

    if (trends.qualityTrend === 'declining') {
      alerts.push({
        type: 'DECLINING_QUALITY_TREND',
        severity: 'MEDIUM',
        message: 'Tendencia de calidad en declive detectada'
      });
    }

    return alerts;
  }

  private async generateConsolidatedReport(analysisResults: PerformanceAnalysisResult[]): Promise<any> {
    const consolidatedKPIs = this.consolidateKPIs(analysisResults);
    const criticalIssues = this.identifyCriticalIssues(analysisResults);
    const topRecommendations = this.aggregateRecommendations(analysisResults);

    const report = {
      reportDate: new Date(),
      totalSchedulesAnalyzed: analysisResults.length,
      consolidatedKPIs,
      criticalIssues,
      topRecommendations,
      performanceDistribution: this.calculatePerformanceDistribution(analysisResults)
    };

    // Save report to database or file system
    console.log('Consolidated Performance Report Generated:', report);
    
    return report;
  }

  private async sendCriticalAlerts(analysisResults: PerformanceAnalysisResult[]): Promise<void> {
    const criticalSchedules = analysisResults.filter(result => 
      result.alerts.some(alert => alert.severity === 'HIGH')
    );

    for (const schedule of criticalSchedules) {
      const criticalAlerts = schedule.alerts.filter(alert => 
        alert.severity === 'HIGH'
      );

      for (const alert of criticalAlerts) {
        await this.notificationService.createNotification({
          userId: 'system', // Should be replaced with project managers
          type: 'ALERT',
          title: 'Alerta Crítica de Performance',
          message: alert.message,
          // CORREGIDO: Usar solo valores válidos de priority
          priority: alert.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
          relatedEntityType: 'CALCULATION_SCHEDULE',
          relatedEntityId: schedule.scheduleId,
          metadata: {
            analysisDate: schedule.analysisDate,
            alertType: alert.type,
            kpis: schedule.kpis,
            severity: alert.severity,
            requiresAction: true
          }
        });
      }
    }
  }

  private async updateHistoricalMetrics(analysisResults: PerformanceAnalysisResult[]): Promise<void> {
    // Store historical metrics for trend analysis
    for (const result of analysisResults) {
      // This would typically be saved to a metrics/analytics table
      console.log(`Storing historical metrics for schedule ${result.scheduleId}`);
    }
  }

  // Helper methods
  private calculateAverageProductivity(reports: any[]): number {
    if (reports.length === 0) return 0;
    const values = reports.map(r => r.productivityRate || 0);
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculateAverageQuality(reports: any[]): number {
    if (reports.length === 0) return 100;
    const values = reports.map(r => r.qualityScore || 100);
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private determineTrend(historical: number, recent: number): 'improving' | 'declining' | 'stable' {
    const threshold = 0.05; // 5% threshold
    const change = (recent - historical) / historical;
    
    if (change > threshold) return 'improving';
    if (change < -threshold) return 'declining';
    return 'stable';
  }

  private compareWithBenchmarks(kpis: any, benchmarks: any): 'above' | 'below' | 'average' {
    const scores = Object.keys(kpis).map(key => {
      const kpiValue = kpis[key];
      const benchmarkValue = benchmarks[key];
      return kpiValue / benchmarkValue;
    });
    
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (avgScore > 1.05) return 'above';
    if (avgScore < 0.95) return 'below';
    return 'average';
  }

  private consolidateKPIs(results: PerformanceAnalysisResult[]): any {
    if (results.length === 0) return {};
    
    const consolidated = {
      avgSchedulePerformance: 0,
      avgCostPerformance: 0,
      avgQualityIndex: 0,
      avgProductivityIndex: 0,
      avgSafetyIndex: 0
    };
    
    for (const result of results) {
      consolidated.avgSchedulePerformance += result.kpis.schedulePerformance;
      consolidated.avgCostPerformance += result.kpis.costPerformance;
      consolidated.avgQualityIndex += result.kpis.qualityIndex;
      consolidated.avgProductivityIndex += result.kpis.productivityIndex;
      consolidated.avgSafetyIndex += result.kpis.safetyIndex;
    }
    
    const count = results.length;
    return {
      avgSchedulePerformance: consolidated.avgSchedulePerformance / count,
      avgCostPerformance: consolidated.avgCostPerformance / count,
      avgQualityIndex: consolidated.avgQualityIndex / count,
      avgProductivityIndex: consolidated.avgProductivityIndex / count,
      avgSafetyIndex: consolidated.avgSafetyIndex / count
    };
  }

  private identifyCriticalIssues(results: PerformanceAnalysisResult[]): any[] {
    const criticalIssues = [];
    
    for (const result of results) {
      const criticalAlerts = result.alerts.filter(alert => 
        alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
      );
      
      if (criticalAlerts.length > 0) {
        criticalIssues.push({
          scheduleId: result.scheduleId,
          issueCount: criticalAlerts.length,
          issues: criticalAlerts
        });
      }
    }
    
    return criticalIssues;
  }

  private aggregateRecommendations(results: PerformanceAnalysisResult[]): string[] {
    const allRecommendations = results.flatMap(result => result.recommendations);
    const recommendationCounts = new Map<string, number>();
    
    for (const recommendation of allRecommendations) {
      recommendationCounts.set(recommendation, (recommendationCounts.get(recommendation) || 0) + 1);
    }
    
    // Return top 5 most common recommendations
    return Array.from(recommendationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }

  private calculatePerformanceDistribution(results: PerformanceAnalysisResult[]): any {
    const distribution = {
      excellent: 0, // >95%
      good: 0,      // 85-95%
      fair: 0,      // 70-85%
      poor: 0       // <70%
    };
    
    for (const result of results) {
      const avgPerformance = (result.kpis.schedulePerformance + result.kpis.costPerformance) / 2;
      
      if (avgPerformance > 0.95) distribution.excellent++;
      else if (avgPerformance > 0.85) distribution.good++;
      else if (avgPerformance > 0.70) distribution.fair++;
      else distribution.poor++;
    }
    
    return distribution;
  }
}