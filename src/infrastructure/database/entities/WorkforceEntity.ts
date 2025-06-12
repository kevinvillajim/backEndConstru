// ===== WorkforceEntity.ts =====
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
  
  export enum WorkforceType {
    FOREMAN = 'foreman',
    SKILLED_WORKER = 'skilled_worker',
    HELPER = 'helper',
    SPECIALIST = 'specialist',
    SUPERVISOR = 'supervisor',
    QUALITY_INSPECTOR = 'quality_inspector'
  }
  
  export enum CertificationLevel {
    BASIC = 'basic',
    INTERMEDIATE = 'intermediate', 
    ADVANCED = 'advanced',
    EXPERT = 'expert',
    CERTIFIED = 'certified'
  }
  
  @Entity('workforce')
  @Index(['trade', 'isAvailable'])
  @Index(['geographicalZone', 'certificationLevel'])
  export class WorkforceEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255 })
    fullName: string;
  
    @Column({ type: 'varchar', length: 20, unique: true })
    identification: string; // Cédula Ecuador
  
    @Column({
      type: 'enum',
      enum: WorkforceType
    })
    workerType: WorkforceType;
  
    @Column({
      type: 'enum',
      enum: ['EXCAVATION', 'CONCRETE', 'MASONRY', 'STEEL', 'CARPENTRY', 'ELECTRICAL', 'PLUMBING', 'PAINTING', 'FINISHING', 'LANDSCAPING']
    })
    primaryTrade: string;
  
    @Column({ type: 'json', nullable: true })
    secondaryTrades: string[];
  
    @Column({
      type: 'enum',
      enum: CertificationLevel,
      default: CertificationLevel.BASIC
    })
    certificationLevel: CertificationLevel;
  
    // Información laboral
    @Column({ type: 'decimal', precision: 8, scale: 2 })
    hourlyRate: number;
  
    @Column({ type: 'decimal', precision: 8, scale: 2 })
    overtimeRate: number;
  
    @Column({ type: 'integer', default: 8 })
    standardWorkingHours: number;
  
    @Column({ type: 'boolean', default: true })
    isAvailable: boolean;
  
    @Column({ type: 'date', nullable: true })
    availableFrom: Date;
  
    @Column({ type: 'date', nullable: true })
    availableUntil: Date;
  
    // Productividad y rendimiento
    @Column({ type: 'json' })
    productivity: {
      [trade: string]: {
        unit: string; // m², m³, ml, etc.
        dailyOutput: number;
        qualityRating: number; // 1-5
        safetyRating: number; // 1-5
      }
    };
  
    @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
    productivityFactor: number; // Factor multiplicador
  
    @Column({ type: 'integer', default: 0 })
    experienceYears: number;
  
    // Ubicación y movilidad
    @Column({
      type: 'enum',
      enum: ['QUITO', 'GUAYAQUIL', 'CUENCA', 'COSTA', 'SIERRA', 'ORIENTE', 'INSULAR']
    })
    geographicalZone: string;
  
    @Column({ type: 'boolean', default: false })
    willingToRelocate: boolean;
  
    @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
    relocationDailyCost: number;
  
    // Certificaciones y competencias
    @Column({ type: 'json', nullable: true })
    certifications: {
      name: string;
      issuer: string;
      issueDate: Date;
      expiryDate: Date;
      certificateNumber: string;
      isActive: boolean;
    }[];
  
    @Column({ type: 'json', nullable: true })
    skills: {
      skill: string;
      level: CertificationLevel;
      verified: boolean;
    }[];
  
    // Historial de trabajo
    @Column({ type: 'json', nullable: true })
    workHistory: {
      projectId: string;
      projectName: string;
      startDate: Date;
      endDate: Date;
      role: string;
      performanceRating: number;
      notes: string;
    }[];
  
    // Información de contacto
    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;
  
    @Column({ type: 'varchar', length: 500, nullable: true })
    address: string;
  
    // Información de emergencia
    @Column({ type: 'json', nullable: true })
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  
    @Column({ type: 'json', nullable: true })
    customFields: Record<string, any>;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    // Relaciones
    @ManyToOne(() => UserEntity, user => user.id, { nullable: true })
    @JoinColumn({ name: 'managed_by' })
    managedBy: UserEntity;
  
    @Column({ type: 'uuid', nullable: true })
    managedById: string;
  
    @OneToMany(() => ResourceAssignmentEntity, assignment => assignment.workforce)
    assignments: ResourceAssignmentEntity[];
  
    // Métodos calculados
    public get isCurrentlyAssigned(): boolean {
      // En implementación real, verificar asignaciones activas
      return false;
    }
  
    public get dailyCost(): number {
      return this.hourlyRate * this.standardWorkingHours;
    }
  
    public get overallRating(): number {
      const ratings = Object.values(this.productivity).map(p => (p.qualityRating + p.safetyRating) / 2);
      return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    }
  
    public canWorkInTrade(trade: string): boolean {
      return this.primaryTrade === trade || (this.secondaryTrades || []).includes(trade);
    }
  
    public getCostForDays(days: number, includeRelocation: boolean = false): number {
      let cost = this.dailyCost * days;
      if (includeRelocation && this.willingToRelocate) {
        cost += this.relocationDailyCost * days;
      }
      return cost;
    }
  }