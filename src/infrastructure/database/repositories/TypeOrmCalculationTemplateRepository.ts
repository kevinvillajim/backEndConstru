// src/infrastructure/database/repositories/TypeOrmCalculationTemplateRepository.ts
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import {CalculationTemplateRepository} from "../../../domain/repositories/CalculationTemplateRepository";
import {
	CalculationTemplate,
	CreateCalculationTemplateDTO,
	UpdateCalculationTemplateDTO,
	CalculationType,
	ProfessionType,
} from "../../../domain/models/calculation/CalculationTemplate";
import {CalculationParameter} from "../../../domain/models/calculation/CalculationParameter";
import { CalculationTemplateEntity } from "../entities/CalculationTemplateEntity";
import { CalculationParameterEntity } from "../entities/CalculationParameterEntity";

export class TypeOrmCalculationTemplateRepository implements CalculationTemplateRepository {
  private repository: Repository<CalculationTemplateEntity>;
  private parameterRepository: Repository<CalculationParameterEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CalculationTemplateEntity);
    this.parameterRepository = AppDataSource.getRepository(CalculationParameterEntity);
  }

  async findById(id: string): Promise<CalculationTemplate | null> {
    const template = await this.repository.findOne({
      where: { id }
    });
    
    return template ? this.toDomainModel(template) : null;
  }

  async findByIdWithParameters(id: string): Promise<CalculationTemplate | null> {
    const template = await this.repository.findOne({
      where: { id },
      relations: ["parameters"]
    });
    
    if (!template) return null;
    
    const domainTemplate = this.toDomainModel(template);
    
    // Convertir parámetros a modelo de dominio
    if (template.parameters) {
      domainTemplate.parameters = template.parameters.map(p => this.toParameterDomainModel(p));
    }
    
    return domainTemplate;
  }

  async findAll(
    filters?: {
      types?: CalculationType[];
      targetProfessions?: ProfessionType[];
      isActive?: boolean;
      isVerified?: boolean;
      isFeatured?: boolean;
      shareLevel?: "private" | "organization" | "public";
      createdBy?: string;
      tags?: string[];
      searchTerm?: string;
    },
    pagination?: {
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    }
  ): Promise<{ templates: CalculationTemplate[]; total: number }> {
    // Construir query base
    let queryBuilder = this.repository.createQueryBuilder("template");
    
    // Aplicar filtros
    if (filters) {
      if (filters.types && filters.types.length > 0) {
        queryBuilder = queryBuilder.andWhere("template.type IN (:...types)", { types: filters.types });
      }
      
      if (filters.targetProfessions && filters.targetProfessions.length > 0) {
        queryBuilder = queryBuilder.andWhere("template.targetProfession IN (:...professions)", { 
          professions: filters.targetProfessions 
        });
      }
      
      if (filters.isActive !== undefined) {
        queryBuilder = queryBuilder.andWhere("template.is_active = :isActive", { isActive: filters.isActive });
      }
      
      if (filters.isVerified !== undefined) {
        queryBuilder = queryBuilder.andWhere("template.is_verified = :isVerified", { isVerified: filters.isVerified });
      }
      
      if (filters.isFeatured !== undefined) {
        queryBuilder = queryBuilder.andWhere("template.is_featured = :isFeatured", { isFeatured: filters.isFeatured });
      }
      
      if (filters.shareLevel) {
        queryBuilder = queryBuilder.andWhere("template.share_level = :shareLevel", { shareLevel: filters.shareLevel });
      }
      
      if (filters.createdBy) {
        queryBuilder = queryBuilder.andWhere("template.created_by = :createdBy", { createdBy: filters.createdBy });
      }
      
      if (filters.tags && filters.tags.length > 0) {
        // Para buscar en array de tags (JSON)
        // Nota: esta implementación puede variar según la base de datos
        filters.tags.forEach((tag, index) => {
          queryBuilder = queryBuilder.andWhere(`JSON_CONTAINS(template.tags, :tag${index})`, { [`tag${index}`]: `"${tag}"` });
        });
      }
      
      if (filters.searchTerm) {
        queryBuilder = queryBuilder.andWhere(
          "(template.name LIKE :term OR template.description LIKE :term)",
          { term: `%${filters.searchTerm}%` }
        );
      }
    }
    
    // Calcular total
    const total = await queryBuilder.getCount();
    
    // Aplicar paginación y ordenamiento
    if (pagination) {
      const skip = (pagination.page - 1) * pagination.limit;
      queryBuilder = queryBuilder.skip(skip).take(pagination.limit);
      
      if (pagination.sortBy) {
        const order = pagination.sortOrder || "ASC";
        queryBuilder = queryBuilder.orderBy(`template.${pagination.sortBy}`, order as "ASC" | "DESC");
      } else {
        // Ordenamiento por defecto
        queryBuilder = queryBuilder.orderBy("template.name", "ASC");
      }
    }
    
    // Ejecutar consulta
    const templateEntities = await queryBuilder.getMany();
    
    // Convertir a modelos de dominio
    const templates = templateEntities.map(entity => this.toDomainModel(entity));
    
    return { templates, total };
  }

  async findByUser(userId: string, includePublic: boolean = false): Promise<CalculationTemplate[]> {
    let queryBuilder = this.repository.createQueryBuilder("template")
      .where("template.created_by = :userId", { userId });
    
    if (includePublic) {
      queryBuilder = queryBuilder.orWhere("template.share_level = 'public'")
        .andWhere("template.is_active = :isActive", { isActive: true })
        .andWhere("template.is_verified = :isVerified", { isVerified: true });
    }
    
    const templates = await queryBuilder.getMany();
    return templates.map(template => this.toDomainModel(template));
  }

  async findFeatured(): Promise<CalculationTemplate[]> {
    const templates = await this.repository.find({
      where: {
        isFeatured: true,
        isActive: true,
        isVerified: true
      },
      order: {
        usageCount: "DESC"
      },
      take: 10
    });
    
    return templates.map(template => this.toDomainModel(template));
  }

  async create(templateData: CreateCalculationTemplateDTO): Promise<CalculationTemplate> {
    const templateEntity = this.toEntity(templateData);
    const savedTemplate = await this.repository.save(templateEntity);
    return this.toDomainModel(savedTemplate);
  }

  async update(id: string, templateData: UpdateCalculationTemplateDTO): Promise<CalculationTemplate | null> {
    const template = await this.repository.findOne({ where: { id } });
    
    if (!template) return null;
    
    // Actualizar campos
    Object.assign(template, templateData);
    
    const updatedTemplate = await this.repository.save(template);
    return this.toDomainModel(updatedTemplate);
  }

  async updateUsageStats(id: string, { usageCount, rating }: { usageCount?: number; rating?: number }): Promise<void> {
    const template = await this.repository.findOne({ where: { id } });
    
    if (!template) {
      throw new Error(`Plantilla no encontrada: ${id}`);
    }
    
    if (usageCount !== undefined) {
      template.usageCount = usageCount;
    }
    
    if (rating !== undefined) {
      // Actualizar promedio ponderado
      const newTotalRatings = template.ratingCount + 1;
      const currentRatingSum = template.averageRating * template.ratingCount;
      template.averageRating = (currentRatingSum + rating) / newTotalRatings;
      template.ratingCount = newTotalRatings;
    }
    
    await this.repository.save(template);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async countByType(): Promise<Record<CalculationType, number>> {
    const counts = await this.repository
      .createQueryBuilder("template")
      .select("template.type", "type")
      .addSelect("COUNT(*)", "count")
      .groupBy("template.type")
      .getRawMany();
    
    const result = {} as Record<CalculationType, number>;
    
    // Inicializar todos los tipos con 0
    Object.values(CalculationType).forEach(type => {
      result[type] = 0;
    });
    
    // Establecer valores reales
    counts.forEach(item => {
      result[item.type as CalculationType] = parseInt(item.count, 10);
    });
    
    return result;
  }

  async countByProfession(): Promise<Record<ProfessionType, number>> {
    const counts = await this.repository
      .createQueryBuilder("template")
      .select("template.targetProfession", "profession")
      .addSelect("COUNT(*)", "count")
      .groupBy("template.targetProfession")
      .getRawMany();
    
    const result = {} as Record<ProfessionType, number>;
    
    // Inicializar todos los tipos con 0
    Object.values(ProfessionType).forEach(profession => {
      result[profession] = 0;
    });
    
    // Establecer valores reales
    counts.forEach(item => {
      result[item.profession as ProfessionType] = parseInt(item.count, 10);
    });
    
    return result;
  }

  // Métodos de conversión de entidad a dominio y viceversa
  private toDomainModel(entity: CalculationTemplateEntity): CalculationTemplate {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      targetProfession: entity.targetProfession,
      formula: entity.formula,
      necReference: entity.necReference,
      isActive: entity.isActive,
      version: entity.version,
      parentTemplateId: entity.parentTemplateId,
      source: entity.source,
      createdBy: entity.createdBy,
      isVerified: entity.isVerified,
      verifiedBy: entity.verifiedBy,
      verifiedAt: entity.verifiedAt,
      isFeatured: entity.isFeatured,
      usageCount: entity.usageCount,
      averageRating: entity.averageRating,
      ratingCount: entity.ratingCount,
      tags: entity.tags,
      shareLevel: entity.shareLevel as 'private' | 'organization' | 'public',
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  private toParameterDomainModel(entity: CalculationParameterEntity): CalculationParameter {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      dataType: entity.dataType,
      scope: entity.scope,
      displayOrder: entity.displayOrder,
      isRequired: entity.isRequired,
      defaultValue: entity.defaultValue,
      minValue: entity.minValue,
      maxValue: entity.maxValue,
      regexPattern: entity.regexPattern,
      unitOfMeasure: entity.unitOfMeasure,
      allowedValues: entity.allowedValues,
      helpText: entity.helpText,
      dependsOnParameters: entity.dependsOnParameters,
      formula: entity.formula,
      calculationTemplateId: entity.calculationTemplateId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  private toEntity(model: CreateCalculationTemplateDTO): CalculationTemplateEntity {
    const entity = new CalculationTemplateEntity();
    
    // Copiar campos básicos
    entity.name = model.name;
    entity.description = model.description;
    entity.type = model.type;
    entity.targetProfession = model.targetProfession;
    entity.formula = model.formula;
    entity.necReference = model.necReference;
    entity.isActive = model.isActive;
    entity.version = model.version;
    entity.parentTemplateId = model.parentTemplateId;
    entity.source = model.source;
    entity.createdBy = model.createdBy;
    entity.isVerified = model.isVerified;
    entity.verifiedBy = model.verifiedBy;
    entity.verifiedAt = model.verifiedAt;
    entity.isFeatured = model.isFeatured;
    entity.usageCount = 0;
    entity.averageRating = 0;
    entity.ratingCount = 0;
    entity.tags = model.tags;
    entity.shareLevel = model.shareLevel;
    
    return entity;
  }
}