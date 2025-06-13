// src/infrastructure/webserver/controllers/ScheduleAnalyticsController.ts
import { Request, Response } from 'express';
import { GenerateScheduleReportsUseCase } from '../../../application/schedule/GenerateScheduleReportsUseCase';
import { CalculationScheduleRepository } from '../../../domain/repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../../../domain/repositories/ScheduleActivityRepository';
import { ProgressTrackingRepository } from '../../../domain/repositories/ProgressTrackingRepository';

export class ScheduleAnalyticsController {
  constructor(
    private generateReportsUseCase: GenerateScheduleReportsUseCase,
    private scheduleRepository: CalculationScheduleRepository,
    private activityRepository: ScheduleActivityRepository,
    private progressRepository: ProgressTrackingRepository
  ) {}

  // GET /api/schedule-analytics/:scheduleId/dashboard
  async getScheduleDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { period = '30d' } = req.query;

      const schedule = await this.scheduleRepository.findById(scheduleId);
      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
        return;
      }

      const activities = await this.activityRepository.findByScheduleId(scheduleId);
      const progressReports = await this.getProgressReportsForPeriod(scheduleId, period as string);

      const dashboard = {
        overview: await this.generateOverviewMetrics(schedule, activities),
        performance: await this.generatePerformanceMetrics(activities, progressReports),
        schedule: await this.generateScheduleMetrics(activities),
        quality: await this.generateQualityMetrics(progressReports),
        resources: await this.generateResourceMetrics(activities, progressReports),
        trends: await this.generateTrendAnalysis(progressReports, period as string),
        alerts: await this.generateAlerts(schedule, activities, progressReports)
      };

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating dashboard',
        error: (error as Error).message
      });
    }
  }

  // GET /api/schedule-analytics/:scheduleId/performance
  async getPerformanceAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { 
        startDate, 
        endDate, 
        groupBy = 'week',
        includeForecasting = 'false'
      } = req.query;

      const activities = await this.activityRepository.findByScheduleId(scheduleId);
      const progressReports = await this.progressRepository.findByScheduleId(scheduleId);

      const performance = {
        earnedValueAnalysis: this.calculateEarnedValueAnalysis(activities, progressReports),
        schedulePerformance: this.calculateSchedulePerformance(activities, progressReports),
        costPerformance: this.calculateCostPerformance(activities, progressReports),
        productivityAnalysis: this.calculateProductivityAnalysis(progressReports),
        trendAnalysis: this.calculateTrendAnalysis(progressReports, groupBy as string),
        benchmarks: await this.calculateBenchmarks(scheduleId, activities),
        forecasting: includeForecasting === 'true' ? 
          await this.generatePerformanceForecasting(activities, progressReports) : undefined
      };

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating performance analytics',
        error: (error as Error).message
      });
    }
  }

  // GET /api/schedule-analytics/:scheduleId/variance-analysis
  async getVarianceAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { threshold = 10 } = req.query;

      const activities = await this.activityRepository.findByScheduleId(scheduleId);
      const progressReports = await this.progressRepository.findByScheduleId(scheduleId);

      const variance = {
        scheduleVariance: this.calculateScheduleVariance(activities),
        costVariance: this.calculateCostVariance(activities),
        scopeVariance: this.calculateScopeVariance(activities, progressReports),
        resourceVariance: this.calculateResourceVariance(activities, progressReports),
        significantVariances: this.identifySignificantVariances(activities, Number(threshold)),
        varianceTrends: this.calculateVarianceTrends(progressReports),
        rootCauseAnalysis: this.performRootCauseAnalysis(activities, progressReports),
        correctionActions: this.suggestCorrectionActions(activities, progressReports)
      };

      res.json({
        success: true,
        data: variance
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating variance analysis',
        error: (error as Error).message
      });
    }
  }

  // GET /api/schedule-analytics/:scheduleId/critical-path
  async getCriticalPathAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      const activities = await this.activityRepository.findByScheduleId(scheduleId);
      const criticalPathActivities = activities.filter(a => a.isCriticalPath);

      const analysis = {
        criticalPath: criticalPathActivities.map(a => ({
          id: a.id,
          name: a.name,
          plannedDuration: a.plannedDurationDays,
          actualDuration: a.actualDurationDays,
          variance: a.actualDurationDays - a.plannedDurationDays,
          status: a.status,
          riskLevel: this.calculateActivityRiskLevel(a)
        })),
        totalFloat: this.calculateTotalFloat(activities),
        freeFloat: this.calculateFreeFloat(activities),
        criticalPathLength: this.calculateCriticalPathLength(criticalPathActivities),
        riskAnalysis: this.analyzeCriticalPathRisks(criticalPathActivities),
        recommendations: this.generateCriticalPathRecommendations(criticalPathActivities),
        alternativePaths: this.identifyAlternativePaths(activities)
      };

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating critical path analysis',
        error: (error as Error).message
      });
    }
  }

  // POST /api/schedule-analytics/:scheduleId/reports
  async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const reportRequest = {
        scheduleId,
        ...req.body
      };

      const result = await this.generateReportsUseCase.execute(reportRequest);

      res.json({
        success: true,
        message: 'Report generated successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error generating report',
        error: (error as Error).message
      });
    }
  }

  // GET /api/schedule-analytics/:scheduleId/kpis
  async getKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { period = '30d' } = req.query;

      const schedule = await this.scheduleRepository.findById(scheduleId);
      const activities = await this.activityRepository.findByScheduleId(scheduleId);
      const progressReports = await this.getProgressReportsForPeriod(scheduleId, period as string);

      const kpis = {
        scheduleKPIs: {
          schedulePerformanceIndex: this.calculateSPI(activities),
          scheduleVariance: this.calculateOverallScheduleVariance(activities),
          onTimeCompletion: this.calculateOnTimeCompletionRate(activities),
          criticalPathHealth: this.calculateCriticalPathHealth(activities)
        },
        costKPIs: {
          costPerformanceIndex: this.calculateCPI(activities),
          costVariance: this.calculateOverallCostVariance(activities),
          budgetUtilization: this.calculateBudgetUtilization(schedule, activities),
          costEfficiency: this.calculateCostEfficiency(activities)
        },
        qualityKPIs: {
          qualityIndex: this.calculateQualityIndex(progressReports),
          defectRate: this.calculateDefectRate(progressReports),
          reworkRate: this.calculateReworkRate(progressReports),
          inspectionPassRate: this.calculateInspectionPassRate(progressReports)
        },
        productivityKPIs: {
          overallProductivity: this.calculateOverallProductivity(progressReports),
          laborEfficiency: this.calculateLaborEfficiency(progressReports),
          equipmentUtilization: this.calculateEquipmentUtilization(progressReports),
          materialWaste: this.calculateMaterialWaste(progressReports)
        },
        safetyKPIs: {
          safetyIndex: this.calculateSafetyIndex(progressReports),
          incidentRate: this.calculateIncidentRate(progressReports),
          nearMissRate: this.calculateNearMissRate(progressReports),
          safetyComplianceRate: this.calculateSafetyComplianceRate(progressReports)
        }
      };

      res.json({
        success: true,
        data: kpis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error calculating KPIs',
        error: (error as Error).message
      });
    }
  }

  // GET /api/schedule-analytics/:scheduleId/predictions
  async getPredictiveAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { 
        horizon = '30d',
        confidenceLevel = 0.9,
        includeScenarios = 'false'
      } = req.query;

      const activities = await this.activityRepository.findByScheduleId(scheduleId);
      const progressReports = await this.progressRepository.findByScheduleId(scheduleId);

      const predictions = {
        completionPrediction: this.predictCompletion(activities, progressReports),
        costPrediction: this.predictFinalCost(activities, progressReports),
        riskPrediction: this.predictRisks(activities, progressReports),
        resourcePrediction: this.predictResourceNeeds(activities, progressReports),
        qualityPrediction: this.predictQualityMetrics(progressReports),
        scenarioAnalysis: includeScenarios === 'true' ? 
          this.generateScenarioAnalysis(activities, progressReports) : undefined
      };

      res.json({
        success: true,
        data: predictions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error generating predictive analytics',
        error: (error as Error).message
      });
    }
  }

  // Private helper methods
  private async getProgressReportsForPeriod(scheduleId: string, period: string): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return await this.progressRepository.findByScheduleId(scheduleId);
  }

  private async generateOverviewMetrics(schedule: any, activities: any[]): Promise<any> {
    const completed = activities.filter(a => a.status === 'COMPLETED').length;
    const inProgress = activities.filter(a => a.status === 'IN_PROGRESS').length;
    const notStarted = activities.filter(a => a.status === 'NOT_STARTED').length;
    const overallProgress = activities.reduce((sum, a) => sum + a.progressPercentage, 0) / activities.length;

    return {
      totalActivities: activities.length,
      completedActivities: completed,
      inProgressActivities: inProgress,
      notStartedActivities: notStarted,
      overallProgress: Math.round(overallProgress * 100) / 100,
      scheduleHealth: this.calculateScheduleHealth(activities),
      projectStatus: schedule.status,
      daysElapsed: this.daysBetween(schedule.plannedStartDate, new Date()),
      estimatedDaysRemaining: this.estimateDaysRemaining(activities)
    };
  }

  private async generatePerformanceMetrics(activities: any[], progressReports: any[]): Promise<any> {
    return {
      schedulePerformanceIndex: this.calculateSPI(activities),
      costPerformanceIndex: this.calculateCPI(activities),
      estimateAtCompletion: this.calculateEAC(activities),
      estimateToComplete: this.calculateETC(activities),
      varianceAtCompletion: this.calculateVAC(activities),
      toCompletePerformanceIndex: this.calculateTCPI(activities)
    };
  }

  private async generateScheduleMetrics(activities: any[]): Promise<any> {
    const criticalActivities = activities.filter(a => a.isCriticalPath);
    const delayedActivities = activities.filter(a => this.isActivityDelayed(a));

    return {
      totalActivities: activities.length,
      criticalPathActivities: criticalActivities.length,
      delayedActivities: delayedActivities.length,
      averageProgress: activities.reduce((sum, a) => sum + a.progressPercentage, 0) / activities.length,
      criticalPathProgress: criticalActivities.reduce((sum, a) => sum + a.progressPercentage, 0) / criticalActivities.length,
      scheduleAdherence: this.calculateScheduleAdherence(activities)
    };
  }

  private async generateQualityMetrics(progressReports: any[]): Promise<any> {
    if (progressReports.length === 0) {
      return {
        qualityIndex: 100,
        qualityIssues: 0,
        averageQualityScore: 100,
        qualityTrend: 'stable'
      };
    }

    const qualityScores = progressReports.map(r => r.qualityScore || 100);
    const qualityIssues = progressReports.reduce((sum, r) => sum + (r.qualityIssues?.length || 0), 0);

    return {
      qualityIndex: qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length,
      qualityIssues,
      averageQualityScore: qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length,
      qualityTrend: this.calculateQualityTrend(progressReports)
    };
  }

  private async generateResourceMetrics(activities: any[], progressReports: any[]): Promise<any> {
    return {
      resourceUtilization: this.calculateResourceUtilization(activities, progressReports),
      resourceConflicts: this.identifyResourceConflicts(activities),
      resourceEfficiency: this.calculateResourceEfficiency(progressReports),
      resourceCosts: this.calculateResourceCosts(activities, progressReports)
    };
  }

  private async generateTrendAnalysis(progressReports: any[], period: string): Promise<any> {
    const groupedReports = this.groupReportsByPeriod(progressReports, period);
    
    return {
      progressTrend: this.calculateProgressTrend(groupedReports),
      productivityTrend: this.calculateProductivityTrend(groupedReports),
      qualityTrend: this.calculateQualityTrend(progressReports),
      costTrend: this.calculateCostTrend(groupedReports)
    };
  }

  private async generateAlerts(schedule: any, activities: any[], progressReports: any[]): Promise<any[]> {
    const alerts = [];

    // Schedule alerts
    const delayedActivities = activities.filter(a => this.isActivityDelayed(a));
    if (delayedActivities.length > 0) {
      alerts.push({
        type: 'warning',
        category: 'schedule',
        message: `${delayedActivities.length} activities are behind schedule`,
        priority: 'high'
      });
    }

    // Critical path alerts
    const delayedCriticalActivities = activities.filter(a => a.isCriticalPath && this.isActivityDelayed(a));
    if (delayedCriticalActivities.length > 0) {
      alerts.push({
        type: 'critical',
        category: 'schedule',
        message: `${delayedCriticalActivities.length} critical path activities are delayed`,
        priority: 'critical'
      });
    }

    // Quality alerts
    const recentQualityIssues = progressReports.filter(r => 
      r.qualityScore < 80 && 
      new Date(r.reportDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (recentQualityIssues.length > 0) {
      alerts.push({
        type: 'warning',
        category: 'quality',
        message: `${recentQualityIssues.length} quality issues reported in the last week`,
        priority: 'medium'
      });
    }

    return alerts;
  }

  // Calculation helper methods
  private calculateScheduleHealth(activities: any[]): string {
    const onTimeActivities = activities.filter(a => !this.isActivityDelayed(a)).length;
    const healthPercentage = (onTimeActivities / activities.length) * 100;
    
    if (healthPercentage >= 90) return 'excellent';
    if (healthPercentage >= 75) return 'good';
    if (healthPercentage >= 60) return 'fair';
    return 'poor';
  }

  private estimateDaysRemaining(activities: any[]): number {
    const incompleteActivities = activities.filter(a => a.status !== 'COMPLETED');
    if (incompleteActivities.length === 0) return 0;
    
    // Simplified calculation
    const avgProgressRate = incompleteActivities.reduce((sum, a) => {
      const elapsed = this.daysBetween(a.actualStartDate || a.plannedStartDate, new Date());
      return sum + (a.progressPercentage / Math.max(1, elapsed));
    }, 0) / incompleteActivities.length;
    
    const remainingWork = incompleteActivities.reduce((sum, a) => sum + (100 - a.progressPercentage), 0);
    return Math.ceil(remainingWork / Math.max(1, avgProgressRate));
  }

  private calculateSPI(activities: any[]): number {
    const totalEV = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const totalPV = activities.reduce((sum, a) => sum + (a.plannedTotalCost || 0), 0);
    return totalPV > 0 ? totalEV / totalPV : 1;
  }

  private calculateCPI(activities: any[]): number {
    const totalEV = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const totalAC = activities.reduce((sum, a) => sum + (a.actualTotalCost || 0), 0);
    return totalAC > 0 ? totalEV / totalAC : 1;
  }

  private calculateEAC(activities: any[]): number {
    const totalAC = activities.reduce((sum, a) => sum + (a.actualTotalCost || 0), 0);
    const totalBAC = activities.reduce((sum, a) => sum + (a.plannedTotalCost || 0), 0);
    const totalEV = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const cpi = this.calculateCPI(activities);
    
    return totalAC + ((totalBAC - totalEV) / cpi);
  }

  private calculateETC(activities: any[]): number {
    const eac = this.calculateEAC(activities);
    const totalAC = activities.reduce((sum, a) => sum + (a.actualTotalCost || 0), 0);
    return eac - totalAC;
  }

  private calculateVAC(activities: any[]): number {
    const totalBAC = activities.reduce((sum, a) => sum + (a.plannedTotalCost || 0), 0);
    const eac = this.calculateEAC(activities);
    return totalBAC - eac;
  }

  private calculateTCPI(activities: any[]): number {
    const totalBAC = activities.reduce((sum, a) => sum + (a.plannedTotalCost || 0), 0);
    const totalEV = activities.reduce((sum, a) => sum + (a.earnedValue || 0), 0);
    const eac = this.calculateEAC(activities);
    const totalAC = activities.reduce((sum, a) => sum + (a.actualTotalCost || 0), 0);
    
    return (totalBAC - totalEV) / (eac - totalAC);
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

  private daysBetween(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // Placeholder implementations for other methods
  private calculateEarnedValueAnalysis(activities: any[], progressReports: any[]): any { return {}; }
  private calculateSchedulePerformance(activities: any[], progressReports: any[]): any { return {}; }
  private calculateCostPerformance(activities: any[], progressReports: any[]): any { return {}; }
  private calculateProductivityAnalysis(progressReports: any[]): any { return {}; }
  private calculateTrendAnalysis(progressReports: any[], groupBy: string): any { return {}; }
  private async calculateBenchmarks(scheduleId: string, activities: any[]): Promise<any> { return {}; }
  private async generatePerformanceForecasting(activities: any[], progressReports: any[]): Promise<any> { return {}; }
  
  private calculateScheduleVariance(activities: any[]): any { return {}; }
  private calculateCostVariance(activities: any[]): any { return {}; }
  private calculateScopeVariance(activities: any[], progressReports: any[]): any { return {}; }
  private calculateResourceVariance(activities: any[], progressReports: any[]): any { return {}; }
  private identifySignificantVariances(activities: any[], threshold: number): any[] { return []; }
  private calculateVarianceTrends(progressReports: any[]): any { return {}; }
  private performRootCauseAnalysis(activities: any[], progressReports: any[]): any { return {}; }
  private suggestCorrectionActions(activities: any[], progressReports: any[]): any[] { return []; }
  
  private calculateActivityRiskLevel(activity: any): string { return 'medium'; }
  private calculateTotalFloat(activities: any[]): any { return {}; }
  private calculateFreeFloat(activities: any[]): any { return {}; }
  private calculateCriticalPathLength(activities: any[]): number { return 0; }
  private analyzeCriticalPathRisks(activities: any[]): any { return {}; }
  private generateCriticalPathRecommendations(activities: any[]): string[] { return []; }
  private identifyAlternativePaths(activities: any[]): any[] { return []; }
  
  private calculateOverallScheduleVariance(activities: any[]): number { return 0; }
  private calculateOnTimeCompletionRate(activities: any[]): number { return 0; }
  private calculateCriticalPathHealth(activities: any[]): number { return 0; }
  private calculateOverallCostVariance(activities: any[]): number { return 0; }
  private calculateBudgetUtilization(schedule: any, activities: any[]): number { return 0; }
  private calculateCostEfficiency(activities: any[]): number { return 0; }
  private calculateQualityIndex(progressReports: any[]): number { return 100; }
  private calculateDefectRate(progressReports: any[]): number { return 0; }
  private calculateReworkRate(progressReports: any[]): number { return 0; }
  private calculateInspectionPassRate(progressReports: any[]): number { return 100; }
  private calculateOverallProductivity(progressReports: any[]): number { return 0; }
  private calculateLaborEfficiency(progressReports: any[]): number { return 0; }
  private calculateEquipmentUtilization(progressReports: any[]): number { return 0; }
  private calculateMaterialWaste(progressReports: any[]): number { return 0; }
  private calculateSafetyIndex(progressReports: any[]): number { return 100; }
  private calculateIncidentRate(progressReports: any[]): number { return 0; }
  private calculateNearMissRate(progressReports: any[]): number { return 0; }
  private calculateSafetyComplianceRate(progressReports: any[]): number { return 100; }
  
  private predictCompletion(activities: any[], progressReports: any[]): any { return {}; }
  private predictFinalCost(activities: any[], progressReports: any[]): any { return {}; }
  private predictRisks(activities: any[], progressReports: any[]): any { return {}; }
  private predictResourceNeeds(activities: any[], progressReports: any[]): any { return {}; }
  private predictQualityMetrics(progressReports: any[]): any { return {}; }
  private generateScenarioAnalysis(activities: any[], progressReports: any[]): any { return {}; }
  
  private calculateResourceUtilization(activities: any[], progressReports: any[]): any { return {}; }
  private identifyResourceConflicts(activities: any[]): any[] { return []; }
  private calculateResourceEfficiency(progressReports: any[]): any { return {}; }
  private calculateResourceCosts(activities: any[], progressReports: any[]): any { return {}; }
  private groupReportsByPeriod(progressReports: any[], period: string): any { return {}; }
  private calculateProgressTrend(groupedReports: any): any { return {}; }
  private calculateProductivityTrend(groupedReports: any): any { return {}; }
  private calculateQualityTrend(progressReports: any[]): string { return 'stable'; }
  private calculateCostTrend(groupedReports: any): any { return {}; }
  private calculateScheduleAdherence(activities: any[]): number { return 0; }
}