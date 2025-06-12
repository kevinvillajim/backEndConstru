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
import { ScheduleActivityTemplateEntity } from './ScheduleActivityTemplateEntity';
  
export enum TemplateScope {
  SYSTEM = 'system',
  COMPANY = 'company', 
  PERSONAL = 'personal',
  SHARED = 'shared'
}

export enum ConstructionPhase {
  PRELIMINARY = 'preliminary',
  FOUNDATION = 'foundation',
  STRUCTURE = 'structure',
  WALLS = 'walls',
  ROOF = 'roof',
  INSTALLATIONS = 'installations',
  FINISHES = 'finishes',
  EXTERIOR = 'exterior',
  CLEANUP = 'cleanup'
}

@Entity('schedule_templates')
@Index(['constructionType', 'geographicalZone'])
@Index(['scope', 'isVerified'])
@Index(['usageCount'])
export class ScheduleTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['RESIDENTIAL_SINGLE', 'RESIDENTIAL_MULTI', 'COMMERCIAL_SMALL', 'COMMERCIAL_LARGE', 'INDUSTRIAL', 'INFRASTRUCTURE', 'RENOVATION', 'SPECIALIZED']
  })
  constructionType: string;

  @Column({
    type: 'enum',
    enum: TemplateScope
  })
  scope: TemplateScope;

  @Column({
    type: 'enum',
    enum: ['QUITO', 'GUAYAQUIL', 'CUENCA', 'COSTA', 'SIERRA', 'ORIENTE', 'INSULAR']
  })
  geographicalZone: string;

  // Configuración base del template
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  estimatedDurationDays: number;

  @Column({ type: 'json' })
  phaseConfiguration: {
    [phase in ConstructionPhase]: {
      durationPercentage: number;
      startAfterPhase?: ConstructionPhase;
      canOverlapWith?: ConstructionPhase[];
      criticalPath: boolean;
      minDurationDays: number;
      maxDurationDays: number;
    }
  };

  // Configuración de recursos típicos
  @Column({ type: 'json' })
  standardResources: {
    workforce: {
      [trade: string]: {
        minWorkers: number;
        maxWorkers: number;
        hourlyRate: number;
        dailyHours: number;
        productivity: number; // m²/día, m³/día, etc.
      }
    };
    equipment: {
      [equipment: string]: {
        required: boolean;
        dailyCost: number;
        mobilizationCost: number;
        utilization: number; // percentage
      }
    };
    materials: {
      deliverySchedule: string[];
      bufferStock: number; // percentage
      criticalMaterials: string[];
    };
  };

  // Factores de ajuste por zona geográfica
  @Column({ type: 'json' })
  geographicalAdjustments: {
    climateFactors: {
      rainySeasonMonths: number[];
      productivityAdjustment: number;
      workingDaysReduction: number;
    };
    logisticsFactors: {
      materialDeliveryDelay: number; // días adicionales
      equipmentAvailability: number; // factor 0-1
      laborAvailability: number; // factor 0-1
    };
    costsFactors: {
      transportMultiplier: number;
      laborCostMultiplier: number;
      materialCostMultiplier: number;
    };
  };

  // Configuración de dependencias
  @Column({ type: 'json' })
  activityDependencies: {
    criticalPath: string[]; // IDs de actividades críticas
    parallelActivities: string[][]; // Grupos de actividades paralelas
    sequentialGroups: {
      groupId: string;
      activities: string[];
      minGapDays: number;
    }[];
  };

  // Métricas de rendimiento
  @Column({ type: 'json' })
  performanceMetrics: {
    productivity: {
      [trade: string]: {
        unit: string; // m², m³, ml, etc.
        averageDaily: number;
        bestCase: number;
        worstCase: number;
      }
    };
    quality: {
      inspectionPoints: number;
      reworkProbability: number;
      qualityDelayDays: number;
    };
    safety: {
      safetyInspections: number;
      riskLevel: 'low' | 'medium' | 'high';
      safetyDelayDays: number;
    };
  };

  // Configuración de alertas y control
  @Column({ type: 'json' })
  controlConfiguration: {
    milestones: {
      name: string;
      percentageComplete: number;
      criticalCheckpoints: string[];
    }[];
    alertThresholds: {
      delayDays: number;
      costVariance: number;
      resourceUtilization: number;
    };
    approvalRequirements: {
      phaseApprovals: ConstructionPhase[];
      inspectionRequirements: string[];
      clientApprovals: string[];
    };
  };

  // Metadatos del template
  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'integer', default: 0 })
  ratingCount: number;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  version: string;

  @Column({ type: 'uuid', nullable: true })
  parentTemplateId: string; // Para templates derivados

  // Configuración NEC y normativas
  @Column({ type: 'json', nullable: true })
  necCompliance: {
    applicableNorms: string[];
    inspectionRequirements: {
      phase: ConstructionPhase;
      inspectionType: string;
      requiredBy: string;
      documentation: string[];
    }[];
    qualityStandards: {
      activity: string;
      standard: string;
      tolerance: string;
    }[];
  };

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => UserEntity, user => user.id, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  createdById: string;

  @OneToMany(() => ScheduleActivityTemplateEntity, activity => activity.scheduleTemplate)
  activityTemplates: ScheduleActivityTemplateEntity[];

  // RELACIÓN AGREGADA - Alias para activities (compatibilidad)
  get activities(): ScheduleActivityTemplateEntity[] {
    return this.activityTemplates;
  }

  // Métodos calculados
  public get isSystemTemplate(): boolean {
    return this.scope === TemplateScope.SYSTEM;
  }

  public get popularityScore(): number {
    // Combina usage count y rating para popularidad
    const usageScore = Math.min(this.usageCount / 100, 1) * 50;
    const ratingScore = (this.averageRating / 5) * 50;
    return usageScore + ratingScore;
  }

  public calculateEstimatedCost(projectSize: number, unitType: string): number {
    // Calcula costo estimado basado en recursos estándar
    let totalCost = 0;

    // Costo de mano de obra
    Object.entries(this.standardResources.workforce).forEach(([trade, config]) => {
      const dailyCost = config.minWorkers * config.hourlyRate * config.dailyHours;
      const tradeDuration = this.estimatedDurationDays / config.productivity;
      totalCost += dailyCost * tradeDuration;
    });

    // Costo de equipos
    Object.entries(this.standardResources.equipment).forEach(([equipment, config]) => {
      const equipmentDays = this.estimatedDurationDays * (config.utilization / 100);
      totalCost += (config.dailyCost * equipmentDays) + config.mobilizationCost;
    });

    // Aplicar factores geográficos
    const geoMultiplier = this.geographicalAdjustments.costsFactors.laborCostMultiplier;
    
    return totalCost * geoMultiplier * projectSize;
  }

  public getPhaseSequence(): ConstructionPhase[] {
    // Devuelve las fases en orden secuencial
    const phases = Object.keys(this.phaseConfiguration) as ConstructionPhase[];
    return phases.sort((a, b) => {
      const configA = this.phaseConfiguration[a];
      const configB = this.phaseConfiguration[b];
      
      // Ordenar por dependencias y criticidad
      if (configA.startAfterPhase && configA.startAfterPhase === b) return 1;
      if (configB.startAfterPhase && configB.startAfterPhase === a) return -1;
      
      return configA.durationPercentage - configB.durationPercentage;
    });
  }

  public getCriticalPath(): ConstructionPhase[] {
    return Object.entries(this.phaseConfiguration)
      .filter(([_, config]) => config.criticalPath)
      .map(([phase, _]) => phase as ConstructionPhase);
  }

  // MÉTODOS ADICIONALES para compatibilidad con el sistema
  public getActivityCount(): number {
    return this.activityTemplates?.length || 0;
  }

  public getActivitiesByPhase(phase: ConstructionPhase): ScheduleActivityTemplateEntity[] {
    return this.activityTemplates?.filter(activity => 
      activity.name.toLowerCase().includes(phase.toLowerCase()) ||
      activity.description?.toLowerCase().includes(phase.toLowerCase())
    ) || [];
  }

  public getCriticalPathActivities(): ScheduleActivityTemplateEntity[] {
    return this.activityTemplates?.filter(activity => activity.isCriticalPath) || [];
  }

  public getEstimatedTotalCost(): number {
    return this.activityTemplates?.reduce((total, activity) => 
      total + (activity.estimatedCost || 0), 0
    ) || 0;
  }

  public getPhaseByActivity(activityId: string): ConstructionPhase | null {
    const activity = this.activityTemplates?.find(a => a.id === activityId);
    if (!activity) return null;

    // Determinar fase basada en el tipo de actividad
    const activityName = activity.name.toLowerCase();
    
    if (activityName.includes('preparation') || activityName.includes('preliminary')) {
      return ConstructionPhase.PRELIMINARY;
    }
    if (activityName.includes('foundation') || activityName.includes('excavation')) {
      return ConstructionPhase.FOUNDATION;
    }
    if (activityName.includes('structure') || activityName.includes('concrete')) {
      return ConstructionPhase.STRUCTURE;
    }
    if (activityName.includes('wall') || activityName.includes('masonry')) {
      return ConstructionPhase.WALLS;
    }
    if (activityName.includes('roof') || activityName.includes('roofing')) {
      return ConstructionPhase.ROOF;
    }
    if (activityName.includes('electrical') || activityName.includes('plumbing') || activityName.includes('installation')) {
      return ConstructionPhase.INSTALLATIONS;
    }
    if (activityName.includes('finish') || activityName.includes('paint')) {
      return ConstructionPhase.FINISHES;
    }
    if (activityName.includes('exterior') || activityName.includes('landscaping')) {
      return ConstructionPhase.EXTERIOR;
    }
    if (activityName.includes('cleanup') || activityName.includes('clean')) {
      return ConstructionPhase.CLEANUP;
    }

    return ConstructionPhase.STRUCTURE; // Default
  }

  public clone(): Partial<ScheduleTemplateEntity> {
    return {
      name: `${this.name} (Copy)`,
      description: this.description,
      constructionType: this.constructionType,
      scope: this.scope,
      geographicalZone: this.geographicalZone,
      estimatedDurationDays: this.estimatedDurationDays,
      phaseConfiguration: JSON.parse(JSON.stringify(this.phaseConfiguration)),
      standardResources: JSON.parse(JSON.stringify(this.standardResources)),
      geographicalAdjustments: JSON.parse(JSON.stringify(this.geographicalAdjustments)),
      activityDependencies: JSON.parse(JSON.stringify(this.activityDependencies)),
      performanceMetrics: JSON.parse(JSON.stringify(this.performanceMetrics)),
      controlConfiguration: JSON.parse(JSON.stringify(this.controlConfiguration)),
      necCompliance: this.necCompliance ? JSON.parse(JSON.stringify(this.necCompliance)) : undefined,
      tags: this.tags ? [...this.tags] : undefined,
      customFields: this.customFields ? JSON.parse(JSON.stringify(this.customFields)) : undefined
    };
  }

  public updateRating(newRating: number): void {
    const totalRating = (this.averageRating * this.ratingCount) + newRating;
    this.ratingCount += 1;
    this.averageRating = totalRating / this.ratingCount;
  }

  public incrementUsage(): void {
    this.usageCount += 1;
  }

  public isApplicableToZone(zone: string): boolean {
    return this.geographicalZone === zone || this.scope === TemplateScope.SYSTEM;
  }

  public hasTag(tag: string): boolean {
    return this.tags?.includes(tag) || false;
  }

  public addTag(tag: string): void {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  public removeTag(tag: string): void {
    if (this.tags) {
      this.tags = this.tags.filter(t => t !== tag);
    }
  }
}