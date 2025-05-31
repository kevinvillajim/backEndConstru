// src/infrastructure/database/repositories/TypeOrmCalculationResultRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {CalculationResultRepository} from "../../../domain/repositories/CalculationResultRepository";
import {
	CalculationResult,
	CreateCalculationResultDTO,
	SaveCalculationResultDTO,
} from "../../../domain/models/calculation/CalculationResult";
import {CalculationResultEntity} from "../entities/CalculationResultEntity";

export class TypeOrmCalculationResultRepository
	implements CalculationResultRepository
{
	private repository: Repository<CalculationResultEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(CalculationResultEntity);
	}

	async findById(id: string): Promise<CalculationResult | null> {
		const result = await this.repository.findOne({
			where: {id},
		});

		return result ? this.toDomainModel(result) : null;
	}

	async findByUser(
		userId: string,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{results: CalculationResult[]; total: number}> {
		let queryBuilder = this.repository
			.createQueryBuilder("result")
			.where("result.user_id = :userId", {userId});

		// Calcular total
		const total = await queryBuilder.getCount();

		// Aplicar paginación y ordenamiento
		if (pagination) {
			const skip = (pagination.page - 1) * pagination.limit;
			queryBuilder = queryBuilder.skip(skip).take(pagination.limit);

			if (pagination.sortBy) {
				const order = pagination.sortOrder || "ASC";
				queryBuilder = queryBuilder.orderBy(
					`result.${pagination.sortBy}`,
					order as "ASC" | "DESC"
				);
			} else {
				// Ordenamiento por defecto
				queryBuilder = queryBuilder.orderBy("result.created_at", "DESC");
			}
		}

		// Ejecutar consulta
		const resultEntities = await queryBuilder.getMany();

		// Convertir a modelos de dominio
		const results = resultEntities.map((entity) => this.toDomainModel(entity));

		return {results, total};
	}

	async findByProject(projectId: string): Promise<CalculationResult[]> {
		const results = await this.repository.find({
			where: {projectId},
			order: {createdAt: "DESC"},
		});

		return results.map((result) => this.toDomainModel(result));
	}

	async findByTemplate(
		templateId: string,
		limit: number = 10
	): Promise<CalculationResult[]> {
		const results = await this.repository.find({
			where: {calculationTemplateId: templateId},
			order: {createdAt: "DESC"},
			take: limit,
		});

		return results.map((result) => this.toDomainModel(result));
	}

	async findSavedByUser(userId: string): Promise<CalculationResult[]> {
		const results = await this.repository.find({
			where: {userId, isSaved: true},
			order: {createdAt: "DESC"},
		});

		return results.map((result) => this.toDomainModel(result));
	}

	async create(result: CreateCalculationResultDTO): Promise<CalculationResult> {
		const resultEntity = this.toEntity(result);
		const savedResult = await this.repository.save(resultEntity);
		return this.toDomainModel(savedResult);
	}

	async save(
		saveData: SaveCalculationResultDTO
	): Promise<CalculationResult | null> {
		const result = await this.repository.findOne({
			where: {id: saveData.id},
		});

		if (!result) return null;

		// Actualizar campos
		result.name = saveData.name;
		result.notes = saveData.notes;
		result.isSaved = true;

		if (saveData.usedInProject !== undefined) {
			result.usedInProject = saveData.usedInProject;
		}

		if (saveData.projectId) {
			result.projectId = saveData.projectId;
		}

		const updatedResult = await this.repository.save(result);
		return this.toDomainModel(updatedResult);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== 0;
	}

	async getAverageExecutionTime(templateId: string): Promise<number | null> {
		const result = await this.repository
			.createQueryBuilder("result")
			.select("AVG(result.execution_time_ms)", "avgTime")
			.where("result.calculation_template_id = :templateId", {templateId})
			.andWhere("result.was_successful = :wasSuccessful", {wasSuccessful: true})
			.getRawOne();

		return result?.avgTime ? parseFloat(result.avgTime) : null;
	}

	async countSuccessfulByTemplate(templateId: string): Promise<number> {
		return this.repository.count({
			where: {
				calculationTemplateId: templateId,
				wasSuccessful: true,
			},
		});
	}

	async update(
		id: string,
		resultData: Partial<CalculationResult>
	): Promise<CalculationResult | null> {
		const result = await this.repository.findOne({where: {id}});

		if (!result) return null;

		// Actualizar campos
		Object.assign(result, resultData);

		const updatedResult = await this.repository.save(result);
		return this.toDomainModel(updatedResult);
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: CalculationResultEntity): CalculationResult {
		return {
			id: entity.id,
			calculationTemplateId: entity.calculationTemplateId,
			projectId: entity.projectId,
			userId: entity.userId,
			inputParameters: entity.inputParameters,
			results: entity.results,
			isSaved: entity.isSaved,
			name: entity.name,
			notes: entity.notes,
			executionTimeMs: entity.executionTimeMs,
			wasSuccessful: entity.wasSuccessful,
			errorMessage: entity.errorMessage,
			usedInProject: entity.usedInProject,
			ledToMaterialOrder: entity.ledToMaterialOrder,
			ledToBudget: entity.ledToBudget,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	private toEntity(model: CreateCalculationResultDTO): CalculationResultEntity {
		const entity = new CalculationResultEntity();

		// Copiar campos
		entity.calculationTemplateId = model.calculationTemplateId;
		entity.projectId = model.projectId;
		entity.userId = model.userId;
		entity.inputParameters = model.inputParameters;
		entity.results = model.results;
		entity.isSaved = model.isSaved;
		entity.name = model.name;
		entity.notes = model.notes;
		entity.executionTimeMs = model.executionTimeMs;
		entity.wasSuccessful = model.wasSuccessful;
		entity.errorMessage = model.errorMessage;
		entity.usedInProject = model.usedInProject;
		entity.ledToMaterialOrder = model.ledToMaterialOrder;
		entity.ledToBudget = model.ledToBudget;

		return entity;
	}
}
