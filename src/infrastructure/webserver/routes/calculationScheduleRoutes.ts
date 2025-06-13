// src/infrastructure/webserver/routes/calculationScheduleRoutes.ts
import { Router } from 'express';
import { CalculationScheduleController } from '../controllers/CalculationScheduleController';
import { ScheduleAnalyticsController } from '../controllers/ScheduleAnalyticsController';
import { ResourceManagementController } from '../controllers/ResourceManagementController';
import { authenticate as authMiddleware } from '../middlewares/authMiddleware';
import { validateScheduleCreation, validateScheduleUpdate, validateProgressReport, validateOptimization } from '../validators/scheduleValidator';

export function createCalculationScheduleRoutes(
  scheduleController: CalculationScheduleController,
  analyticsController: ScheduleAnalyticsController,
  resourceController: ResourceManagementController
): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  // Basic CRUD operations
  router.get('/', scheduleController.getSchedules.bind(scheduleController));
  router.post('/', validateScheduleCreation, scheduleController.createSchedule.bind(scheduleController));
  router.get('/:scheduleId', scheduleController.getScheduleById.bind(scheduleController));
  router.put('/:scheduleId', validateScheduleUpdate, scheduleController.updateSchedule.bind(scheduleController));
  router.delete('/:scheduleId', scheduleController.deleteSchedule.bind(scheduleController));

  // Schedule generation
  router.post('/generate-from-budget', scheduleController.generateFromBudget.bind(scheduleController));
  router.post('/generate-from-calculation', scheduleController.generateFromCalculation.bind(scheduleController));

  // Schedule optimization
  router.post('/:scheduleId/optimize', validateOptimization, scheduleController.optimizeSchedule.bind(scheduleController));

  // Progress tracking
  router.post('/:scheduleId/progress-report', validateProgressReport, scheduleController.submitProgressReport.bind(scheduleController));
  router.get('/:scheduleId/activities', scheduleController.getScheduleActivities.bind(scheduleController));

  // Predictions and analytics
  router.get('/:scheduleId/delay-prediction', scheduleController.predictDelays.bind(scheduleController));

  // Budget synchronization
  router.post('/:scheduleId/sync-with-budget', scheduleController.syncWithBudget.bind(scheduleController));

  // Status management
  router.put('/:scheduleId/status', scheduleController.updateScheduleStatus.bind(scheduleController));

  // Templates
  router.get('/templates', scheduleController.getTemplates.bind(scheduleController));

  // Analytics routes
  router.get('/:scheduleId/analytics/dashboard', analyticsController.getScheduleDashboard.bind(analyticsController));
  router.get('/:scheduleId/analytics/performance', analyticsController.getPerformanceAnalytics.bind(analyticsController));
  router.get('/:scheduleId/analytics/variance', analyticsController.getVarianceAnalysis.bind(analyticsController));
  router.get('/:scheduleId/analytics/critical-path', analyticsController.getCriticalPathAnalysis.bind(analyticsController));
  router.get('/:scheduleId/analytics/kpis', analyticsController.getKPIs.bind(analyticsController));
  router.get('/:scheduleId/analytics/predictions', analyticsController.getPredictiveAnalytics.bind(analyticsController));
  router.post('/:scheduleId/analytics/reports', analyticsController.generateReport.bind(analyticsController));

  // Resource management routes
  router.get('/:scheduleId/resources', resourceController.getScheduleResources.bind(resourceController));
  router.post('/resource-assignments', resourceController.createResourceAssignment.bind(resourceController));
  router.put('/resource-assignments/:assignmentId', resourceController.updateResourceAssignment.bind(resourceController));
  router.delete('/resource-assignments/:assignmentId', resourceController.deleteResourceAssignment.bind(resourceController));
  router.get('/:scheduleId/resource-conflicts', resourceController.getResourceConflicts.bind(resourceController));
  router.post('/resource-conflicts/:conflictId/resolve', resourceController.resolveResourceConflict.bind(resourceController));
  router.post('/:scheduleId/optimize-resources', resourceController.optimizeResources.bind(resourceController));
  router.get('/resource-availability', resourceController.getResourceAvailability.bind(resourceController));
  router.get('/:scheduleId/resource-utilization', resourceController.getResourceUtilization.bind(resourceController));
  router.post('/:scheduleId/rebalance-resources', resourceController.rebalanceResources.bind(resourceController));

  return router;
}