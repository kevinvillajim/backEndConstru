// ===== TypeOrmCalculationScheduleRepository.ts =====
import { Repository, Between, MoreThan, LessThan, In } from 'typeorm';
import { CalculationScheduleEntity, ScheduleStatus, ConstructionType, GeographicalZone } from '../entities/CalculationScheduleEntity';
import { CalculationScheduleRepository } from '../../../domain/repositories/CalculationScheduleRepository';
import { PaginationOptions } from '../../../domain/models/common/PaginationOptions';

export class TypeOrmCalculationScheduleRepository implements CalculationScheduleRepository {
  constructor(private repository: Repository<CalculationScheduleEntity>) {}

  async findById(id: string): Promise<CalculationScheduleEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'project',
        'calculationBudget',
        'activities',
        'activities.resourceAssignments',
        'activities.progressReports',
        'progressTracking',
        'weatherFactors'
      ]
    });
  }

  async findByProjectId(projectId: string): Promise<CalculationScheduleEntity[]> {
    return await this.repository.find({
      where: { projectId },
      relations: ['activities', 'progressTracking'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: ScheduleStatus): Promise<CalculationScheduleEntity[]> {
    return await this.repository.find({
      where: { status },
      relations: ['project', 'activities'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findByConstructionType(
    constructionType: ConstructionType, 
    geographicalZone?: GeographicalZone
  ): Promise<CalculationScheduleEntity[]> {
    const where: any = { constructionType };
    if (geographicalZone) {
      where.geographicalZone = geographicalZone;
    }

    return await this.repository.find({
      where,
      relations: ['project'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<CalculationScheduleEntity[]> {
    return await this.repository.find({
      where: [
        {
          plannedStartDate: Between(startDate, endDate)
        },
        {
          plannedEndDate: Between(startDate, endDate)
        },
        {
          plannedStartDate: LessThan(startDate),
          plannedEndDate: MoreThan(endDate)
        }
      ],
      relations: ['project', 'activities'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findActiveSchedules(): Promise<CalculationScheduleEntity[]> {
    return await this.repository.find({
      where: {
        status: In([ScheduleStatus.ACTIVE, ScheduleStatus.DELAYED]),
        isActive: true
      },
      relations: ['project', 'activities'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findDelayedSchedules(): Promise<CalculationScheduleEntity[]> {
    const today = new Date();
    
    return await this.repository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.project', 'project')
      .leftJoinAndSelect('schedule.activities', 'activities')
      .where('schedule.status = :status', { status: ScheduleStatus.ACTIVE })
      .andWhere('schedule.plannedEndDate < :today', { today })
      .andWhere('schedule.progressPercentage < 100')
      .orderBy('schedule.plannedEndDate', 'ASC')
      .getMany();
  }

  async findSchedulesNeedingAttention(): Promise<CalculationScheduleEntity[]> {
    // Cronogramas que necesitan atención (retrasos, problemas, etc.)
    return await this.repository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.project', 'project')
      .leftJoinAndSelect('schedule.activities', 'activities')
      .where('schedule.isActive = true')
      .andWhere(
        '(schedule.progressPercentage < :minProgress AND schedule.status = :activeStatus) OR ' +
        'schedule.status = :delayedStatus OR ' +
        'schedule.costVariancePercentage > :maxCostVariance OR ' +
        'schedule.costVariancePercentage < :minCostVariance',
        {
          minProgress: 10,
          activeStatus: ScheduleStatus.ACTIVE,
          delayedStatus: ScheduleStatus.DELAYED,
          maxCostVariance: 15,
          minCostVariance: -15
        }
      )
      .orderBy('schedule.healthScore', 'ASC')
      .getMany();
  }

  async findWithBudgetIntegration(budgetId: string): Promise<CalculationScheduleEntity[]> {
    return await this.repository.find({
      where: { calculationBudgetId: budgetId },
      relations: ['calculationBudget', 'activities'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOptimizedSchedules(): Promise<CalculationScheduleEntity[]> {
    return await this.repository.find({
      where: { isOptimized: true },
      relations: ['project'],
      order: { healthScore: 'DESC' }
    });
  }

  async findByGeographicalZone(zone: GeographicalZone): Promise<CalculationScheduleEntity[]> {
    return await this.repository.find({
      where: { geographicalZone: zone },
      relations: ['project', 'activities'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findPaginated(options: PaginationOptions): Promise<{
    items: CalculationScheduleEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [items, total] = await this.repository.findAndCount({
      relations: ['project'],
      order: { [options.sortBy || 'createdAt']: options.sortOrder || 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit
    });

    return {
      items,
      total,
      page: options.page,
      limit: options.limit
    };
  }

  async getScheduleMetrics(scheduleId: string): Promise<any> {
    const result = await this.repository
      .createQueryBuilder('schedule')
      .leftJoin('schedule.activities', 'activities')
      .select([
        'schedule.id',
        'schedule.progressPercentage',
        'schedule.totalPlannedDuration',
        'schedule.totalActualDuration',
        'schedule.totalScheduleCost',
        'schedule.actualSpentCost',
        'COUNT(activities.id) as totalActivities',
        'SUM(CASE WHEN activities.status = \'completed\' THEN 1 ELSE 0 END) as completedActivities',
        'SUM(CASE WHEN activities.isCriticalPath = true THEN 1 ELSE 0 END) as criticalActivities',
        'AVG(activities.progressPercentage) as avgActivityProgress'
      ])
      .where('schedule.id = :scheduleId', { scheduleId })
      .groupBy('schedule.id')
      .getRawOne();

    return result;
  }

  async getCriticalPathActivities(scheduleId: string): Promise<any[]> {
    return await this.repository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.activities', 'activities')
      .where('schedule.id = :scheduleId', { scheduleId })
      .andWhere('activities.isCriticalPath = true')
      .orderBy('activities.plannedStartDate', 'ASC')
      .getMany();
  }

  async getResourceUtilization(scheduleId: string, dateRange?: { start: Date; end: Date }): Promise<any[]> {
    let query = this.repository
      .createQueryBuilder('schedule')
      .leftJoin('schedule.activities', 'activities')
      .leftJoin('activities.resourceAssignments', 'assignments')
      .leftJoin('assignments.workforce', 'workforce')
      .leftJoin('assignments.equipment', 'equipment')
      .select([
        'activities.primaryTrade as trade',
        'DATE(activities.plannedStartDate) as date',
        'COUNT(DISTINCT assignments.id) as resourceCount',
        'SUM(assignments.allocationPercentage) as totalAllocation'
      ])
      .where('schedule.id = :scheduleId', { scheduleId });

    if (dateRange) {
      query = query
        .andWhere('activities.plannedStartDate >= :startDate', { startDate: dateRange.start })
        .andWhere('activities.plannedEndDate <= :endDate', { endDate: dateRange.end });
    }

    return await query
      .groupBy('activities.primaryTrade, DATE(activities.plannedStartDate)')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async save(schedule: CalculationScheduleEntity): Promise<CalculationScheduleEntity> {
    return await this.repository.save(schedule);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  async updateProgress(scheduleId: string, progressData: {
    progressPercentage: number;
    actualSpentCost: number;
    notes?: string;
  }): Promise<boolean> {
    const result = await this.repository.update(scheduleId, {
      progressPercentage: progressData.progressPercentage,
      actualSpentCost: progressData.actualSpentCost,
      costVariancePercentage: this.calculateCostVariance(progressData.actualSpentCost, scheduleId)
    });

    return result.affected > 0;
  }

  private calculateCostVariance(actualCost: number, scheduleId: string): number {
    // En implementación real, calcular basado en presupuesto original
    return 0; // Placeholder
  }
}