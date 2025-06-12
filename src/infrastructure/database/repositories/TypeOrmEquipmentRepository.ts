// src/infrastructure/database/repositories/TypeOrmEquipmentRepository.ts
import { Repository, Between } from 'typeorm';
import { EquipmentEntity } from '../entities/EquipmentEntity';
import { EquipmentRepository } from '../../../domain/repositories/EquipmentRepository';
import { AppDataSource } from '../data-source';

export class TypeOrmEquipmentRepository implements EquipmentRepository {
  private repository: Repository<EquipmentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(EquipmentEntity);
  }

  async findById(id: string): Promise<EquipmentEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['owner', 'assignments']
    });
  }

  async findByType(equipmentType: string): Promise<EquipmentEntity[]> {
    return await this.repository.find({
      where: { equipmentType },
      order: { name: 'ASC' }
    });
  }

  async findAvailable(dateRange: { start: Date; end: Date }, equipmentType?: string): Promise<EquipmentEntity[]> {
    const where: any = {
      isAvailable: true,
      condition: 'out_of_service' // NOT equal to
    };

    if (equipmentType) {
      where.equipmentType = equipmentType;
    }

    const equipmentList = await this.repository.find({
      where,
      relations: ['assignments']
    });

    // Filter out equipment that has conflicting assignments
    return equipmentList.filter(equipment => {
      if (!equipment.assignments || equipment.assignments.length === 0) {
        return true;
      }

      // Check for time conflicts
      const hasConflict = equipment.assignments.some(assignment => {
        return assignment.plannedStartDate < dateRange.end && 
               assignment.plannedEndDate > dateRange.start &&
               assignment.status !== 'cancelled';
      });

      return !hasConflict;
    });
  }

  async findByGeographicalZone(zone: string): Promise<EquipmentEntity[]> {
    return await this.repository.find({
      where: { geographicalZone: zone },
      order: { name: 'ASC' }
    });
  }

  async findByCondition(condition: string): Promise<EquipmentEntity[]> {
    return await this.repository.find({
      where: { condition },
      order: { name: 'ASC' }
    });
  }

  async findNeedingMaintenance(): Promise<EquipmentEntity[]> {
    return await this.repository
      .createQueryBuilder('equipment')
      .where("equipment.maintenanceSchedule->>'hoursUntilMaintenance' <= '0'")
      .orWhere("equipment.maintenanceSchedule->>'nextMaintenance' < NOW()")
      .orderBy('equipment.name', 'ASC')
      .getMany();
  }

  async searchEquipment(criteria: {
    type?: string;
    zone?: string;
    maxDailyCost?: number;
    minCondition?: string;
    specifications?: any;
  }): Promise<EquipmentEntity[]> {
    let query = this.repository.createQueryBuilder('equipment');

    if (criteria.type) {
      query = query.andWhere('equipment.equipmentType = :type', { type: criteria.type });
    }

    if (criteria.zone) {
      query = query.andWhere('equipment.geographicalZone = :zone', { zone: criteria.zone });
    }

    if (criteria.maxDailyCost) {
      query = query.andWhere('equipment.dailyRentalCost <= :maxCost', { maxCost: criteria.maxDailyCost });
    }

    if (criteria.minCondition) {
      const conditionOrder = ['poor', 'fair', 'good', 'excellent'];
      const minIndex = conditionOrder.indexOf(criteria.minCondition);
      if (minIndex >= 0) {
        const acceptableConditions = conditionOrder.slice(minIndex);
        query = query.andWhere('equipment.condition IN (:...conditions)', { conditions: acceptableConditions });
      }
    }

    return await query.orderBy('equipment.name', 'ASC').getMany();
  }

  async getUtilizationReport(equipmentId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    const equipment = await this.repository.findOne({
      where: { id: equipmentId },
      relations: ['assignments']
    });

    if (!equipment) {
      return null;
    }

    const assignments = equipment.assignments?.filter(assignment => 
      assignment.plannedStartDate >= dateRange.start && 
      assignment.plannedEndDate <= dateRange.end
    ) || [];

    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 3600 * 24));
    const utilizedDays = assignments.reduce((sum, assignment) => {
      const assignmentDays = Math.ceil((assignment.plannedEndDate.getTime() - assignment.plannedStartDate.getTime()) / (1000 * 3600 * 24));
      return sum + assignmentDays;
    }, 0);

    return {
      equipmentId,
      equipmentName: equipment.name,
      totalDays,
      utilizedDays,
      utilizationPercentage: (utilizedDays / totalDays) * 100,
      assignments: assignments.map(assignment => ({
        activityId: assignment.activityId,
        startDate: assignment.plannedStartDate,
        endDate: assignment.plannedEndDate,
        allocationPercentage: assignment.allocationPercentage
      }))
    };
  }

  async save(equipment: EquipmentEntity): Promise<EquipmentEntity> {
    return await this.repository.save(equipment);
  }

  async updateMaintenance(equipmentId: string, maintenanceData: {
    lastMaintenance: Date;
    nextMaintenance: Date;
    operatingHours: number;
  }): Promise<boolean> {
    const result = await this.repository.update(equipmentId, {
      totalOperatingHours: maintenanceData.operatingHours,
      maintenanceSchedule: {
        lastMaintenance: maintenanceData.lastMaintenance,
        nextMaintenance: maintenanceData.nextMaintenance,
        maintenanceType: 'preventive',
        maintenanceInterval: 100, // Default interval
        hoursUntilMaintenance: 100 // Recalculate based on interval
      }
    });

    return result.affected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}