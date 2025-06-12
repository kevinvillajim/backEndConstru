// src/infrastructure/database/repositories/TypeOrmWorkforceRepository.ts
import { Repository } from 'typeorm';
import { CertificationLevel, WorkforceEntity, WorkforceType } from '../entities/WorkforceEntity';
import { WorkforceRepository } from '../../../domain/repositories/WorkforceRepository';
import { AppDataSource } from '../data-source';

export class TypeOrmWorkforceRepository implements WorkforceRepository {
  private repository: Repository<WorkforceEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(WorkforceEntity);
  }

  async findById(id: string): Promise<WorkforceEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['managedBy', 'assignments']
    });
  }

  async findByTrade(trade: string): Promise<WorkforceEntity[]> {
    return await this.repository
      .createQueryBuilder('workforce')
      .where('workforce.primaryTrade = :trade', { trade })
      .orWhere('workforce.secondaryTrades::text LIKE :trade', { trade: `%${trade}%` })
      .orderBy('workforce.fullName', 'ASC')
      .getMany();
  }

  async findAvailable(dateRange: { start: Date; end: Date }, trade?: string): Promise<WorkforceEntity[]> {
    let query = this.repository
      .createQueryBuilder('workforce')
      .leftJoinAndSelect('workforce.assignments', 'assignments')
      .where('workforce.isAvailable = true');

    if (trade) {
      query = query.andWhere(
        '(workforce.primaryTrade = :trade OR workforce.secondaryTrades::text LIKE :tradeLike)',
        { trade, tradeLike: `%${trade}%` }
      );
    }

    const workers = await query.getMany();

    // Filter out workers with conflicting assignments
    return workers.filter(worker => {
      if (!worker.assignments || worker.assignments.length === 0) {
        return true;
      }

      const hasConflict = worker.assignments.some(assignment => {
        return assignment.plannedStartDate < dateRange.end && 
               assignment.plannedEndDate > dateRange.start &&
               assignment.status !== 'cancelled';
      });

      return !hasConflict;
    });
  }

  async findByGeographicalZone(zone: string): Promise<WorkforceEntity[]> {
    return await this.repository
      .createQueryBuilder('workforce')
      .where('workforce.contactInfo LIKE :zone', { zone: `%${zone}%` }) // Fix: use a text field search
      .orderBy('workforce.name', 'ASC')
      .getMany();
  }

  async findByCertificationLevel(level: CertificationLevel): Promise<WorkforceEntity[]> {
    return await this.repository
      .createQueryBuilder('workforce')
      .where('workforce.skillLevel = :level', { level: level })
      .orderBy('workforce.name', 'ASC')
      .getMany();
  }

  async findByType(type: WorkforceType): Promise<WorkforceEntity[]> {
    return await this.repository.find({
      where: { workerType: type },
      order: { fullName: 'ASC' }
    });
  }

  async searchWorkers(criteria: {
    trade?: string;
    zone?: string;
    minExperience?: number;
    maxRate?: number;
    skills?: string[];
  }): Promise<WorkforceEntity[]> {
    let query = this.repository.createQueryBuilder('workforce');

    if (criteria.trade) {
      query = query.andWhere('workforce.specializations LIKE :trade', { 
        trade: `%${criteria.trade}%`
      });
    }

    if (criteria.zone) {
      query = query.andWhere('workforce.contactInfo LIKE :zone', { 
        zone: `%${criteria.zone}%` 
      });
    }

    if (criteria.minExperience) {
      // Assuming there's an experience field or we derive it from skillLevel
      query = query.andWhere('workforce.skillLevel IN (:...levels)', { 
        levels: ['advanced', 'expert'] // Approximate experience mapping
      });
    }

    if (criteria.maxRate) {
      query = query.andWhere('workforce.hourlyRate <= :maxRate', { maxRate: criteria.maxRate });
    }

    if (criteria.skills && criteria.skills.length > 0) {
      const skillConditions = criteria.skills.map((_, index) => 
        `workforce.specializations LIKE :skill${index}`
      ).join(' OR ');
      
      const skillParams = criteria.skills.reduce((acc, skill, index) => {
        acc[`skill${index}`] = `%${skill}%`;
        return acc;
      }, {});
      
      query = query.andWhere(`(${skillConditions})`, skillParams);
    }

    return await query.orderBy('workforce.name', 'ASC').getMany();
  }

  async getUtilizationReport(workerId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    const worker = await this.repository.findOne({
      where: { id: workerId },
      relations: ['assignments']
    });

    if (!worker) {
      return null;
    }

    const assignments = worker.assignments?.filter(assignment => 
      assignment.plannedStartDate >= dateRange.start && 
      assignment.plannedEndDate <= dateRange.end
    ) || [];

    const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 3600 * 24));
    const totalWorkingHours = totalDays * worker.standardWorkingHours;
    
    const utilizedHours = assignments.reduce((sum, assignment) => {
      const assignmentDays = Math.ceil((assignment.plannedEndDate.getTime() - assignment.plannedStartDate.getTime()) / (1000 * 3600 * 24));
      return sum + (assignmentDays * assignment.dailyHours * (assignment.allocationPercentage / 100));
    }, 0);

    return {
      workerId,
      workerName: worker.fullName,
      trade: worker.primaryTrade,
      totalWorkingHours,
      utilizedHours,
      utilizationPercentage: (utilizedHours / totalWorkingHours) * 100,
      assignments: assignments.map(assignment => ({
        activityId: assignment.activityId,
        startDate: assignment.plannedStartDate,
        endDate: assignment.plannedEndDate,
        dailyHours: assignment.dailyHours,
        allocationPercentage: assignment.allocationPercentage
      }))
    };
  }

  async save(worker: WorkforceEntity): Promise<WorkforceEntity> {
    return await this.repository.save(worker);
  }

  async updateAvailability(workerId: string, availability: { 
    from: Date; 
    to: Date; 
    isAvailable: boolean 
  }): Promise<boolean> {
    const result = await this.repository.update(workerId, {
      isAvailable: availability.isAvailable,
      availableFrom: availability.from,
      availableUntil: availability.to
    });

    return result.affected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}