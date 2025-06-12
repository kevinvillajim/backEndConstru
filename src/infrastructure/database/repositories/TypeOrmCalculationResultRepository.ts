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

		// Preparar datos para actualización con conversión de tipos apropiada
		const updateData: any = {};

		// Copiar campos string directamente
		if (resultData.calculationTemplateId !== undefined) {
			updateData.calculationTemplateId = resultData.calculationTemplateId;
		}
		if (resultData.projectId !== undefined) {
			updateData.projectId = resultData.projectId;
		}
		if (resultData.userId !== undefined) {
			updateData.userId = resultData.userId;
		}
		if (resultData.name !== undefined) {
			updateData.name = resultData.name;
		}
		if (resultData.notes !== undefined) {
			updateData.notes = resultData.notes;
		}
		if (resultData.errorMessage !== undefined) {
			updateData.errorMessage = resultData.errorMessage;
		}

		// Convertir campos JSON - mantener como objetos
		if (resultData.inputParameters !== undefined) {
			updateData.inputParameters = resultData.inputParameters || {};
		}
		if (resultData.results !== undefined) {
			updateData.results = resultData.results || {};
		}

		// Convertir campos booleanos
		if (resultData.isSaved !== undefined) {
			updateData.isSaved = this.ensureBoolean(resultData.isSaved);
		}
		if (resultData.wasSuccessful !== undefined) {
			updateData.wasSuccessful = this.ensureBoolean(resultData.wasSuccessful);
		}
		if (resultData.usedInProject !== undefined) {
			updateData.usedInProject = this.ensureBoolean(resultData.usedInProject);
		}
		if (resultData.ledToMaterialOrder !== undefined) {
			updateData.ledToMaterialOrder = this.ensureBoolean(resultData.ledToMaterialOrder);
		}
		if (resultData.ledToBudget !== undefined) {
			updateData.ledToBudget = this.ensureBoolean(resultData.ledToBudget);
		}

		// Convertir campos numéricos
		if (resultData.executionTimeMs !== undefined) {
			updateData.executionTimeMs = this.ensureNumber(resultData.executionTimeMs);
		}

		// Actualizar campos
		Object.assign(result, updateData);

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
			// Mantener como objetos para el modelo de dominio
			inputParameters: entity.inputParameters || {},
			results: entity.results || {},
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

		// Copiar campos básicos
		entity.calculationTemplateId = model.calculationTemplateId;
		entity.projectId = model.projectId;
		entity.userId = model.userId;
		entity.name = model.name;
		entity.notes = model.notes;
		entity.errorMessage = model.errorMessage;

		// Los campos JSON se mantienen como objetos
		entity.inputParameters = model.inputParameters || {};
		entity.results = model.results || {};

		// Convertir campos booleanos y numéricos de forma segura
		entity.isSaved = this.ensureBoolean(model.isSaved);
		entity.executionTimeMs = this.ensureNumber(model.executionTimeMs);
		entity.wasSuccessful = this.ensureBoolean(model.wasSuccessful);
		entity.usedInProject = this.ensureBoolean(model.usedInProject);
		entity.ledToMaterialOrder = this.ensureBoolean(model.ledToMaterialOrder);
		entity.ledToBudget = this.ensureBoolean(model.ledToBudget);

		return entity;
	}

	// Métodos auxiliares para conversión segura de tipos
	private ensureBoolean(value: any): boolean {
		if (typeof value === 'boolean') {
			return value;
		}
		if (typeof value === 'string') {
			return value.toLowerCase() === 'true' || value === '1';
		}
		if (typeof value === 'number') {
			return value !== 0;
		}
		return false;
	}

	private ensureNumber(value: any): number {
		if (typeof value === 'number') {
			return value;
		}
		if (typeof value === 'string') {
			const parsed = parseFloat(value);
			return isNaN(parsed) ? 0 : parsed;
		}
		return 0;
	}
}