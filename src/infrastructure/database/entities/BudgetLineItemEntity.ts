// src/infrastructure/database/entities/BudgetLineItemEntity.ts
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
import { MaterialEntity } from "./MaterialEntity";
import { CalculationResultEntity } from "./CalculationResultEntity";

export enum LineItemType {
  MATERIAL = "material",
  LABOR = "labor", 
  EQUIPMENT = "equipment",
  SUBCONTRACT = "subcontract",
  PROFESSIONAL = "professional",
  INDIRECT = "indirect",
  CONTINGENCY = "contingency"
}

export enum LineItemSource {
  CALCULATION = "calculation", // Proviene de cálculo técnico
  MANUAL = "manual", // Ingresado manualmente
  TEMPLATE = "template", // Desde plantilla
  IMPORTED = "imported" // Importado desde otra fuente
}

@Entity("budget_line_items")
@Index("IDX_line_item_budget_category", ["calculationBudgetId", "category"])
@Index("IDX_line_item_type_source", ["itemType", "source"])
export class BudgetLineItemEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  description: string;

  @Column({ type: "text", nullable: true })
  specifications: string;

  @Column({
    type: "enum",
    enum: LineItemType
  })
  itemType: LineItemType;

  @Column({
    type: "enum",
    enum: LineItemSource,
    default: LineItemSource.MANUAL
  })
  source: LineItemSource;

  @Column({ name: "calculation_budget_id" })
  calculationBudgetId: string;

  @ManyToOne(() => CalculationBudgetEntity, (budget) => budget.lineItems)
  @JoinColumn({ name: "calculation_budget_id" })
  calculationBudget: CalculationBudgetEntity;

  // Información del cálculo origen (si aplica)
  @Column({ name: "source_calculation_id", nullable: true })
  sourceCalculationId: string;

  @ManyToOne(() => CalculationResultEntity, { nullable: true })
  @JoinColumn({ name: "source_calculation_id" })
  sourceCalculation: CalculationResultEntity;

  @Column({ name: "calculation_parameter_key", nullable: true })
  calculationParameterKey: string; // Clave en el resultado del cálculo

  // Información del material (si aplica)
  @Column({ name: "material_id", nullable: true })
  materialId: string;

  @ManyToOne(() => MaterialEntity, { nullable: true })
  @JoinColumn({ name: "material_id" })
  material: MaterialEntity;

  // Cantidades y precios
  @Column({ type: "decimal", precision: 10, scale: 3 })
  quantity: number;

  @Column({ name: "unit_of_measure" })
  unitOfMeasure: string;

  @Column({ name: "unit_price", type: "decimal", precision: 12, scale: 4 })
  unitPrice: number;

  @Column({ name: "waste_percentage", type: "decimal", precision: 5, scale: 2, default: 0 })
  wastePercentage: number;

  @Column({ name: "final_quantity", type: "decimal", precision: 10, scale: 3 })
  finalQuantity: number; // Cantidad + desperdicio

  @Column({ name: "subtotal", type: "decimal", precision: 12, scale: 2 })
  subtotal: number;

  // Categorización
  @Column({ name: "category" })
  category: string; // Materiales, Mano de Obra, etc.

  @Column({ name: "subcategory", nullable: true })
  subcategory: string;

  @Column({ name: "chapter", nullable: true })
  chapter: string; // Capítulo de obra

  @Column({ name: "cost_code", nullable: true })
  costCode: string; // Código de costo interno

  // Información regional y técnica
  @Column({ name: "regional_factor", type: "decimal", precision: 5, scale: 3, default: 1 })
  regionalFactor: number;

  @Column({ name: "difficulty_factor", type: "decimal", precision: 5, scale: 3, default: 1 })
  difficultyFactor: number;

  @Column({ name: "nec_reference", nullable: true })
  necReference: string;

  // Tracking de precios
  @Column({ name: "price_date", nullable: true })
  priceDate: Date;

  @Column({ name: "price_source", nullable: true })
  priceSource: string; // IPCO, Proveedor, etc.

  @Column({ name: "price_validity_days", type: "int", default: 30 })
  priceValidityDays: number;

  // Metadata adicional
  @Column({ type: "json", nullable: true })
  metadata: {
    supplierInfo?: any;
    technicalSpecs?: any;
    alternativeOptions?: any;
    notes?: string;
  };

  // Campos personalizados - AGREGADO
  @Column({ type: "json", nullable: true })
  customFields: Record<string, any>;

  @Column({ name: "display_order", type: "int", default: 0 })
  displayOrder: number;

  @Column({ name: "is_optional", default: false })
  isOptional: boolean;

  @Column({ name: "is_alternate", default: false })
  isAlternate: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}