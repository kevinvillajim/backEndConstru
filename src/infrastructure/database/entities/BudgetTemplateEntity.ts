// src/infrastructure/database/entities/BudgetTemplateEntity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
  } from "typeorm";
  import { UserEntity } from "./UserEntity";
  import { CalculationBudgetEntity } from "./CalculationBudgetEntity";
  
  export enum ProjectType {
    RESIDENTIAL_SINGLE = "residential_single",
    RESIDENTIAL_MULTI = "residential_multi", 
    COMMERCIAL_SMALL = "commercial_small",
    COMMERCIAL_LARGE = "commercial_large",
    INDUSTRIAL = "industrial",
    INFRASTRUCTURE = "infrastructure",
    RENOVATION = "renovation",
    SPECIALIZED = "specialized"
  }
  
  export enum TemplateScope {
    SYSTEM = "system",
    COMPANY = "company", 
    PERSONAL = "personal",
    SHARED = "shared"
  }
  
  @Entity("budget_templates")
  @Index("IDX_budget_template_type_region", ["projectType", "geographicalZone"])
  @Index("IDX_budget_template_active", ["isActive"])
  export class BudgetTemplateEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @Column()
    name: string;
  
    @Column({ type: "text" })
    description: string;
  
    @Column({
      type: "enum",
      enum: ProjectType
    })
    projectType: ProjectType;
  
    @Column({
      type: "enum",
      enum: TemplateScope,
      default: TemplateScope.PERSONAL
    })
    scope: TemplateScope;
  
    @Column({ name: "geographical_zone", default: "costa" })
    geographicalZone: string;
  
    // Factores de cálculo por región Ecuador
    @Column({ type: "json" })
    wasteFactors: {
      concrete?: number;
      steel?: number;
      ceramics?: number;
      electrical?: number;
      plumbing?: number;
      general?: number;
    };
  
    @Column({ type: "json" })
    laborRates: {
      masterBuilder?: number; // maestro mayor
      builder?: number; // albañil
      helper?: number; // peón
      electrician?: number;
      plumber?: number;
      painter?: number;
      carpenter?: number;
    };
  
    // Rendimientos típicos Ecuador (unidades por jornal)
    @Column({ type: "json" })
    laborProductivity: {
      concretePouring?: number; // m3/día
      wallConstruction?: number; // m2/día
      tileInstallation?: number; // m2/día
      paintingInterior?: number; // m2/día
      paintingExterior?: number; // m2/día
    };
  
    @Column({ type: "json" })
    indirectCosts: {
      administration?: number; // porcentaje
      utilities?: number; // porcentaje
      tools?: number; // porcentaje
      safety?: number; // porcentaje
      permits?: number; // monto fijo
    };
  
    @Column({ type: "json" })
    professionalFees: {
      architectural?: number; // porcentaje del presupuesto
      structural?: number;
      electrical?: number;
      mechanical?: number;
      supervision?: number;
      consultation?: number;
    };
  
    // Configuración NEC específica
    @Column({ type: "json", nullable: true })
    necCompliance: {
      seismicZone?: string;
      soilType?: string;
      windZone?: string;
      requiredFactors?: any;
    };
  
    @Column({ name: "created_by" })
    createdBy: string;
  
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: "created_by" })
    creator: UserEntity;
  
    @Column({ name: "is_active", default: true })
    isActive: boolean;
  
    @Column({ name: "is_verified", default: false })
    isVerified: boolean;
  
    @Column({ name: "usage_count", default: 0 })
    usageCount: number;
  
    @OneToMany(() => CalculationBudgetEntity, (budget) => budget.budgetTemplate)
    budgets: CalculationBudgetEntity[];
  
    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
  
    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
  }