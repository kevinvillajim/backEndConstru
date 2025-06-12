import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ScheduleTemplateEntity } from './ScheduleTemplateEntity';

export enum ActivityType {
  PREPARATION = 'preparation',
  EXCAVATION = 'excavation',
  FOUNDATION = 'foundation',
  STRUCTURE = 'structure',
  MASONRY = 'masonry',
  ROOFING = 'roofing',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  FINISHING = 'finishing',
  INSPECTION = 'inspection',
  CLEANUP = 'cleanup',
  OTHER = 'other'
}

export enum ActivityCategory {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  OPTIONAL = 'optional'
}

export enum ActivityStatus {
  TEMPLATE = 'template',
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('schedule_activity_templates')
export class ScheduleActivityTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  scheduleTemplateId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ActivityType
  })
  type: ActivityType;

  @Column({
    type: 'enum',
    enum: ActivityCategory,
    default: ActivityCategory.MAJOR
  })
  category: ActivityCategory;

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.TEMPLATE
  })
  status: ActivityStatus;

  @Column('int')
  estimatedDurationDays: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  estimatedCost: number;

  @Column('int', { default: 0 })
  orderIndex: number;

  @Column('json', { nullable: true })
  predecessors: string[]; // Array de IDs de actividades predecesoras

  @Column('json', { nullable: true })
  successors: string[]; // Array de IDs de actividades sucesoras

  @Column('json', { nullable: true })
  requiredResources: {
    resourceType: string;
    resourceId?: string;
    quantity: number;
    unit: string;
  }[];

  @Column('json', { nullable: true })
  deliverables: {
    name: string;
    description?: string;
    required: boolean;
  }[];

  @Column('json', { nullable: true })
  qualityChecks: {
    checkName: string;
    description: string;
    required: boolean;
  }[];

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  bufferPercentage: number; // Porcentaje de tiempo adicional como buffer

  @Column('json', { nullable: true })
  dependencies: {
    activityId: string;
    dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
    lagDays?: number;
  }[];

  @Column('text', { nullable: true })
  instructions: string;

  @Column('text', { nullable: true })
  safetyRequirements: string;

  @Column('json', { nullable: true })
  milestones: {
    name: string;
    description?: string;
    dayOffset: number; // Días desde el inicio de la actividad
  }[];

  @Column('boolean', { default: false })
  isCriticalPath: boolean;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => ScheduleTemplateEntity, (template: ScheduleTemplateEntity) => template.activities, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'scheduleTemplateId' })
  scheduleTemplate: ScheduleTemplateEntity;

  // Métodos de utilidad
  calculateTotalDuration(): number {
    const bufferDays = (this.estimatedDurationDays * this.bufferPercentage) / 100;
    return this.estimatedDurationDays + bufferDays;
  }

  addPredecessor(activityId: string): void {
    if (!this.predecessors) {
      this.predecessors = [];
    }
    
    if (!this.predecessors.includes(activityId)) {
      this.predecessors.push(activityId);
    }
  }

  removePredecessor(activityId: string): void {
    if (this.predecessors) {
      this.predecessors = this.predecessors.filter(id => id !== activityId);
    }
  }

  addSuccessor(activityId: string): void {
    if (!this.successors) {
      this.successors = [];
    }
    
    if (!this.successors.includes(activityId)) {
      this.successors.push(activityId);
    }
  }

  removeSuccessor(activityId: string): void {
    if (this.successors) {
      this.successors = this.successors.filter(id => id !== activityId);
    }
  }

  addRequiredResource(resourceType: string, quantity: number, unit: string, resourceId?: string): void {
    if (!this.requiredResources) {
      this.requiredResources = [];
    }
    
    this.requiredResources.push({
      resourceType,
      resourceId,
      quantity,
      unit
    });
  }

  removeRequiredResource(index: number): void {
    if (this.requiredResources && index >= 0 && index < this.requiredResources.length) {
      this.requiredResources.splice(index, 1);
    }
  }

  addDeliverable(name: string, description?: string, required: boolean = true): void {
    if (!this.deliverables) {
      this.deliverables = [];
    }
    
    this.deliverables.push({
      name,
      description,
      required
    });
  }

  removeDeliverable(index: number): void {
    if (this.deliverables && index >= 0 && index < this.deliverables.length) {
      this.deliverables.splice(index, 1);
    }
  }

  addQualityCheck(checkName: string, description: string, required: boolean = true): void {
    if (!this.qualityChecks) {
      this.qualityChecks = [];
    }
    
    this.qualityChecks.push({
      checkName,
      description,
      required
    });
  }

  removeQualityCheck(index: number): void {
    if (this.qualityChecks && index >= 0 && index < this.qualityChecks.length) {
      this.qualityChecks.splice(index, 1);
    }
  }

  addMilestone(name: string, dayOffset: number, description?: string): void {
    if (!this.milestones) {
      this.milestones = [];
    }
    
    this.milestones.push({
      name,
      description,
      dayOffset
    });
    
    // Ordenar milestones por dayOffset
    this.milestones.sort((a, b) => a.dayOffset - b.dayOffset);
  }

  removeMilestone(index: number): void {
    if (this.milestones && index >= 0 && index < this.milestones.length) {
      this.milestones.splice(index, 1);
    }
  }

  hasPredecessors(): boolean {
    return this.predecessors && this.predecessors.length > 0;
  }

  hasSuccessors(): boolean {
    return this.successors && this.successors.length > 0;
  }

  getResourceCost(): number {
    if (!this.requiredResources) {
      return 0;
    }
    
    // Esta es una estimación simplificada
    // En una implementación real, necesitarías acceso a los costos de recursos
    return this.requiredResources.reduce((total, resource) => {
      // Asumir un costo base por unidad de recurso
      const baseCost = this.getBaseCostForResourceType(resource.resourceType);
      return total + (resource.quantity * baseCost);
    }, 0);
  }

  private getBaseCostForResourceType(resourceType: string): number {
    // Costos base estimados por tipo de recurso
    const baseCosts: { [key: string]: number } = {
      workforce: 25, // $25 por hora
      equipment: 100, // $100 por hora
      material: 50 // $50 por unidad
    };
    
    return baseCosts[resourceType] || 0;
  }

  clone(): Partial<ScheduleActivityTemplateEntity> {
    return {
      name: `${this.name} (Copy)`,
      description: this.description,
      type: this.type,
      category: this.category,
      estimatedDurationDays: this.estimatedDurationDays,
      estimatedCost: this.estimatedCost,
      requiredResources: this.requiredResources ? [...this.requiredResources] : undefined,
      deliverables: this.deliverables ? [...this.deliverables] : undefined,
      qualityChecks: this.qualityChecks ? [...this.qualityChecks] : undefined,
      bufferPercentage: this.bufferPercentage,
      instructions: this.instructions,
      safetyRequirements: this.safetyRequirements,
      milestones: this.milestones ? [...this.milestones] : undefined
    };
  }
}