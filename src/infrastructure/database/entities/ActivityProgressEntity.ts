// src/infrastructure/database/entities/ActivityProgressEntity.ts
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
  import { UserEntity } from './UserEntity';
  
  @Entity('activity_progress')
  @Index(['activityId', 'reportDate'])
  export class ActivityProgressEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'date' })
    reportDate: Date;
  
    @Column({ type: 'decimal', precision: 5, scale: 2 })
    progressPercentage: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    previousProgress: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2 })
    progressToday: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    quantityCompleted: number;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    unit: string;
  
    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    hoursWorked: number;
  
    @Column({ type: 'integer', nullable: true })
    workersPresent: number;
  
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    actualCost: number;
  
    @Column({ type: 'text', nullable: true })
    notes: string;
  
    @Column({ type: 'json', nullable: true })
    issues: {
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      status: 'open' | 'resolved';
    }[];
  
    @Column({ type: 'json', nullable: true })
    photosUrls: string[];
  
    @Column({ type: 'boolean', default: false })
    isApproved: boolean;
  
    @Column({ type: 'date', nullable: true })
    approvedAt: Date;
  
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
  
    public get openIssuesCount(): number {
      return this.issues ? this.issues.filter(i => i.status === 'open').length : 0;
    }
  }