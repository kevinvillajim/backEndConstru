// src/infrastructure/database/entities/BudgetTemplateEntity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { UserEntity } from "./UserEntity";

export enum ProjectTypeEntity {
  RESIDENTIAL_SINGLE = "residential_single",
  RESIDENTIAL_MULTI = "residential_multi", 
  COMMERCIAL_SMALL = "commercial_small",
  COMMERCIAL_LARGE = "commercial_large",
  INDUSTRIAL = "industrial",
  INFRASTRUCTURE = "infrastructure",
  RENOVATION = "renovation",
  SPECIALIZED = "specialized"
}

export enum TemplateScopeEntity {
  SYSTEM = "system",
  COMPANY = "company", 
  PERSONAL = "personal",
  SHARED = "shared"
}

@Entity("budget_templates")
@Index("idx_budget_template_project_type", ["projectType"])
@Index("idx_budget_template_geographical_zone", ["geographicalZone"])
@Index("idx_budget_template_scope", ["scope"])
@Index("idx_budget_template_active", ["isActive"])
@Index("idx_budget_template_verified", ["isVerified"])
@Index("idx_budget_template_created_by", ["createdBy"])
export class BudgetTemplateEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({
    type: "enum",
    enum: ProjectTypeEntity
  })
  projectType!: ProjectTypeEntity;

  @Column({
    type: "enum", 
    enum: TemplateScopeEntity
  })
  scope!: TemplateScopeEntity;

  @Column({ type: "varchar", length: 50 })
  geographicalZone!: string;

  // Factores de desperdicio como JSON
  @Column({ type: "json", nullable: true })
  wasteFactors?: {
    concrete?: number;
    steel?: number;
    ceramics?: number;
    electrical?: number;
    plumbing?: number;
    general?: number;
  };

  // Tasas de mano de obra como JSON
  @Column({ type: "json", nullable: true })
  laborRates?: {
    masterBuilder?: number;
    builder?: number;
    helper?: number;
    electrician?: number;
    plumber?: number;
    painter?: number;
    carpenter?: number;
  };

  // Productividad de mano de obra como JSON
  @Column({ type: "json", nullable: true })
  laborProductivity?: {
    concretePouring?: number;
    wallConstruction?: number;
    tileInstallation?: number;
    paintingInterior?: number;
    paintingExterior?: number;
  };

  // Costos indirectos como JSON
  @Column({ type: "json", nullable: true })
  indirectCosts?: {
    administration?: number;
    utilities?: number;
    tools?: number;
    safety?: number;
    permits?: number;
  };

  // Honorarios profesionales como JSON
  @Column({ type: "json", nullable: true })
  professionalFees?: {
    architectural?: number;
    structural?: number;
    electrical?: number;
    mechanical?: number;
    supervision?: number;
    consultation?: number;
  };

  // Cumplimiento NEC como JSON
  @Column({ type: "json", nullable: true })
  necCompliance?: {
    seismicZone?: string;
    soilType?: string;
    windZone?: string;
    requiredFactors?: any;
  };

  // Metadata
  @Column({ type: "uuid" })
  createdBy!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: "createdBy" })
  creator!: UserEntity;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "boolean", default: false })
  isVerified!: boolean;

  @Column({ type: "int", default: 0 })
  usageCount!: number;

  // Rating promedio (calculado)
  @Column({ type: "decimal", precision: 3, scale: 2, nullable: true })
  averageRating?: number;

  // Metadata adicional como JSON
  @Column({ type: "json", nullable: true })
  metadata?: {
    version?: string;
    tags?: string[];
    category?: string;
    difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    estimatedSavings?: number;
    compatibleProjects?: string[];
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Métodos de utilidad
  getCompleteness(): number {
    let completedFields = 0;
    const totalFields = 20;

    // Campos básicos
    if (this.name) completedFields++;
    if (this.description) completedFields++;
    if (this.projectType) completedFields++;
    if (this.geographicalZone) completedFields++;

    // Factores de desperdicio
    if (this.wasteFactors?.general) completedFields++;
    if (this.wasteFactors?.concrete) completedFields++;
    if (this.wasteFactors?.steel) completedFields++;

    // Tasas de mano de obra
    if (this.laborRates?.masterBuilder) completedFields++;
    if (this.laborRates?.builder) completedFields++;
    if (this.laborRates?.helper) completedFields++;

    // Productividad
    if (this.laborProductivity?.concretePouring) completedFields++;
    if (this.laborProductivity?.wallConstruction) completedFields++;

    // Costos indirectos
    if (this.indirectCosts?.administration) completedFields++;
    if (this.indirectCosts?.utilities) completedFields++;
    if (this.indirectCosts?.tools) completedFields++;

    // Honorarios profesionales
    if (this.professionalFees?.architectural) completedFields++;
    if (this.professionalFees?.structural) completedFields++;
    if (this.professionalFees?.supervision) completedFields++;

    // Cumplimiento NEC
    if (this.necCompliance?.seismicZone) completedFields++;
    if (this.necCompliance?.soilType) completedFields++;

    return (completedFields / totalFields) * 100;
  }

  isAccessibleBy(userId: string, userCompany?: string): boolean {
    // Templates del sistema son accesibles para todos
    if (this.scope === TemplateScopeEntity.SYSTEM) {
      return true;
    }

    // Templates personales solo para el creador
    if (this.scope === TemplateScopeEntity.PERSONAL) {
      return this.createdBy === userId;
    }

    // Templates de empresa para miembros de la empresa
    if (this.scope === TemplateScopeEntity.COMPANY) {
      // Aquí se implementaría la lógica de verificación de empresa
      return userCompany !== undefined;
    }

    // Templates compartidos - implementar lógica específica
    if (this.scope === TemplateScopeEntity.SHARED) {
      return true; // Por ahora permitir acceso
    }

    return false;
  }

  canBeEditedBy(userId: string, isCompanyAdmin: boolean = false): boolean {
    // Templates del sistema no pueden editarse
    if (this.scope === TemplateScopeEntity.SYSTEM) {
      return false;
    }

    // Templates personales solo por el creador
    if (this.scope === TemplateScopeEntity.PERSONAL) {
      return this.createdBy === userId;
    }

    // Templates de empresa por el creador o administradores
    if (this.scope === TemplateScopeEntity.COMPANY) {
      return this.createdBy === userId || isCompanyAdmin;
    }

    // Templates compartidos por el creador
    if (this.scope === TemplateScopeEntity.SHARED) {
      return this.createdBy === userId;
    }

    return false;
  }

  getTotalIndirectCostRate(): number {
    if (!this.indirectCosts) return 0;
    
    return Object.values(this.indirectCosts)
      .filter(value => typeof value === 'number')
      .reduce((sum, value) => sum + value, 0);
  }

  getTotalProfessionalFeeRate(): number {
    if (!this.professionalFees) return 0;
    
    return Object.values(this.professionalFees)
      .filter(value => typeof value === 'number')
      .reduce((sum, value) => sum + value, 0);
  }

  // Método para validar datos antes de guardar
  validate(): string[] {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("El nombre del template es obligatorio");
    }

    if (!this.projectType) {
      errors.push("El tipo de proyecto es obligatorio");
    }

    if (!this.geographicalZone) {
      errors.push("La zona geográfica es obligatoria");
    }

    // Validar factores de desperdicio
    if (this.wasteFactors) {
      Object.entries(this.wasteFactors).forEach(([key, value]) => {
        if (value !== undefined && (value < 1.0 || value > 3.0)) {
          errors.push(`Factor de desperdicio ${key} debe estar entre 1.0 y 3.0`);
        }
      });
    }

    // Validar tasas de mano de obra
    if (this.laborRates) {
      Object.entries(this.laborRates).forEach(([key, value]) => {
        if (value !== undefined && (value < 5 || value > 500)) {
          errors.push(`Tasa de mano de obra ${key} debe estar entre $5 y $500`);
        }
      });
    }

    // Validar costos indirectos (como porcentajes)
    if (this.indirectCosts) {
      const totalIndirect = this.getTotalIndirectCostRate();
      if (totalIndirect > 0.8) { // 80%
        errors.push("Los costos indirectos totales no pueden exceder 80%");
      }
    }

    // Validar honorarios profesionales
    if (this.professionalFees) {
      const totalFees = this.getTotalProfessionalFeeRate();
      if (totalFees > 0.5) { // 50%
        errors.push("Los honorarios profesionales totales no pueden exceder 50%");
      }
    }

    return errors;
  }
}