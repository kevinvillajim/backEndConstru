// ===== ProgressTrackingRepository.ts (Domain Interface) =====
import { ProgressTrackingEntity, ProgressReportType } from '../models/calculation/ProgressTracking';

export interface ProgressTrackingRepository {
  findByFilters(filters: any): any[] | PromiseLike<any[]>;
  findById(id: string): Promise<ProgressTrackingEntity | null>;
  findByScheduleId(scheduleId: string): Promise<ProgressTrackingEntity[]>;
  findByDateRange(scheduleId: string, startDate: Date, endDate: Date): Promise<ProgressTrackingEntity[]>;
  findByReportType(reportType: ProgressReportType, scheduleId?: string): Promise<ProgressTrackingEntity[]>;
  findLatestReport(scheduleId: string): Promise<ProgressTrackingEntity | null>;
  findPendingApproval(): Promise<ProgressTrackingEntity[]>;
  getProgressTrend(scheduleId: string, days?: number): Promise<ProgressTrackingEntity[]>;
  getProductivityMetrics(scheduleId: string, dateRange?: { start: Date; end: Date }): Promise<any[]>;
  save(progressReport: ProgressTrackingEntity): Promise<ProgressTrackingEntity>;
  approve(reportId: string, approvedById: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}