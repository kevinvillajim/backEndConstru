// src/domain/models/calculation/ScheduleTemplate.ts
export enum TemplateScope {
    SYSTEM = 'system',
    COMPANY = 'company', 
    PERSONAL = 'personal',
    SHARED = 'shared'
  }
  
  export enum ConstructionPhase {
    PRELIMINARY = 'preliminary',
    FOUNDATION = 'foundation',
    STRUCTURE = 'structure',
    WALLS = 'walls',
    ROOF = 'roof',
    INSTALLATIONS = 'installations',
    FINISHES = 'finishes',
    EXTERIOR = 'exterior',
    CLEANUP = 'cleanup'
  }
  
  export interface ScheduleTemplate {
    id: string;
    name: string;
    description?: string;
    constructionType: string;
    scope: TemplateScope;
    geographicalZone: string;
    estimatedDurationDays: number;
    phaseConfiguration: {
      [phase in ConstructionPhase]: {
        durationPercentage: number;
        startAfterPhase?: ConstructionPhase;
        canOverlapWith?: ConstructionPhase[];
        criticalPath: boolean;
        minDurationDays: number;
        maxDurationDays: number;
      }
    };
    standardResources: {
      workforce: {
        [trade: string]: {
          minWorkers: number;
          maxWorkers: number;
          hourlyRate: number;
          dailyHours: number;
          productivity: number;
        }
      };
      equipment: {
        [equipment: string]: {
          required: boolean;
          dailyCost: number;
          mobilizationCost: number;
          utilization: number;
        }
      };
      materials: {
        deliverySchedule: string[];
        bufferStock: number;
        criticalMaterials: string[];
      };
    };
    geographicalAdjustments: {
      climateFactors: {
        rainySeasonMonths: number[];
        productivityAdjustment: number;
        workingDaysReduction: number;
      };
      logisticsFactors: {
        materialDeliveryDelay: number;
        equipmentAvailability: number;
        laborAvailability: number;
      };
      costsFactors: {
        transportMultiplier: number;
        laborCostMultiplier: number;
        materialCostMultiplier: number;
      };
    };
    activityDependencies: {
      criticalPath: string[];
      parallelActivities: string[][];
      sequentialGroups: {
        groupId: string;
        activities: string[];
        minGapDays: number;
      }[];
    };
    performanceMetrics: {
      productivity: {
        [trade: string]: {
          unit: string;
          averageDaily: number;
          bestCase: number;
          worstCase: number;
        }
      };
      quality: {
        inspectionPoints: number;
        reworkProbability: number;
        qualityDelayDays: number;
      };
      safety: {
        safetyInspections: number;
        riskLevel: 'low' | 'medium' | 'high';
        safetyDelayDays: number;
      };
    };
    controlConfiguration: {
      milestones: {
        name: string;
        percentageComplete: number;
        criticalCheckpoints: string[];
      }[];
      alertThresholds: {
        delayDays: number;
        costVariance: number;
        resourceUtilization: number;
      };
      approvalRequirements: {
        phaseApprovals: ConstructionPhase[];
        inspectionRequirements: string[];
        clientApprovals: string[];
      };
    };
    necCompliance?: {
      applicableNorms: string[];
      inspectionRequirements: {
        phase: ConstructionPhase;
        inspectionType: string;
        requiredBy: string;
        documentation: string[];
      }[];
      qualityStandards: {
        activity: string;
        standard: string;
        tolerance: string;
      }[];
    };
    isVerified: boolean;
    isActive: boolean;
    usageCount: number;
    averageRating: number;
    ratingCount: number;
    tags?: string[];
    version?: string;
    parentTemplateId?: string;
    createdById?: string;
    customFields?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateScheduleTemplateDTO {
    name: string;
    description?: string;
    constructionType: string;
    scope: TemplateScope;
    geographicalZone: string;
    estimatedDurationDays: number;
    phaseConfiguration: ScheduleTemplate['phaseConfiguration'];
    standardResources: ScheduleTemplate['standardResources'];
    geographicalAdjustments: ScheduleTemplate['geographicalAdjustments'];
    activityDependencies: ScheduleTemplate['activityDependencies'];
    performanceMetrics: ScheduleTemplate['performanceMetrics'];
    controlConfiguration: ScheduleTemplate['controlConfiguration'];
    necCompliance?: ScheduleTemplate['necCompliance'];
    tags?: string[];
    version?: string;
    parentTemplateId?: string;
    createdById?: string;
    customFields?: Record<string, any>;
  }
  
  export interface UpdateScheduleTemplateDTO extends Partial<CreateScheduleTemplateDTO> {
    id: string;
    isVerified?: boolean;
    isActive?: boolean;
    usageCount?: number;
    averageRating?: number;
    ratingCount?: number;
  }
  
  export interface TemplateActivityTemplate {
    id: string;
    templateId: string;
    name: string;
    description?: string;
    activityType: string;
    primaryTrade: string;
    estimatedDurationDays: number;
    prerequisites: string[];
    resources: {
      workforce: { trade: string; quantity: number }[];
      equipment: { type: string; quantity: number }[];
      materials: { material: string; quantity: number }[];
    };
    qualityRequirements: string[];
    safetyRequirements: string[];
    order: number;
  }
  
  // Re-export entity for compatibility
  export { ScheduleTemplateEntity } from '../../../infrastructure/database/entities/ScheduleTemplateEntity';