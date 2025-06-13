// src/infrastructure/database/repositories/TypeOrmProgressTrackingRepository.ts
import { Repository, Between, MoreThan, LessThan, In } from 'typeorm';
import { ActivityProgressEntity, ProgressReportStatus } from '../entities/ActivityProgressEntity';
import { ProgressTrackingRepository, ProgressTrackingFilters } from '../../../domain/repositories/ProgressTrackingRepository';
import { AppDataSource } from '../data-source';

export class TypeOrmProgressTrackingRepository implements ProgressTrackingRepository {
  private repository: Repository<ActivityProgressEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ActivityProgressEntity);
  }

  async findById(id: string): Promise<ActivityProgressEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['activity', 'activity.schedule']
    });
  }

  async findByActivityId(activityId: string): Promise<ActivityProgressEntity[]> {
    return await this.repository.find({
      where: { activityId },
      order: { reportDate: 'DESC' }
    });
  }

  async findByScheduleId(scheduleId: string, filters?: ProgressTrackingFilters): Promise<ActivityProgressEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.activity', 'activity')
      .where('activity.scheduleId = :scheduleId', { scheduleId });

    if (filters) {
      if (filters.startDate) {
        queryBuilder.andWhere('progress.reportDate >= :startDate', { startDate: filters.startDate });
      }
      if (filters.endDate) {
        queryBuilder.andWhere('progress.reportDate <= :endDate', { endDate: filters.endDate });
      }
      if (filters.reportedBy) {
        queryBuilder.andWhere('progress.reportedBy = :reportedBy', { reportedBy: filters.reportedBy });
      }
      if (filters.status) {
        queryBuilder.andWhere('progress.status = :status', { status: filters.status });
      }
      if (filters.minQualityScore) {
        queryBuilder.andWhere('progress.qualityScore >= :minQualityScore', { minQualityScore: filters.minQualityScore });
      }
      if (filters.hasIssues !== undefined) {
        if (filters.hasIssues) {
          queryBuilder.andWhere(
            '(progress.qualityIssues IS NOT NULL AND JSON_LENGTH(progress.qualityIssues) > 0) OR ' +
            '(progress.safetyIncidents IS NOT NULL AND JSON_LENGTH(progress.safetyIncidents) > 0) OR ' +
            '(progress.obstacles IS NOT NULL AND JSON_LENGTH(progress.obstacles) > 0)'
          );
        } else {
          queryBuilder.andWhere(
            '(progress.qualityIssues IS NULL OR JSON_LENGTH(progress.qualityIssues) = 0) AND ' +
            '(progress.safetyIncidents IS NULL OR JSON_LENGTH(progress.safetyIncidents) = 0) AND ' +
            '(progress.obstacles IS NULL OR JSON_LENGTH(progress.obstacles) = 0)'
          );
        }
      }
    }

    return await queryBuilder
      .orderBy('progress.reportDate', 'DESC')
      .getMany();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ActivityProgressEntity[]> {
    return await this.repository.find({
      where: {
        reportDate: Between(startDate, endDate)
      },
      relations: ['activity'],
      order: { reportDate: 'DESC' }
    });
  }

  async findByReporter(reporterId: string): Promise<ActivityProgressEntity[]> {
    return await this.repository.find({
      where: { reportedBy: reporterId },
      relations: ['activity'],
      order: { reportDate: 'DESC' }
    });
  }

  async findByFilters(filters: ProgressTrackingFilters): Promise<ActivityProgressEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.activity', 'activity');

    let hasWhere = false;

    if (filters.startDate) {
      queryBuilder.where('progress.reportDate >= :startDate', { startDate: filters.startDate });
      hasWhere = true;
    }

    if (filters.endDate) {
      const condition = hasWhere ? 'andWhere' : 'where';
      queryBuilder[condition]('progress.reportDate <= :endDate', { endDate: filters.endDate });
      hasWhere = true;
    }

    if (filters.reportedBy) {
      const condition = hasWhere ? 'andWhere' : 'where';
      queryBuilder[condition]('progress.reportedBy = :reportedBy', { reportedBy: filters.reportedBy });
      hasWhere = true;
    }

    if (filters.status) {
      const condition = hasWhere ? 'andWhere' : 'where';
      queryBuilder[condition]('progress.status = :status', { status: filters.status });
      hasWhere = true;
    }

    if (filters.minQualityScore) {
      const condition = hasWhere ? 'andWhere' : 'where';
      queryBuilder[condition]('progress.qualityScore >= :minQualityScore', { minQualityScore: filters.minQualityScore });
      hasWhere = true;
    }

    if (filters.hasIssues !== undefined) {
      const condition = hasWhere ? 'andWhere' : 'where';
      if (filters.hasIssues) {
        queryBuilder[condition](
          '(progress.qualityIssues IS NOT NULL AND JSON_LENGTH(progress.qualityIssues) > 0) OR ' +
          '(progress.safetyIncidents IS NOT NULL AND JSON_LENGTH(progress.safetyIncidents) > 0) OR ' +
          '(progress.obstacles IS NOT NULL AND JSON_LENGTH(progress.obstacles) > 0)'
        );
      } else {
        queryBuilder[condition](
          '(progress.qualityIssues IS NULL OR JSON_LENGTH(progress.qualityIssues) = 0) AND ' +
          '(progress.safetyIncidents IS NULL OR JSON_LENGTH(progress.safetyIncidents) = 0) AND ' +
          '(progress.obstacles IS NULL OR JSON_LENGTH(progress.obstacles) = 0)'
        );
      }
    }

    return await queryBuilder
      .orderBy('progress.reportDate', 'DESC')
      .getMany();
  }

  async findWithQualityIssues(): Promise<ActivityProgressEntity[]> {
    return await this.repository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.activity', 'activity')
      .where('progress.qualityIssues IS NOT NULL')
      .andWhere('JSON_LENGTH(progress.qualityIssues) > 0')
      .orderBy('progress.reportDate', 'DESC')
      .getMany();
  }

  async findWithSafetyIncidents(): Promise<ActivityProgressEntity[]> {
    return await this.repository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.activity', 'activity')
      .where('progress.safetyIncidents IS NOT NULL')
      .andWhere('JSON_LENGTH(progress.safetyIncidents) > 0')
      .orderBy('progress.reportDate', 'DESC')
      .getMany();
  }

  async findPendingApproval(): Promise<ActivityProgressEntity[]> {
    return await this.repository.find({
      where: { status: 'submitted' as ProgressReportStatus },
      relations: ['activity'],
      order: { createdAt: 'ASC' }
    });
  }

  async findLateReports(): Promise<ActivityProgressEntity[]> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    return await this.repository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.activity', 'activity')
      .where('progress.reportDate <= :twoDaysAgo', { twoDaysAgo })
      .andWhere('progress.createdAt > DATE_ADD(progress.reportDate, INTERVAL 1 DAY)')
      .orderBy('progress.reportDate', 'DESC')
      .getMany();
  }

  async getProductivityMetrics(
    scheduleId?: string, 
    activityId?: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    let query = this.repository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select([
        'activity.primaryTrade as trade',
        'AVG(progress.productivityRate) as avgProductivity',
        'AVG(progress.efficiencyPercentage) as avgEfficiency',
        'COUNT(*) as reportCount',
        'SUM(progress.actualHoursWorked) as totalHours',
        'SUM(progress.workCompleted->>"$.quantity") as totalQuantity'
      ]);

    if (scheduleId) {
      query = query.where('activity.scheduleId = :scheduleId', { scheduleId });
    }

    if (activityId) {
      query = query.andWhere('progress.activityId = :activityId', { activityId });
    }

    if (dateRange) {
      query = query
        .andWhere('progress.reportDate >= :startDate', { startDate: dateRange.start })
        .andWhere('progress.reportDate <= :endDate', { endDate: dateRange.end });
    }

    return await query
      .groupBy('activity.primaryTrade')
      .getRawMany();
  }

  async getQualityMetrics(
    scheduleId?: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    let query = this.repository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select([
        'AVG(progress.qualityScore) as avgQualityScore',
        'COUNT(*) as totalReports',
        'SUM(CASE WHEN progress.qualityIssues IS NOT NULL AND JSON_LENGTH(progress.qualityIssues) > 0 THEN 1 ELSE 0 END) as reportsWithIssues',
        'AVG(CASE WHEN progress.qualityIssues IS NOT NULL THEN JSON_LENGTH(progress.qualityIssues) ELSE 0 END) as avgIssuesPerReport'
      ]);

    if (scheduleId) {
      query = query.where('activity.scheduleId = :scheduleId', { scheduleId });
    }

    if (dateRange) {
      query = query
        .andWhere('progress.reportDate >= :startDate', { startDate: dateRange.start })
        .andWhere('progress.reportDate <= :endDate', { endDate: dateRange.end });
    }

    const result = await query.getRawOne();
    
    return {
      averageQualityScore: parseFloat(result.avgQualityScore) || 0,
      totalReports: parseInt(result.totalReports) || 0,
      reportsWithIssues: parseInt(result.reportsWithIssues) || 0,
      averageIssuesPerReport: parseFloat(result.avgIssuesPerReport) || 0,
      qualityRate: result.totalReports > 0 ? 
        ((result.totalReports - result.reportsWithIssues) / result.totalReports) * 100 : 100
    };
  }

  async getSafetyMetrics(
    scheduleId?: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    let query = this.repository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select([
        'AVG(progress.safetyScore) as avgSafetyScore',
        'COUNT(*) as totalReports',
        'SUM(CASE WHEN progress.safetyIncidents IS NOT NULL AND JSON_LENGTH(progress.safetyIncidents) > 0 THEN 1 ELSE 0 END) as reportsWithIncidents',
        'AVG(CASE WHEN progress.safetyIncidents IS NOT NULL THEN JSON_LENGTH(progress.safetyIncidents) ELSE 0 END) as avgIncidentsPerReport'
      ]);

    if (scheduleId) {
      query = query.where('activity.scheduleId = :scheduleId', { scheduleId });
    }

    if (dateRange) {
      query = query
        .andWhere('progress.reportDate >= :startDate', { startDate: dateRange.start })
        .andWhere('progress.reportDate <= :endDate', { endDate: dateRange.end });
    }

    const result = await query.getRawOne();
    
    return {
      averageSafetyScore: parseFloat(result.avgSafetyScore) || 0,
      totalReports: parseInt(result.totalReports) || 0,
      reportsWithIncidents: parseInt(result.reportsWithIncidents) || 0,
      averageIncidentsPerReport: parseFloat(result.avgIncidentsPerReport) || 0,
      safetyRate: result.totalReports > 0 ? 
        ((result.totalReports - result.reportsWithIncidents) / result.totalReports) * 100 : 100
    };
  }

  async save(progressReport: ActivityProgressEntity): Promise<ActivityProgressEntity> {
    // Calcular scores automáticamente si no están establecidos
    if (!progressReport.overallScore) {
      progressReport.overallScore = progressReport.calculateOverallScore();
    }
    
    if (!progressReport.productivityRate) {
      progressReport.productivityRate = progressReport.calculateProductivity();
    }
    
    if (!progressReport.efficiencyPercentage) {
      progressReport.efficiencyPercentage = progressReport.calculateEfficiency();
    }

    return await this.repository.save(progressReport);
  }

  async saveMany(progressReports: ActivityProgressEntity[]): Promise<ActivityProgressEntity[]> {
    // Calcular métricas para todos los reportes
    progressReports.forEach(report => {
      if (!report.overallScore) {
        report.overallScore = report.calculateOverallScore();
      }
      if (!report.productivityRate) {
        report.productivityRate = report.calculateProductivity();
      }
      if (!report.efficiencyPercentage) {
        report.efficiencyPercentage = report.calculateEfficiency();
      }
    });

    return await this.repository.save(progressReports);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  async deleteOlderThan(cutoffDate: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(ActivityProgressEntity)
      .where('reportDate < :cutoffDate', { cutoffDate })
      .andWhere('status NOT IN (:...protectedStatuses)', { 
        protectedStatuses: ['submitted', 'approved'] 
      })
      .execute();

    return result.affected || 0;
  }

  async approve(id: string, approvedBy: string): Promise<boolean> {
    const result = await this.repository.update(id, {
      status: () => "'approved'",
      approvedBy: approvedBy,
      approvedAt: new Date()
    });

    return result.affected > 0;
  }

  async reject(id: string, rejectedBy: string, reason: string): Promise<boolean> {
    const result = await this.repository.update(id, {
      status: () => 'rejected',
      approvedBy: rejectedBy, // Reuse field for rejected by
      approvedAt: new Date(),
      rejectionReason: reason
    });

    return result.affected > 0;
  }

  // Métodos adicionales para análisis avanzado

  async getWeatherImpactAnalysis(scheduleId?: string): Promise<any[]> {
    let query = this.repository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select([
        'progress.weatherConditions->>"$.workability" as workability',
        'COUNT(*) as reportCount',
        'AVG(progress.progressPercentage) as avgProgress',
        'AVG(progress.productivityRate) as avgProductivity',
        'SUM(JSON_LENGTH(COALESCE(progress.obstacles, "[]"))) as totalObstacles'
      ]);

    if (scheduleId) {
      query = query.where('activity.scheduleId = :scheduleId', { scheduleId });
    }

    return await query
      .where('progress.weatherConditions IS NOT NULL')
      .groupBy('progress.weatherConditions->>"$.workability"')
      .getRawMany();
  }

  async getMaterialWasteAnalysis(scheduleId?: string): Promise<any[]> {
    const baseQuery = `
      SELECT 
        DATE(p.reportDate) as reportDate,
        JSON_UNQUOTE(JSON_EXTRACT(material.value, '$.materialName')) as materialName,
        SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(material.value, '$.quantityUsed')) AS DECIMAL(10,2))) as totalUsed,
        SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(material.value, '$.quantityWasted')) AS DECIMAL(10,2))) as totalWasted,
        AVG(
          CASE 
            WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(material.value, '$.quantityUsed')) AS DECIMAL(10,2)) > 0 
            THEN (CAST(JSON_UNQUOTE(JSON_EXTRACT(material.value, '$.quantityWasted')) AS DECIMAL(10,2)) / 
                  CAST(JSON_UNQUOTE(JSON_EXTRACT(material.value, '$.quantityUsed')) AS DECIMAL(10,2))) * 100
            ELSE 0
          END
        ) as wastePercentage
      FROM activity_progress p
      CROSS JOIN JSON_TABLE(
        p.materialUsage, 
        '$[*]' COLUMNS (
          value JSON PATH '$'
        )
      ) as material
      ${scheduleId ? 'INNER JOIN schedule_activities a ON p.activityId = a.id WHERE a.scheduleId = ?' : 'WHERE 1=1'}
      AND p.materialUsage IS NOT NULL
      GROUP BY DATE(p.reportDate), JSON_UNQUOTE(JSON_EXTRACT(material.value, '$.materialName'))
      ORDER BY reportDate DESC
    `;

    const params = scheduleId ? [scheduleId] : [];
    return await this.repository.query(baseQuery, params);
  }

  async getEquipmentUtilizationTrends(scheduleId?: string): Promise<any[]> {
    const baseQuery = `
      SELECT 
        JSON_UNQUOTE(JSON_EXTRACT(equipment.value, '$.equipmentName')) as equipmentName,
        DATE(p.reportDate) as reportDate,
        AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(equipment.value, '$.utilizationPercentage')) AS DECIMAL(5,2))) as avgUtilization,
        AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(equipment.value, '$.hoursUsed')) AS DECIMAL(8,2))) as avgHoursUsed,
        COUNT(*) as reportCount
      FROM activity_progress p
      CROSS JOIN JSON_TABLE(
        p.equipmentUsage, 
        '$[*]' COLUMNS (
          value JSON PATH '$'
        )
      ) as equipment
      ${scheduleId ? 'INNER JOIN schedule_activities a ON p.activityId = a.id WHERE a.scheduleId = ?' : 'WHERE 1=1'}
      AND p.equipmentUsage IS NOT NULL
      GROUP BY JSON_UNQUOTE(JSON_EXTRACT(equipment.value, '$.equipmentName')), DATE(p.reportDate)
      ORDER BY reportDate DESC
    `;

    const params = scheduleId ? [scheduleId] : [];
    return await this.repository.query(baseQuery, params);
  }

  async getTopPerformers(scheduleId?: string, limit: number = 10): Promise<any[]> {
    let query = this.repository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select([
        'progress.reportedBy as reporterId',
        'COUNT(*) as totalReports',
        'AVG(progress.overallScore) as avgOverallScore',
        'AVG(progress.qualityScore) as avgQualityScore',
        'AVG(progress.safetyScore) as avgSafetyScore',
        'AVG(progress.productivityScore) as avgProductivityScore',
        'SUM(CASE WHEN progress.qualityIssues IS NULL OR JSON_LENGTH(progress.qualityIssues) = 0 THEN 1 ELSE 0 END) as reportsWithoutIssues'
      ]);

    if (scheduleId) {
      query = query.where('activity.scheduleId = :scheduleId', { scheduleId });
    }

    return await query
      .groupBy('progress.reportedBy')
      .having('COUNT(*) >= 5') // Al menos 5 reportes para ser considerado
      .orderBy('avgOverallScore', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getDailyProgressSummary(scheduleId: string, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.repository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select([
        'COUNT(*) as totalReports',
        'AVG(progress.progressPercentage) as avgProgress',
        'AVG(progress.qualityScore) as avgQuality',
        'AVG(progress.safetyScore) as avgSafety',
        'AVG(progress.productivityRate) as avgProductivity',
        'SUM(progress.actualHoursWorked) as totalHours',
        'SUM(progress.actualWorkersOnSite) as totalWorkers',
        'SUM(progress.dailyTotalCost) as totalCost',
        'SUM(CASE WHEN progress.qualityIssues IS NOT NULL AND JSON_LENGTH(progress.qualityIssues) > 0 THEN 1 ELSE 0 END) as reportsWithQualityIssues',
        'SUM(CASE WHEN progress.safetyIncidents IS NOT NULL AND JSON_LENGTH(progress.safetyIncidents) > 0 THEN 1 ELSE 0 END) as reportsWithSafetyIncidents'
      ])
      .where('activity.scheduleId = :scheduleId', { scheduleId })
      .andWhere('progress.reportDate BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
      .getRawOne();
  }

  async getWeeklyTrends(scheduleId: string, weeks: number = 4): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (weeks * 7));

    return await this.repository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select([
        'YEARWEEK(progress.reportDate) as week',
        'AVG(progress.progressPercentage) as avgProgress',
        'AVG(progress.qualityScore) as avgQuality',
        'AVG(progress.safetyScore) as avgSafety',
        'AVG(progress.productivityRate) as avgProductivity',
        'COUNT(*) as totalReports',
        'SUM(progress.actualHoursWorked) as totalHours',
        'SUM(progress.dailyTotalCost) as totalCost'
      ])
      .where('activity.scheduleId = :scheduleId', { scheduleId })
      .andWhere('progress.reportDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('YEARWEEK(progress.reportDate)')
      .orderBy('week', 'ASC')
      .getRawMany();
  }

  async getActivityProgressComparison(scheduleId: string): Promise<any[]> {
    return await this.repository
      .createQueryBuilder('progress')
      .leftJoin('progress.activity', 'activity')
      .select([
        'activity.id as activityId',
        'activity.name as activityName',
        'activity.primaryTrade as trade',
        'COUNT(*) as totalReports',
        'AVG(progress.progressPercentage) as avgProgress',
        'AVG(progress.qualityScore) as avgQuality',
        'AVG(progress.safetyScore) as avgSafety',
        'AVG(progress.productivityRate) as avgProductivity',
        'MAX(progress.reportDate) as lastReportDate',
        'SUM(CASE WHEN progress.qualityIssues IS NOT NULL AND JSON_LENGTH(progress.qualityIssues) > 0 THEN 1 ELSE 0 END) as issuesCount'
      ])
      .where('activity.scheduleId = :scheduleId', { scheduleId })
      .groupBy('activity.id, activity.name, activity.primaryTrade')
      .orderBy('avgProgress', 'DESC')
      .getRawMany();
  }
}