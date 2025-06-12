// src/infrastructure/database/repositories/TypeOrmProfessionalCostRepository.ts
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ProfessionalCostRepository } from "../../../domain/repositories/ProfessionalCostRepository";
import { ProfessionalCost, CreateProfessionalCostDTO, ProfessionalService, ComplexityLevel } from "../../../domain/models/calculation/ProfessionalCost";
import { ProfessionalCostEntity } from "../entities/ProfessionalCostEntity";

export class TypeOrmProfessionalCostRepository implements ProfessionalCostRepository {
  private repository: Repository<ProfessionalCostEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProfessionalCostEntity);
  }
  findByType(calculationBudgetId: string, costType: string): Promise<ProfessionalCost[]> {
    throw new Error("Method not implemented.");
  }

  async findById(id: string): Promise<ProfessionalCost | null> {
    const professionalCost = await this.repository.findOne({
      where: { id },
      relations: ["professional", "calculationBudget"]
    });

    return professionalCost ? this.toDomainModel(professionalCost) : null;
  }

  async findByBudget(calculationBudgetId: string): Promise<ProfessionalCost[]> {
    const professionalCosts = await this.repository.find({
      where: { calculationBudgetId },
      relations: ["professional"],
      order: { createdAt: "ASC" }
    });

    return professionalCosts.map(cost => this.toDomainModel(cost));
  }

  

  async findByService(calculationBudgetId: string, service: ProfessionalService): Promise<ProfessionalCost | null> {
    const professionalCost = await this.repository.findOne({
      where: { 
        calculationBudgetId,
        service
      },
      relations: ["professional"]
    });

    return professionalCost ? this.toDomainModel(professionalCost) : null;
  }

  async findByProfessional(professionalId: string): Promise<ProfessionalCost[]> {
    const professionalCosts = await this.repository.find({
      where: { professionalId },
      relations: ["calculationBudget"],
      order: { createdAt: "DESC" }
    });

    return professionalCosts.map(cost => this.toDomainModel(cost));
  }

  async findApproved(calculationBudgetId: string): Promise<ProfessionalCost[]> {
    const professionalCosts = await this.repository.find({
      where: { 
        calculationBudgetId,
        isApproved: true
      },
      relations: ["professional"],
      order: { approvalDate: "DESC" }
    });

    return professionalCosts.map(cost => this.toDomainModel(cost));
  }

  async create(professionalCostData: CreateProfessionalCostDTO): Promise<ProfessionalCost> {
    const professionalCostEntity = this.toEntity(professionalCostData);
    const savedProfessionalCost = await this.repository.save(professionalCostEntity);
    return this.toDomainModel(savedProfessionalCost);
  }

  async createMany(professionalCostsData: CreateProfessionalCostDTO[]): Promise<ProfessionalCost[]> {
    const professionalCostEntities = professionalCostsData.map(data => this.toEntity(data));
    const savedProfessionalCosts = await this.repository.save(professionalCostEntities);
    return savedProfessionalCosts.map(cost => this.toDomainModel(cost));
  }

  async update(id: string, professionalCostData: Partial<ProfessionalCost>): Promise<ProfessionalCost | null> {
    const professionalCost = await this.repository.findOne({ where: { id } });
    if (!professionalCost) return null;

    Object.assign(professionalCost, professionalCostData);
    const updatedProfessionalCost = await this.repository.save(professionalCost);
    return this.toDomainModel(updatedProfessionalCost);
  }

  async approve(id: string, approvedBy?: string): Promise<ProfessionalCost | null> {
    const professionalCost = await this.repository.findOne({ where: { id } });
    if (!professionalCost) return null;

    professionalCost.isApproved = true;
    professionalCost.approvalDate = new Date();

    const updatedProfessionalCost = await this.repository.save(professionalCost);
    return this.toDomainModel(updatedProfessionalCost);
  }

  async recalculateAmount(id: string, budgetSubtotal: number): Promise<ProfessionalCost | null> {
    const professionalCost = await this.repository.findOne({ where: { id } });
    if (!professionalCost) return null;

    // Recalcular según el tipo de cálculo
    let newAmount = professionalCost.fixedAmount;

    // Si tiene porcentaje base, calcular sobre el subtotal del presupuesto
    if (professionalCost.basePercentage > 0) {
      newAmount += budgetSubtotal * (professionalCost.basePercentage / 100);
    }

    // Si tiene tarifa por horas, calcular según las horas estimadas
    if (professionalCost.hourlyRate && professionalCost.estimatedHours) {
      newAmount += professionalCost.hourlyRate * professionalCost.estimatedHours;
    }

    // Aplicar multiplicador de complejidad
    newAmount *= professionalCost.complexityMultiplier;

    professionalCost.calculatedAmount = newAmount;

    const updatedProfessionalCost = await this.repository.save(professionalCost);
    return this.toDomainModel(updatedProfessionalCost);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async deleteByBudget(calculationBudgetId: string): Promise<boolean> {
    const result = await this.repository.delete({ calculationBudgetId });
    return result.affected !== 0;
  }

  async getTotalByBudget(calculationBudgetId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder("professionalCost")
      .select("SUM(professionalCost.calculatedAmount)", "total")
      .where("professionalCost.calculationBudgetId = :calculationBudgetId", { calculationBudgetId })
      .andWhere("professionalCost.isApproved = :isApproved", { isApproved: true })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  private toDomainModel(entity: ProfessionalCostEntity): ProfessionalCost {
    return {
      id: entity.id,
      calculationBudgetId: entity.calculationBudgetId,
      service: entity.service,
      description: entity.description,
      complexityLevel: entity.complexityLevel,
      type: entity.type,
      amount: entity.amount,
      percentage: entity.percentage,
      costType: entity.costType,
      basedOnAmount: entity.basedOnAmount,
      basePercentage: entity.basePercentage,
      fixedAmount: entity.fixedAmount,
      hourlyRate: entity.hourlyRate,
      estimatedHours: entity.estimatedHours,
      complexityMultiplier: entity.complexityMultiplier,
      calculatedAmount: entity.calculatedAmount,
      professionalId: entity.professionalId,
      professionalName: entity.professionalName,
      professionalRegistration: entity.professionalRegistration,
      professionalSpeciality: entity.professionalSpeciality,
      ecuadorianRegulation: entity.ecuadorianRegulation,
      includesTaxes: entity.includesTaxes,
      taxPercentage: entity.taxPercentage,
      isApproved: entity.isApproved,
      approvalDate: entity.approvalDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  private toEntity(model: CreateProfessionalCostDTO): ProfessionalCostEntity {
    const entity = new ProfessionalCostEntity();
    Object.assign(entity, model);
    return entity;
  }
}