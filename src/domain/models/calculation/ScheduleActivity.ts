// src/domain/models/calculation/ScheduleActivity.ts
export enum ActivityStatus {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    ON_HOLD = 'on_hold',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    DELAYED = 'delayed',
    REWORK_REQUIRED = 'rework_required'
  }
  
  export enum ActivityType {
    CONSTRUCTION = 'construction',
    INSTALLATION = 'installation',
    INSPECTION = 'inspection',
    DELIVERY = 'delivery',
    APPROVAL = 'approval',
    MILESTONE = 'milestone',
    BUFFER = 'buffer'
  }
  
  export enum ActivityPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    CRITICAL = 'critical'
  }
  
  export enum ConstructionTrade {
    EXCAVATION = 'excavation',
    CONCRETE = 'concrete',
    MASONRY = 'masonry',
    STEEL = 'steel',
    CARPENTRY = 'carpentry',
    ELECTRICAL = 'electrical',
    PLUMBING = 'plumbing',
    PAINTING = 'painting',
    FINISHING = 'finishing',
    LANDSCAPING = 'landscaping'
  }
  
  export interface ScheduleActivity {
    id: string;
    scheduleId: string;
    name: string;
    description?: string;
    status: ActivityStatus;
    activityType: ActivityType;
    priority: ActivityPriority;
    primaryTrade?: ConstructionTrade;
    plannedStartDate: Date;
    plannedEndDate: Date;
    plannedDurationDays: number;
    actualStartDate?: Date;
    actualEndDate?: Date;
    actualDurationDays: number;
    earlyStartDate?: Date;
    earlyFinishDate?: Date;
    lateStartDate?: Date;
    lateFinishDate?: Date;
    totalFloat: number;
    freeFloat: number;
    progressPercentage: number;
    isCriticalPath: boolean;
    isMilestone: boolean;
    workConfiguration: {
      workingHours: {
        dailyHours: number;
        startTime: string;
        endTime: string;
        workingDays: number[];
      };
      shifts: {
        shiftNumber: number;
        startTime: string;
        endTime: string;
        workers: number;
      }[];
      overtime: {
        maxOvertimeHours: number;
        overtimeRate: number;
      };
    };
    workQuantities: {
      unit: string;
      plannedQuantity: number;
      completedQuantity: number;
      remainingQuantity: number;
      productivity: number;
    };
    plannedLaborCost: number;
    plannedMaterialCost: number;
    plannedEquipmentCost: number;
    plannedTotalCost: number;
    actualLaborCost: number;
    actualMaterialCost: number;
    actualEquipmentCost: number;
    actualTotalCost: number;
    predecessors?: {
      activityId: string;
      dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
      lagDays: number;
    }[];
    successors?: {
      activityId: string;
      dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
      lagDays: number;
    }[];
    alertConfiguration?: {
      delayAlert: {
        enabled: boolean;
        thresholdDays: number;
        recipients: string[];
      };
      qualityAlert: {
        enabled: boolean;
        inspectionRequired: boolean;
        qualityStandard: string;
      };
      resourceAlert: {
        enabled: boolean;
        minResourceUtilization: number;
        maxResourceUtilization: number;
      };
    };
    environmentalFactors?: {
      weatherSensitive: boolean;
      seasonalAdjustments: {
        month: number;
        productivityFactor: number;
      }[];
      workingConditions: {
        indoorWork: boolean;
        heightWork: boolean;
        noiseSensitive: boolean;
        dustSensitive: boolean;
      };
    };
    qualityControl?: {
      inspectionRequired: boolean;
      inspectionPoints: string[];
      qualityStandards: string[];
      testingRequired: boolean;
      approvalRequired: boolean;
      reworkProbability: number;
    };
    location?: {
      area: string;
      floor: string;
      zone: string;
      coordinates: {
        x: number;
        y: number;
        z: number;
      };
    };
    resourceAssignments?: string[]; // Array of ResourceAssignment IDs
    progressReports?: string[]; // Array of ProgressTracking IDs
    customFields?: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateScheduleActivityDTO {
    scheduleId: string;
    name: string;
    description?: string;
    activityType: ActivityType;
    priority?: ActivityPriority;
    primaryTrade?: ConstructionTrade;
    plannedStartDate: Date;
    plannedEndDate: Date;
    plannedDurationDays: number;
    workConfiguration: ScheduleActivity['workConfiguration'];
    workQuantities: ScheduleActivity['workQuantities'];
    plannedLaborCost?: number;
    plannedMaterialCost?: number;
    plannedEquipmentCost?: number;
    plannedTotalCost?: number;
    predecessors?: ScheduleActivity['predecessors'];
    alertConfiguration?: ScheduleActivity['alertConfiguration'];
    environmentalFactors?: ScheduleActivity['environmentalFactors'];
    qualityControl?: ScheduleActivity['qualityControl'];
    location?: ScheduleActivity['location'];
    customFields?: Record<string, any>;
  }
  
  export interface UpdateScheduleActivityDTO extends Partial<CreateScheduleActivityDTO> {
    id: string;
    status?: ActivityStatus;
    actualStartDate?: Date;
    actualEndDate?: Date;
    actualDurationDays?: number;
    progressPercentage?: number;
    actualLaborCost?: number;
    actualMaterialCost?: number;
    actualEquipmentCost?: number;
    actualTotalCost?: number;
  }
  
  export interface ActivityDependency {
    activityId: string;
    dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
    lagDays: number;
  }
  
  export interface CriticalPathActivity extends ScheduleActivity {
    criticality: number;
    impactOnProject: number;
  }
  
  // Re-export entity for compatibility
  export { ScheduleActivityEntity } from '../../../infrastructure/database/entities/ScheduleActivityEntity';