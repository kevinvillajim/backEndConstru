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
import { CalculationScheduleEntity } from './CalculationScheduleEntity';
import { ResourceAssignmentEntity, ResourceType } from './ResourceAssignmentEntity';
import { ActivityProgressEntity } from './ActivityProgressEntity';
import { ActivityStatus, ActivityType, ActivityPriority, ConstructionTrade } from '../../../domain/models/calculation/ScheduleActivity';

@Entity('schedule_activities')
@Index(['scheduleId', 'status'])
@Index(['plannedStartDate', 'plannedEndDate'])
@Index(['isCriticalPath'])
export class ScheduleActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ActivityStatus,
    default: ActivityStatus.NOT_STARTED
  })
  status: ActivityStatus;

  @Column({
    type: 'enum',
    enum: ActivityType
  })
  activityType: ActivityType;

  @Column({
    type: 'enum',
    enum: ActivityPriority,
    default: ActivityPriority.NORMAL
  })
  priority: ActivityPriority;

  @Column({
    type: 'enum',
    enum: ConstructionTrade,
    nullable: true
  })
  primaryTrade: ConstructionTrade;

  // Planificación temporal
  @Column({ type: 'date' })
  plannedStartDate: Date;

  @Column({ type: 'date' })
  plannedEndDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  plannedDurationDays: number;

  @Column({ type: 'date', nullable: true })
  actualStartDate: Date;

  @Column({ type: 'date', nullable: true })
  actualEndDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualDurationDays: number;

  // Fechas de control
  @Column({ type: 'date', nullable: true })
  earlyStartDate: Date;

  @Column({ type: 'date', nullable: true })
  earlyFinishDate: Date;

  @Column({ type: 'date', nullable: true })
  lateStartDate: Date;

  @Column({ type: 'date', nullable: true })
  lateFinishDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalFloat: number; // Holgura total

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  freeFloat: number; // Holgura libre

  // Control de progreso
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ type: 'boolean', default: false })
  isCriticalPath: boolean;

  @Column({ type: 'boolean', default: false })
  isMilestone: boolean;

  // Configuración de trabajo
  @Column({ type: 'json' })
  workConfiguration: {
    workingHours: {
      dailyHours: number;
      startTime: string;
      endTime: string;
      workingDays: number[]; // 0-6, domingo=0
    };
    shifts: {
      shiftNumber: number;
      startTime: string;
      endTime: string;
      workers: number;
    }[];
    overtime: {
      maxOvertimeHours: number;
      overtimeRate: number;
    };
  };

  // Recursos y cantidades
  @Column({ type: 'json' })
  workQuantities: {
    unit: string; // m², m³, ml, und
    plannedQuantity: number;
    completedQuantity: number;
    remainingQuantity: number;
    productivity: number; // cantidad por día/hora
  };

  // Costos planificados
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  plannedLaborCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  plannedMaterialCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  plannedEquipmentCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  plannedTotalCost: number;

  // Costos reales
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualLaborCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualMaterialCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualEquipmentCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualTotalCost: number;

  // Dependencias
  @Column({ type: 'json', nullable: true })
  predecessors: {
    activityId: string;
    dependencyType: 'FS' | 'SS' | 'FF' | 'SF'; // Finish-Start, Start-Start, Finish-Finish, Start-Finish
    lagDays: number;
  }[];

  @Column({ type: 'json', nullable: true })
  successors: {
    activityId: string;
    dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
    lagDays: number;
  }[];

  // Configuración de alertas
  @Column({ type: 'json', nullable: true })
  alertConfiguration: {
    delayAlert: {
      enabled: boolean;
      thresholdDays: number;
      recipients: string[];
    };
    qualityAlert: {
      enabled: boolean;
      inspectionRequired: boolean;
      qualityStandard: string;
    };
    resourceAlert: {
      enabled: boolean;
      minResourceUtilization: number;
      maxResourceUtilization: number;
    };
  };

  // Factores ambientales
  @Column({ type: 'json', nullable: true })
  environmentalFactors: {
    weatherSensitive: boolean;
    seasonalAdjustments: {
      month: number;
      productivityFactor: number;
    }[];
    workingConditions: {
      indoorWork: boolean;
      heightWork: boolean;
      noiseSensitive: boolean;
      dustSensitive: boolean;
    };
  };

  // Calidad y control
  @Column({ type: 'json', nullable: true })
  qualityControl: {
    inspectionRequired: boolean;
    inspectionPoints: string[];
    qualityStandards: string[];
    testingRequired: boolean;
    approvalRequired: boolean;
    reworkProbability: number;
  };

  // Ubicación física
  @Column({ type: 'json', nullable: true })
  location: {
    area: string;
    floor: string;
    zone: string;
    coordinates: {
      x: number;
      y: number;
      z: number;
    };
  };

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => CalculationScheduleEntity, schedule => schedule.activities)
  @JoinColumn({ name: 'schedule_id' })
  schedule: CalculationScheduleEntity;

  @Column({ type: 'uuid' })
  scheduleId: string;

  @OneToMany(() => ResourceAssignmentEntity, assignment => assignment.activity)
  resourceAssignments: ResourceAssignmentEntity[];

  // ALIAS para compatibilidad con el optimizer
  get assignments(): ResourceAssignmentEntity[] {
    return this.resourceAssignments;
  }

  @OneToMany(() => ActivityProgressEntity, progress => progress.activity)
  progressReports: ActivityProgressEntity[];

  // Métodos calculados requeridos por el optimizer
  public get durationVariance(): number {
    if (!this.plannedDurationDays || this.plannedDurationDays === 0) return 0;
    return ((this.actualDurationDays - this.plannedDurationDays) / this.plannedDurationDays) * 100;
  }

  public get costVariance(): number {
    if (!this.plannedTotalCost || this.plannedTotalCost === 0) return 0;
    return ((this.actualTotalCost - this.plannedTotalCost) / this.plannedTotalCost) * 100;
  }

  public get isDelayed(): boolean {
    if (this.status === ActivityStatus.COMPLETED) {
      return this.actualEndDate && this.actualEndDate > this.plannedEndDate;
    }
    return new Date() > this.plannedStartDate && this.status === ActivityStatus.NOT_STARTED;
  }

  public get earnedValue(): number {
    return this.plannedTotalCost * (this.progressPercentage / 100);
  }

  public get schedulePerformanceIndex(): number {
    // SPI = EV / PV
    const plannedValue = this.getPlannedValueAtDate(new Date());
    return plannedValue > 0 ? this.earnedValue / plannedValue : 1;
  }

  public get costPerformanceIndex(): number {
    // CPI = EV / AC
    return this.actualTotalCost > 0 ? this.earnedValue / this.actualTotalCost : 1;
  }

  public get estimateAtCompletion(): number {
    // EAC = AC + (BAC - EV) / CPI
    const cpi = this.costPerformanceIndex;
    if (cpi === 0) return this.plannedTotalCost;
    
    return this.actualTotalCost + ((this.plannedTotalCost - this.earnedValue) / cpi);
  }

  public get remainingWork(): number {
    return Math.max(0, this.workQuantities.plannedQuantity - this.workQuantities.completedQuantity);
  }

  public get estimatedCompletionDate(): Date | null {
    if (this.status === ActivityStatus.COMPLETED) return this.actualEndDate;
    if (this.progressPercentage === 0 || !this.actualStartDate) return null;

    const daysElapsed = this.actualStartDate ? 
      Math.floor((new Date().getTime() - this.actualStartDate.getTime()) / (1000 * 3600 * 24)) : 0;
    
    const estimatedTotalDays = (daysElapsed / this.progressPercentage) * 100;
    const remainingDays = estimatedTotalDays - daysElapsed;
    
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + remainingDays);
    
    return estimatedCompletion;
  }

  public get criticality(): number {
    // Calcula nivel de criticidad basado en múltiples factores
    let score = 0;

    if (this.isCriticalPath) score += 40;
    if (this.priority === ActivityPriority.CRITICAL) score += 30;
    if (this.totalFloat < 2) score += 20;
    if (this.isDelayed) score += 10;

    return Math.min(100, score);
  }

  private getPlannedValueAtDate(date: Date): number {
    // Calcula el valor planificado a una fecha específica
    if (date < this.plannedStartDate) return 0;
    if (date >= this.plannedEndDate) return this.plannedTotalCost;

    const totalDays = Math.floor((this.plannedEndDate.getTime() - this.plannedStartDate.getTime()) / (1000 * 3600 * 24));
    const elapsedDays = Math.floor((date.getTime() - this.plannedStartDate.getTime()) / (1000 * 3600 * 24));
    
    const progressRatio = Math.min(1, elapsedDays / totalDays);
    return this.plannedTotalCost * progressRatio;
  }

  public canStart(): boolean {
    // Verifica si la actividad puede comenzar basado en dependencias
    if (this.status !== ActivityStatus.NOT_STARTED) return false;
    
    // Verificar predecessors (implementación simplificada)
    return true; // En implementación real, verificar estado de predecessors
  }

  public updateProgress(percentage: number, actualCost?: number): void {
    this.progressPercentage = Math.max(0, Math.min(100, percentage));
    
    if (actualCost !== undefined) {
      this.actualTotalCost = actualCost;
    }

    // Actualizar fechas si es necesario
    if (this.progressPercentage > 0 && !this.actualStartDate) {
      this.actualStartDate = new Date();
    }

    if (this.progressPercentage === 100 && !this.actualEndDate) {
      this.actualEndDate = new Date();
      this.status = ActivityStatus.COMPLETED;
      this.actualDurationDays = this.actualStartDate ? 
        Math.floor((this.actualEndDate.getTime() - this.actualStartDate.getTime()) / (1000 * 3600 * 24)) : 0;
    }
  }

  // MÉTODOS ADICIONALES para compatibilidad con ResourceAssignment
  public getActiveAssignments(): ResourceAssignmentEntity[] {
    return this.resourceAssignments?.filter(assignment => 
      assignment.status === 'active' || assignment.status === 'assigned'
    ) || [];
  }

  public getTotalResourceCost(): number {
    return this.resourceAssignments?.reduce((total, assignment) => 
      total + (assignment.actualCost || assignment.plannedCost || 0), 0
    ) || 0;
  }

  public getResourcesByType(resourceType: string): ResourceAssignmentEntity[] {
    return this.resourceAssignments?.filter(assignment => 
      assignment.resourceType === resourceType
    ) || [];
  }

  public hasResourceConflicts(): boolean {
    const assignments = this.getActiveAssignments();
    return assignments.some(assignment => assignment.isOverallocated);
  }

  // Método helper para obtener requerimientos de recursos 
  // (usado por el optimizer)
  public getResourceRequirements(): any {
    const assignments = this.resourceAssignments || [];
    
    const workforce = assignments
      .filter(a => a.resourceType === ResourceType.WORKFORCE)
      .map(a => ({
        trade: a.workforce?.trade || this.primaryTrade || 'general',
        quantity: a.quantity || 1,
        skillLevel: a.workforce?.skillLevel || 'basic',
        hourlyRate: a.plannedCost || 25
      }));

    const equipment = assignments
      .filter(a => a.resourceType === ResourceType.EQUIPMENT)
      .map(a => ({
        type: a.equipment?.type || 'general',
        quantity: a.quantity || 1,
        dailyCost: a.plannedCost || 100
      }));

    const materials = assignments
      .filter(a => a.resourceType === ResourceType.MATERIAL)
      .map(a => ({
        material: a.material?.name || 'general',
        quantity: a.quantity || 1,
        unit: a.unit || 'unit',
        unitCost: a.plannedCost || 10
      }));

    return {
      workforce: workforce.length > 0 ? workforce : undefined,
      equipment: equipment.length > 0 ? equipment : undefined,
      materials: materials.length > 0 ? materials : undefined
    };
  }
}