// src/infrastructure/webserver/controllers/ResourceManagementController.ts
import { Request, Response } from 'express';
import { ScheduleActivityRepository } from '../../../domain/repositories/ScheduleActivityRepository';
import { CalculationScheduleRepository } from '../../../domain/repositories/CalculationScheduleRepository'; // AGREGADO
import { ResourceAssignmentRepository } from '../../../domain/repositories/ResourceAssignmentRepository';
import { WorkforceRepository } from '../../../domain/repositories/WorkforceRepository';
import { EquipmentRepository } from '../../../domain/repositories/EquipmentRepository';
import { ResourceOptimizationService } from '../../../domain/services/ResourceOptimizationService';

export class ResourceManagementController {
  constructor(
    private activityRepository: ScheduleActivityRepository,
    private scheduleRepository: CalculationScheduleRepository, // AGREGADO
    private resourceAssignmentRepository: ResourceAssignmentRepository,
    private workforceRepository: WorkforceRepository,
    private equipmentRepository: EquipmentRepository,
    private resourceOptimizationService: ResourceOptimizationService
  ) {}

  // GET /api/resource-management/schedules/:scheduleId/resources
  async getScheduleResources(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { includeAvailability = 'false', date } = req.query;

      const activities = await this.activityRepository.findByScheduleId(scheduleId);
      const assignments = await this.resourceAssignmentRepository.findByScheduleId(scheduleId);

      const resourceSummary = {
        workforce: await this.getWorkforceSummary(assignments),
        equipment: await this.getEquipmentSummary(assignments),
        assignments: assignments,
        conflicts: await this.identifyResourceConflicts(scheduleId),
        utilization: await this.calculateResourceUtilization(scheduleId, date as string)
      };

      if (includeAvailability === 'true') {
        resourceSummary['availability'] = await this.getResourceAvailabilityForSchedule(scheduleId, date as string);
      }

      res.json({
        success: true,
        data: resourceSummary
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching schedule resources',
        error: (error as Error).message
      });
    }
  }

  // POST /api/resource-management/assignments
  async createResourceAssignment(req: Request, res: Response): Promise<void> {
    try {
      const assignmentData = req.body;
      
      // Validar disponibilidad del recurso
      const conflictCheck = await this.checkResourceConflicts(assignmentData);
      if (conflictCheck.hasConflicts) {
        res.status(409).json({
          success: false,
          message: 'Resource conflict detected',
          conflicts: conflictCheck.conflicts
        });
        return;
      }

      const newAssignment = await this.resourceAssignmentRepository.save(assignmentData);

      res.status(201).json({
        success: true,
        message: 'Resource assignment created successfully',
        data: newAssignment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error creating resource assignment',
        error: (error as Error).message
      });
    }
  }

  // PUT /api/resource-management/assignments/:assignmentId
  async updateResourceAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const updateData = req.body;

      const existingAssignment = await this.resourceAssignmentRepository.findById(assignmentId);
      if (!existingAssignment) {
        res.status(404).json({
          success: false,
          message: 'Resource assignment not found'
        });
        return;
      }

      // Validar conflictos con la nueva configuración
      const conflictCheck = await this.checkResourceConflicts({
        ...existingAssignment,
        ...updateData
      });

      if (conflictCheck.hasConflicts) {
        res.status(409).json({
          success: false,
          message: 'Resource conflict detected',
          conflicts: conflictCheck.conflicts
        });
        return;
      }

      const updatedAssignment = await this.resourceAssignmentRepository.save({
        ...existingAssignment,
        ...updateData,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Resource assignment updated successfully',
        data: updatedAssignment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error updating resource assignment',
        error: (error as Error).message
      });
    }
  }

  // DELETE /api/resource-management/assignments/:assignmentId
  async deleteResourceAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;

      const assignment = await this.resourceAssignmentRepository.findById(assignmentId);
      if (!assignment) {
        res.status(404).json({
          success: false,
          message: 'Resource assignment not found'
        });
        return;
      }

      await this.resourceAssignmentRepository.delete(assignmentId);

      res.json({
        success: true,
        message: 'Resource assignment deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting resource assignment',
        error: (error as Error).message
      });
    }
  }

  // GET /api/resource-management/conflicts/:scheduleId
  async getResourceConflicts(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { includeResolution = 'false' } = req.query;

      const conflicts = await this.identifyResourceConflicts(scheduleId);
      
      const result: any = { conflicts };

      if (includeResolution === 'true') {
        result.resolutions = await this.generateConflictResolutions(conflicts);
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error identifying resource conflicts',
        error: (error as Error).message
      });
    }
  }

  // POST /api/resource-management/conflicts/:conflictId/resolve
  async resolveResourceConflict(req: Request, res: Response): Promise<void> {
    try {
      const { conflictId } = req.params;
      const { resolutionStrategy, parameters } = req.body;

      const resolution = await this.applyConflictResolution(conflictId, resolutionStrategy, parameters);

      res.json({
        success: true,
        message: 'Resource conflict resolved successfully',
        data: resolution
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error resolving resource conflict',
        error: (error as Error).message
      });
    }
  }

  // POST /api/resource-management/schedules/:scheduleId/optimize
  async optimizeResources(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { optimizationGoals, constraints } = req.body;

      // Obtener cronograma y actividades
      const schedule = await this.scheduleRepository.findById(scheduleId);
      const activities = await this.activityRepository.findByScheduleId(scheduleId);

      if (!schedule || !activities) {
        res.status(404).json({
          success: false,
          message: 'Schedule or activities not found'
        });
        return;
      }

      // CORREGIDO: Proporcionar argumentos para los métodos
      const dateRange = { 
        start: new Date(), 
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 días desde ahora
      };

      // Crear opciones de optimización
      const optimizationOptions = {
        objectiveFunction: optimizationGoals?.primary || 'maximize_efficiency',
        constraints: {
          maxBudget: constraints?.maxBudget,
          maxProjectDuration: constraints?.maxDuration,
          availableWorkforce: await this.workforceRepository.findAvailable(dateRange), // CORREGIDO: Proporcionar dateRange
          availableEquipment: await this.equipmentRepository.findAvailable(dateRange), // CORREGIDO: Proporcionar dateRange
          workingHours: constraints?.workingHours || {
            dailyHours: 8,
            weeklyHours: 48,
            overtimeAllowed: false,
            maxOvertimeHours: 0
          },
          qualityRequirements: constraints?.qualityRequirements || {
            minimumSkillLevel: 'intermediate',
            inspectionRequired: true,
            certificationRequired: false
          }
        },
        preferences: constraints?.preferences || {
          prioritizeLocalResources: true,
          allowSubcontracting: false,
          preferExperiencedWorkers: true,
          minimizeResourceTransitions: true
        }
      };

      const optimizationResult = await this.resourceOptimizationService.optimizeResourceAllocation(
        schedule,
        activities,
        optimizationOptions
      );

      res.json({
        success: true,
        message: 'Resource optimization completed',
        data: optimizationResult
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error optimizing resources',
        error: (error as Error).message
      });
    }
  }

  // GET /api/resource-management/availability
  async getResourceAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { 
        startDate, 
        endDate, 
        resourceType,
        location 
      } = req.query;

      const filters: any = {};
      if (startDate && endDate) {
        filters.dateRange = { start: new Date(startDate as string), end: new Date(endDate as string) };
      }
      if (resourceType) filters.resourceType = resourceType;
      if (location) filters.location = location;

      const availability = await this.calculateResourceAvailabilityWithFilters(filters);

      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error calculating resource availability',
        error: (error as Error).message
      });
    }
  }

  // GET /api/resource-management/utilization/:scheduleId
  async getResourceUtilization(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { 
        period = '30d',
        groupBy = 'resource',
        includeForecasting = 'false'
      } = req.query;

      const utilization = await this.calculateResourceUtilization(scheduleId, period as string);
      const result: any = { utilization };

      if (groupBy === 'time') {
        result.timeBreakdown = await this.getUtilizationByTime(scheduleId, period as string);
      }

      if (includeForecasting === 'true') {
        result.forecast = await this.forecastResourceUtilization(scheduleId);
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error calculating resource utilization',
        error: (error as Error).message
      });
    }
  }

  // POST /api/resource-management/schedules/:scheduleId/rebalance
  async rebalanceResources(req: Request, res: Response): Promise<void> {
    try {
      const { scheduleId } = req.params;
      const { strategy = 'automated', priorities } = req.body;

      const rebalanceResult = await this.executeResourceRebalancing(scheduleId, strategy, priorities);

      res.json({
        success: true,
        message: 'Resource rebalancing completed',
        data: rebalanceResult
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Error rebalancing resources',
        error: (error as Error).message
      });
    }
  }

  // Private helper methods
  private async getWorkforceSummary(assignments: any[]): Promise<any> {
    const workforceAssignments = assignments.filter(a => a.resourceType === 'WORKFORCE');
    const summary = {
      totalAssignments: workforceAssignments.length,
      byTrade: new Map<string, number>(),
      totalCost: 0
    };

    for (const assignment of workforceAssignments) {
      const trade = assignment.getResourceDetails?.()?.trade || 'unknown';
      summary.byTrade.set(trade, (summary.byTrade.get(trade) || 0) + assignment.quantity);
      summary.totalCost += assignment.totalCost || 0;
    }

    return {
      ...summary,
      byTrade: Object.fromEntries(summary.byTrade)
    };
  }

  private async getEquipmentSummary(assignments: any[]): Promise<any> {
    const equipmentAssignments = assignments.filter(a => a.resourceType === 'EQUIPMENT');
    const summary = {
      totalAssignments: equipmentAssignments.length,
      byType: new Map<string, number>(),
      totalCost: 0
    };

    for (const assignment of equipmentAssignments) {
      const type = assignment.getResourceDetails?.()?.equipmentType || 'unknown';
      summary.byType.set(type, (summary.byType.get(type) || 0) + assignment.quantity);
      summary.totalCost += assignment.totalCost || 0;
    }

    return {
      ...summary,
      byType: Object.fromEntries(summary.byType)
    };
  }

  private async identifyResourceConflicts(scheduleId: string): Promise<any[]> {
    const assignments = await this.resourceAssignmentRepository.findByScheduleId(scheduleId);
    const conflicts = [];

    // Group by resource and check for overlapping time periods
    const resourceGroups = new Map<string, any[]>();
    
    for (const assignment of assignments) {
      const resourceKey = `${assignment.resourceType}_${assignment.resourceId}`;
      if (!resourceGroups.has(resourceKey)) {
        resourceGroups.set(resourceKey, []);
      }
      resourceGroups.get(resourceKey)!.push(assignment);
    }

    for (const [resourceKey, resourceAssignments] of resourceGroups) {
      for (let i = 0; i < resourceAssignments.length; i++) {
        for (let j = i + 1; j < resourceAssignments.length; j++) {
          const conflict = this.checkAssignmentOverlap(resourceAssignments[i], resourceAssignments[j]);
          if (conflict) {
            conflicts.push({
              id: `${resourceAssignments[i].id}_${resourceAssignments[j].id}`,
              resourceKey,
              conflictingAssignments: [resourceAssignments[i].id, resourceAssignments[j].id],
              overlapPeriod: conflict.overlapPeriod,
              severity: conflict.severity
            });
          }
        }
      }
    }

    return conflicts;
  }

  private checkAssignmentOverlap(assignment1: any, assignment2: any): any | null {
    const start1 = new Date(assignment1.startDate);
    const end1 = new Date(assignment1.endDate);
    const start2 = new Date(assignment2.startDate);
    const end2 = new Date(assignment2.endDate);

    // Check for overlap
    if (start1 < end2 && start2 < end1) {
      const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
      const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
      const overlapDays = (overlapEnd.getTime() - overlapStart.getTime()) / (24 * 60 * 60 * 1000);

      return {
        overlapPeriod: { start: overlapStart, end: overlapEnd },
        severity: overlapDays > 5 ? 'high' : overlapDays > 2 ? 'medium' : 'low'
      };
    }

    return null;
  }

  private async checkResourceConflicts(assignmentData: any): Promise<any> {
    const existingAssignments = await this.resourceAssignmentRepository.findByResource(
      assignmentData.resourceId,
      assignmentData.resourceType
    );

    const conflicts = [];
    for (const existing of existingAssignments) {
      if (existing.id !== assignmentData.id) { // Skip self when updating
        const conflict = this.checkAssignmentOverlap(assignmentData, existing);
        if (conflict) {
          conflicts.push({
            existingAssignmentId: existing.id,
            conflictDetails: conflict
          });
        }
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  private async calculateResourceUtilization(scheduleId: string, period?: string): Promise<any> {
    const assignments = await this.resourceAssignmentRepository.findByScheduleId(scheduleId);
    
    // Calculate utilization metrics
    const utilization = {
      workforce: this.calculateWorkforceUtilization(assignments),
      equipment: this.calculateEquipmentUtilization(assignments),
      overall: 0
    };

    utilization.overall = (utilization.workforce + utilization.equipment) / 2;

    return utilization;
  }

  private calculateWorkforceUtilization(assignments: any[]): number {
    const workforceAssignments = assignments.filter(a => a.resourceType === 'WORKFORCE');
    if (workforceAssignments.length === 0) return 0;

    // Simplified calculation - in reality would be more complex
    const totalAssignedHours = workforceAssignments.reduce((sum, a) => sum + (a.plannedHours || 0), 0);
    const totalAvailableHours = workforceAssignments.reduce((sum, a) => sum + (a.plannedHours || 0), 0);

    return totalAvailableHours > 0 ? (totalAssignedHours / totalAvailableHours) * 100 : 0;
  }

  private calculateEquipmentUtilization(assignments: any[]): number {
    const equipmentAssignments = assignments.filter(a => a.resourceType === 'EQUIPMENT');
    if (equipmentAssignments.length === 0) return 0;

    // Simplified calculation
    return 75; // Placeholder
  }

  // CORREGIDO: Renombrado para evitar duplicación
  private async getResourceAvailabilityForSchedule(scheduleId: string, date?: string): Promise<any> {
    // This would integrate with workforce and equipment repositories
    return {
      workforce: await this.getWorkforceAvailability(date),
      equipment: await this.getEquipmentAvailability(date)
    };
  }

  private async getWorkforceAvailability(date?: string): Promise<any> {
    // Simplified implementation
    return {
      totalAvailable: 50,
      assigned: 35,
      free: 15,
      byTrade: {
        masonry: 10,
        electrical: 8,
        plumbing: 6,
        general: 26
      }
    };
  }

  private async getEquipmentAvailability(date?: string): Promise<any> {
    // Simplified implementation
    return {
      totalAvailable: 20,
      assigned: 15,
      free: 5,
      byType: {
        excavator: 3,
        crane: 2,
        truck: 8,
        mixer: 4,
        other: 3
      }
    };
  }

  private async generateConflictResolutions(conflicts: any[]): Promise<any[]> {
    return conflicts.map(conflict => ({
      conflictId: conflict.id,
      strategies: [
        {
          name: 'reschedule_activity',
          description: 'Reprogramar una de las actividades conflictivas',
          impact: 'medium',
          feasibility: 'high'
        },
        {
          name: 'split_resource',
          description: 'Dividir el recurso entre las actividades',
          impact: 'low',
          feasibility: 'medium'
        },
        {
          name: 'substitute_resource',
          description: 'Usar un recurso alternativo',
          impact: 'low',
          feasibility: 'depends_on_availability'
        }
      ]
    }));
  }

  private async applyConflictResolution(conflictId: string, strategy: string, parameters: any): Promise<any> {
    // Implementation would depend on the strategy
    return {
      conflictId,
      strategy,
      applied: true,
      changes: [],
      timestamp: new Date()
    };
  }

  // CORREGIDO: Renombrado para evitar duplicación
  private async calculateResourceAvailabilityWithFilters(filters: any): Promise<any> {
    // Implementation would calculate availability based on filters
    return {
      workforce: {},
      equipment: {},
      summary: {}
    };
  }

  private async getUtilizationByTime(scheduleId: string, period: string): Promise<any> {
    // Implementation would break down utilization by time periods
    return {};
  }

  private async forecastResourceUtilization(scheduleId: string): Promise<any> {
    // Implementation would forecast future utilization
    return {};
  }

  private async executeResourceRebalancing(scheduleId: string, strategy: string, priorities: any): Promise<any> {
    // Implementation would rebalance resources according to strategy
    return {
      strategy,
      changesMade: [],
      improvementMetrics: {},
      timestamp: new Date()
    };
  }
}