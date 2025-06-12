  // ===== ResourceAssignmentEntity.ts =====


import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    OneToMany, 
    CreateDateColumn, 
    UpdateDateColumn, 
    JoinColumn,
    Index 
  } from 'typeorm';
  import { UserEntity } from './UserEntity';
  import { ResourceAssignmentEntity } from './ResourceAssignmentEntity';

@Entity('resource_assignments')
@Index(['activityId', 'assignmentDate'])
@Index(['workforceId', 'equipmentId'])
export class ResourceAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  assignmentDate: Date;

  @Column({ type: 'date' })
  plannedStartDate: Date;

  @Column({ type: 'date' })
  plannedEndDate: Date;

  @Column({ type: 'date', nullable: true })
  actualStartDate: Date;

  @Column({ type: 'date', nullable: true })
  actualEndDate: Date;

  // Configuración de la asignación
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  allocationPercentage: number; // % de tiempo asignado

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 8 })
  dailyHours: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  role: string; // Rol específico en la actividad

  @Column({ type: 'text', nullable: true })
  responsibilities: string;

  // Costos
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  plannedCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualCost: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  negotiatedRate: number; // Tarifa negociada específica

  // Estado y rendimiento
  @Column({
    type: 'enum',
    enum: ['assigned', 'active', 'completed', 'cancelled', 'on_hold'],
    default: 'assigned'
  })
  status: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  productivityFactor: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  performanceRating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => ScheduleActivityEntity, activity => activity.resourceAssignments)
  @JoinColumn({ name: 'activity_id' })
  activity: ScheduleActivityEntity;

  @Column({ type: 'uuid' })
  activityId: string;

  @ManyToOne(() => WorkforceEntity, workforce => workforce.assignments, { nullable: true })
  @JoinColumn({ name: 'workforce_id' })
  workforce: WorkforceEntity;

  @Column({ type: 'uuid', nullable: true })
  workforceId: string;

  @ManyToOne(() => EquipmentEntity, equipment => equipment.assignments, { nullable: true })
  @JoinColumn({ name: 'equipment_id' })
  equipment: EquipmentEntity;

  @Column({ type: 'uuid', nullable: true })
  equipmentId: string;

  // Métodos calculados
  public get isWorkforceAssignment(): boolean {
    return this.workforceId !== null;
  }

  public get isEquipmentAssignment(): boolean {
    return this.equipmentId !== null;
  }

  public get costVariance(): number {
    if (!this.plannedCost || this.plannedCost === 0) return 0;
    return ((this.actualCost - this.plannedCost) / this.plannedCost) * 100;
  }

  public get plannedDurationDays(): number {
    return Math.floor((this.plannedEndDate.getTime() - this.plannedStartDate.getTime()) / (1000 * 3600 * 24));
  }

  public get actualDurationDays(): number {
    if (!this.actualStartDate || !this.actualEndDate) return 0;
    return Math.floor((this.actualEndDate.getTime() - this.actualStartDate.getTime()) / (1000 * 3600 * 24));
  }

  public calculateCost(): number {
    const days = this.plannedDurationDays;
    const allocation = this.allocationPercentage / 100;
    
    if (this.workforceId && this.workforce) {
      const rate = this.negotiatedRate || this.workforce.hourlyRate;
      return rate * this.dailyHours * days * allocation;
    }
    
    if (this.equipmentId && this.equipment) {
      const rate = this.negotiatedRate || this.equipment.hourlyOperatingCost;
      return rate * this.dailyHours * days * allocation;
    }
    
    return 0;
  }
}