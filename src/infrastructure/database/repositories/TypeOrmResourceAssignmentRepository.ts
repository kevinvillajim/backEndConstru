// ===== TypeOrmResourceAssignmentRepository.ts =====
import { Repository, Between, LessThan, MoreThan, In } from 'typeorm';
import { ResourceAssignmentEntity, ResourceAssignmentStatus, ResourceType } from '../entities/ResourceAssignmentEntity';
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
      order: { startDate: 'ASC' } // CORREGIDO: usar startDate en lugar de plannedStartDate
    });
  }

  async findByResource(resourceId: string, resourceType: string): Promise<ResourceAssignmentEntity[]> {
    const where: any = { resourceId, resourceType: resourceType as ResourceType };

    return await this.repository.find({
      where,
      relations: ['activity'],
      order: { startDate: 'ASC' } // CORREGIDO: usar startDate
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
      order: { startDate: 'ASC' } // CORREGIDO: usar startDate
    });
  }

  async findByEquipmentId(equipmentId: string): Promise<ResourceAssignmentEntity[]> {
    return await this.repository.find({
      where: { equipmentId },
      relations: ['activity'],
      order: { startDate: 'ASC' } // CORREGIDO: usar startDate
    });
  }

  async findResourceConflicts(
    resourceId: string, 
    resourceType: 'workforce' | 'equipment',
    dateRange: { start: Date; end: Date }
  ): Promise<ResourceAssignmentEntity[]> {
    const whereClause: any = { 
      resourceId: resourceId,
      resourceType: resourceType.toUpperCase() as ResourceType,
      startDate: LessThan(dateRange.end),
      endDate: MoreThan(dateRange.start),
      status: In([ResourceAssignmentStatus.ASSIGNED, ResourceAssignmentStatus.ACTIVE]) // CORREGIDO: usar enum correcto
    };

    return await this.repository.find({
      where: whereClause,
      relations: ['activity'],
      order: { startDate: 'ASC' }
    });
  }

  async findActiveAssignments(): Promise<ResourceAssignmentEntity[]> {
    const today = new Date();
    
    return await this.repository.find({
      where: {
        status: ResourceAssignmentStatus.ACTIVE, // CORREGIDO: usar enum correcto
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
        'DATE(assignment.startDate) as date', // CORREGIDO: usar startDate
        'CASE WHEN assignment.workforceId IS NOT NULL THEN \'workforce\' ELSE \'equipment\' END as resourceType',
        'COALESCE(workforce.primaryTrade, equipment.equipmentType) as resourceCategory',
        'COUNT(*) as assignmentCount',
        'AVG(assignment.allocationPercentage) as avgAllocation'
      ])
      .where('assignment.startDate >= :startDate', { startDate: dateRange.start }) // CORREGIDO: usar startDate
      .andWhere('assignment.endDate <= :endDate', { endDate: dateRange.end }); // CORREGIDO: usar endDate

    if (resourceType === 'workforce') {
      query = query.andWhere('assignment.workforceId IS NOT NULL');
    } else if (resourceType === 'equipment') {
      query = query.andWhere('assignment.equipmentId IS NOT NULL');
    }

    return await query
      .groupBy('DATE(assignment.startDate), resourceType, resourceCategory') // CORREGIDO: usar startDate
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async save(assignment: ResourceAssignmentEntity): Promise<ResourceAssignmentEntity> {
    // AGREGADO: Sincronizar fechas antes de guardar
    assignment.syncPlannedDates();
    return await this.repository.save(assignment);
  }

  async saveMany(assignments: ResourceAssignmentEntity[]): Promise<ResourceAssignmentEntity[]> {
    // AGREGADO: Sincronizar fechas antes de guardar
    assignments.forEach(assignment => assignment.syncPlannedDates());
    return await this.repository.save(assignments);
  }

  async updateStatus(assignmentId: string, status: string): Promise<boolean> {
    const result = await this.repository.update(assignmentId, { 
      status: status as ResourceAssignmentStatus // CORREGIDO: cast al enum correcto
    });
    return result.affected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}