import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ResourceAssignmentEntity } from './ResourceAssignmentEntity';
import { UserEntity } from './UserEntity';

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

export enum GeographicalZone {
  QUITO = 'quito',
  GUAYAQUIL = 'guayaquil',
  CUENCA = 'cuenca',
  COSTA = 'costa',
  SIERRA = 'sierra',
  ORIENTE = 'oriente',
  INSULAR = 'insular'
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

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  serialNumber: string;

  @Column({ type: 'integer', nullable: true })
  manufacturingYear: number;

  // PROPIEDAD AGREGADA - Esta se estaba usando en el repositorio
  @Column({
    type: 'enum',
    enum: EquipmentType
  })
  equipmentType: EquipmentType;

  // Alias para compatibilidad con código existente
  get type(): EquipmentType {
    return this.equipmentType;
  }

  set type(value: EquipmentType) {
    this.equipmentType = value;
  }

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

  // PROPIEDAD AGREGADA - Disponibilidad
  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'date', nullable: true })
  availableFrom: Date;

  @Column({ type: 'date', nullable: true })
  availableUntil: Date;

  // Costos
  @Column('decimal', { precision: 8, scale: 2 })
  hourlyRate: number;

  // PROPIEDADES AGREGADAS - Costos adicionales
  @Column('decimal', { precision: 8, scale: 2 })
  dailyRentalCost: number;

  @Column('decimal', { precision: 8, scale: 2 })
  hourlyOperatingCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  mobilizationCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  demobilizationCost: number;

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

  @Column({ type: 'varchar', length: 200, nullable: true })
  currentLocation: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operator: string;

  // PROPIEDAD AGREGADA - Zona geográfica
  @Column({
    type: 'enum',
    enum: GeographicalZone
  })
  geographicalZone: GeographicalZone;

  // PROPIEDADES AGREGADAS - Especificaciones detalladas
  @Column({ type: 'json', nullable: true })
  specifications: {
    capacity: {
      value: number;
      unit: string;
    };
    dimensions: {
      length: number;
      width: number;
      height: number;
      weight: number;
    };
    performance: {
      maxReach: number;
      operatingSpeed: number;
      fuelConsumption: number;
    };
    requirements: {
      operatorRequired: boolean;
      powerType: string;
      specialPermits: string[];
    };
  };

  // PROPIEDADES AGREGADAS - Mantenimiento
  @Column({ type: 'json', nullable: true })
  maintenanceSchedule: {
    lastMaintenance: Date;
    nextMaintenance: Date;
    maintenanceType: string;
    maintenanceInterval: number;
    hoursUntilMaintenance: number;
  };

  @Column({ type: 'json', nullable: true })
  maintenanceHistory: {
    date: Date;
    type: string;
    description: string;
    cost: number;
    performedBy: string;
  }[];

  // PROPIEDADES AGREGADAS - Certificaciones y seguridad
  @Column({ type: 'json', nullable: true })
  certifications: {
    certificationType: string;
    issueDate: Date;
    expiryDate: Date;
    certifyingBody: string;
  }[];

  @Column({ type: 'json', nullable: true })
  safetyFeatures: string[];

  @Column({ type: 'date', nullable: true })
  lastSafetyInspection: Date;

  @Column({ type: 'date', nullable: true })
  nextSafetyInspection: Date;

  @Column('text', { nullable: true })
  notes: string;

  // PROPIEDADES AGREGADAS - Propiedad y campos personalizados
  @Column({ type: 'uuid', nullable: true })
  ownerId: string;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => ResourceAssignmentEntity, assignment => assignment.equipment)
  assignments: ResourceAssignmentEntity[];

  @ManyToOne(() => UserEntity, user => user.id, { nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity;

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

  isEquipmentAvailable(): boolean {
    return this.status === EquipmentStatus.AVAILABLE && this.isAvailable;
  }

  canOperate(requestedHours: number): boolean {
    if (!this.isEquipmentAvailable()) {
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

    // Actualizar cronograma de mantenimiento
    if (this.maintenanceSchedule) {
      this.maintenanceSchedule.lastMaintenance = new Date();
      if (this.maintenanceSchedule.maintenanceInterval) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + this.maintenanceSchedule.maintenanceInterval);
        this.maintenanceSchedule.nextMaintenance = nextDate;
        this.maintenanceSchedule.hoursUntilMaintenance = this.maintenanceSchedule.maintenanceInterval * 8;
      }
    }
  }

  getActiveAssignments(): ResourceAssignmentEntity[] {
    return this.assignments?.filter(assignment => 
      assignment.status === 'active' || assignment.status === 'assigned'
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

  // MÉTODOS ADICIONALES para compatibilidad con el sistema
  getDailyOperatingCost(): number {
    const dailyHours = this.maxOperatingHoursPerDay || 8;
    return this.calculateTotalOperatingCost(dailyHours);
  }

  isInMaintenanceWindow(): boolean {
    if (!this.maintenanceSchedule?.nextMaintenance) return false;
    
    const now = new Date();
    const nextMaintenance = new Date(this.maintenanceSchedule.nextMaintenance);
    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilMaintenance <= 7; // Dentro de la ventana de 7 días
  }

  getMaintenanceStatus(): string {
    if (this.status === EquipmentStatus.MAINTENANCE) return 'in_maintenance';
    if (this.needsMaintenance()) return 'needs_maintenance';
    if (this.isInMaintenanceWindow()) return 'maintenance_due_soon';
    return 'maintenance_ok';
  }

  getCapacityInfo(): string {
    if (this.specifications?.capacity) {
      return `${this.specifications.capacity.value} ${this.specifications.capacity.unit}`;
    }
    return 'N/A';
  }

  requiresOperator(): boolean {
    return this.specifications?.requirements?.operatorRequired || false;
  }

  getSpecialPermits(): string[] {
    return this.specifications?.requirements?.specialPermits || [];
  }
}