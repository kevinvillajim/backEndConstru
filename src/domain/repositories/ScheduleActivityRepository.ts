// ===== ScheduleActivityRepository.ts (Domain Interface) =====
import { ScheduleActivityEntity, ActivityStatus, ConstructionTrade } from '../models/calculation/ScheduleActivity';

export interface ScheduleActivityRepository {
  findById(id: string): Promise<ScheduleActivityEntity | null>;
  findByScheduleId(scheduleId: string): Promise<ScheduleActivityEntity[]>;
  findCriticalPath(scheduleId: string): Promise<ScheduleActivityEntity[]>;
  findByStatus(status: ActivityStatus): Promise<ScheduleActivityEntity[]>;
  findByTrade(trade: ConstructionTrade): Promise<ScheduleActivityEntity[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<ScheduleActivityEntity[]>;
  findDelayedActivities(): Promise<ScheduleActivityEntity[]>;
  findActivitiesStartingToday(): Promise<ScheduleActivityEntity[]>;
  findResourceConflicts(dateRange: { start: Date; end: Date }): Promise<any[]>;
  getProductivityMetrics(scheduleId?: string, trade?: ConstructionTrade, dateRange?: { start: Date; end: Date }): Promise<any[]>;
  save(activity: ScheduleActivityEntity): Promise<ScheduleActivityEntity>;
  saveMany(activities: ScheduleActivityEntity[]): Promise<ScheduleActivityEntity[]>;
  updateProgress(activityId: string, progressData: {
    progressPercentage: number;
    actualCost?: number;
    notes?: string;
  }): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  recalculateCriticalPath(scheduleId: string): Promise<boolean>;
}