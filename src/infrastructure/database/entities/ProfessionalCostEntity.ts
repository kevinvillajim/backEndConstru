// src/infrastructure/database/entities/ProfessionalCostEntity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { CalculationBudgetEntity } from "./CalculationBudgetEntity";
import { UserEntity } from "./UserEntity";

export enum ProfessionalService {
  ARCHITECTURAL_DESIGN = "architectural_design",
  STRUCTURAL_DESIGN = "structural_design", 
  ELECTRICAL_DESIGN = "electrical_design",
  MECHANICAL_DESIGN = "mechanical_design",
  PLUMBING_DESIGN = "plumbing_design",
  CONSTRUCTION_SUPERVISION = "construction_supervision",
  PROJECT_MANAGEMENT = "project_management",
  SPECIALTY_CONSULTATION = "specialty_consultation",
  PERMITS_PROCESSING = "permits_processing",
  QUALITY_CONTROL = "quality_control"
}

export enum ComplexityLevel {
  BASIC = "basic", // Vivienda unifamiliar
  INTERMEDIATE = "intermediate", // Edificio pequeño
  ADVANCED = "advanced", // Edificio grande
  COMPLEX = "complex" // Infraestructura especializada
}

@Entity("professional_costs")
@Index("IDX_prof_cost_budget", ["calculationBudgetId"])
@Index("IDX_prof_cost_service", ["service"])
export class ProfessionalCostEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "calculation_budget_id" })
  calculationBudgetId: string;

  @ManyToOne(() => CalculationBudgetEntity)
  @JoinColumn({ name: "calculation_budget_id" })
  calculationBudget: CalculationBudgetEntity;

  @Column({
    type: "enum",
    enum: ProfessionalService
  })
  service: ProfessionalService;

  @Column()
  description: string;

  @Column({
    type: "enum",
    enum: ComplexityLevel
  })
  complexityLevel: ComplexityLevel;

  // Propiedades principales requeridas por el modelo de dominio
  @Column({ name: "cost_type", type: "varchar", length: 50 })
  costType: string;

  @Column({ name: "type", type: "varchar", length: 50 })
  type: string;

  @Column({ name: "amount", type: "decimal", precision: 12, scale: 2 })
  amount: number;

  @Column({ name: "percentage", type: "decimal", precision: 5, scale: 2 })
  percentage: number;

  @Column({ name: "based_on_amount", type: "decimal", precision: 12, scale: 2, nullable: true })
  basedOnAmount: number;

  // Cálculo del honorario
  @Column({ name: "base_percentage", type: "decimal", precision: 5, scale: 3 })
  basePercentage: number; // % sobre presupuesto de construcción

  @Column({ name: "fixed_amount", type: "decimal", precision: 12, scale: 2, default: 0 })
  fixedAmount: number; // Monto fijo adicional

  @Column({ name: "hourly_rate", type: "decimal", precision: 8, scale: 2, nullable: true })
  hourlyRate: number; // Tarifa por hora

  @Column({ name: "estimated_hours", type: "decimal", precision: 8, scale: 2, nullable: true })
  estimatedHours: number;

  @Column({ name: "complexity_multiplier", type: "decimal", precision: 5, scale: 3, default: 1 })
  complexityMultiplier: number;

  @Column({ name: "calculated_amount", type: "decimal", precision: 12, scale: 2 })
  calculatedAmount: number;

  // Información del profesional
  @Column({ name: "professional_id", nullable: true })
  professionalId: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "professional_id" })
  professional: UserEntity;

  @Column({ name: "professional_name", nullable: true })
  professionalName: string;

  @Column({ name: "professional_registration", nullable: true })
  professionalRegistration: string; // Número de colegiatura

  @Column({ name: "professional_speciality", nullable: true })
  professionalSpeciality: string;

  // Configuración según normativa ecuatoriana
  @Column({ type: "json", nullable: true })
  ecuadorianRegulation: {
    collegeProfessional?: string; // CAE, CIE, etc.
    minimumPercentage?: number;
    maximumPercentage?: number;
    regulationReference?: string;
  };

  @Column({ name: "includes_taxes", default: true })
  includesTaxes: boolean;

  @Column({ name: "tax_percentage", type: "decimal", precision: 5, scale: 2, default: 15 })
  taxPercentage: number;

  @Column({ name: "is_approved", default: false })
  isApproved: boolean;

  @Column({ name: "approval_date", nullable: true })
  approvalDate: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}