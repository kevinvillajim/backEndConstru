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

export enum ProgressReportStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum WeatherCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export enum QualityLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  SATISFACTORY = 'satisfactory',
  POOR = 'poor',
  UNACCEPTABLE = 'unacceptable'
}

@Entity('activity_progress')
@Index(['activityId', 'reportDate'])
@Index(['reportDate'])
@Index(['status'])
export class ActivityProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  reportDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  progressPercentage: number;

  @Column({
    type: 'enum',
    enum: ProgressReportStatus,
    default: ProgressReportStatus.SUBMITTED
  })
  status: ProgressReportStatus;

  // Trabajo completado
  @Column({ type: 'json' })
  workCompleted: {
    quantity: number;
    unit: string;
    description?: string;
    qualityLevel: QualityLevel;
  };

  // Recursos utilizados
  @Column({ type: 'int', default: 0 })
  actualWorkersOnSite: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  actualHoursWorked: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  plannedHoursForDay: number;

  // Productividad
  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  productivityRate: number; // unidades por hora-persona

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  efficiencyPercentage: number;

  // Condiciones ambientales
  @Column({ type: 'json', nullable: true })
  weatherConditions: {
    workability: WeatherCondition;
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    visibility: string;
    description: string;
  };

  // Problemas de calidad
  @Column({ type: 'json', nullable: true })
  qualityIssues: {
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    status: 'open' | 'resolved' | 'pending';
    reportedBy: string;
    resolvedBy?: string;
    resolvedDate?: Date;
    correctionAction?: string;
  }[];

  // Incidentes de seguridad
  @Column({ type: 'json', nullable: true })
  safetyIncidents: {
    id: string;
    type: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    injuryType?: string;
    personInvolved?: string;
    correctionAction: string;
    preventiveMeasures: string;
  }[];

  // Obstáculos y retrasos
  @Column({ type: 'json', nullable: true })
  obstacles: {
    type: 'material_delay' | 'equipment_failure' | 'weather' | 'quality_issue' | 'coordination' | 'other';
    description: string;
    impact: 'low' | 'medium' | 'high';
    estimatedDelayHours: number;
    resolution?: string;
    preventable: boolean;
  }[];

  // Materiales y recursos
  @Column({ type: 'json', nullable: true })
  materialUsage: {
    materialId: string;
    materialName: string;
    quantityUsed: number;
    quantityWasted: number;
    unit: string;
    wasteReason?: string;
  }[];

  @Column({ type: 'json', nullable: true })
  equipmentUsage: {
    equipmentId: string;
    equipmentName: string;
    hoursUsed: number;
    utilizationPercentage: number;
    maintenanceRequired: boolean;
    issues?: string;
  }[];

  // Costos del día
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  dailyLaborCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  dailyMaterialCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  dailyEquipmentCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  dailyTotalCost: number;

  // Ubicación y documentación
  @Column({ type: 'json', nullable: true })
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    area?: string;
    zone?: string;
  };

  @Column({ type: 'json', nullable: true })
  photos: {
    url: string;
    description: string;
    type: 'progress' | 'quality' | 'safety' | 'issue';
    timestamp: Date;
  }[];

  // Calificaciones y métricas
  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  qualityScore: number; // 0-10

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  safetyScore: number; // 0-10

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  productivityScore: number; // 0-10

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  overallScore: number; // 0-10

  // Comentarios y observaciones
  @Column({ type: 'text', nullable: true })
  generalComments: string;

  @Column({ type: 'text', nullable: true })
  nextDayPlanning: string;

  @Column({ type: 'text', nullable: true })
  supervisorNotes: string;

  // Información del reporte
  @Column({ type: 'uuid' })
  reportedBy: string; // User ID

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string; // User ID

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

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
  @ManyToOne(() => ScheduleActivityEntity, activity => activity.progressReports)
  @JoinColumn({ name: 'activity_id' })
  activity: ScheduleActivityEntity;

  @Column({ type: 'uuid' })
  activityId: string;

  // Métodos calculados
  public get hasQualityIssues(): boolean {
    return this.qualityIssues && this.qualityIssues.length > 0;
  }

  public get hasSafetyIncidents(): boolean {
    return this.safetyIncidents && this.safetyIncidents.length > 0;
  }

  public get hasObstacles(): boolean {
    return this.obstacles && this.obstacles.length > 0;
  }

  public get openQualityIssues(): any[] {
    return this.qualityIssues?.filter(issue => issue.status === 'open') || [];
  }

  public get criticalSafetyIncidents(): any[] {
    return this.safetyIncidents?.filter(incident => incident.severity === 'critical') || [];
  }

  public get totalDelayHours(): number {
    return this.obstacles?.reduce((total, obstacle) => 
      total + obstacle.estimatedDelayHours, 0) || 0;
  }

  public get materialWastePercentage(): number {
    if (!this.materialUsage || this.materialUsage.length === 0) return 0;
    
    const totalUsed = this.materialUsage.reduce((sum, m) => sum + m.quantityUsed, 0);
    const totalWasted = this.materialUsage.reduce((sum, m) => sum + m.quantityWasted, 0);
    
    return totalUsed > 0 ? (totalWasted / totalUsed) * 100 : 0;
  }

  public get equipmentUtilization(): number {
    if (!this.equipmentUsage || this.equipmentUsage.length === 0) return 0;
    
    const avgUtilization = this.equipmentUsage.reduce((sum, e) => 
      sum + e.utilizationPercentage, 0) / this.equipmentUsage.length;
    
    return avgUtilization;
  }

  public get weatherImpact(): 'none' | 'low' | 'medium' | 'high' {
    if (!this.weatherConditions) return 'none';
    
    switch (this.weatherConditions.workability) {
      case WeatherCondition.EXCELLENT:
      case WeatherCondition.GOOD:
        return 'none';
      case WeatherCondition.FAIR:
        return 'low';
      case WeatherCondition.POOR:
        return this.totalDelayHours > 4 ? 'high' : 'medium';
      default:
        return 'none';
    }
  }

  public get isLateReport(): boolean {
    const reportDate = new Date(this.reportDate);
    const submissionDate = new Date(this.createdAt);
    const daysDifference = Math.ceil(
      (submissionDate.getTime() - reportDate.getTime()) / (1000 * 3600 * 24)
    );
    
    return daysDifference > 1; // Report submitted more than 1 day after work date
  }

  // Métodos de utilidad
  public calculateProductivity(): number {
    if (!this.actualHoursWorked || !this.actualWorkersOnSite) return 0;
    
    const totalPersonHours = this.actualHoursWorked * this.actualWorkersOnSite;
    const unitsCompleted = this.workCompleted.quantity;
    
    return totalPersonHours > 0 ? unitsCompleted / totalPersonHours : 0;
  }

  public calculateEfficiency(): number {
    if (!this.plannedHoursForDay || this.plannedHoursForDay === 0) return 100;
    
    return Math.min(100, (this.plannedHoursForDay / this.actualHoursWorked) * 100);
  }

  public calculateOverallScore(): number {
    const scores = [
      this.qualityScore || 0,
      this.safetyScore || 0,
      this.productivityScore || 0
    ].filter(score => score > 0);
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  public getPerformanceSummary(): any {
    return {
      progressPercentage: this.progressPercentage,
      qualityScore: this.qualityScore,
      safetyScore: this.safetyScore,
      productivityScore: this.productivityScore,
      overallScore: this.calculateOverallScore(),
      efficiency: this.calculateEfficiency(),
      productivity: this.calculateProductivity(),
      weatherImpact: this.weatherImpact,
      hasIssues: this.hasQualityIssues || this.hasSafetyIncidents || this.hasObstacles,
      delayHours: this.totalDelayHours,
      materialWaste: this.materialWastePercentage,
      equipmentUtilization: this.equipmentUtilization
    };
  }

  public validate(): string[] {
    const errors: string[] = [];

    if (this.progressPercentage < 0 || this.progressPercentage > 100) {
      errors.push('Progress percentage must be between 0 and 100');
    }

    if (!this.workCompleted || !this.workCompleted.quantity) {
      errors.push('Work completed information is required');
    }

    if (this.actualWorkersOnSite < 0) {
      errors.push('Actual workers on site cannot be negative');
    }

    if (this.actualHoursWorked < 0) {
      errors.push('Actual hours worked cannot be negative');
    }

    if (this.reportDate > new Date()) {
      errors.push('Report date cannot be in the future');
    }

    if (this.qualityScore && (this.qualityScore < 0 || this.qualityScore > 10)) {
      errors.push('Quality score must be between 0 and 10');
    }

    return errors;
  }

  public isValid(): boolean {
    return this.validate().length === 0;
  }

  public clone(): Partial<ActivityProgressEntity> {
    return {
      reportDate: this.reportDate,
      progressPercentage: this.progressPercentage,
      workCompleted: { ...this.workCompleted },
      actualWorkersOnSite: this.actualWorkersOnSite,
      actualHoursWorked: this.actualHoursWorked,
      plannedHoursForDay: this.plannedHoursForDay,
      productivityRate: this.productivityRate,
      efficiencyPercentage: this.efficiencyPercentage,
      weatherConditions: this.weatherConditions ? { ...this.weatherConditions } : undefined,
      qualityIssues: this.qualityIssues ? [...this.qualityIssues] : undefined,
      safetyIncidents: this.safetyIncidents ? [...this.safetyIncidents] : undefined,
      obstacles: this.obstacles ? [...this.obstacles] : undefined,
      materialUsage: this.materialUsage ? [...this.materialUsage] : undefined,
      equipmentUsage: this.equipmentUsage ? [...this.equipmentUsage] : undefined,
      dailyLaborCost: this.dailyLaborCost,
      dailyMaterialCost: this.dailyMaterialCost,
      dailyEquipmentCost: this.dailyEquipmentCost,
      dailyTotalCost: this.dailyTotalCost,
      location: this.location ? { ...this.location } : undefined,
      photos: this.photos ? [...this.photos] : undefined,
      generalComments: this.generalComments,
      nextDayPlanning: this.nextDayPlanning,
      supervisorNotes: this.supervisorNotes,
      customFields: this.customFields ? { ...this.customFields } : undefined
    };
  }
}