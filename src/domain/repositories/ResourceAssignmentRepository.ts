// ===== ResourceAssignmentRepository.ts (Domain Interface) =====
import { ResourceAssignmentEntity } from '../models/calculation/ResourceAssignment';

export interface ResourceAssignmentRepository {
  findById(id: string): Promise<ResourceAssignmentEntity | null>;
  findByActivityId(activityId: string): Promise<ResourceAssignmentEntity[]>;
  findByWorkforceId(workforceId: string): Promise<ResourceAssignmentEntity[]>;
  findByEquipmentId(equipmentId: string): Promise<ResourceAssignmentEntity[]>;
  findByScheduleId(scheduleId: string): Promise<ResourceAssignmentEntity[]>;
  findByResource(resourceId: string, resourceType: string): Promise<ResourceAssignmentEntity[]>;
  findResourceConflicts(resourceId: string, resourceType: 'workforce' | 'equipment', dateRange: { start: Date; end: Date }): Promise<ResourceAssignmentEntity[]>;
  findActiveAssignments(): Promise<ResourceAssignmentEntity[]>;
  getResourceUtilization(dateRange: { start: Date; end: Date }, resourceType?: 'workforce' | 'equipment'): Promise<any[]>;
  save(assignment: ResourceAssignmentEntity): Promise<ResourceAssignmentEntity>;
  saveMany(assignments: ResourceAssignmentEntity[]): Promise<ResourceAssignmentEntity[]>;
  updateStatus(assignmentId: string, status: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}