// src/infrastructure/database/repositories/TypeOrmBudgetTemplateRepository.ts
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { BudgetTemplateRepository } from "../../../domain/repositories/BudgetTemplateRepository";
import { BudgetTemplate, CreateBudgetTemplateDTO, ProjectType, TemplateScope } from "../../../domain/models/calculation/BudgetTemplate";
import { BudgetTemplateEntity } from "../entities/BudgetTemplateEntity";
import { PaginationOptions } from "../../../domain/models/common/PaginationOptions";

export class TypeOrmBudgetTemplateRepository implements BudgetTemplateRepository {
  private repository: Repository<BudgetTemplateEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(BudgetTemplateEntity);
  }

  async findById(id: string): Promise<BudgetTemplate | null> {
    const template = await this.repository.findOne({
      where: { id },
      relations: ["creator"]
    });

    return template ? this.toDomainModel(template) : null;
  }

  async findByProjectType(projectType: ProjectType, geographicalZone?: string): Promise<BudgetTemplate[]> {
    const queryBuilder = this.repository.createQueryBuilder("template")
      .where("template.projectType = :projectType", { projectType })
      .andWhere("template.isActive = :isActive", { isActive: true });

    if (geographicalZone) {
      queryBuilder.andWhere("template.geographicalZone = :geographicalZone", { geographicalZone });
    }

    queryBuilder.orderBy("template.usageCount", "DESC");

    const templates = await queryBuilder.getMany();
    return templates.map(template => this.toDomainModel(template));
  }

  async findByScope(scope: TemplateScope, userId?: string): Promise<BudgetTemplate[]> {
    const queryBuilder = this.repository.createQueryBuilder("template")
      .where("template.scope = :scope", { scope })
      .andWhere("template.isActive = :isActive", { isActive: true });

    if (userId && scope === TemplateScope.PERSONAL) {
      queryBuilder.andWhere("template.createdBy = :userId", { userId });
    }

    queryBuilder.orderBy("template.createdAt", "DESC");

    const templates = await queryBuilder.getMany();
    return templates.map(template => this.toDomainModel(template));
  }

  async findActiveTemplates(filters?: {
    projectType?: ProjectType;
    geographicalZone?: string;
    scope?: TemplateScope;
  }): Promise<BudgetTemplate[]> {
    const queryBuilder = this.repository.createQueryBuilder("template")
      .where("template.isActive = :isActive", { isActive: true });

    if (filters?.projectType) {
      queryBuilder.andWhere("template.projectType = :projectType", { 
        projectType: filters.projectType 
      });
    }

    if (filters?.geographicalZone) {
      queryBuilder.andWhere("template.geographicalZone = :geographicalZone", { 
        geographicalZone: filters.geographicalZone 
      });
    }

    if (filters?.scope) {
      queryBuilder.andWhere("template.scope = :scope", { 
        scope: filters.scope 
      });
    }

    queryBuilder.orderBy("template.usageCount", "DESC")
      .addOrderBy("template.createdAt", "DESC");

    const templates = await queryBuilder.getMany();
    return templates.map(template => this.toDomainModel(template));
  }

  async findPopularTemplates(limit: number = 10): Promise<BudgetTemplate[]> {
    const templates = await this.repository.find({
      where: { 
        isActive: true,
        scope: TemplateScope.SYSTEM
      },
      order: { 
        usageCount: "DESC",
        createdAt: "DESC"
      },
      take: limit
    });

    return templates.map(template => this.toDomainModel(template));
  }

  async create(templateData: CreateBudgetTemplateDTO): Promise<BudgetTemplate> {
    const templateEntity = this.toEntity(templateData);
    const savedTemplate = await this.repository.save(templateEntity);
    return this.toDomainModel(savedTemplate);
  }

  async update(id: string, templateData: Partial<BudgetTemplate>): Promise<BudgetTemplate | null> {
    const template = await this.repository.findOne({ where: { id } });
    if (!template) return null;

    Object.assign(template, templateData);
    const updatedTemplate = await this.repository.save(template);
    return this.toDomainModel(updatedTemplate);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.repository.increment({ id }, "usageCount", 1);
  }

  private toDomainModel(entity: BudgetTemplateEntity): BudgetTemplate {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      projectType: entity.projectType,
      scope: entity.scope,
      geographicalZone: entity.geographicalZone,
      wasteFactors: entity.wasteFactors,
      laborRates: entity.laborRates,
      laborProductivity: entity.laborProductivity,
      indirectCosts: entity.indirectCosts,
      professionalFees: entity.professionalFees,
      necCompliance: entity.necCompliance,
      createdBy: entity.createdBy,
      isActive: entity.isActive,
      isVerified: entity.isVerified,
      usageCount: entity.usageCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  private toEntity(model: CreateBudgetTemplateDTO): BudgetTemplateEntity {
    const entity = new BudgetTemplateEntity();
    Object.assign(entity, model);
    return entity;
  }
}