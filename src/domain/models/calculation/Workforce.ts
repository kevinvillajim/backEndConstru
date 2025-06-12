// src/domain/models/calculation/Workforce.ts
export enum WorkforceType {
    FOREMAN = 'foreman',
    SKILLED_WORKER = 'skilled_worker',
    HELPER = 'helper',
    SPECIALIST = 'specialist',
    SUPERVISOR = 'supervisor',
    QUALITY_INSPECTOR = 'quality_inspector'
  }
  
  export enum CertificationLevel {
    BASIC = 'basic',
    INTERMEDIATE = 'intermediate', 
    ADVANCED = 'advanced',
    EXPERT = 'expert',
    CERTIFIED = 'certified'
  }
  
  export interface Workforce {
    id: string;
    fullName: string;
    identification: string;
    workerType: WorkforceType;
    primaryTrade: string;
    secondaryTrades?: string[];
    certificationLevel: CertificationLevel;
    hourlyRate: number;
    overtimeRate: number;
    standardWorkingHours: number;
    isAvailable: boolean;
    availableFrom?: Date;
    availableUntil?: Date;
    productivity: {
      [trade: string]: {
        unit: string;
        dailyOutput: number;
        qualityRating: number;
        safetyRating: number;
      }
    };
    productivityFactor: number;
    experienceYears: number;
    geographicalZone: string;
    willingToRelocate: boolean;
    relocationDailyCost: number;
    certifications?: {
      name: string;
      issuer: string;
      issueDate: Date;
      expiryDate: Date;
      certificateNumber: string;
      isActive: boolean;
    }[];
    skills?: {
      skill: string;
      level: CertificationLevel;
      verified: boolean;
    }[];
    workHistory?: {
      projectId: string;
      projectName: string;
      startDate: Date;
      endDate: Date;
      role: string;
      performanceRating: number;
      notes: string;
    }[];
    phone?: string;
    email?: string;
    address?: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
    managedById?: string;
    customFields?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateWorkforceDTO {
    fullName: string;
    identification: string;
    workerType: WorkforceType;
    primaryTrade: string;
    secondaryTrades?: string[];
    certificationLevel?: CertificationLevel;
    hourlyRate: number;
    overtimeRate?: number;
    standardWorkingHours?: number;
    productivity: Workforce['productivity'];
    productivityFactor?: number;
    experienceYears?: number;
    geographicalZone: string;
    willingToRelocate?: boolean;
    relocationDailyCost?: number;
    certifications?: Workforce['certifications'];
    skills?: Workforce['skills'];
    phone?: string;
    email?: string;
    address?: string;
    emergencyContact?: Workforce['emergencyContact'];
    managedById?: string;
    customFields?: Record<string, any>;
  }
  
  export interface UpdateWorkforceDTO extends Partial<CreateWorkforceDTO> {
    id: string;
    isAvailable?: boolean;
    availableFrom?: Date;
    availableUntil?: Date;
    workHistory?: Workforce['workHistory'];
  }
  
  export interface WorkforceAvailability {
    workerId: string;
    workerName: string;
    trade: string;
    isAvailable: boolean;
    availabilityPeriods: {
      startDate: Date;
      endDate: Date;
      availability: 'full' | 'partial' | 'unavailable';
      notes?: string;
    }[];
    currentAssignments: {
      projectId: string;
      projectName: string;
      startDate: Date;
      endDate: Date;
      allocationPercentage: number;
    }[];
  }
  
  export interface WorkforcePerformance {
    workerId: string;
    workerName: string;
    trade: string;
    overallRating: number;
    productivityScore: number;
    qualityScore: number;
    safetyScore: number;
    reliabilityScore: number;
    recentProjects: {
      projectId: string;
      projectName: string;
      rating: number;
      feedback: string;
    }[];
    improvementAreas: string[];
    strengths: string[];
  }
  
  // Re-export entity for compatibility
  export { WorkforceEntity } from '../../../infrastructure/database/entities/WorkforceEntity';