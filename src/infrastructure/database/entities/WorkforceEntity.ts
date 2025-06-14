import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ResourceAssignmentEntity } from './ResourceAssignmentEntity';
import { UserEntity } from './UserEntity';

export enum WorkforceType {
  FOREMAN = 'foreman',
  SKILLED_WORKER = 'skilled_worker',
  HELPER = 'helper',
  SPECIALIST = 'specialist',
  SUPERVISOR = 'supervisor',
  QUALITY_INSPECTOR = 'quality_inspector',
  LABORER = 'laborer',
  TECHNICIAN = 'technician',
  ENGINEER = 'engineer'
}

export enum WorkforceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_LEAVE = 'on_leave',
  INACTIVE = 'inactive'
}

export enum CertificationLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate', 
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  CERTIFIED = 'certified'
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

@Entity('workforce')
export class WorkforceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // PROPIEDADES AGREGADAS - Información personal
  @Column({ type: 'varchar', length: 200 })
  fullName: string;

  // Alias para compatibilidad con código existente
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  identification: string;

  // PROPIEDADES AGREGADAS - Clasificación profesional
  @Column({
    type: 'enum',
    enum: WorkforceType
  })
  workerType: WorkforceType;

  @Column({ type: 'varchar', length: 100 })
  primaryTrade: string;

  @Column({ type: 'json', nullable: true })
  secondaryTrades: string[];

  @Column({
    type: 'enum',
    enum: CertificationLevel,
    default: CertificationLevel.BASIC
  })
  certificationLevel: CertificationLevel;

  @Column({
    type: 'enum',
    enum: WorkforceStatus,
    default: WorkforceStatus.AVAILABLE
  })
  status: WorkforceStatus;

  // PROPIEDADES AGREGADAS - Información laboral y costos
  @Column('decimal', { precision: 8, scale: 2 })
  hourlyRate: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  overtimeRate: number;

  @Column({ type: 'integer', default: 8 })
  standardWorkingHours: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  skillLevel: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  specializations: string;

  @Column('int', { default: 8 })
  maxHoursPerDay: number;

  @Column('int', { default: 40 })
  maxHoursPerWeek: number;

  // PROPIEDADES AGREGADAS - Disponibilidad
  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'date', nullable: true })
  availableFrom: Date;

  @Column({ type: 'date', nullable: true })
  availableUntil: Date;

  // PROPIEDADES AGREGADAS - Productividad y rendimiento
  @Column({ type: 'json', nullable: true })
  productivity: {
    [trade: string]: {
      unit: string;
      dailyOutput: number;
      qualityRating: number;
      safetyRating: number;
    }
  };

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  productivityFactor: number;

  @Column({ type: 'integer', default: 0 })
  experienceYears: number;

  // PROPIEDADES AGREGADAS - Ubicación y movilidad
  @Column({
    type: 'enum',
    enum: GeographicalZone
  })
  geographicalZone: GeographicalZone;

  @Column({ type: 'boolean', default: false })
  willingToRelocate: boolean;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  relocationDailyCost: number;

  // PROPIEDADES AGREGADAS - Certificaciones y habilidades
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

  // PROPIEDADES AGREGADAS - Historial laboral
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

  // PROPIEDADES AGREGADAS - Información de contacto
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'json', nullable: true })
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactInfo: string;

  @Column('text', { nullable: true })
  notes: string;

  // PROPIEDADES AGREGADAS - Gestión y campos personalizados
  @Column({ type: 'uuid', nullable: true })
  managedById: string;

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => ResourceAssignmentEntity, assignment => assignment.workforce)
  assignments: ResourceAssignmentEntity[];

  @ManyToOne(() => UserEntity, user => user.id, { nullable: true })
  @JoinColumn({ name: 'managedById' })
  managedBy: UserEntity;
  trade: import("../../../../src/domain/models/calculation/ScheduleActivity").ConstructionTrade;

  // Métodos de utilidad
  calculateDailyCost(hours: number): number {
    const regularHours = Math.min(hours, this.maxHoursPerDay);
    const overtimeHours = Math.max(0, hours - this.maxHoursPerDay);
    
    let totalCost = regularHours * this.hourlyRate;
    
    if (overtimeHours > 0 && this.overtimeRate) {
      totalCost += overtimeHours * this.overtimeRate;
    }
    
    return totalCost;
  }

  isWorkerAvailable(): boolean {
    return this.status === WorkforceStatus.AVAILABLE && this.isAvailable;
  }

  canWorkHours(requestedHours: number): boolean {
    return requestedHours <= this.maxHoursPerDay && this.isWorkerAvailable();
  }

  getActiveAssignments(): ResourceAssignmentEntity[] {
    return this.assignments?.filter(assignment => 
      assignment.status === 'active' || assignment.status === 'assigned'
    ) || [];
  }

  getTotalAssignedHours(): number {
    const activeAssignments = this.getActiveAssignments();
    return activeAssignments.reduce((total, assignment) => {
      // CORREGIDO: Calcular horas basadas en la duración y horas diarias
      const assignmentDays = assignment.durationDays;
      const dailyHours = assignment.dailyHours || this.maxHoursPerDay;
      return total + (assignmentDays * dailyHours * (assignment.allocationPercentage / 100));
    }, 0);
  }

  // MÉTODOS ADICIONALES para compatibilidad con el sistema
  hasSkill(skillName: string): boolean {
    return this.skills?.some(skill => 
      skill.skill.toLowerCase().includes(skillName.toLowerCase())
    ) || false;
  }

  getSkillLevel(skillName: string): CertificationLevel | null {
    const skill = this.skills?.find(skill => 
      skill.skill.toLowerCase().includes(skillName.toLowerCase())
    );
    return skill?.level || null;
  }

  isSkillVerified(skillName: string): boolean {
    const skill = this.skills?.find(skill => 
      skill.skill.toLowerCase().includes(skillName.toLowerCase())
    );
    return skill?.verified || false;
  }

  hasTrade(tradeName: string): boolean {
    if (this.primaryTrade?.toLowerCase().includes(tradeName.toLowerCase())) {
      return true;
    }
    return this.secondaryTrades?.some(trade => 
      trade.toLowerCase().includes(tradeName.toLowerCase())
    ) || false;
  }

  getActiveCertifications(): any[] {
    return this.certifications?.filter(cert => 
      cert.isActive && new Date(cert.expiryDate) > new Date()
    ) || [];
  }

  getExpiringCertifications(daysAhead: number = 30): any[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    return this.certifications?.filter(cert => 
      cert.isActive && 
      new Date(cert.expiryDate) > new Date() && 
      new Date(cert.expiryDate) <= cutoffDate
    ) || [];
  }

  getAveragePerformanceRating(): number {
    if (!this.workHistory || this.workHistory.length === 0) return 0;
    
    const totalRating = this.workHistory.reduce((sum, work) => sum + work.performanceRating, 0);
    return totalRating / this.workHistory.length;
  }

  getProductivityForTrade(trade: string): number {
    if (!this.productivity || !this.productivity[trade]) {
      return this.productivityFactor;
    }
    
    const tradeProductivity = this.productivity[trade];
    return tradeProductivity.dailyOutput * this.productivityFactor;
  }

  canRelocateTo(zone: GeographicalZone): boolean {
    if (this.geographicalZone === zone) return true;
    return this.willingToRelocate;
  }

  getRelocationCost(zone: GeographicalZone): number {
    if (this.geographicalZone === zone) return 0;
    return this.willingToRelocate ? this.relocationDailyCost : -1;
  }

  updateAvailability(from: Date, to: Date, available: boolean): void {
    this.availableFrom = from;
    this.availableUntil = to;
    this.isAvailable = available;
    
    if (!available) {
      this.status = WorkforceStatus.ON_LEAVE;
    } else if (this.status === WorkforceStatus.ON_LEAVE) {
      this.status = WorkforceStatus.AVAILABLE;
    }
  }

  addWorkExperience(projectId: string, projectName: string, role: string, startDate: Date, endDate: Date, rating: number, notes?: string): void {
    if (!this.workHistory) {
      this.workHistory = [];
    }
    
    this.workHistory.push({
      projectId,
      projectName,
      startDate,
      endDate,
      role,
      performanceRating: rating,
      notes: notes || ''
    });
    
    // Actualizar años de experiencia
    const monthsExperience = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    this.experienceYears += monthsExperience / 12;
  }

  addCertification(name: string, issuer: string, issueDate: Date, expiryDate: Date, certificateNumber: string): void {
    if (!this.certifications) {
      this.certifications = [];
    }
    
    this.certifications.push({
      name,
      issuer,
      issueDate,
      expiryDate,
      certificateNumber,
      isActive: true
    });
  }

  addSkill(skillName: string, level: CertificationLevel, verified: boolean = false): void {
    if (!this.skills) {
      this.skills = [];
    }
    
    // Evitar duplicados
    const existingSkill = this.skills.find(skill => skill.skill === skillName);
    if (existingSkill) {
      existingSkill.level = level;
      existingSkill.verified = verified;
    } else {
      this.skills.push({
        skill: skillName,
        level,
        verified
      });
    }
  }
}