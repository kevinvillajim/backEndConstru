// ===== TypeOrmScheduleActivityRepository.ts =====
import { Repository, Between, In } from 'typeorm';
import { ScheduleActivityEntity, ActivityStatus, ConstructionTrade } from '../entities/ScheduleActivityEntity';
import { ScheduleActivityRepository } from '../../../domain/repositories/ScheduleActivityRepository';

export class TypeOrmScheduleActivityRepository implements ScheduleActivityRepository {
  constructor(private repository: Repository<ScheduleActivityEntity>) {}

  async findById(id: string): Promise<ScheduleActivityEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['schedule', 'resourceAssignments', 'progressReports']
    });
  }

  async findByScheduleId(scheduleId: string): Promise<ScheduleActivityEntity[]> {
    return await this.repository.find({
      where: { scheduleId },
      relations: ['resourceAssignments'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findCriticalPath(scheduleId: string): Promise<ScheduleActivityEntity[]> {
    return await this.repository.find({
      where: { 
        scheduleId, 
        isCriticalPath: true 
      },
      relations: ['resourceAssignments'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findByStatus(status: ActivityStatus): Promise<ScheduleActivityEntity[]> {
    return await this.repository.find({
      where: { status },
      relations: ['schedule'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findByTrade(trade: ConstructionTrade): Promise<ScheduleActivityEntity[]> {
    return await this.repository.find({
      where: { primaryTrade: trade },
      relations: ['schedule', 'resourceAssignments'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ScheduleActivityEntity[]> {
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
      relations: ['schedule', 'resourceAssignments'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findDelayedActivities(): Promise<ScheduleActivityEntity[]> {
    const today = new Date();
    
    return await this.repository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.schedule', 'schedule')
      .where('activity.plannedStartDate < :today', { today })
      .andWhere('activity.status = :status', { status: ActivityStatus.NOT_STARTED })
      .orWhere('activity.plannedEndDate < :today', { today })
      .andWhere('activity.status IN (:...inProgressStatuses)', { 
        inProgressStatuses: [ActivityStatus.IN_PROGRESS, ActivityStatus.ON_HOLD] 
      })
      .orderBy('activity.plannedStartDate', 'ASC')
      .getMany();
  }

  async findActivitiesStartingToday(): Promise<ScheduleActivityEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.repository.find({
      where: {
        plannedStartDate: Between(today, tomorrow),
        status: ActivityStatus.NOT_STARTED
      },
      relations: ['schedule', 'resourceAssignments'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findResourceConflicts(dateRange: { start: Date; end: Date }): Promise<any[]> {
    return await this.repository
      .createQueryBuilder('activity')
      .leftJoin('activity.resourceAssignments', 'assignment')
      .leftJoin('assignment.workforce', 'workforce')
      .leftJoin('assignment.equipment', 'equipment')
      .select([
        'DATE(activity.plannedStartDate) as date',
        'activity.primaryTrade as trade',
        'COUNT(DISTINCT assignment.id) as resourceDemand',
        'ARRAY_AGG(DISTINCT activity.id) as activityIds'
      ])
      .where('activity.plannedStartDate >= :startDate', { startDate: dateRange.start })
      .andWhere('activity.plannedEndDate <= :endDate', { endDate: dateRange.end })
      .groupBy('DATE(activity.plannedStartDate), activity.primaryTrade')
      .having('COUNT(DISTINCT assignment.id) > 1')
      .getRawMany();
  }

  async getProductivityMetrics(
    scheduleId?: string, 
    trade?: ConstructionTrade,
    dateRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    let query = this.repository
      .createQueryBuilder('activity')
      .select([
        'activity.primaryTrade as trade',
        'AVG(activity.progressPercentage) as avgProgress',
        'AVG(activity.plannedDurationDays) as avgPlannedDuration',
        'AVG(activity.actualDurationDays) as avgActualDuration',
        'SUM(activity.workQuantities->>\'plannedQuantity\') as totalPlannedQuantity',
        'SUM(activity.workQuantities->>\'completedQuantity\') as totalCompletedQuantity'
      ]);

    if (scheduleId) {
      query = query.where('activity.scheduleId = :scheduleId', { scheduleId });
    }

    if (trade) {
      query = query.andWhere('activity.primaryTrade = :trade', { trade });
    }

    if (dateRange) {
      query = query
        .andWhere('activity.plannedStartDate >= :startDate', { startDate: dateRange.start })
        .andWhere('activity.plannedEndDate <= :endDate', { endDate: dateRange.end });
    }

    return await query
      .groupBy('activity.primaryTrade')
      .getRawMany();
  }

  async save(activity: ScheduleActivityEntity): Promise<ScheduleActivityEntity> {
    return await this.repository.save(activity);
  }

  async saveMany(activities: ScheduleActivityEntity[]): Promise<ScheduleActivityEntity[]> {
    return await this.repository.save(activities);
  }

  async updateProgress(activityId: string, progressData: {
    progressPercentage: number;
    actualCost?: number;
    notes?: string;
  }): Promise<boolean> {
    const updateData: any = {
      progressPercentage: progressData.progressPercentage
    };

    if (progressData.actualCost !== undefined) {
      updateData.actualTotalCost = progressData.actualCost;
    }

    // Si se completa al 100%, actualizar fechas
    if (progressData.progressPercentage === 100) {
      updateData.actualEndDate = new Date();
      updateData.status = ActivityStatus.COMPLETED;
    } else if (progressData.progressPercentage > 0) {
      updateData.status = ActivityStatus.IN_PROGRESS;
      updateData.actualStartDate = updateData.actualStartDate || new Date();
    }

    const result = await this.repository.update(activityId, updateData);
    return result.affected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  async recalculateCriticalPath(scheduleId: string): Promise<boolean> {
    // Implementación simplificada del algoritmo CPM
    const activities = await this.findByScheduleId(scheduleId);
    
    // Resetear critical path flags
    await this.repository.update(
      { scheduleId },
      { isCriticalPath: false, totalFloat: 0 }
    );

    // Calcular nueva ruta crítica (implementación simplificada)
    const criticalActivities = this.calculateCriticalPath(activities);
    
    for (const activity of criticalActivities) {
      await this.repository.update(activity.id, { 
        isCriticalPath: true, 
        totalFloat: 0 
      });
    }

    return true;
  }

  private calculateCriticalPath(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    // Implementación simplificada - en la práctica usaría algoritmo CPM completo
    return activities.filter(activity => {
      // Actividades sin holgura son típicamente críticas
      const duration = activity.plannedEndDate.getTime() - activity.plannedStartDate.getTime();
      const daysDuration = duration / (1000 * 3600 * 24);
      
      return daysDuration > 0 && activity.totalFloat === 0;
    });
  }
}