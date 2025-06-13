// ===== TypeOrmProgressTrackingRepository.ts =====
import { Repository, Between, MoreThan } from 'typeorm';
import { ProgressTrackingEntity, ProgressReportType } from '../entities/ProgressTrackingEntity';
import { ProgressTrackingRepository } from '../../../domain/repositories/ProgressTrackingRepository';
import { AppDataSource } from '../data-source';

export class TypeOrmProgressTrackingRepository implements ProgressTrackingRepository {
  private repository: Repository<ProgressTrackingEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProgressTrackingEntity);
  }
  async findByFilters(filters: any): Promise<ProgressTrackingEntity[]> {
    const queryBuilder = this.repository.createQueryBuilder('progress');
    
    if (filters.scheduleId) {
      queryBuilder.andWhere('progress.scheduleId = :scheduleId', { scheduleId: filters.scheduleId });
    }
    
    if (filters.startDate) {
      queryBuilder.andWhere('progress.reportDate >= :startDate', { startDate: filters.startDate });
    }
    
    if (filters.endDate) {
      queryBuilder.andWhere('progress.reportDate <= :endDate', { endDate: filters.endDate });
    }
    
    return await queryBuilder
      .leftJoinAndSelect('progress.reportedBy', 'reportedBy')
      .orderBy('progress.reportDate', 'DESC')
      .getMany();
  }
  
  async deleteOlderThan(cutoffDate: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(ProgressTrackingEntity)
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();
    return result.affected || 0;
  }

  async findById(id: string): Promise<ProgressTrackingEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['schedule', 'reportedBy', 'approvedBy']
    });
  }

  async findByScheduleId(scheduleId: string): Promise<ProgressTrackingEntity[]> {
    return await this.repository.find({
      where: { scheduleId },
      relations: ['reportedBy'],
      order: { reportDate: 'DESC' }
    });
  }

  async findByDateRange(
    scheduleId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ProgressTrackingEntity[]> {
    return await this.repository.find({
      where: {
        scheduleId,
        reportDate: Between(startDate, endDate)
      },
      relations: ['reportedBy'],
      order: { reportDate: 'ASC' }
    });
  }

  async findByReportType(
    reportType: ProgressReportType, 
    scheduleId?: string
  ): Promise<ProgressTrackingEntity[]> {
    const where: any = { reportType };
    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    return await this.repository.find({
      where,
      relations: ['schedule', 'reportedBy'],
      order: { reportDate: 'DESC' }
    });
  }

  async findLatestReport(scheduleId: string): Promise<ProgressTrackingEntity | null> {
    return await this.repository.findOne({
      where: { scheduleId },
      relations: ['reportedBy'],
      order: { reportDate: 'DESC' }
    });
  }

  async findPendingApproval(): Promise<ProgressTrackingEntity[]> {
    return await this.repository.find({
      where: { isApproved: false },
      relations: ['schedule', 'reportedBy'],
      order: { reportDate: 'ASC' }
    });
  }

  async getProgressTrend(
    scheduleId: string, 
    days: number = 30
  ): Promise<ProgressTrackingEntity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.repository.find({
      where: {
        scheduleId,
        reportDate: MoreThan(startDate)
      },
      order: { reportDate: 'ASC' }
    });
  }

  async getProductivityMetrics(
    scheduleId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    let query = this.repository
      .createQueryBuilder('progress')
      .select([
        'DATE(progress.reportDate) as date',
        'AVG(progress.overallProgress) as avgProgress',
        'AVG(progress.overallEfficiency) as avgEfficiency',
        'COUNT(CASE WHEN jsonb_array_length(progress.issues) > 0 THEN 1 END) as issueCount'
      ])
      .where('progress.scheduleId = :scheduleId', { scheduleId });

    if (dateRange) {
      query = query
        .andWhere('progress.reportDate >= :startDate', { startDate: dateRange.start })
        .andWhere('progress.reportDate <= :endDate', { endDate: dateRange.end });
    }

    return await query
      .groupBy('DATE(progress.reportDate)')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async save(progressReport: ProgressTrackingEntity): Promise<ProgressTrackingEntity> {
    return await this.repository.save(progressReport);
  }

  async approve(reportId: string, approvedById: string): Promise<boolean> {
    const result = await this.repository.update(reportId, {
      isApproved: true,
      approvedAt: new Date(),
      approvedById
    });
    return result.affected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}