// ===== WorkforceRepository.ts (Domain Interface) =====
import { WorkforceEntity, WorkforceType, CertificationLevel } from '../models/calculation/Workforce';

export interface WorkforceRepository {
  findById(id: string): Promise<WorkforceEntity | null>;
  findByTrade(trade: string): Promise<WorkforceEntity[]>;
  findAvailable(dateRange: { start: Date; end: Date }, trade?: string): Promise<WorkforceEntity[]>;
  findByGeographicalZone(zone: string): Promise<WorkforceEntity[]>;
  findByCertificationLevel(level: CertificationLevel): Promise<WorkforceEntity[]>;
  findByType(type: WorkforceType): Promise<WorkforceEntity[]>;
  searchWorkers(criteria: {
    trade?: string;
    zone?: string;
    minExperience?: number;
    maxRate?: number;
    skills?: string[];
  }): Promise<WorkforceEntity[]>;
  getUtilizationReport(workerId: string, dateRange: { start: Date; end: Date }): Promise<any>;
  save(worker: WorkforceEntity): Promise<WorkforceEntity>;
  updateAvailability(workerId: string, availability: { from: Date; to: Date; isAvailable: boolean }): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}