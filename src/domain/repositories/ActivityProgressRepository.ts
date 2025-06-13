// src/domain/repositories/ActivityProgressRepository.ts
import { ActivityProgressEntity } from "../../infrastructure/database/entities/ActivityProgressEntity";

export interface ActivityProgressRepository {
  findById(id: string): Promise<ActivityProgressEntity | null>;
  findByActivityId(activityId: string): Promise<ActivityProgressEntity[]>;
  findByScheduleId(scheduleId: string): Promise<ActivityProgressEntity[]>;
  findByDateRange(activityId: string, startDate: Date, endDate: Date): Promise<ActivityProgressEntity[]>;
  findLatest(activityId: string): Promise<ActivityProgressEntity | null>;
  save(progress: ActivityProgressEntity): Promise<ActivityProgressEntity>;
  create(progressData: any): Promise<ActivityProgressEntity>;
  update(id: string, progressData: Partial<ActivityProgressEntity>): Promise<ActivityProgressEntity | null>;
  delete(id: string): Promise<boolean>;
  deleteOlderThan(date: Date): Promise<number>;
}