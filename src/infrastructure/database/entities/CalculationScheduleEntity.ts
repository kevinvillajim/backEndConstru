import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    OneToMany, 
    CreateDateColumn, 
    UpdateDateColumn, 
    JoinColumn 
  } from 'typeorm';
  import { ProjectEntity } from './ProjectEntity';
  import { CalculationBudgetEntity } from './CalculationBudgetEntity';
  import { ScheduleActivityEntity } from './ScheduleActivityEntity';
  import { ProgressTrackingEntity } from './ProgressTrackingEntity';
  import { WeatherFactorEntity } from './WeatherFactorEntity';
  
  export enum ScheduleStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    ON_HOLD = 'on_hold',
    DELAYED = 'delayed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
  }
  
  export enum ConstructionType {
    RESIDENTIAL_SINGLE = 'residential_single',
    RESIDENTIAL_MULTI = 'residential_multi',
    COMMERCIAL_SMALL = 'commercial_small',
    COMMERCIAL_LARGE = 'commercial_large',
    INDUSTRIAL = 'industrial',
    INFRASTRUCTURE = 'infrastructure',
    RENOVATION = 'renovation',
    SPECIALIZED = 'specialized'
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
  
  @Entity('calculation_schedules')
  export class CalculationScheduleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255 })
    name: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({
      type: 'enum',
      enum: ScheduleStatus,
      default: ScheduleStatus.DRAFT
    })
    status: ScheduleStatus;
  
    @Column({
      type: 'enum',
      enum: ConstructionType
    })
    constructionType: ConstructionType;
  
    @Column({
      type: 'enum',
      enum: GeographicalZone
    })
    geographicalZone: GeographicalZone;
  
    // Fechas del cronograma
    @Column({ type: 'date' })
    plannedStartDate: Date;
  
    @Column({ type: 'date' })
    plannedEndDate: Date;
  
    @Column({ type: 'date', nullable: true })
    actualStartDate: Date;
  
    @Column({ type: 'date', nullable: true })
    actualEndDate: Date;
  
    // Métricas de progreso
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    progressPercentage: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalPlannedDuration: number; // En días
  
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalActualDuration: number; // En días
  
    // Configuración de factores
    @Column({ type: 'json', nullable: true })
    climateFactors: {
      rainySeasonImpact: number;
      temperatureRange: { min: number; max: number };
      humidityImpact: number;
      altitudeAdjustment: number;
    };
  
    @Column({ type: 'json', nullable: true })
    laborFactors: {
      standardWorkHours: number;
      overtimeMultiplier: number;
      weekendMultiplier: number;
      holidayList: string[];
      productivityFactors: { [trade: string]: number };
    };
  
    @Column({ type: 'json', nullable: true })
    resourceConstraints: {
      maxConcurrentActivities: number;
      criticalResourceLimits: { [resource: string]: number };
      bufferTimePercentage: number;
    };
  
    // Configuración de alertas
    @Column({ type: 'json', nullable: true })
    alertSettings: {
      delayThresholdDays: number;
      criticalPathMonitoring: boolean;
      resourceConflictAlerts: boolean;
      weatherImpactAlerts: boolean;
      budgetVarianceAlerts: boolean;
    };
  
    // Análisis financiero
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalScheduleCost: number;
  
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    actualSpentCost: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    costVariancePercentage: number;
  
    // Templates y optimización
    @Column({ type: 'uuid', nullable: true })
    baseTemplateId: string;
  
    @Column({ type: 'boolean', default: false })
    isOptimized: boolean;
  
    @Column({ type: 'json', nullable: true })
    optimizationParameters: {
      prioritizeTime: boolean;
      prioritizeCost: boolean;
      prioritizeQuality: boolean;
      allowResourceSharing: boolean;
      enableParallelActivities: boolean;
    };
  
    @Column({ type: 'json', nullable: true })
    criticalPath: string[]; // Array de activity IDs
  
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
    @ManyToOne(() => ProjectEntity, project => project.id)
    @JoinColumn({ name: 'project_id' })
    project: ProjectEntity;
  
    @Column({ type: 'uuid' })
    projectId: string;
  
    @ManyToOne(() => CalculationBudgetEntity, budget => budget.id, { nullable: true })
    @JoinColumn({ name: 'calculation_budget_id' })
    calculationBudget: CalculationBudgetEntity;
  
    @Column({ type: 'uuid', nullable: true })
    calculationBudgetId: string;
  
    @OneToMany(() => ScheduleActivityEntity, activity => activity.schedule)
    activities: ScheduleActivityEntity[];
  
    @OneToMany(() => ProgressTrackingEntity, progress => progress.schedule)
    progressTracking: ProgressTrackingEntity[];
  
    @OneToMany(() => WeatherFactorEntity, weather => weather.schedule)
    weatherFactors: WeatherFactorEntity[];
  
    // Métodos calculados (virtuales)
    public get scheduleVariance(): number {
      if (!this.totalPlannedDuration || this.totalPlannedDuration === 0) return 0;
      return ((this.totalActualDuration - this.totalPlannedDuration) / this.totalPlannedDuration) * 100;
    }
  
    public get isDelayed(): boolean {
      return this.scheduleVariance > 0;
    }
  
    public get estimatedCompletionDate(): Date | null {
      if (!this.actualStartDate || this.progressPercentage === 0) return null;
      
      const daysElapsed = this.actualStartDate ? 
        Math.floor((new Date().getTime() - this.actualStartDate.getTime()) / (1000 * 3600 * 24)) : 0;
      
      const estimatedTotalDays = (daysElapsed / this.progressPercentage) * 100;
      const remainingDays = estimatedTotalDays - daysElapsed;
      
      const estimatedCompletion = new Date();
      estimatedCompletion.setDate(estimatedCompletion.getDate() + remainingDays);
      
      return estimatedCompletion;
    }
  
    public get healthScore(): number {
      // Calcula un score de salud del cronograma basado en múltiples factores
      let score = 100;
      
      // Penalizar por retrasos
      if (this.scheduleVariance > 10) score -= 30;
      else if (this.scheduleVariance > 5) score -= 15;
      
      // Penalizar por varianza de costos
      if (Math.abs(this.costVariancePercentage) > 15) score -= 25;
      else if (Math.abs(this.costVariancePercentage) > 10) score -= 15;
      
      // Bonificar por progreso consistente
      if (this.progressPercentage > 0 && this.scheduleVariance < 5) score += 10;
      
      return Math.max(0, Math.min(100, score));
    }
  }