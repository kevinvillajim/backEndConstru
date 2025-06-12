import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ResourceAssignmentEntity } from './ResourceAssignmentEntity';

export enum EquipmentType {
  EXCAVATOR = 'excavator',
  CRANE = 'crane',
  BULLDOZER = 'bulldozer',
  MIXER = 'mixer',
  TRUCK = 'truck',
  GENERATOR = 'generator',
  COMPRESSOR = 'compressor',
  WELDING_MACHINE = 'welding_machine',
  DRILLING_MACHINE = 'drilling_machine',
  SCAFFOLDING = 'scaffolding',
  HAND_TOOLS = 'hand_tools',
  OTHER = 'other'
}

export enum EquipmentStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order',
  RETIRED = 'retired'
}

export enum EquipmentCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical'
}

@Entity('equipment')
export class EquipmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: EquipmentType
  })
  type: EquipmentType;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.AVAILABLE
  })
  status: EquipmentStatus;

  @Column({
    type: 'enum',
    enum: EquipmentCondition,
    default: EquipmentCondition.GOOD
  })
  condition: EquipmentCondition;

  @Column('decimal', { precision: 8, scale: 2 })
  hourlyRate: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  purchasePrice: number;

  @Column('date', { nullable: true })
  purchaseDate: Date;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  maintenanceCostPerHour: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  fuelCostPerHour: number;

  @Column('int', { nullable: true })
  maxOperatingHoursPerDay: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalOperatingHours: number;

  @Column('date', { nullable: true })
  lastMaintenanceDate: Date;

  @Column('int', { nullable: true })
  maintenanceIntervalHours: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operator: string;

  @Column('text', { nullable: true })
  specifications: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => ResourceAssignmentEntity, assignment => assignment.equipment)
  assignments: ResourceAssignmentEntity[];

  // Métodos de utilidad
  calculateTotalOperatingCost(hours: number): number {
    let totalCost = hours * this.hourlyRate;
    
    if (this.maintenanceCostPerHour) {
      totalCost += hours * this.maintenanceCostPerHour;
    }
    
    if (this.fuelCostPerHour) {
      totalCost += hours * this.fuelCostPerHour;
    }
    
    return totalCost;
  }

  isAvailable(): boolean {
    return this.status === EquipmentStatus.AVAILABLE;
  }

  canOperate(requestedHours: number): boolean {
    if (!this.isAvailable()) {
      return false;
    }
    
    if (this.maxOperatingHoursPerDay && requestedHours > this.maxOperatingHoursPerDay) {
      return false;
    }
    
    return this.condition !== EquipmentCondition.CRITICAL && 
           this.condition !== EquipmentCondition.POOR;
  }

  needsMaintenance(): boolean {
    if (!this.lastMaintenanceDate || !this.maintenanceIntervalHours) {
      return false;
    }
    
    const hoursInOperation = this.totalOperatingHours;
    const lastMaintenanceHours = this.getHoursSinceLastMaintenance();
    
    return lastMaintenanceHours >= this.maintenanceIntervalHours;
  }

  private getHoursSinceLastMaintenance(): number {
    if (!this.lastMaintenanceDate) {
      return 0;
    }
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.lastMaintenanceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Estimación simplificada: asumimos 8 horas de operación por día
    return diffDays * 8;
  }

  addOperatingHours(hours: number): void {
    this.totalOperatingHours += hours;
    
    if (this.needsMaintenance()) {
      this.status = EquipmentStatus.MAINTENANCE;
    }
  }

  performMaintenance(): void {
    this.lastMaintenanceDate = new Date();
    this.status = EquipmentStatus.AVAILABLE;
    
    // Mejorar condición después del mantenimiento
    if (this.condition === EquipmentCondition.POOR) {
      this.condition = EquipmentCondition.FAIR;
    } else if (this.condition === EquipmentCondition.FAIR) {
      this.condition = EquipmentCondition.GOOD;
    }
  }

  getActiveAssignments(): ResourceAssignmentEntity[] {
    return this.assignments?.filter(assignment => 
      assignment.status === 'active' || assignment.status === 'pending'
    ) || [];
  }

  getUtilizationRate(): number {
    const activeAssignments = this.getActiveAssignments();
    if (activeAssignments.length === 0) {
      return 0;
    }
    
    // Calcular tasa de utilización basada en asignaciones activas
    const totalAssignedHours = activeAssignments.reduce((total, assignment) => {
      return total + assignment.getDuration();
    }, 0);
    
    const maxAvailableHours = this.maxOperatingHoursPerDay || 24;
    return Math.min(100, (totalAssignedHours / maxAvailableHours) * 100);
  }
}