// src/domain/models/calculation/Equipment.ts
export interface Equipment {
    id: string;
    name: string;
    equipmentType: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    manufacturingYear?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'out_of_service';
    isAvailable: boolean;
    availableFrom?: Date;
    availableUntil?: Date;
    dailyRentalCost: number;
    hourlyOperatingCost: number;
    mobilizationCost: number;
    demobilizationCost: number;
    specifications: {
      capacity: {
        value: number;
        unit: string;
      };
      dimensions: {
        length: number;
        width: number;
        height: number;
        weight: number;
      };
      performance: {
        maxReach: number;
        operatingSpeed: number;
        fuelConsumption: number;
      };
      requirements: {
        operatorRequired: boolean;
        powerType: string;
        specialPermits: string[];
      };
    };
    geographicalZone: string;
    currentLocation?: string;
    maintenanceSchedule?: {
      lastMaintenance: Date;
      nextMaintenance: Date;
      maintenanceType: string;
      maintenanceInterval: number;
      hoursUntilMaintenance: number;
    };
    totalOperatingHours: number;
    maintenanceHistory?: {
      date: Date;
      type: string;
      description: string;
      cost: number;
      performedBy: string;
    }[];
    certifications?: {
      certificationType: string;
      issueDate: Date;
      expiryDate: Date;
      certifyingBody: string;
    }[];
    safetyFeatures?: string[];
    lastSafetyInspection?: Date;
    nextSafetyInspection?: Date;
    ownerId?: string;
    customFields?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateEquipmentDTO {
    name: string;
    equipmentType: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    manufacturingYear?: number;
    condition: 'excellent' | 'good' | 'fair' | 'poor' | 'out_of_service';
    dailyRentalCost: number;
    hourlyOperatingCost: number;
    mobilizationCost: number;
    demobilizationCost: number;
    specifications: Equipment['specifications'];
    geographicalZone: string;
    currentLocation?: string;
    ownerId?: string;
  }
  
  export interface UpdateEquipmentDTO extends Partial<CreateEquipmentDTO> {
    id: string;
  }
  
  // Re-export entity enums and types for compatibility
  export { EquipmentEntity } from '../../../infrastructure/database/entities/EquipmentEntity';