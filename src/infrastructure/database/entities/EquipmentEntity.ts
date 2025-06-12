// ===== EquipmentEntity.ts =====

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

@Entity('equipment')
@Index(['equipmentType', 'isAvailable'])
@Index(['geographicalZone', 'condition'])
export class EquipmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  equipmentType: string; // Excavadora, Grúa, Mezcladora, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  serialNumber: string;

  @Column({ type: 'integer', nullable: true })
  manufacturingYear: number;

  // Estado y disponibilidad
  @Column({
    type: 'enum',
    enum: ['excellent', 'good', 'fair', 'poor', 'out_of_service'],
    default: 'good'
  })
  condition: string;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'date', nullable: true })
  availableFrom: Date;

  @Column({ type: 'date', nullable: true })
  availableUntil: Date;

  // Costos de operación
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  dailyRentalCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourlyOperatingCost: number; // Combustible, operador, etc.

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  mobilizationCost: number; // Costo de transporte

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  demobilizationCost: number;

  // Especificaciones técnicas
  @Column({ type: 'json' })
  specifications: {
    capacity: {
      value: number;
      unit: string; // ton, m³, etc.
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
      powerType: string; // Diesel, Electric, etc.
      specialPermits: string[];
    };
  };

  // Ubicación
  @Column({
    type: 'enum',
    enum: ['QUITO', 'GUAYAQUIL', 'CUENCA', 'COSTA', 'SIERRA', 'ORIENTE', 'INSULAR']
  })
  geographicalZone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  currentLocation: string;

  // Mantenimiento
  @Column({ type: 'json', nullable: true })
  maintenanceSchedule: {
    lastMaintenance: Date;
    nextMaintenance: Date;
    maintenanceType: string;
    maintenanceInterval: number; // horas
    hoursUntilMaintenance: number;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalOperatingHours: number;

  @Column({ type: 'json', nullable: true })
  maintenanceHistory: {
    date: Date;
    type: string;
    description: string;
    cost: number;
    performedBy: string;
  }[];

  // Seguridad y certificaciones
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

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => UserEntity, user => user.id, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string;

  @OneToMany(() => ResourceAssignmentEntity, assignment => assignment.equipment)
  assignments: ResourceAssignmentEntity[];

  // Métodos calculados
  public get isOperational(): boolean {
    return this.condition !== 'out_of_service' && this.isAvailable;
  }

  public get needsMaintenance(): boolean {
    if (!this.maintenanceSchedule) return false;
    return this.maintenanceSchedule.hoursUntilMaintenance <= 0;
  }

  public get totalDailyCost(): number {
    return this.dailyRentalCost + (this.hourlyOperatingCost * 8); // 8 horas estándar
  }

  public getCostForDays(days: number, includeMobilization: boolean = true): number {
    let cost = this.totalDailyCost * days;
    if (includeMobilization) {
      cost += this.mobilizationCost + this.demobilizationCost;
    }
    return cost;
  }

  public updateOperatingHours(hours: number): void {
    this.totalOperatingHours += hours;
    if (this.maintenanceSchedule) {
      this.maintenanceSchedule.hoursUntilMaintenance -= hours;
    }
  }
}
