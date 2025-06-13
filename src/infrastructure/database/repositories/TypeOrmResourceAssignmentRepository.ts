// ===== TypeOrmResourceAssignmentRepository.ts =====
import { Repository, Between, LessThan, MoreThan, In } from 'typeorm';
import { ResourceAssignmentEntity, AssignmentStatus, ResourceType } from '../entities/ResourceAssignmentEntity';
import { ResourceAssignmentRepository } from '../../../domain/repositories/ResourceAssignmentRepository';
import { AppDataSource } from '../data-source';

export class TypeOrmResourceAssignmentRepository implements ResourceAssignmentRepository {
  private repository: Repository<ResourceAssignmentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ResourceAssignmentEntity);
  }
  async findByScheduleId(scheduleId: string): Promise<ResourceAssignmentEntity[]> {
    return await this.repository.find({
      where: { 
        activity: { scheduleId } // Assuming there's a relation to activity
      },
      relations: ['activity', 'workforce', 'equipment'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findByResource(resourceType: 'workforce' | 'equipment', resourceId: string): Promise<ResourceAssignmentEntity[]> {
    const where = resourceType === 'workforce' 
      ? { workforceId: resourceId }
      : { equipmentId: resourceId };

    return await this.repository.find({
      where,
      relations: ['activity'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findById(id: string): Promise<ResourceAssignmentEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['activity', 'workforce', 'equipment']
    });
  }

  async findByActivityId(activityId: string): Promise<ResourceAssignmentEntity[]> {
    return await this.repository.find({
      where: { activityId },
      relations: ['workforce', 'equipment'],
      order: { assignmentDate: 'ASC' }
    });
  }

  async findByWorkforceId(workforceId: string): Promise<ResourceAssignmentEntity[]> {
    return await this.repository.find({
      where: { workforceId },
      relations: ['activity'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findByEquipmentId(equipmentId: string): Promise<ResourceAssignmentEntity[]> {
    return await this.repository.find({
      where: { equipmentId },
      relations: ['activity'],
      order: { plannedStartDate: 'ASC' }
    });
  }

  async findResourceConflicts(
    resourceId: string, 
    resourceType: 'workforce' | 'equipment',
    dateRange: { start: Date; end: Date }
  ): Promise<ResourceAssignmentEntity[]> {
    const whereClause = resourceType === 'workforce' 
      ? { resourceId: resourceId }
      : { resourceId: resourceId };

    return await this.repository.find({
      where: {
        ...whereClause,
        resourceType: resourceType as ResourceType,
        startDate: LessThan(dateRange.end),
        endDate: MoreThan(dateRange.start),
        status: In([AssignmentStatus.PENDING, AssignmentStatus.ACTIVE]) // Fix: use enum values
      },
      relations: ['activity'],
      order: { startDate: 'ASC' }
    });
  }

  async findActiveAssignments(): Promise<ResourceAssignmentEntity[]> {
    const today = new Date();
    
    return await this.repository.find({
      where: {
        status: AssignmentStatus.ACTIVE, // Fix: use enum value
        startDate: LessThan(today),
        endDate: MoreThan(today)
      },
      relations: ['activity', 'workforce', 'equipment'],
      order: { startDate: 'ASC' }
    });
  }

  async getResourceUtilization(
    dateRange: { start: Date; end: Date },
    resourceType?: 'workforce' | 'equipment'
  ): Promise<any[]> {
    let query = this.repository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.workforce', 'workforce')
      .leftJoin('assignment.equipment', 'equipment')
      .leftJoin('assignment.activity', 'activity')
      .select([
        'DATE(assignment.plannedStartDate) as date',
        'CASE WHEN assignment.workforceId IS NOT NULL THEN \'workforce\' ELSE \'equipment\' END as resourceType',
        'COALESCE(workforce.primaryTrade, equipment.equipmentType) as resourceCategory',
        'COUNT(*) as assignmentCount',
        'AVG(assignment.allocationPercentage) as avgAllocation'
      ])
      .where('assignment.plannedStartDate >= :startDate', { startDate: dateRange.start })
      .andWhere('assignment.plannedEndDate <= :endDate', { endDate: dateRange.end });

    if (resourceType === 'workforce') {
      query = query.andWhere('assignment.workforceId IS NOT NULL');
    } else if (resourceType === 'equipment') {
      query = query.andWhere('assignment.equipmentId IS NOT NULL');
    }

    return await query
      .groupBy('DATE(assignment.plannedStartDate), resourceType, resourceCategory')
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async save(assignment: ResourceAssignmentEntity): Promise<ResourceAssignmentEntity> {
    return await this.repository.save(assignment);
  }

  async saveMany(assignments: ResourceAssignmentEntity[]): Promise<ResourceAssignmentEntity[]> {
    return await this.repository.save(assignments);
  }

  async updateStatus(assignmentId: string, status: string): Promise<boolean> {
    const result = await this.repository.update(assignmentId, { 
      status: status as AssignmentStatus // Fix: cast to enum
    });
    return result.affected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}