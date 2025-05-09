// src/infrastructure/database/repositories/TypeOrmTaskRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {TaskRepository} from "@domain/repositories/TaskRepository";
import {Task} from "@domain/models/project/Task";
import {TaskEntity} from "../entities/TaskEntity";

export class TypeOrmTaskRepository implements TaskRepository {
	private repository: Repository<TaskEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(TaskEntity);
	}

	async findById(id: string): Promise<Task | null> {
		const task = await this.repository.findOne({
			where: {id},
			relations: ["materialRequests"],
		});

		return task ? this.toDomainModel(task) : null;
	}

	async findByPhase(phaseId: string): Promise<Task[]> {
		const tasks = await this.repository.find({
			where: {phaseId},
			order: {startDate: "ASC"},
		});

		return tasks.map((task) => this.toDomainModel(task));
	}

	async create(task: Task): Promise<Task> {
		const taskEntity = this.toEntity(task);
		const savedTask = await this.repository.save(taskEntity);
		return this.toDomainModel(savedTask);
	}

	async createMany(tasks: Task[]): Promise<Task[]> {
		const taskEntities = tasks.map((task) => this.toEntity(task));
		const savedTasks = await this.repository.save(taskEntities);
		return savedTasks.map((task) => this.toDomainModel(task));
	}

	async update(id: string, taskData: Partial<Task>): Promise<Task | null> {
		const task = await this.repository.findOne({where: {id}});

		if (!task) return null;

		// Actualizar campos
		Object.assign(task, taskData);

		const updatedTask = await this.repository.save(task);
		return this.toDomainModel(updatedTask);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.softDelete(id);
		return result.affected !== 0;
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: TaskEntity): Task {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			status: entity.status,
			startDate: entity.startDate,
			endDate: entity.endDate,
			phaseId: entity.phaseId,
			assignedTo: entity.assignedTo,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
		};
	}

	private toEntity(model: Task): TaskEntity {
		const entity = new TaskEntity();

		Object.assign(entity, model);

		return entity;
	}
}
