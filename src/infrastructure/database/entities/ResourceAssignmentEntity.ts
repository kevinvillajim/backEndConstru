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
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
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

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  totalCost: number;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => ScheduleActivityEntity, (activity: ScheduleActivityEntity) => activity.assignments, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'activityId' })
  activity: ScheduleActivityEntity;

  @ManyToOne(() => WorkforceEntity, (workforce: WorkforceEntity) => workforce.assignments, {
    nullable: true,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'resourceId' })
  workforce: WorkforceEntity;

  @ManyToOne(() => EquipmentEntity, (equipment: EquipmentEntity) => equipment.assignments, {
    nullable: true,
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'resourceId' })
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
      } else if (percentage > 0 && this.status === AssignmentStatus.PENDING) {
        this.status = AssignmentStatus.ACTIVE;
        if (!this.startDate) {
          this.startDate = new Date();
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
    if (this.startDate && this.endDate) {
      return Math.abs(this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24);
    }
    return 0;
  }
}