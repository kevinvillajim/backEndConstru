// src/infrastructure/webserver/controllers/CalculationScheduleController.ts
import { Request, Response } from 'express';
import { GenerateScheduleFromBudgetUseCase } from '../../../application/schedule/GenerateScheduleFromBudgetUseCase';
import { OptimizeProjectScheduleUseCase } from '../../../application/schedule/OptimizeProjectScheduleUseCase';
import { TrackDailyProgressUseCase } from '../../../application/schedule/TrackDailyProgressUseCase';
import { PredictProjectDelaysScheduleUseCase } from '../../../application/schedule/PredictProjectDelaysScheduleUseCase';
import { BudgetScheduleIntegrationService } from '../../../domain/services/BudgetScheduleIntegrationService';
import { CalculationScheduleService } from '../../../domain/services/CalculationScheduleService';
import { CalculationScheduleRepository } from '../../../domain/repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../../../domain/repositories/ScheduleActivityRepository';
import { ScheduleTemplateRepository } from '../../../domain/repositories/ScheduleTemplateRepository';
import { ActivityStatus } from '../../../domain/models/calculation/ScheduleActivity';

export class CalculationScheduleController {
  constructor(
    private generateScheduleUseCase: GenerateScheduleFromBudgetUseCase,
    private optimizeScheduleUseCase: OptimizeProjectScheduleUseCase,
    private trackProgressUseCase: TrackDailyProgressUseCase,
    private predictDelaysUseCase: PredictProjectDelaysScheduleUseCase,
    private budgetScheduleService: BudgetScheduleIntegrationService,
    private calculationScheduleService: CalculationScheduleService,
    private scheduleRepository: CalculationScheduleRepository,
    private activityRepository: ScheduleActivityRepository,
    private templateRepository: ScheduleTemplateRepository
  ) {}

  // GET /api/calculation-schedules
  async getSchedules(req: Request, res: Response): Promise<void> {
    try {
      const {
        projectId,
        status,
        constructionType,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters: any = {};
      if (projectId) filters.projectId = projectId;
      if (status) filters.status = status;
      if (constructionType) filters.constructionType = constructionType;

      const schedules = await this.scheduleRepository.findByFilters(filters, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.json({
        success: true,
        data: schedules,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: schedules.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching schedules',
        error: error.message
      });
    }
  }

  // POST /api/calculation-schedules
  async createSchedule(req: Request, res: Response): Promise<void> {
    try {
      const scheduleData = req.body;
      const newSchedule = await this.scheduleRepository.save(scheduleData);

      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: newSchedule
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creating schedule',
        error: error.message
      });
    }
  }

  // GET /api/calculation-schedules/:scheduleId
  async getScheduleById(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { includeActivities = 'true', includeProgress = 'false' } = req.query;

      const schedule = await this.scheduleRepository.findById(scheduleId);
      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
        return;
      }

      const result: any = { schedule };

      if (includeActivities === 'true') {
        result.activities = await this.activityRepository.findByScheduleId(scheduleId);
      }

      if (includeProgress === 'true') {
        result.progressSummary = await this.calculateScheduleProgress(scheduleId);
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching schedule',
        error: error.message
      });
    }
  }

  // PUT /api/calculation-schedules/:scheduleId
  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const updateData = req.body;

      const existingSchedule = await this.scheduleRepository.findById(scheduleId);
      if (!existingSchedule) {
        res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
        return;
      }

      const updatedSchedule = await this.scheduleRepository.save({
        ...existingSchedule,
        ...updateData,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Schedule updated successfully',
        data: updatedSchedule
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error updating schedule',
        error: error.message
      });
    }
  }

  // DELETE /api/calculation-schedules/:scheduleId
  async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;

      const schedule = await this.scheduleRepository.findById(scheduleId);
      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
        return;
      }

      // Soft delete
      await this.scheduleRepository.save({
        ...schedule,
        isActive: false,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Schedule deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting schedule',
        error: error.message
      });
    }
  }

  // POST /api/calculation-schedules/generate-from-budget
  async generateFromBudget(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body;
      const result = await this.generateScheduleUseCase.execute(request);

      res.status(201).json({
        success: true,
        message: 'Schedule generated from budget successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error generating schedule from budget',
        error: error.message
      });
    }
  }

  // POST /api/calculation-schedules/generate-from-calculation
  async generateFromCalculation(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body;
      const result = await this.calculationScheduleService.generateScheduleFromCalculation(request);

      res.status(201).json({
        success: true,
        message: 'Schedule generated from calculation successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error generating schedule from calculation',
        error: error.message
      });
    }
  }

  // POST /api/calculation-schedules/:scheduleId/optimize
  async optimizeSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const optimizationRequest = {
        scheduleId,
        ...req.body
      };

      const result = await this.optimizeScheduleUseCase.execute(optimizationRequest);

      res.json({
        success: true,
        message: 'Schedule optimization completed',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error optimizing schedule',
        error: error.message
      });
    }
  }

  // POST /api/calculation-schedules/:scheduleId/progress-report
  async submitProgressReport(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const progressRequest = {
        scheduleId,
        reportedBy: req.user?.id || 'anonymous',
        ...req.body
      };

      const result = await this.trackProgressUseCase.execute(progressRequest);

      res.status(201).json({
        success: true,
        message: 'Progress report submitted successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error submitting progress report',
        error: error.message
      });
    }
  }

  // GET /api/calculation-schedules/:scheduleId/delay-prediction
  async predictDelays(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const {
        predictionHorizon = 'medium',
        confidenceLevel = 0.9,
        scenarioAnalysis = false
      } = req.query;

      const predictionRequest = {
        scheduleId,
        predictionHorizon: predictionHorizon as 'short' | 'medium' | 'long',
        includeFactors: {
          weather: true,
          productivity: true,
          resources: true,
          dependencies: true,
          qualityIssues: true,
          externalFactors: true
        },
        confidenceLevel: Number(confidenceLevel) as 0.8 | 0.9 | 0.95,
        scenarioAnalysis: scenarioAnalysis === 'true'
      };

      const result = await this.predictDelaysUseCase.execute(predictionRequest);

      res.json({
        success: true,
        message: 'Delay prediction completed',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error predicting delays',
        error: error.message
      });
    }
  }

  // POST /api/calculation-schedules/:scheduleId/sync-with-budget
  async syncWithBudget(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { budgetId, syncOptions } = req.body;

      const syncRequest = {
        budgetId,
        scheduleId,
        syncDirection: 'bidirectional',
        syncOptions: {
          syncCosts: true,
          syncQuantities: true,
          syncTimelines: true,
          syncResources: true,
          createMissingItems: false,
          preserveCustomizations: true,
          ...syncOptions
        },
        conflictResolution: 'manual_review'
      };

      const result = await this.budgetScheduleService.synchronizeBudgetAndSchedule(syncRequest);

      res.json({
        success: true,
        message: 'Schedule synchronized with budget',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error synchronizing with budget',
        error: error.message
      });
    }
  }

  // GET /api/calculation-schedules/:scheduleId/activities
  async getScheduleActivities(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const {
        status,
        activityType,
        isCriticalPath,
        includeProgress = 'false'
      } = req.query;

      let activities = await this.activityRepository.findByScheduleId(scheduleId);

      // Apply filters
      if (status) {
        activities = activities.filter(a => a.status === status);
      }
      if (activityType) {
        activities = activities.filter(a => a.activityType === activityType);
      }
      if (isCriticalPath !== undefined) {
        activities = activities.filter(a => a.isCriticalPath === (isCriticalPath === 'true'));
      }

      const result = {
        activities,
        summary: {
          total: activities.length,
          completed: activities.filter(a => a.status === 'COMPLETED').length,
          inProgress: activities.filter(a => a.status === 'IN_PROGRESS').length,
          notStarted: activities.filter(a => a.status === 'NOT_STARTED').length,
          criticalPath: activities.filter(a => a.isCriticalPath).length
        }
      };

      if (includeProgress === 'true') {
        result['progressSummary'] = this.calculateActivitiesProgress(activities);
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching schedule activities',
        error: error.message
      });
    }
  }

  // PUT /api/calculation-schedules/:scheduleId/status
  async updateScheduleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { status, notes } = req.body;

      const schedule = await this.scheduleRepository.findById(scheduleId);
      if (!schedule) {
        res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
        return;
      }

      // Validate status transition
      const validTransitions = this.getValidStatusTransitions(schedule.status);
      if (!validTransitions.includes(status)) {
        res.status(400).json({
          success: false,
          message: `Invalid status transition from ${schedule.status} to ${status}`
        });
        return;
      }

      const updatedSchedule = await this.scheduleRepository.save({
        ...schedule,
        status,
        customFields: {
          ...schedule.customFields,
          statusChangeNotes: notes,
          lastStatusChange: new Date()
        },
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Schedule status updated successfully',
        data: updatedSchedule
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error updating schedule status',
        error: error.message
      });
    }
  }

  // GET /api/calculation-schedules/templates
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const {
        constructionType,
        geographicalZone,
        scope,
        verified,
        trending
      } = req.query;

      const filters: any = {};
      if (constructionType) filters.constructionType = constructionType;
      if (geographicalZone) filters.geographicalZone = geographicalZone;
      if (scope) filters.scope = scope;
      if (verified !== undefined) filters.isVerified = verified === 'true';

      let templates = await this.templateRepository.findByFilters(filters);

      if (trending === 'true') {
        templates = templates.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 10);
      }

      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching schedule templates',
        error: error.message
      });
    }
  }

  // Private helper methods
  private async calculateScheduleProgress(scheduleId: string): Promise<any> {
    const activities = await this.activityRepository.findByScheduleId(scheduleId);
    
    if (activities.length === 0) {
      return {
        overallProgress: 0,
        completedActivities: 0,
        totalActivities: 0,
        estimatedCompletion: null
      };
    }

    const totalProgress = activities.reduce((sum, activity) => sum + activity.progressPercentage, 0);
    const overallProgress = totalProgress / activities.length;
    const completedActivities = activities.filter(a => a.status === 'COMPLETED').length;

    return {
      overallProgress: Math.round(overallProgress * 100) / 100,
      completedActivities,
      totalActivities: activities.length,
      criticalPathProgress: this.calculateCriticalPathProgress(activities),
      estimatedCompletion: this.estimateCompletionDate(activities)
    };
  }

  private calculateActivitiesProgress(activities: any[]): any {
    const totalPlannedCost = activities.reduce((sum, a) => sum + a.plannedTotalCost, 0);
    const totalEarnedValue = activities.reduce((sum, a) => sum + a.earnedValue, 0);
    const totalActualCost = activities.reduce((sum, a) => sum + a.actualTotalCost, 0);

    return {
      schedulePerformanceIndex: totalPlannedCost > 0 ? totalEarnedValue / totalPlannedCost : 1,
      costPerformanceIndex: totalActualCost > 0 ? totalEarnedValue / totalActualCost : 1,
      totalPlannedValue: totalPlannedCost,
      totalEarnedValue: totalEarnedValue,
      totalActualCost: totalActualCost,
      summary: {
        // Usar enum values para comparaciones correctas
        completed: activities.filter(a => a.status === ActivityStatus.COMPLETED).length,
        inProgress: activities.filter(a => a.status === ActivityStatus.IN_PROGRESS).length,
        notStarted: activities.filter(a => a.status === ActivityStatus.NOT_STARTED).length
      }
    };
  }

  private calculateCriticalPathProgress(activities: any[]): number {
    const criticalActivities = activities.filter(a => a.isCriticalPath);
    if (criticalActivities.length === 0) return 0;

    const totalProgress = criticalActivities.reduce((sum, a) => sum + a.progressPercentage, 0);
    return totalProgress / criticalActivities.length;
  }

  private estimateCompletionDate(activities: any[]): Date | null {
    const inProgressActivities = activities.filter(a => 
      a.status === 'IN_PROGRESS' && a.progressPercentage > 0
    );

    if (inProgressActivities.length === 0) return null;

    // Simplified estimation based on current progress rates
    const avgProgressRate = inProgressActivities.reduce((sum, a) => {
      const daysElapsed = Math.max(1, this.daysBetween(a.actualStartDate || a.plannedStartDate, new Date()));
      return sum + (a.progressPercentage / daysElapsed);
    }, 0) / inProgressActivities.length;

    const remainingWork = activities.reduce((sum, a) => sum + (100 - a.progressPercentage), 0);
    const estimatedDaysRemaining = remainingWork / avgProgressRate;

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Math.ceil(estimatedDaysRemaining));

    return completionDate;
  }

  private daysBetween(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private getValidStatusTransitions(currentStatus: string): string[] {
    const transitions = {
      'DRAFT': ['ACTIVE', 'CANCELLED'],
      'ACTIVE': ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
      'ON_HOLD': ['ACTIVE', 'CANCELLED'],
      'DELAYED': ['ACTIVE', 'ON_HOLD', 'CANCELLED'],
      'COMPLETED': [], // No transitions from completed
      'CANCELLED': [] // No transitions from cancelled
    };

    return transitions[currentStatus] || [];
  }
}