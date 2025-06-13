import { CalculationScheduleRepository } from "../../domain/repositories/CalculationScheduleRepository";
import { ProgressTrackingRepository } from "../../domain/repositories/ProgressTrackingRepository";
import { ScheduleActivityRepository } from "../../domain/repositories/ScheduleActivityRepository";

// src/application/schedule/GenerateScheduleReportsUseCase.ts
export interface ScheduleReportRequest {
    scheduleId: string;
    reportType: 'executive' | 'detailed' | 'variance' | 'performance' | 'resource_utilization' | 'custom';
    periodType: 'daily' | 'weekly' | 'monthly' | 'project_to_date';
    startDate?: Date;
    endDate?: Date;
    includePhotos?: boolean;
    includeCharts?: boolean;
    includeRecommendations?: boolean;
    customFilters?: {
      activities?: string[];
      trades?: string[];
      phases?: string[];
      minVariance?: number;
    };
    outputFormat: 'pdf' | 'excel' | 'json' | 'html';
    recipientEmails?: string[];
    templateId?: string;
  }
  
  export interface ScheduleReportResponse {
    reportId: string;
    reportData: any;
    downloadUrl?: string;
    summary: {
      totalActivities: number;
      completedActivities: number;
      delayedActivities: number;
      overallProgress: number;
      scheduleVariance: number;
      costVariance: number;
    };
    charts?: any[];
    recommendations?: string[];
  }
  
  export class GenerateScheduleReportsUseCase {
    constructor(
      private scheduleRepository: CalculationScheduleRepository,
      private activityRepository: ScheduleActivityRepository,
      private progressRepository: ProgressTrackingRepository
    ) {}
  
    async execute(request: ScheduleReportRequest): Promise<ScheduleReportResponse> {
      // 1. Obtener datos del cronograma
      const schedule = await this.scheduleRepository.findById(request.scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }
  
      // 2. Obtener actividades filtradas
      const activities = await this.getFilteredActivities(request);
  
      // 3. Obtener reportes de progreso
      const progressReports = await this.getProgressReports(request);
  
      // 4. Generar datos del reporte según tipo
      const reportData = await this.generateReportData(request, schedule, activities, progressReports);
  
      // 5. Calcular métricas resumen
      const summary = this.calculateSummaryMetrics(activities, progressReports);
  
      // 6. Generar gráficos si se solicitan
      const charts = request.includeCharts ? this.generateCharts(activities, progressReports) : undefined;
  
      // 7. Generar recomendaciones si se solicitan
      const recommendations = request.includeRecommendations ? 
        this.generateReportRecommendations(activities, progressReports, summary) : undefined;
  
      // 8. Generar archivo de salida
      const downloadUrl = await this.generateOutputFile(request, reportData, summary, charts);
  
      // 9. Enviar por email si se solicita
      if (request.recipientEmails && request.recipientEmails.length > 0) {
        await this.sendReportByEmail(request, downloadUrl);
      }
  
      return {
        reportId: this.generateReportId(),
        reportData,
        downloadUrl,
        summary,
        charts,
        recommendations
      };
    }
  
    private async getFilteredActivities(request: ScheduleReportRequest): Promise<any[]> {
      let activities = await this.activityRepository.findByScheduleId(request.scheduleId);
  
      // Aplicar filtros personalizados
      if (request.customFilters) {
        if (request.customFilters.activities) {
          activities = activities.filter(a => request.customFilters!.activities!.includes(a.id));
        }
        
        if (request.customFilters.trades) {
          activities = activities.filter(a => 
            request.customFilters!.trades!.includes(a.primaryTrade)
          );
        }
        
        if (request.customFilters.minVariance !== undefined) {
          activities = activities.filter(a => 
            Math.abs(this.calculateActivityVariance(a)) >= request.customFilters!.minVariance!
          );
        }
      }
  
      return activities;
    }
  
    private async getProgressReports(request: ScheduleReportRequest): Promise<any[]> {
      const filters: any = { scheduleId: request.scheduleId };
      
      if (request.startDate) {
        filters.startDate = request.startDate;
      }
      if (request.endDate) {
        filters.endDate = request.endDate;
      }
  
      return await this.progressRepository.findByFilters(filters);
    }
  
    private async generateReportData(
      request: ScheduleReportRequest,
      schedule: any,
      activities: any[],
      progressReports: any[]
    ): Promise<any> {
      switch (request.reportType) {
        case 'executive':
          return this.generateExecutiveReport(schedule, activities, progressReports);
        case 'detailed':
          return this.generateDetailedReport(schedule, activities, progressReports);
        case 'variance':
          return this.generateVarianceReport(schedule, activities, progressReports);
        case 'performance':
          return this.generatePerformanceReport(schedule, activities, progressReports);
        case 'resource_utilization':
          return this.generateResourceUtilizationReport(schedule, activities, progressReports);
        default:
          return this.generateCustomReport(request, schedule, activities, progressReports);
      }
    }
  
    private generateExecutiveReport(schedule: any, activities: any[], progressReports: any[]): any {
      return {
        projectOverview: {
          name: schedule.name,
          status: schedule.status,
          plannedStartDate: schedule.plannedStartDate,
          plannedEndDate: schedule.plannedEndDate,
          totalBudget: schedule.totalBudget
        },
        progressSummary: {
          overallProgress: this.calculateOverallProgress(activities),
          completedActivities: activities.filter(a => a.status === 'COMPLETED').length,
          totalActivities: activities.length,
          onTimeActivities: activities.filter(a => this.isOnTime(a)).length
        },
        financialSummary: {
          plannedValue: activities.reduce((sum, a) => sum + a.plannedTotalCost, 0),
          earnedValue: activities.reduce((sum, a) => sum + a.earnedValue, 0),
          actualCost: activities.reduce((sum, a) => sum + a.actualTotalCost, 0),
          costPerformanceIndex: this.calculateProjectCPI(activities),
          schedulePerformanceIndex: this.calculateProjectSPI(activities)
        },
        keyMilestones: this.identifyKeyMilestones(activities),
        riskAreas: this.identifyRiskAreas(activities, progressReports),
        nextPeriodFocus: this.getNextPeriodFocus(activities)
      };
    }
  
    private generateDetailedReport(schedule: any, activities: any[], progressReports: any[]): any {
      return {
        scheduleDetails: schedule,
        activitiesBreakdown: activities.map(activity => ({
          ...activity,
          variance: this.calculateActivityVariance(activity),
          performanceMetrics: this.calculateActivityPerformance(activity),
          recentProgress: progressReports.filter(p => p.activityId === activity.id).slice(-5)
        })),
        resourceAllocation: this.analyzeResourceAllocation(activities),
        qualityMetrics: this.analyzeQualityMetrics(progressReports),
        safetyMetrics: this.analyzeSafetyMetrics(progressReports),
        weatherImpact: this.analyzeWeatherImpact(progressReports)
      };
    }
  
    private generateVarianceReport(schedule: any, activities: any[], progressReports: any[]): any {
      const varianceAnalysis = activities.map(activity => ({
        activityId: activity.id,
        activityName: activity.name,
        scheduleVariance: this.calculateScheduleVariance(activity),
        costVariance: this.calculateCostVariance(activity),
        durationVariance: activity.actualDurationDays - activity.plannedDurationDays,
        performanceIndex: {
          schedule: activity.schedulePerformanceIndex,
          cost: activity.costPerformanceIndex
        },
        rootCauses: this.identifyVarianceCauses(activity, progressReports),
        correctionActions: this.suggestCorrections(activity)
      }));
  
      return {
        overallVariance: {
          schedule: this.calculateProjectScheduleVariance(activities),
          cost: this.calculateProjectCostVariance(activities)
        },
        activitiesWithVariance: varianceAnalysis.filter(a => 
          Math.abs(a.scheduleVariance) > 5 || Math.abs(a.costVariance) > 10
        ),
        trendAnalysis: this.analyzeVarianceTrends(varianceAnalysis, progressReports),
        forecastImpact: this.forecastVarianceImpact(activities, varianceAnalysis)
      };
    }
  
    private generatePerformanceReport(schedule: any, activities: any[], progressReports: any[]): any {
      return {
        productivityAnalysis: this.analyzeProductivity(activities, progressReports),
        resourceEfficiency: this.analyzeResourceEfficiency(activities, progressReports),
        qualityPerformance: this.analyzeQualityPerformance(progressReports),
        safetyPerformance: this.analyzeSafetyPerformance(progressReports),
        benchmarking: this.performBenchmarking(activities, progressReports),
        improvementOpportunities: this.identifyImprovements(activities, progressReports)
      };
    }
  
    private generateResourceUtilizationReport(schedule: any, activities: any[], progressReports: any[]): any {
      return {
        workforceUtilization: this.analyzeWorkforceUtilization(activities, progressReports),
        equipmentUtilization: this.analyzeEquipmentUtilization(activities, progressReports),
        resourceConflicts: this.identifyResourceConflicts(activities),
        optimizationOpportunities: this.identifyOptimizationOpportunities(activities),
        costAnalysis: this.analyzeResourceCosts(activities, progressReports)
      };
    }
  
    private generateCustomReport(request: ScheduleReportRequest, schedule: any, activities: any[], progressReports: any[]): any {
      // Implementar generación de reportes personalizados
      return {
        customData: 'Pending implementation based on specific requirements'
      };
    }
  
    private calculateSummaryMetrics(activities: any[], progressReports: any[]): any {
      const completedActivities = activities.filter(a => a.status === 'COMPLETED').length;
      const delayedActivities = activities.filter(a => this.isDelayed(a)).length;
      const overallProgress = this.calculateOverallProgress(activities);
      
      return {
        totalActivities: activities.length,
        completedActivities,
        delayedActivities,
        overallProgress,
        scheduleVariance: this.calculateProjectScheduleVariance(activities),
        costVariance: this.calculateProjectCostVariance(activities)
      };
    }
  
    private generateCharts(activities: any[], progressReports: any[]): any[] {
      return [
        {
          type: 'progress_timeline',
          data: this.generateProgressTimelineData(activities, progressReports)
        },
        {
          type: 'cost_variance',
          data: this.generateCostVarianceData(activities)
        },
        {
          type: 'resource_utilization',
          data: this.generateResourceUtilizationData(activities, progressReports)
        },
        {
          type: 'schedule_performance',
          data: this.generateSchedulePerformanceData(activities)
        }
      ];
    }
  
    // Helper methods implementations
    private calculateActivityVariance(activity: any): number {
      // Implementation for activity variance calculation
      return 0;
    }
  
    private calculateOverallProgress(activities: any[]): number {
      if (activities.length === 0) return 0;
      return activities.reduce((sum, a) => sum + a.progressPercentage, 0) / activities.length;
    }
  
    private isOnTime(activity: any): boolean {
      // Implementation to check if activity is on time
      return true;
    }
  
    private isDelayed(activity: any): boolean {
      // Implementation to check if activity is delayed
      return false;
    }
  
    private calculateProjectCPI(activities: any[]): number {
      const totalEV = activities.reduce((sum, a) => sum + a.earnedValue, 0);
      const totalAC = activities.reduce((sum, a) => sum + a.actualTotalCost, 0);
      return totalAC > 0 ? totalEV / totalAC : 1;
    }
  
    private calculateProjectSPI(activities: any[]): number {
      const totalEV = activities.reduce((sum, a) => sum + a.earnedValue, 0);
      const totalPV = activities.reduce((sum, a) => sum + a.plannedTotalCost, 0);
      return totalPV > 0 ? totalEV / totalPV : 1;
    }
  
    private identifyKeyMilestones(activities: any[]): any[] {
      return activities.filter(a => a.isCriticalPath || a.priority === 'HIGH')
                      .map(a => ({
                        name: a.name,
                        plannedDate: a.plannedEndDate,
                        actualDate: a.actualEndDate,
                        status: a.status
                      }));
    }
  
    private identifyRiskAreas(activities: any[], progressReports: any[]): string[] {
      const risks = [];
      
      // Identify delayed activities
      const delayedCount = activities.filter(a => this.isDelayed(a)).length;
      if (delayedCount > activities.length * 0.2) {
        risks.push('Alto número de actividades retrasadas');
      }
      
      // Identify quality issues
      const qualityIssues = progressReports.filter(p => p.qualityScore < 80).length;
      if (qualityIssues > 0) {
        risks.push('Problemas de calidad detectados');
      }
      
      return risks;
    }
  
    private getNextPeriodFocus(activities: any[]): string[] {
      return activities
        .filter(a => a.status === 'IN_PROGRESS' || a.status === 'NOT_STARTED')
        .slice(0, 5)
        .map(a => a.name);
    }
  
    // Additional helper methods would be implemented here...
    private analyzeResourceAllocation(activities: any[]): any { return {}; }
    private analyzeQualityMetrics(progressReports: any[]): any { return {}; }
    private analyzeSafetyMetrics(progressReports: any[]): any { return {}; }
    private analyzeWeatherImpact(progressReports: any[]): any { return {}; }
    private calculateScheduleVariance(activity: any): number { return 0; }
    private calculateCostVariance(activity: any): number { return 0; }
    private calculateActivityPerformance(activity: any): any { return {}; }
    private identifyVarianceCauses(activity: any, progressReports: any[]): string[] { return []; }
    private suggestCorrections(activity: any): string[] { return []; }
    private calculateProjectScheduleVariance(activities: any[]): number { return 0; }
    private calculateProjectCostVariance(activities: any[]): number { return 0; }
    private analyzeVarianceTrends(varianceAnalysis: any[], progressReports: any[]): any { return {}; }
    private forecastVarianceImpact(activities: any[], varianceAnalysis: any[]): any { return {}; }
    private analyzeProductivity(activities: any[], progressReports: any[]): any { return {}; }
    private analyzeResourceEfficiency(activities: any[], progressReports: any[]): any { return {}; }
    private analyzeQualityPerformance(progressReports: any[]): any { return {}; }
    private analyzeSafetyPerformance(progressReports: any[]): any { return {}; }
    private performBenchmarking(activities: any[], progressReports: any[]): any { return {}; }
    private identifyImprovements(activities: any[], progressReports: any[]): string[] { return []; }
    private analyzeWorkforceUtilization(activities: any[], progressReports: any[]): any { return {}; }
    private analyzeEquipmentUtilization(activities: any[], progressReports: any[]): any { return {}; }
    private identifyResourceConflicts(activities: any[]): any[] { return []; }
    private identifyOptimizationOpportunities(activities: any[]): string[] { return []; }
    private analyzeResourceCosts(activities: any[], progressReports: any[]): any { return {}; }
  
    private generateProgressTimelineData(activities: any[], progressReports: any[]): any { return {}; }
    private generateCostVarianceData(activities: any[]): any { return {}; }
    private generateResourceUtilizationData(activities: any[], progressReports: any[]): any { return {}; }
    private generateSchedulePerformanceData(activities: any[]): any { return {}; }
  
    private generateReportRecommendations(activities: any[], progressReports: any[], summary: any): string[] {
      const recommendations = [];
      
      if (summary.scheduleVariance < -10) {
        recommendations.push('Implementar medidas urgentes para recuperar cronograma');
      }
      
      if (summary.costVariance > 15) {
        recommendations.push('Revisar control de costos y optimizar recursos');
      }
      
      if (summary.delayedActivities > summary.totalActivities * 0.2) {
        recommendations.push('Reevaluar asignación de recursos y dependencias');
      }
      
      return recommendations;
    }
  
    private async generateOutputFile(request: ScheduleReportRequest, reportData: any, summary: any, charts?: any[]): Promise<string> {
      // Implementation would generate the actual file based on outputFormat
      // For now, return a placeholder URL
      return `https://example.com/reports/${this.generateReportId()}.${request.outputFormat}`;
    }
  
    private async sendReportByEmail(request: ScheduleReportRequest, downloadUrl: string): Promise<void> {
      // Implementation would send email with report attached or link
      console.log(`Sending report to: ${request.recipientEmails?.join(', ')}`);
    }
  
    private generateReportId(): string {
      return `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
  