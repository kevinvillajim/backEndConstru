import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Importar las entidades necesarias
import { ScheduleActivityEntity } from './ScheduleActivityEntity';
import { WorkforceEntity } from './WorkforceEntity';
import { EquipmentEntity } from './EquipmentEntity';

export enum ResourceType {
  WORKFORCE = 'workforce',
  EQUIPMENT = 'equipment',
  MATERIAL = 'material'
}

export enum AssignmentStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

@Entity('resource_assignments')
export class ResourceAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ResourceType
  })
  resourceType: ResourceType;

  @Column('uuid')
  resourceId: string;

  @Column('uuid')
  activityId: string;

  // Fechas de asignación planificadas - PROPIEDADES AGREGADAS
  @Column({ type: 'date' })
  assignmentDate: Date;

  @Column({ type: 'date' })
  plannedStartDate: Date;

  @Column({ type: 'date' })
  plannedEndDate: Date;

  @Column({ type: 'date', nullable: true })
  actualStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  actualEndDate?: Date;

  // Asignación y costos - PROPIEDADES AGREGADAS
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  allocationPercentage: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 8 })
  dailyHours: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  role?: string;

  @Column({ type: 'text', nullable: true })
  responsibilities?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  totalCost: number;

  // Costos planificados y reales - PROPIEDADES AGREGADAS
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  plannedCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  negotiatedRate?: number;

  // Productividad y rendimiento - PROPIEDADES AGREGADAS
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  productivityFactor: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  performanceRating?: number;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING
  })
  status: AssignmentStatus;

  @Column('timestamp', { nullable: true })
  startDate: Date;

  @Column('timestamp', { nullable: true })
  endDate: Date;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column('text', { nullable: true })
  notes: string;

  // Referencias a workforce y equipment - PROPIEDADES AGREGADAS
  @Column({ type: 'uuid', nullable: true })
  workforceId?: string;

  @Column({ type: 'uuid', nullable: true })
  equipmentId?: string;

  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => ScheduleActivityEntity, (activity: ScheduleActivityEntity) => activity.resourceAssignments, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'activityId' })
  activity: ScheduleActivityEntity;

  @ManyToOne(() => WorkforceEntity, (workforce: WorkforceEntity) => workforce.assignments, {
    nullable: true,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'workforceId' })
  workforce: WorkforceEntity;

  @ManyToOne(() => EquipmentEntity, (equipment: EquipmentEntity) => equipment.assignments, {
    nullable: true,
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'equipmentId' })
  equipment: EquipmentEntity;

  // Métodos de utilidad
  calculateTotalCost(): number {
    if (this.unitCost && this.quantity) {
      return this.unitCost * this.quantity;
    }
    return 0;
  }

  updateProgress(percentage: number): void {
    if (percentage >= 0 && percentage <= 100) {
      this.progressPercentage = percentage;
      
      if (percentage === 100) {
        this.status = AssignmentStatus.COMPLETED;
        this.endDate = new Date();
        this.actualEndDate = new Date();
      } else if (percentage > 0 && this.status === AssignmentStatus.PENDING) {
        this.status = AssignmentStatus.ACTIVE;
        if (!this.startDate) {
          this.startDate = new Date();
        }
        if (!this.actualStartDate) {
          this.actualStartDate = new Date();
        }
      }
    }
  }

  isActive(): boolean {
    return this.status === AssignmentStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.status === AssignmentStatus.COMPLETED;
  }

  getDuration(): number {
    if (this.actualStartDate && this.actualEndDate) {
      return Math.abs(this.actualEndDate.getTime() - this.actualStartDate.getTime()) / (1000 * 60 * 60 * 24);
    }
    if (this.plannedStartDate && this.plannedEndDate) {
      return Math.abs(this.plannedEndDate.getTime() - this.plannedStartDate.getTime()) / (1000 * 60 * 60 * 24);
    }
    return 0;
  }

  // MÉTODOS ADICIONALES para compatibilidad con el sistema
  getPlannedDuration(): number {
    if (this.plannedStartDate && this.plannedEndDate) {
      return Math.abs(this.plannedEndDate.getTime() - this.plannedStartDate.getTime()) / (1000 * 60 * 60 * 24);
    }
    return 0;
  }

  getActualDuration(): number {
    if (this.actualStartDate && this.actualEndDate) {
      return Math.abs(this.actualEndDate.getTime() - this.actualStartDate.getTime()) / (1000 * 60 * 60 * 24);
    }
    return 0;
  }

  getEfficiency(): number {
    const planned = this.getPlannedDuration();
    const actual = this.getActualDuration();
    
    if (actual === 0) return 1;
    return planned / actual;
  }

  canBeModified(): boolean {
    return this.status === AssignmentStatus.PENDING || this.status === AssignmentStatus.ASSIGNED;
  }

  isOverallocated(): boolean {
    return this.allocationPercentage > 100;
  }

  getResourceName(): string {
    if (this.workforce) {
      return this.workforce.name;
    }
    if (this.equipment) {
      return this.equipment.name;
    }
    return 'Unknown Resource';
  }
}