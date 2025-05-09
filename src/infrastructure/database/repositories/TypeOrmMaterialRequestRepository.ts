// src/infrastructure/database/repositories/TypeOrmMaterialRequestRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {MaterialRequestRepository} from "@domain/repositories/MaterialRequestRepository";
import {
	MaterialRequest,
	MaterialRequestStatus,
} from "@domain/models/project/MaterialRequest";
import {MaterialRequestEntity} from "../entities/MaterialRequestEntity";
import {TaskEntity} from "../entities/TaskEntity";

export class TypeOrmMaterialRequestRepository
	implements MaterialRequestRepository
{
	private repository: Repository<MaterialRequestEntity>;
	private taskRepository: Repository<TaskEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(MaterialRequestEntity);
		this.taskRepository = AppDataSource.getRepository(TaskEntity);
	}

	async findById(id: string): Promise<MaterialRequest | null> {
		const request = await this.repository.findOne({
			where: {id},
			relations: ["material", "requester", "task"],
		});

		return request ? this.toDomainModel(request) : null;
	}

	async findByTask(taskId: string): Promise<MaterialRequest[]> {
		const requests = await this.repository.find({
			where: {taskId},
			relations: ["material"],
		});

		return requests.map((request) => this.toDomainModel(request));
	}

	async findByProject(
		projectId: string,
		filters?: any
	): Promise<MaterialRequest[]> {
		// Primero obtenemos las tareas del proyecto
		const tasks = await this.taskRepository
			.createQueryBuilder("task")
			.innerJoin("task.phase", "phase")
			.where("phase.project_id = :projectId", {projectId})
			.getMany();

		if (tasks.length === 0) {
			return [];
		}

		const taskIds = tasks.map((task) => task.id);

		// Ahora buscamos las solicitudes de material para estas tareas
		let queryBuilder = this.repository
			.createQueryBuilder("request")
			.where("request.task_id IN (:...taskIds)", {taskIds})
			.leftJoinAndSelect("request.material", "material")
			.leftJoinAndSelect("request.requester", "requester");

		// Aplicar filtros adicionales
		if (filters) {
			if (filters.status) {
				queryBuilder = queryBuilder.andWhere("request.status = :status", {
					status: filters.status,
				});
			}

			if (filters.materialId) {
				queryBuilder = queryBuilder.andWhere(
					"request.material_id = :materialId",
					{
						materialId: filters.materialId,
					}
				);
			}

			if (filters.requesterId) {
				queryBuilder = queryBuilder.andWhere(
					"request.requester_id = :requesterId",
					{
						requesterId: filters.requesterId,
					}
				);
			}
		}

		// Ordenar por fecha de creación
		queryBuilder = queryBuilder.orderBy("request.created_at", "DESC");

		const requests = await queryBuilder.getMany();
		return requests.map((request) => this.toDomainModel(request));
	}

	async findByRequester(requesterId: string): Promise<MaterialRequest[]> {
		const requests = await this.repository.find({
			where: {requesterId},
			relations: ["material", "task"],
			order: {createdAt: "DESC"},
		});

		return requests.map((request) => this.toDomainModel(request));
	}

	async create(request: MaterialRequest): Promise<MaterialRequest> {
		const entity = this.toEntity(request);
		const savedRequest = await this.repository.save(entity);
		return this.toDomainModel(savedRequest);
	}

	async update(id: string, data: Partial<MaterialRequest>): Promise<boolean> {
		const result = await this.repository.update(id, data);
		return result.affected !== undefined && result.affected > 0;
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.softDelete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	// Métodos auxiliares para conversión entre entidad y modelo de dominio
	private toDomainModel(entity: MaterialRequestEntity): MaterialRequest {
		return {
			id: entity.id,
			taskId: entity.taskId,
			materialId: entity.materialId,
			quantity: entity.quantity,
			status: entity.status as MaterialRequestStatus,
			requesterId: entity.requesterId,
			notes: entity.notes,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
		};
	}

	private toEntity(model: MaterialRequest): MaterialRequestEntity {
		const entity = new MaterialRequestEntity();

		entity.id = model.id;
		entity.taskId = model.taskId;
		entity.materialId = model.materialId;
		entity.quantity = model.quantity;
		entity.status = model.status;
		entity.requesterId = model.requesterId;
		entity.notes = model.notes;

		return entity;
	}
}
