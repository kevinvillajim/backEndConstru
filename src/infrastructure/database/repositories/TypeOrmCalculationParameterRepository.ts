// src/infrastructure/database/repositories/TypeOrmCalculationParameterRepository.ts
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { CalculationParameterRepository } from "@domain/repositories/CalculationParameterRepository";
import { CalculationParameter, CreateCalculationParameterDTO, UpdateCalculationParameterDTO } from "@domain/models/calculation/CalculationParameter";
import { CalculationParameterEntity } from "../entities/CalculationParameterEntity";

export class TypeOrmCalculationParameterRepository implements CalculationParameterRepository {
  private repository: Repository<CalculationParameterEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CalculationParameterEntity);
  }

  async findById(id: string): Promise<CalculationParameter | null> {
    const parameter = await this.repository.findOne({
      where: { id }
    });
    
    return parameter ? this.toDomainModel(parameter) : null;
  }

  async findByTemplateId(templateId: string): Promise<CalculationParameter[]> {
    const parameters = await this.repository.find({
      where: { calculationTemplateId: templateId },
      order: { displayOrder: "ASC" }
    });
    
    return parameters.map(parameter => this.toDomainModel(parameter));
  }

  async findByDependency(parameterId: string): Promise<CalculationParameter[]> {
    // Nota: esta implementación puede variar según la base de datos
    // Busca parámetros que dependen del parámetro especificado
    const parameters = await this.repository
      .createQueryBuilder("parameter")
      .where("parameter.depends_on_parameters LIKE :pattern", { pattern: `%${parameterId}%` })
      .getMany();
    
    return parameters.map(parameter => this.toDomainModel(parameter));
  }

  async create(parameter: CreateCalculationParameterDTO): Promise<CalculationParameter> {
    const parameterEntity = this.toEntity(parameter);
    const savedParameter = await this.repository.save(parameterEntity);
    return this.toDomainModel(savedParameter);
  }

  async createMany(parameters: CreateCalculationParameterDTO[]): Promise<CalculationParameter[]> {
    const parameterEntities = parameters.map(parameter => this.toEntity(parameter));
    const savedParameters = await this.repository.save(parameterEntities);
    return savedParameters.map(parameter => this.toDomainModel(parameter));
  }

  async update(id: string, parameterData: UpdateCalculationParameterDTO): Promise<CalculationParameter | null> {
    const parameter = await this.repository.findOne({ where: { id } });
    
    if (!parameter) return null;
    
    // Actualizar campos
    Object.assign(parameter, parameterData);
    
    const updatedParameter = await this.repository.save(parameter);
    return this.toDomainModel(updatedParameter);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async deleteByTemplateId(templateId: string): Promise<boolean> {
    const result = await this.repository.delete({ calculationTemplateId: templateId });
    return result.affected !== 0;
  }

  // Métodos de conversión de entidad a dominio y viceversa
  private toDomainModel(entity: CalculationParameterEntity): CalculationParameter {
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

  private toEntity(model: CreateCalculationParameterDTO): CalculationParameterEntity {
    const entity = new CalculationParameterEntity();
    
    // Copiar campos
    entity.name = model.name;
    entity.description = model.description;
    entity.dataType = model.dataType;
    entity.scope = model.scope;
    entity.displayOrder = model.displayOrder;
    entity.isRequired = model.isRequired;
    entity.defaultValue = model.defaultValue;
    entity.minValue = model.minValue;
    entity.maxValue = model.maxValue;
    entity.regexPattern = model.regexPattern;
    entity.unitOfMeasure = model.unitOfMeasure;
    entity.allowedValues = model.allowedValues;
    entity.helpText = model.helpText;
    entity.dependsOnParameters = model.dependsOnParameters;
    entity.formula = model.formula;
    entity.calculationTemplateId = model.calculationTemplateId;
    
    return entity;
  }
}