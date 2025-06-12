// ===== ProgressTrackingEntity.ts =====
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
  import { CalculationScheduleEntity } from './CalculationScheduleEntity';
  import { ScheduleActivityEntity } from './ScheduleActivityEntity';
  import { UserEntity } from './UserEntity';
  
  export enum ProgressReportType {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MILESTONE = 'milestone',
    INCIDENT = 'incident',
    QUALITY = 'quality',
    SAFETY = 'safety'
  }
  
  @Entity('progress_tracking')
  @Index(['scheduleId', 'reportDate'])
  @Index(['reportType', 'reportDate'])
  export class ProgressTrackingEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'date' })
    reportDate: Date;
  
    @Column({ type: 'time', nullable: true })
    reportTime: string;
  
    @Column({
      type: 'enum',
      enum: ProgressReportType
    })
    reportType: ProgressReportType;
  
    @Column({ type: 'varchar', length: 255 })
    title: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    // Progreso general
    @Column({ type: 'decimal', precision: 5, scale: 2 })
    overallProgress: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    previousProgress: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2 })
    progressToday: number;
  
    // Progreso por actividad
    @Column({ type: 'json', nullable: true })
    activityProgress: {
      activityId: string;
      activityName: string;
      previousProgress: number;
      currentProgress: number;
      progressToday: number;
      notes: string;
    }[];
  
    // Recursos utilizados
    @Column({ type: 'json', nullable: true })
    resourcesUsed: {
      workforce: {
        trade: string;
        workersPresent: number;
        workersPlanned: number;
        hoursWorked: number;
        productivity: number;
      }[];
      equipment: {
        equipmentId: string;
        equipmentName: string;
        hoursUsed: number;
        hoursPlanned: number;
        efficiency: number;
      }[];
      materials: {
        materialId: string;
        materialName: string;
        quantityUsed: number;
        quantityPlanned: number;
        unit: string;
      }[];
    };
  
    // Condiciones de trabajo
    @Column({ type: 'json', nullable: true })
    workingConditions: {
      weather: {
        condition: string;
        temperature: number;
        humidity: number;
        rainfall: number;
        workingSuitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
      };
      workingHours: {
        startTime: string;
        endTime: string;
        breaks: number;
        overtimeHours: number;
      };
      siteConditions: {
        accessibility: 'excellent' | 'good' | 'fair' | 'poor';
        safety: 'excellent' | 'good' | 'fair' | 'poor';
        organization: 'excellent' | 'good' | 'fair' | 'poor';
      };
    };
  
    // Problemas y observaciones
    @Column({ type: 'json', nullable: true })
    issues: {
      type: 'delay' | 'quality' | 'safety' | 'resource' | 'weather' | 'other';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      impact: string;
      proposedSolution: string;
      responsiblePerson: string;
      targetResolutionDate: Date;
      status: 'open' | 'in_progress' | 'resolved' | 'closed';
    }[];
  
    // Calidad y seguridad
    @Column({ type: 'json', nullable: true })
    qualityControl: {
      inspections: {
        type: string;
        result: 'passed' | 'failed' | 'conditional';
        inspector: string;
        notes: string;
      }[];
      defects: {
        location: string;
        description: string;
        severity: 'minor' | 'major' | 'critical';
        status: 'open' | 'fixed' | 'verified';
      }[];
      tests: {
        testType: string;
        result: string;
        standard: string;
        passed: boolean;
      }[];
    };
  
    @Column({ type: 'json', nullable: true })
    safetyReport: {
      incidents: {
        type: string;
        severity: 'near_miss' | 'first_aid' | 'medical' | 'lost_time';
        description: string;
        personInvolved: string;
        actionTaken: string;
      }[];
      safetyObservations: {
        observation: string;
        riskLevel: 'low' | 'medium' | 'high';
        correctionRequired: boolean;
      }[];
      ppe_compliance: number; // percentage
    };
  
    // Evidencias
    @Column({ type: 'json', nullable: true })
    attachments: {
      type: 'photo' | 'video' | 'document';
      filename: string;
      url: string;
      description: string;
      timestamp: Date;
      geoLocation: {
        latitude: number;
        longitude: number;
        accuracy: number;
      };
    }[];
  
    // Costos del día
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    dailyLaborCost: number;
  
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    dailyMaterialCost: number;
  
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    dailyEquipmentCost: number;
  
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalDailyCost: number;
  
    // Próximas actividades
    @Column({ type: 'json', nullable: true })
    nextDayPlan: {
      activities: string[];
      requiredResources: {
        workforce: { trade: string; quantity: number }[];
        equipment: { type: string; quantity: number }[];
        materials: { material: string; quantity: number }[];
      };
      expectedDeliveries: {
        supplier: string;
        materials: string[];
        expectedTime: string;
      }[];
      specialConsiderations: string[];
    };
  
    @Column({ type: 'json', nullable: true })
    customFields: Record<string, any>;
  
    @Column({ type: 'boolean', default: false })
    isApproved: boolean;
  
    @Column({ type: 'date', nullable: true })
    approvedAt: Date;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    // Relaciones
    @ManyToOne(() => CalculationScheduleEntity, schedule => schedule.progressTracking)
    @JoinColumn({ name: 'schedule_id' })
    schedule: CalculationScheduleEntity;
  
    @Column({ type: 'uuid' })
    scheduleId: string;
  
    @ManyToOne(() => UserEntity, user => user.id)
    @JoinColumn({ name: 'reported_by' })
    reportedBy: UserEntity;
  
    @Column({ type: 'uuid' })
    reportedById: string;
  
    @ManyToOne(() => UserEntity, user => user.id, { nullable: true })
    @JoinColumn({ name: 'approved_by' })
    approvedBy: UserEntity;
  
    @Column({ type: 'uuid', nullable: true })
    approvedById: string;
  
    // Métodos calculados
    public get hasIssues(): boolean {
      return this.issues && this.issues.length > 0;
    }
  
    public get criticalIssuesCount(): number {
      return this.issues ? this.issues.filter(i => i.severity === 'critical').length : 0;
    }
  
    public get overallEfficiency(): number {
      if (!this.resourcesUsed) return 0;
      
      const workforceEfficiency = this.resourcesUsed.workforce?.reduce((acc, w) => 
        acc + (w.workersPresent / w.workersPlanned * w.productivity), 0) || 0;
      
      const equipmentEfficiency = this.resourcesUsed.equipment?.reduce((acc, e) => 
        acc + e.efficiency, 0) || 0;
      
      const totalItems = (this.resourcesUsed.workforce?.length || 0) + (this.resourcesUsed.equipment?.length || 0);
      
      return totalItems > 0 ? (workforceEfficiency + equipmentEfficiency) / totalItems : 0;
    }
  
    public get weatherImpact(): string {
      if (!this.workingConditions?.weather) return 'unknown';
      return this.workingConditions.weather.workingSuitability;
    }
  
    public get safetyScore(): number {
      if (!this.safetyReport) return 100;
      
      let score = 100;
      
      // Penalizar por incidentes
      this.safetyReport.incidents?.forEach(incident => {
        switch (incident.severity) {
          case 'lost_time': score -= 25; break;
          case 'medical': score -= 15; break;
          case 'first_aid': score -= 5; break;
          case 'near_miss': score -= 2; break;
        }
      });
      
      // Considerar observaciones
      this.safetyReport.safetyObservations?.forEach(obs => {
        if (obs.riskLevel === 'high') score -= 10;
        else if (obs.riskLevel === 'medium') score -= 5;
      });
      
      // Bonificar por cumplimiento de EPP
      if (this.safetyReport.ppe_compliance) {
        score += (this.safetyReport.ppe_compliance - 90) * 0.5; // Bonus si >90%
      }
      
      return Math.max(0, Math.min(100, score));
    }
  }