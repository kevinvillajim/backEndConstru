// ===== CalculationScheduleRepository.ts (Domain Interface) =====
import { CalculationScheduleEntity, ScheduleStatus, ConstructionType, GeographicalZone } from '../models/calculation/CalculationSchedule';
import { PaginationOptions } from '../models/common/PaginationOptions';

export interface CalculationScheduleRepository {
  findById(id: string): Promise<CalculationScheduleEntity | null>;
  findByProjectId(projectId: string): Promise<CalculationScheduleEntity[]>;
  findByStatus(status: ScheduleStatus): Promise<CalculationScheduleEntity[]>;
  findByConstructionType(constructionType: ConstructionType, geographicalZone?: GeographicalZone): Promise<CalculationScheduleEntity[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<CalculationScheduleEntity[]>;
  findActiveSchedules(): Promise<CalculationScheduleEntity[]>;
  findDelayedSchedules(): Promise<CalculationScheduleEntity[]>;
  findSchedulesNeedingAttention(): Promise<CalculationScheduleEntity[]>;
  findWithBudgetIntegration(budgetId: string): Promise<CalculationScheduleEntity[]>;
  findOptimizedSchedules(): Promise<CalculationScheduleEntity[]>;
  findByGeographicalZone(zone: GeographicalZone): Promise<CalculationScheduleEntity[]>;
  findPaginated(options: PaginationOptions): Promise<{
    items: CalculationScheduleEntity[];
    total: number;
    page: number;
    limit: number;
  }>;
  getScheduleMetrics(scheduleId: string): Promise<any>;
  getCriticalPathActivities(scheduleId: string): Promise<any[]>;
  getResourceUtilization(scheduleId: string, dateRange?: { start: Date; end: Date }): Promise<any[]>;
  save(schedule: CalculationScheduleEntity): Promise<CalculationScheduleEntity>;
  delete(id: string): Promise<boolean>;
  updateProgress(scheduleId: string, progressData: {
    progressPercentage: number;
    actualSpentCost: number;
    notes?: string;
  }): Promise<boolean>;
}