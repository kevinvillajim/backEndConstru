import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ResourceAssignmentEntity } from './ResourceAssignmentEntity';

export enum WorkforceType {
  LABORER = 'laborer',
  SKILLED_WORKER = 'skilled_worker',
  TECHNICIAN = 'technician',
  SUPERVISOR = 'supervisor',
  ENGINEER = 'engineer',
  SPECIALIST = 'specialist'
}

export enum WorkforceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive'
}

@Entity('workforce')
export class WorkforceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: WorkforceType
  })
  type: WorkforceType;

  @Column({
    type: 'enum',
    enum: WorkforceStatus,
    default: WorkforceStatus.AVAILABLE
  })
  status: WorkforceStatus;

  @Column('decimal', { precision: 8, scale: 2 })
  hourlyRate: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  overtimeRate: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  skillLevel: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  specializations: string;

  @Column('int', { default: 8 })
  maxHoursPerDay: number;

  @Column('int', { default: 40 })
  maxHoursPerWeek: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactInfo: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => ResourceAssignmentEntity, assignment => assignment.workforce)
  assignments: ResourceAssignmentEntity[];

  // Métodos de utilidad
  calculateDailyCost(hours: number): number {
    const regularHours = Math.min(hours, this.maxHoursPerDay);
    const overtimeHours = Math.max(0, hours - this.maxHoursPerDay);
    
    let totalCost = regularHours * this.hourlyRate;
    
    if (overtimeHours > 0 && this.overtimeRate) {
      totalCost += overtimeHours * this.overtimeRate;
    }
    
    return totalCost;
  }

  isAvailable(): boolean {
    return this.status === WorkforceStatus.AVAILABLE;
  }

  canWorkHours(requestedHours: number): boolean {
    return requestedHours <= this.maxHoursPerDay && this.isAvailable();
  }

  getActiveAssignments(): ResourceAssignmentEntity[] {
    return this.assignments?.filter(assignment => 
      assignment.status === 'active' || assignment.status === 'pending'
    ) || [];
  }

  getTotalAssignedHours(): number {
    const activeAssignments = this.getActiveAssignments();
    return activeAssignments.reduce((total, assignment) => {
      // Calcular horas basadas en la duración de la asignación
      const duration = assignment.getDuration();
      return total + duration * this.maxHoursPerDay; // Estimación simplificada
    }, 0);
  }
}