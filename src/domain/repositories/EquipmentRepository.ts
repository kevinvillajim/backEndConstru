// ===== EquipmentRepository.ts (Domain Interface) =====
import { EquipmentEntity } from '../models/calculation/Equipment';

export interface EquipmentRepository {
  findById(id: string): Promise<EquipmentEntity | null>;
  findByType(equipmentType: string): Promise<EquipmentEntity[]>;
  findAvailable(dateRange: { start: Date; end: Date }, equipmentType?: string): Promise<EquipmentEntity[]>;
  findByGeographicalZone(zone: string): Promise<EquipmentEntity[]>;
  findByCondition(condition: string): Promise<EquipmentEntity[]>;
  findNeedingMaintenance(): Promise<EquipmentEntity[]>;
  searchEquipment(criteria: {
    type?: string;
    zone?: string;
    maxDailyCost?: number;
    minCondition?: string;
    specifications?: any;
  }): Promise<EquipmentEntity[]>;
  getUtilizationReport(equipmentId: string, dateRange: { start: Date; end: Date }): Promise<any>;
  save(equipment: EquipmentEntity): Promise<EquipmentEntity>;
  updateMaintenance(equipmentId: string, maintenanceData: {
    lastMaintenance: Date;
    nextMaintenance: Date;
    operatingHours: number;
  }): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}