import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn, 
  JoinColumn,
  Index 
} from 'typeorm';
import { ScheduleActivityEntity } from './ScheduleActivityEntity';
import { WorkforceEntity } from './WorkforceEntity';
import { EquipmentEntity } from './EquipmentEntity';
import { MaterialEntity } from './MaterialEntity';

export enum ResourceAssignmentStatus {
  DRAFT = 'draft',
  ASSIGNED = 'assigned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

// EXPORTAR AssignmentStatus como alias para compatibilidad
export const AssignmentStatus = ResourceAssignmentStatus;

export enum ResourceType {
  WORKFORCE = 'WORKFORCE',
  EQUIPMENT = 'EQUIPMENT',
  MATERIAL = 'MATERIAL'
}

@Entity('resource_assignments')
@Index(['activityId', 'resourceType'])
@Index(['assignmentDate'])
@Index(['status'])
export class ResourceAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ResourceType
  })
  resourceType: ResourceType;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 50, default: 'unit' })
  unit: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  allocationPercentage: number;

  @Column({ type: 'date' })
  assignmentDate: Date;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  // PROPIEDADES AGREGADAS para compatibilidad
  @Column({ type: 'date', nullable: true })
  plannedStartDate: Date;

  @Column({ type: 'date', nullable: true })
  plannedEndDate: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 8 })
  dailyHours: number;

  @Column({
    type: 'enum',
    enum: ResourceAssignmentStatus,
    default: ResourceAssignmentStatus.ASSIGNED
  })
  status: ResourceAssignmentStatus;

  // Costos
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  plannedCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualCost: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  dailyRate: number;

  // Configuración de trabajo
  @Column({ type: 'json', nullable: true })
  workConfiguration: {
    hoursPerDay?: number;
    daysPerWeek?: number;
    shiftType?: string;
    overtimeAllowed?: boolean;
    weekendWork?: boolean;
  };

  // Notas y observaciones
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  specialRequirements: string;

  // Tracking de utilización
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  utilizationPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualHoursWorked: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  plannedHours: number;

  // Metadatos
  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

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

  // Relaciones opcionales con recursos específicos
  @ManyToOne(() => WorkforceEntity, { nullable: true })
  @JoinColumn({ name: 'workforce_id' })
  workforce?: WorkforceEntity;

  @Column({ type: 'uuid', nullable: true })
  workforceId?: string;

  @ManyToOne(() => EquipmentEntity, { nullable: true })
  @JoinColumn({ name: 'equipment_id' })
  equipment?: EquipmentEntity;

  @Column({ type: 'uuid', nullable: true })
  equipmentId?: string;

  @ManyToOne(() => MaterialEntity, { nullable: true })
  @JoinColumn({ name: 'material_id' })
  material?: MaterialEntity;

  @Column({ type: 'uuid', nullable: true })
  materialId?: string;

  // Métodos calculados
  public get totalCost(): number {
    return this.actualCost || this.plannedCost || 0;
  }

  public get costVariance(): number {
    if (!this.plannedCost || this.plannedCost === 0) return 0;
    const actual = this.actualCost || 0;
    return ((actual - this.plannedCost) / this.plannedCost) * 100;
  }

  // MÉTODO AGREGADO - Verificar si está sobreasignado
  public isOverallocated?(): boolean {
    return this.allocationPercentage > 100;
  }

  public get isUnderutilized(): boolean {
    return this.utilizationPercentage < 50;
  }

  public get efficiency(): number {
    if (!this.plannedHours || this.plannedHours === 0) return 100;
    if (!this.actualHoursWorked) return 0;
    
    return Math.min(100, (this.plannedHours / this.actualHoursWorked) * 100);
  }

  public get durationDays(): number {
    const endDate = this.plannedEndDate || this.endDate;
    const startDate = this.plannedStartDate || this.startDate;
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  }

  // MÉTODO AGREGADO - Obtener duración
  public getDuration(): number {
    return this.durationDays;
  }

  public get isCurrentlyActive(): boolean {
    const now = new Date();
    const startDate = this.plannedStartDate || this.startDate;
    const endDate = this.plannedEndDate || this.endDate;
    return this.status === ResourceAssignmentStatus.ACTIVE && 
           startDate <= now && 
           endDate >= now;
  }

  public get isPending(): boolean {
    const startDate = this.plannedStartDate || this.startDate;
    return this.status === ResourceAssignmentStatus.ASSIGNED && 
           new Date() < startDate;
  }

  public get isCompleted(): boolean {
    const endDate = this.plannedEndDate || this.endDate;
    return this.status === ResourceAssignmentStatus.COMPLETED ||
           new Date() > endDate;
  }

  // Métodos de utilidad
  public calculatePlannedCost(): number {
    if (this.hourlyRate && this.plannedHours) {
      return this.hourlyRate * this.plannedHours;
    }
    
    if (this.dailyRate) {
      return this.dailyRate * this.durationDays;
    }
    
    return this.plannedCost || 0;
  }

  public updateUtilization(actualHours: number): void {
    this.actualHoursWorked = actualHours;
    
    if (this.plannedHours > 0) {
      this.utilizationPercentage = Math.min(100, (actualHours / this.plannedHours) * 100);
    }
  }

  public canBeReassigned(): boolean {
    const startDate = this.plannedStartDate || this.startDate;
    return [
      ResourceAssignmentStatus.DRAFT,
      ResourceAssignmentStatus.ASSIGNED
    ].includes(this.status) && new Date() < startDate;
  }

  public getResourceName(): string {
    if (this.workforce) return this.workforce.fullName || this.workforce.name || `${this.workforce.primaryTrade} Worker`;
    if (this.equipment) return this.equipment.name || this.equipment.equipmentType;
    if (this.material) return this.material.name || this.material.type;
    return `${this.resourceType} Resource`;
  }

  public getResourceDetails(): any {
    switch (this.resourceType) {
      case ResourceType.WORKFORCE:
        return {
          type: 'workforce',
          trade: this.workforce?.primaryTrade,
          skillLevel: this.workforce?.skillLevel,
          hourlyRate: this.hourlyRate || this.workforce?.hourlyRate
        };
      case ResourceType.EQUIPMENT:
        return {
          type: 'equipment',
          equipmentType: this.equipment?.equipmentType,
          model: this.equipment?.model,
          dailyRate: this.dailyRate || this.equipment?.dailyRentalCost
        };
      case ResourceType.MATERIAL:
        return {
          type: 'material',
          materialType: this.material?.type,
          unit: this.unit,
          unitCost: this.plannedCost || this.material?.unitCost
        };
      default:
        return { type: 'unknown' };
    }
  }

  public clone(): Partial<ResourceAssignmentEntity> {
    return {
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      quantity: this.quantity,
      unit: this.unit,
      allocationPercentage: this.allocationPercentage,
      plannedCost: this.plannedCost,
      hourlyRate: this.hourlyRate,
      dailyRate: this.dailyRate,
      dailyHours: this.dailyHours,
      workConfiguration: this.workConfiguration ? { ...this.workConfiguration } : undefined,
      notes: this.notes,
      specialRequirements: this.specialRequirements,
      customFields: this.customFields ? { ...this.customFields } : undefined
    };
  }

  // Validaciones
  public validate(): string[] {
    const errors: string[] = [];

    if (!this.resourceType) {
      errors.push('Resource type is required');
    }

    if (this.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (this.allocationPercentage < 0 || this.allocationPercentage > 200) {
      errors.push('Allocation percentage must be between 0 and 200');
    }

    const startDate = this.plannedStartDate || this.startDate;
    const endDate = this.plannedEndDate || this.endDate;

    if (startDate >= endDate) {
      errors.push('Start date must be before end date');
    }

    if (this.resourceType === ResourceType.WORKFORCE && !this.workforceId && !this.resourceId) {
      errors.push('Workforce resource ID is required for workforce assignments');
    }

    if (this.resourceType === ResourceType.EQUIPMENT && !this.equipmentId && !this.resourceId) {
      errors.push('Equipment resource ID is required for equipment assignments');
    }

    if (this.resourceType === ResourceType.MATERIAL && !this.materialId && !this.resourceId) {
      errors.push('Material resource ID is required for material assignments');
    }

    return errors;
  }

  public isValid(): boolean {
    return this.validate().length === 0;
  }

  // MÉTODOS AGREGADOS para compatibilidad con el sistema existente
  public syncPlannedDates(): void {
    if (!this.plannedStartDate && this.startDate) {
      this.plannedStartDate = this.startDate;
    }
    if (!this.plannedEndDate && this.endDate) {
      this.plannedEndDate = this.endDate;
    }
    if (!this.startDate && this.plannedStartDate) {
      this.startDate = this.plannedStartDate;
    }
    if (!this.endDate && this.plannedEndDate) {
      this.endDate = this.plannedEndDate;
    }
  }

  // Constructor para inicializar fechas
  constructor() {
    // Sincronizar fechas al crear la instancia
    if (this.startDate && !this.plannedStartDate) {
      this.plannedStartDate = this.startDate;
    }
    if (this.endDate && !this.plannedEndDate) {
      this.plannedEndDate = this.endDate;
    }
  }
}