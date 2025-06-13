// src/domain/repositories/ProgressTrackingRepository.ts
import { ActivityProgressEntity } from '../../infrastructure/database/entities/ActivityProgressEntity';

export interface ProgressTrackingFilters {
  startDate?: Date;
  endDate?: Date;
  reportedBy?: string;
  status?: string;
  minQualityScore?: number;
  hasIssues?: boolean;
}

export interface ProgressTrackingRepository {
  findById(id: string): Promise<ActivityProgressEntity | null>;
  findByActivityId(activityId: string): Promise<ActivityProgressEntity[]>;
  findByScheduleId(scheduleId: string, filters?: ProgressTrackingFilters): Promise<ActivityProgressEntity[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<ActivityProgressEntity[]>;
  findByReporter(reporterId: string): Promise<ActivityProgressEntity[]>;
  findByFilters(filters: ProgressTrackingFilters): Promise<ActivityProgressEntity[]>;
  findWithQualityIssues(): Promise<ActivityProgressEntity[]>;
  findWithSafetyIncidents(): Promise<ActivityProgressEntity[]>;
  findPendingApproval(): Promise<ActivityProgressEntity[]>;
  findLateReports(): Promise<ActivityProgressEntity[]>;
  getProductivityMetrics(
    scheduleId?: string, 
    activityId?: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<any[]>;
  getQualityMetrics(
    scheduleId?: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<any>;
  getSafetyMetrics(
    scheduleId?: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<any>;
  save(progressReport: ActivityProgressEntity): Promise<ActivityProgressEntity>;
  saveMany(progressReports: ActivityProgressEntity[]): Promise<ActivityProgressEntity[]>;
  delete(id: string): Promise<boolean>;
  deleteOlderThan(cutoffDate: Date): Promise<number>;
  approve(id: string, approvedBy: string): Promise<boolean>;
  reject(id: string, rejectedBy: string, reason: string): Promise<boolean>;
}
