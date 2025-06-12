// src/domain/models/calculation/ProgressTracking.ts
export enum ProgressReportType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MILESTONE = 'milestone',
    INCIDENT = 'incident',
    QUALITY = 'quality',
    SAFETY = 'safety'
  }
  
  export interface ProgressTracking {
    id: string;
    scheduleId: string;
    reportDate: Date;
    reportTime?: string;
    reportType: ProgressReportType;
    title: string;
    description?: string;
    overallProgress: number;
    previousProgress?: number;
    progressToday: number;
    activityProgress?: {
      activityId: string;
      activityName: string;
      previousProgress: number;
      currentProgress: number;
      progressToday: number;
      notes: string;
    }[];
    resourcesUsed?: {
      workforce: {
        trade: string;
        workersPresent: number;
        workersPlanned: number;
        hoursWorked: number;
        productivity: number;
      }[];
      equipment: {
        equipmentId: string;
        equipmentName: string;
        hoursUsed: number;
        hoursPlanned: number;
        efficiency: number;
      }[];
      materials: {
        materialId: string;
        materialName: string;
        quantityUsed: number;
        quantityPlanned: number;
        unit: string;
      }[];
    };
    workingConditions?: {
      weather: {
        condition: string;
        temperature: number;
        humidity: number;
        rainfall: number;
        workingSuitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
      };
      workingHours: {
        startTime: string;
        endTime: string;
        breaks: number;
        overtimeHours: number;
      };
      siteConditions: {
        accessibility: 'excellent' | 'good' | 'fair' | 'poor';
        safety: 'excellent' | 'good' | 'fair' | 'poor';
        organization: 'excellent' | 'good' | 'fair' | 'poor';
      };
    };
    issues?: {
      type: 'delay' | 'quality' | 'safety' | 'resource' | 'weather' | 'other';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      impact: string;
      proposedSolution: string;
      responsiblePerson: string;
      targetResolutionDate: Date;
      status: 'open' | 'in_progress' | 'resolved' | 'closed';
    }[];
    qualityControl?: {
      inspections: {
        type: string;
        result: 'passed' | 'failed' | 'conditional';
        inspector: string;
        notes: string;
      }[];
      defects: {
        location: string;
        description: string;
        severity: 'minor' | 'major' | 'critical';
        status: 'open' | 'fixed' | 'verified';
      }[];
      tests: {
        testType: string;
        result: string;
        standard: string;
        passed: boolean;
      }[];
    };
    safetyReport?: {
      incidents: {
        type: string;
        severity: 'near_miss' | 'first_aid' | 'medical' | 'lost_time';
        description: string;
        personInvolved: string;
        actionTaken: string;
      }[];
      safetyObservations: {
        observation: string;
        riskLevel: 'low' | 'medium' | 'high';
        correctionRequired: boolean;
      }[];
      ppe_compliance: number;
    };
    attachments?: {
      type: 'photo' | 'video' | 'document';
      filename: string;
      url: string;
      description: string;
      timestamp: Date;
      geoLocation: {
        latitude: number;
        longitude: number;
        accuracy: number;
      };
    }[];
    dailyLaborCost: number;
    dailyMaterialCost: number;
    dailyEquipmentCost: number;
    totalDailyCost: number;
    nextDayPlan?: {
      activities: string[];
      requiredResources: {
        workforce: { trade: string; quantity: number }[];
        equipment: { type: string; quantity: number }[];
        materials: { material: string; quantity: number }[];
      };
      expectedDeliveries: {
        supplier: string;
        materials: string[];
        expectedTime: string;
      }[];
      specialConsiderations: string[];
    };
    reportedById: string;
    approvedById?: string;
    isApproved: boolean;
    approvedAt?: Date;
    customFields?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateProgressTrackingDTO {
    scheduleId: string;
    reportDate: Date;
    reportTime?: string;
    reportType: ProgressReportType;
    title: string;
    description?: string;
    overallProgress: number;
    progressToday: number;
    reportedById: string;
    activityProgress?: ProgressTracking['activityProgress'];
    resourcesUsed?: ProgressTracking['resourcesUsed'];
    workingConditions?: ProgressTracking['workingConditions'];
    issues?: ProgressTracking['issues'];
    qualityControl?: ProgressTracking['qualityControl'];
    safetyReport?: ProgressTracking['safetyReport'];
    attachments?: ProgressTracking['attachments'];
    dailyLaborCost?: number;
    dailyMaterialCost?: number;
    dailyEquipmentCost?: number;
    totalDailyCost?: number;
    nextDayPlan?: ProgressTracking['nextDayPlan'];
    customFields?: Record<string, any>;
  }
  
  export interface UpdateProgressTrackingDTO extends Partial<CreateProgressTrackingDTO> {
    id: string;
  }
  
  // Re-export entity for compatibility
  export { ProgressTrackingEntity } from '../../../infrastructure/database/entities/ProgressTrackingEntity';