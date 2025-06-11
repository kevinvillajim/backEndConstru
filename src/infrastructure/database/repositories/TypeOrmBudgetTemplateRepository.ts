// src/infrastructure/database/repositories/TypeOrmBudgetTemplateRepository.ts
import { Repository, FindManyOptions, FindOneOptions, SelectQueryBuilder } from "typeorm";
import { BudgetTemplateRepository } from "../../../domain/repositories/BudgetTemplateRepository";
import { BudgetTemplate, ProjectType, TemplateScope } from "../../../domain/models/calculation/BudgetTemplate";
import { BudgetTemplateEntity, ProjectTypeEntity, TemplateScopeEntity } from "../entities/BudgetTemplateEntity";
import { PaginationOptions } from "../../../domain/models/common/PaginationOptions";
import { AppDataSource } from "../data-source";

export class TypeOrmBudgetTemplateRepository implements BudgetTemplateRepository {
  private repository: Repository<BudgetTemplateEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(BudgetTemplateEntity);
  }
  findByProjectType(projectType: ProjectType, geographicalZone?: string): Promise<BudgetTemplate[]> {
    throw new Error("Method not implemented.");
  }
  findByScope(scope: TemplateScope, userId?: string): Promise<BudgetTemplate[]> {
    throw new Error("Method not implemented.");
  }
  findActiveTemplates(filters?: { projectType?: ProjectType; geographicalZone?: string; scope?: TemplateScope; }): Promise<BudgetTemplate[]> {
    throw new Error("Method not implemented.");
  }
  findPopularTemplates(limit?: number): Promise<BudgetTemplate[]> {
    throw new Error("Method not implemented.");
  }
  incrementUsage(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async create(template: BudgetTemplate): Promise<BudgetTemplate> {
    const entity = this.toEntity(template);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<BudgetTemplate | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ["creator"]
    });
    
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserOrPublic(userId: string): Promise<BudgetTemplate[]> {
    const entities = await this.repository.find({
      where: [
        { createdBy: userId }, // Templates del usuario
        { scope: TemplateScopeEntity.SYSTEM }, // Templates del sistema
        { scope: TemplateScopeEntity.SHARED } // Templates compartidos
      ],
      relations: ["creator"],
      order: { usageCount: "DESC", createdAt: "DESC" }
    });

    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserWithFilters(
    userId: string,
    filters: any,
    pagination?: PaginationOptions
  ): Promise<{ items: BudgetTemplate[]; total: number; page: number; limit: number }> {
    
    const queryBuilder = this.repository.createQueryBuilder("template")
      .leftJoinAndSelect("template.creator", "creator");

    // Filtros de acceso
    queryBuilder.andWhere(
      "(template.createdBy = :userId OR template.scope IN (:...publicScopes))",
      { 
        userId, 
        publicScopes: [TemplateScopeEntity.SYSTEM, TemplateScopeEntity.SHARED] 
      }
    );

    // Aplicar filtros adicionales
    this.applyFilters(queryBuilder, filters);

    // Aplicar paginación
    if (pagination) {
      const offset = (pagination.page - 1) * pagination.limit;
      queryBuilder.skip(offset).take(pagination.limit);

      // Aplicar ordenamiento
      if (pagination.sortBy) {
        const order = pagination.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        queryBuilder.orderBy(`template.${pagination.sortBy}`, order);
      } else {
        queryBuilder.orderBy("template.usageCount", "DESC")
                   .addOrderBy("template.createdAt", "DESC");
      }
    }

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      items: entities.map(entity => this.toDomain(entity)),
      total,
      page: pagination?.page || 1,
      limit: pagination?.limit || entities.length
    };
  }

  async findTrending(options: {
    limit?: number;
    projectType?: ProjectType;
    geographicalZone?: string;
  }): Promise<BudgetTemplate[]> {
    
    const queryBuilder = this.repository.createQueryBuilder("template")
      .leftJoinAndSelect("template.creator", "creator")
      .where("template.isActive = :isActive", { isActive: true })
      .andWhere("template.scope IN (:...publicScopes)", {
        publicScopes: [TemplateScopeEntity.SYSTEM, TemplateScopeEntity.SHARED]
      });

    if (options.projectType) {
      queryBuilder.andWhere("template.projectType = :projectType", {
        projectType: this.toEntityProjectType(options.projectType)
      });
    }

    if (options.geographicalZone) {
      queryBuilder.andWhere("template.geographicalZone = :zone", {
        zone: options.geographicalZone
      });
    }

    queryBuilder
      .orderBy("template.usageCount", "DESC")
      .addOrderBy("template.averageRating", "DESC")
      .limit(options.limit || 10);

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async update(id: string, template: Partial<BudgetTemplate>): Promise<BudgetTemplate> {
    const existingEntity = await this.repository.findOneOrFail({ where: { id } });
    
    // Actualizar campos
    Object.assign(existingEntity, this.toEntity(template as BudgetTemplate));
    existingEntity.updatedAt = new Date();

    const savedEntity = await this.repository.save(existingEntity);
    return this.toDomain(savedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== undefined && result.affected > 0;
  }

  async countPersonalByUser(userId: string): Promise<number> {
    return await this.repository.count({
      where: {
        createdBy: userId,
        scope: TemplateScopeEntity.PERSONAL,
        isActive: true
      }
    });
  }

  async findRecommendationsFor(
    projectType: ProjectType,
    geographicalZone: string,
    userId: string
  ): Promise<BudgetTemplate[]> {
    
    const queryBuilder = this.repository.createQueryBuilder("template")
      .leftJoinAndSelect("template.creator", "creator")
      .where("template.isActive = :isActive", { isActive: true })
      .andWhere("(template.createdBy = :userId OR template.scope IN (:...publicScopes))", {
        userId,
        publicScopes: [TemplateScopeEntity.SYSTEM, TemplateScopeEntity.SHARED]
      });

    // Priorizar coincidencia exacta de tipo de proyecto
    queryBuilder.andWhere("template.projectType = :projectType", {
      projectType: this.toEntityProjectType(projectType)
    });

    // Priorizar zona geográfica similar
    queryBuilder.andWhere("template.geographicalZone = :zone", {
      zone: geographicalZone
    });

    queryBuilder
      .orderBy("template.isVerified", "DESC")
      .addOrderBy("template.usageCount", "DESC")
      .addOrderBy("template.averageRating", "DESC")
      .limit(5);

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async incrementUsageCount(id: string): Promise<void> {
    await this.repository.increment({ id }, "usageCount", 1);
  }

  async updateAverageRating(id: string, newRating: number): Promise<void> {
    await this.repository.update(id, { averageRating: newRating });
  }

  async findSimilar(template: BudgetTemplate, limit: number = 5): Promise<BudgetTemplate[]> {
    const queryBuilder = this.repository.createQueryBuilder("template")
      .leftJoinAndSelect("template.creator", "creator")
      .where("template.id != :id", { id: template.id })
      .andWhere("template.isActive = :isActive", { isActive: true })
      .andWhere("template.scope IN (:...publicScopes)", {
        publicScopes: [TemplateScopeEntity.SYSTEM, TemplateScopeEntity.SHARED]
      });

    // Buscar por tipo de proyecto similar
    queryBuilder.andWhere("template.projectType = :projectType", {
      projectType: this.toEntityProjectType(template.projectType)
    });

    // Ordenar por similitud (zona geográfica, rating, uso)
    queryBuilder
      .addSelect(
        `CASE WHEN template.geographicalZone = :zone THEN 1 ELSE 0 END`,
        "zone_match"
      )
      .setParameter("zone", template.geographicalZone)
      .orderBy("zone_match", "DESC")
      .addOrderBy("template.averageRating", "DESC")
      .addOrderBy("template.usageCount", "DESC")
      .limit(limit);

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  // Métodos auxiliares privados

  private applyFilters(queryBuilder: SelectQueryBuilder<BudgetTemplateEntity>, filters: any): void {
    if (filters.projectType) {
      queryBuilder.andWhere("template.projectType = :projectType", {
        projectType: this.toEntityProjectType(filters.projectType)
      });
    }

    if (filters.geographicalZone) {
      queryBuilder.andWhere("template.geographicalZone = :zone", {
        zone: filters.geographicalZone
      });
    }

    if (filters.scope) {
      queryBuilder.andWhere("template.scope = :scope", {
        scope: this.toEntityScope(filters.scope)
      });
    }

    if (filters.isVerified !== undefined) {
      queryBuilder.andWhere("template.isVerified = :isVerified", {
        isVerified: filters.isVerified
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere("template.isActive = :isActive", {
        isActive: filters.isActive
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        "(template.name ILIKE :search OR template.description ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    if (filters.minRating) {
      queryBuilder.andWhere("template.averageRating >= :minRating", {
        minRating: filters.minRating
      });
    }

    if (filters.minUsage) {
      queryBuilder.andWhere("template.usageCount >= :minUsage", {
        minUsage: filters.minUsage
      });
    }
  }

  private toDomain(entity: BudgetTemplateEntity): BudgetTemplate {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      projectType: this.fromEntityProjectType(entity.projectType),
      scope: this.fromEntityScope(entity.scope),
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

  private toEntity(domain: BudgetTemplate): Partial<BudgetTemplateEntity> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      projectType: this.toEntityProjectType(domain.projectType),
      scope: this.toEntityScope(domain.scope),
      geographicalZone: domain.geographicalZone,
      wasteFactors: domain.wasteFactors,
      laborRates: domain.laborRates,
      laborProductivity: domain.laborProductivity,
      indirectCosts: domain.indirectCosts,
      professionalFees: domain.professionalFees,
      necCompliance: domain.necCompliance,
      createdBy: domain.createdBy,
      isActive: domain.isActive,
      isVerified: domain.isVerified,
      usageCount: domain.usageCount,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
    };
  }

  private toEntityProjectType(projectType: ProjectType): ProjectTypeEntity {
    const mapping: Record<ProjectType, ProjectTypeEntity> = {
      [ProjectType.RESIDENTIAL_SINGLE]: ProjectTypeEntity.RESIDENTIAL_SINGLE,
      [ProjectType.RESIDENTIAL_MULTI]: ProjectTypeEntity.RESIDENTIAL_MULTI,
      [ProjectType.COMMERCIAL_SMALL]: ProjectTypeEntity.COMMERCIAL_SMALL,
      [ProjectType.COMMERCIAL_LARGE]: ProjectTypeEntity.COMMERCIAL_LARGE,
      [ProjectType.INDUSTRIAL]: ProjectTypeEntity.INDUSTRIAL,
      [ProjectType.INFRASTRUCTURE]: ProjectTypeEntity.INFRASTRUCTURE,
      [ProjectType.RENOVATION]: ProjectTypeEntity.RENOVATION,
      [ProjectType.SPECIALIZED]: ProjectTypeEntity.SPECIALIZED
    };
    return mapping[projectType];
  }

  private fromEntityProjectType(entityType: ProjectTypeEntity): ProjectType {
    const mapping: Record<ProjectTypeEntity, ProjectType> = {
      [ProjectTypeEntity.RESIDENTIAL_SINGLE]: ProjectType.RESIDENTIAL_SINGLE,
      [ProjectTypeEntity.RESIDENTIAL_MULTI]: ProjectType.RESIDENTIAL_MULTI,
      [ProjectTypeEntity.COMMERCIAL_SMALL]: ProjectType.COMMERCIAL_SMALL,
      [ProjectTypeEntity.COMMERCIAL_LARGE]: ProjectType.COMMERCIAL_LARGE,
      [ProjectTypeEntity.INDUSTRIAL]: ProjectType.INDUSTRIAL,
      [ProjectTypeEntity.INFRASTRUCTURE]: ProjectType.INFRASTRUCTURE,
      [ProjectTypeEntity.RENOVATION]: ProjectType.RENOVATION,
      [ProjectTypeEntity.SPECIALIZED]: ProjectType.SPECIALIZED
    };
    return mapping[entityType];
  }

  private toEntityScope(scope: TemplateScope): TemplateScopeEntity {
    const mapping: Record<TemplateScope, TemplateScopeEntity> = {
      [TemplateScope.SYSTEM]: TemplateScopeEntity.SYSTEM,
      [TemplateScope.COMPANY]: TemplateScopeEntity.COMPANY,
      [TemplateScope.PERSONAL]: TemplateScopeEntity.PERSONAL,
      [TemplateScope.SHARED]: TemplateScopeEntity.SHARED
    };
    return mapping[scope];
  }

  private fromEntityScope(entityScope: TemplateScopeEntity): TemplateScope {
    const mapping: Record<TemplateScopeEntity, TemplateScope> = {
      [TemplateScopeEntity.SYSTEM]: TemplateScope.SYSTEM,
      [TemplateScopeEntity.COMPANY]: TemplateScope.COMPANY,
      [TemplateScopeEntity.PERSONAL]: TemplateScope.PERSONAL,
      [TemplateScopeEntity.SHARED]: TemplateScope.SHARED
    };
    return mapping[entityScope];
  }
}