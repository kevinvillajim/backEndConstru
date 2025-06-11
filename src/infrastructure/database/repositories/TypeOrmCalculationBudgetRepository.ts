// src/infrastructure/database/repositories/TypeOrmCalculationBudgetRepository.ts
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { CalculationBudgetRepository } from "../../../domain/repositories/CalculationBudgetRepository";
import { CalculationBudget, CreateCalculationBudgetDTO } from "../../../domain/models/calculation/CalculationBudget";
import { CalculationBudgetEntity } from "../entities/CalculationBudgetEntity";
import { PaginationOptions } from "../../../domain/models/common/PaginationOptions";

export class TypeOrmCalculationBudgetRepository implements CalculationBudgetRepository {
  private repository: Repository<CalculationBudgetEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CalculationBudgetEntity);
  }

  async findById(id: string): Promise<CalculationBudget | null> {
    const budget = await this.repository.findOne({
      where: { id },
      relations: ["lineItems", "budgetTemplate", "calculationResult"]
    });

    return budget ? this.toDomainModel(budget) : null;
  }

  async findByProject(projectId: string, options?: PaginationOptions): Promise<{
    budgets: CalculationBudget[];
    total: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder("budget")
      .leftJoinAndSelect("budget.lineItems", "lineItems")
      .leftJoinAndSelect("budget.budgetTemplate", "template")
      .where("budget.projectId = :projectId", { projectId });

    // Aplicar paginación y filtros
    if (options?.page && options?.limit) {
      queryBuilder
        .skip((options.page - 1) * options.limit)
        .take(options.limit);
    }

    if (options?.sortBy) {
      const order = options.sortOrder === "desc" ? "DESC" : "ASC";
      queryBuilder.orderBy(`budget.${options.sortBy}`, order);
    } else {
      queryBuilder.orderBy("budget.createdAt", "DESC");
    }

    const [budgetEntities, total] = await queryBuilder.getManyAndCount();
    const budgets = budgetEntities.map(entity => this.toDomainModel(entity));

    return { budgets, total };
  }

  async findByUser(userId: string, options?: PaginationOptions): Promise<{
    budgets: CalculationBudget[];
    total: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder("budget")
      .leftJoinAndSelect("budget.lineItems", "lineItems")
      .where("budget.userId = :userId", { userId });

    // Similar implementación a findByProject...
    if (options?.page && options?.limit) {
      queryBuilder
        .skip((options.page - 1) * options.limit)
        .take(options.limit);
    }

    if (options?.sortBy) {
      const order = options.sortOrder === "desc" ? "DESC" : "ASC";
      queryBuilder.orderBy(`budget.${options.sortBy}`, order);
    } else {
      queryBuilder.orderBy("budget.createdAt", "DESC");
    }

    const [budgetEntities, total] = await queryBuilder.getManyAndCount();
    const budgets = budgetEntities.map(entity => this.toDomainModel(entity));

    return { budgets, total };
  }

  async findByUserWithFilters(
    userId: string,
    filters: any,
    options?: PaginationOptions
  ): Promise<{ budgets: CalculationBudget[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder("budget")
      .leftJoinAndSelect("budget.lineItems", "lineItems")
      .where("budget.userId = :userId", { userId });
  
    // Aplicar filtros adicionales
    if (filters.projectId) {
      queryBuilder.andWhere("budget.projectId = :projectId", {
        projectId: filters.projectId
      });
    }
  
    if (filters.status) {
      queryBuilder.andWhere("budget.status = :status", {
        status: filters.status
      });
    }
  
    if (filters.budgetType) {
      queryBuilder.andWhere("budget.budgetType = :budgetType", {
        budgetType: filters.budgetType
      });
    }
  
    if (filters.search) {
      queryBuilder.andWhere(
        "(budget.name ILIKE :search OR budget.description ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }
  
    // Aplicar paginación
    if (options?.page && options?.limit) {
      queryBuilder
        .skip((options.page - 1) * options.limit)
        .take(options.limit);
    }
  
    if (options?.sortBy) {
      const order = options.sortOrder === "desc" ? "DESC" : "ASC";
      queryBuilder.orderBy(`budget.${options.sortBy}`, order);
    } else {
      queryBuilder.orderBy("budget.createdAt", "DESC");
    }
  
    const [budgetEntities, total] = await queryBuilder.getManyAndCount();
    const budgets = budgetEntities.map(entity => this.toDomainModel(entity));
  
    return { budgets, total };
  }
  
  async countByUserAndMonth(userId: string, date: Date): Promise<number> {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  
    return await this.repository.count({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        } as any
      }
    });
  }

  async findByCalculationResult(calculationResultId: string): Promise<CalculationBudget[]> {
    const budgets = await this.repository.find({
      where: { calculationResultId },
      relations: ["lineItems"]
    });

    return budgets.map(budget => this.toDomainModel(budget));
  }

  async findVersions(parentBudgetId: string): Promise<CalculationBudget[]> {
    const budgets = await this.repository.find({
      where: { parentBudgetId },
      order: { version: "ASC" },
      relations: ["lineItems"]
    });

    return budgets.map(budget => this.toDomainModel(budget));
  }

  async create(budgetData: CreateCalculationBudgetDTO): Promise<CalculationBudget> {
    const budgetEntity = this.toEntity(budgetData);
    const savedBudget = await this.repository.save(budgetEntity);
    return this.toDomainModel(savedBudget);
  }

  async update(id: string, budgetData: Partial<CalculationBudget>): Promise<CalculationBudget | null> {
    const budget = await this.repository.findOne({ where: { id } });
    if (!budget) return null;

    Object.assign(budget, budgetData);
    const updatedBudget = await this.repository.save(budget);
    return this.toDomainModel(updatedBudget);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async recalculateTotals(id: string): Promise<CalculationBudget | null> {
    const budget = await this.repository.findOne({
      where: { id },
      relations: ["lineItems"]
    });

    if (!budget) return null;

    // Recalcular totales basado en line items
    const materialsSubtotal = budget.lineItems
      ?.filter(item => item.itemType === "material")
      .reduce((sum, item) => sum + item.subtotal, 0) || 0;

    const laborSubtotal = budget.lineItems
      ?.filter(item => item.itemType === "labor")
      .reduce((sum, item) => sum + item.subtotal, 0) || 0;

    const subtotal = materialsSubtotal + laborSubtotal + budget.professionalCostsTotal + budget.indirectCosts;
    const contingencyAmount = subtotal * (budget.contingencyPercentage / 100);
    const taxAmount = (subtotal + contingencyAmount) * (budget.taxPercentage / 100);
    const total = subtotal + contingencyAmount + taxAmount;

    await this.repository.update(id, {
      materialsSubtotal,
      laborSubtotal,
      subtotal,
      contingencyAmount,
      taxAmount,
      total,
      lastCalculatedAt: new Date()
    });

    return this.findById(id);
  }

  private toDomainModel(entity: CalculationBudgetEntity): CalculationBudget {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      budgetType: entity.budgetType,
      version: entity.version,
      parentBudgetId: entity.parentBudgetId,
      projectId: entity.projectId,
      userId: entity.userId,
      calculationResultId: entity.calculationResultId,
      budgetTemplateId: entity.budgetTemplateId,
      materialsSubtotal: entity.materialsSubtotal,
      laborSubtotal: entity.laborSubtotal,
      professionalCostsTotal: entity.professionalCostsTotal, // CORREGIDO: Usar el campo numérico
      indirectCosts: entity.indirectCosts,
      contingencyPercentage: entity.contingencyPercentage,
      contingencyAmount: entity.contingencyAmount,
      subtotal: entity.subtotal,
      taxPercentage: entity.taxPercentage,
      taxAmount: entity.taxAmount,
      total: entity.total,
      geographicalZone: entity.geographicalZone,
      currency: entity.currency,
      exchangeRate: entity.exchangeRate,
      customization: entity.customization,
      exportSettings: entity.exportSettings,
      lastCalculatedAt: entity.lastCalculatedAt,
      isTemplateBudget: entity.isTemplateBudget,
      approvedBy: entity.approvedBy,
      approvedAt: entity.approvedAt,
      // CORREGIDO: Mapear correctamente los arrays relacionados
      lineItems: entity.lineItems?.map(item => ({
        id: item.id,
        description: item.description,
        specifications: item.specifications,
        itemType: item.itemType,
        source: item.source,
        calculationBudgetId: item.calculationBudgetId,
        sourceCalculationId: item.sourceCalculationId,
        calculationParameterKey: item.calculationParameterKey,
        materialId: item.materialId,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        unitPrice: item.unitPrice,
        wastePercentage: item.wastePercentage,
        finalQuantity: item.finalQuantity,
        subtotal: item.subtotal,
        category: item.category,
        subcategory: item.subcategory,
        chapter: item.chapter,
        costCode: item.costCode,
        regionalFactor: item.regionalFactor,
        difficultyFactor: item.difficultyFactor,
        necReference: item.necReference,
        priceDate: item.priceDate,
        priceSource: item.priceSource,
        priceValidityDays: item.priceValidityDays,
        metadata: item.metadata,
        displayOrder: item.displayOrder,
        isOptional: item.isOptional,
        isAlternate: item.isAlternate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      professionalCosts: [], // TODO: Implementar cuando se carguen las relaciones
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  private toEntity(model: CreateCalculationBudgetDTO): CalculationBudgetEntity {
    const entity = new CalculationBudgetEntity();
    Object.assign(entity, model);
    return entity;
  }
}