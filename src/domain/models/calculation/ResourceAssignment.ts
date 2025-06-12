// src/domain/models/calculation/ResourceAssignment.ts
export interface ResourceAssignment {
    id: string;
    activityId: string;
    assignmentDate: Date;
    plannedStartDate: Date;
    plannedEndDate: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
    allocationPercentage: number;
    dailyHours: number;
    role?: string;
    responsibilities?: string;
    plannedCost: number;
    actualCost: number;
    negotiatedRate?: number;
    status: 'assigned' | 'active' | 'completed' | 'cancelled' | 'on_hold';
    productivityFactor: number;
    performanceRating?: number;
    notes?: string;
    workforceId?: string;
    equipmentId?: string;
    customFields?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateResourceAssignmentDTO {
    activityId: string;
    assignmentDate: Date;
    plannedStartDate: Date;
    plannedEndDate: Date;
    allocationPercentage?: number;
    dailyHours?: number;
    role?: string;
    responsibilities?: string;
    plannedCost?: number;
    negotiatedRate?: number;
    status?: 'assigned' | 'active' | 'completed' | 'cancelled' | 'on_hold';
    productivityFactor?: number;
    notes?: string;
    workforceId?: string;
    equipmentId?: string;
    customFields?: Record<string, any>;
  }
  
  export interface UpdateResourceAssignmentDTO extends Partial<CreateResourceAssignmentDTO> {
    id: string;
    actualStartDate?: Date;
    actualEndDate?: Date;
    actualCost?: number;
    performanceRating?: number;
  }
  
  export interface ResourceConflict {
    resourceId: string;
    resourceType: 'workforce' | 'equipment';
    conflictingAssignments: {
      assignmentId: string;
      activityId: string;
      startDate: Date;
      endDate: Date;
    }[];
    severity: 'low' | 'medium' | 'high';
    recommendations: string[];
  }
  
  export interface ResourceUtilization {
    resourceId: string;
    resourceType: 'workforce' | 'equipment';
    resourceName: string;
    totalAssignments: number;
    totalHours: number;
    utilizationPercentage: number;
    averageAllocation: number;
    peakDemandDays: Date[];
    availableCapacity: number;
  }
  
  // Re-export entity for compatibility
  export { ResourceAssignmentEntity } from '../../../infrastructure/database/entities/ResourceAssignmentEntity';