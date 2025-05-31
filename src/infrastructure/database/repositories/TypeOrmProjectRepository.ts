// src/infrastructure/database/repositories/TypeOrmProjectRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {ProjectRepository} from "../../../domain/repositories/ProjectRepository";
import {Project} from "../../../domain/models/project/Project";
import {ProjectEntity} from "../entities/ProjectEntity";

export class TypeOrmProjectRepository implements ProjectRepository {
	private repository: Repository<ProjectEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(ProjectEntity);
	}

	async findById(id: string): Promise<Project | null> {
		const project = await this.repository.findOne({
			where: {id},
			relations: ["phases", "documents", "budgets", "teamMembers"],
		});

		return project ? this.toDomainModel(project) : null;
	}

	async findByUser(userId: string): Promise<Project[]> {
		const projects = await this.repository.find({
			where: {userId},
			order: {createdAt: "DESC"},
		});

		return projects.map((project) => this.toDomainModel(project));
	}

	async create(project: Omit<Project, "id">): Promise<Project> {
		const projectEntity = this.toEntity(project as Project);
		const savedProject = await this.repository.save(projectEntity);
		return this.toDomainModel(savedProject);
	}

	async update(
		id: string,
		projectData: Partial<Project>
	): Promise<Project | null> {
		const project = await this.repository.findOne({where: {id}});

		if (!project) return null;

		// Actualizar campos
		Object.assign(project, projectData);

		const updatedProject = await this.repository.save(project);
		return this.toDomainModel(updatedProject);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.softDelete(id);
		return result.affected !== 0;
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: ProjectEntity): Project {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			status: entity.status,
			type: entity.type,
			clientName: entity.clientName,
			clientEmail: entity.clientEmail,
			clientPhone: entity.clientPhone,
			startDate: entity.startDate,
			endDate: entity.endDate,
			estimatedCompletionDate: entity.estimatedCompletionDate,
			completionPercentage: entity.completionPercentage,
			totalArea: entity.totalArea,
			constructionArea: entity.constructionArea,
			floors: entity.floors,
			location: entity.location,
			isActive: entity.isActive,
			permits: entity.permits,
			tags: entity.tags,
			estimatedBudget: entity.estimatedBudget,
			currentCost: entity.currentCost,
			userId: entity.userId,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
		};
	}

	private toEntity(model: Project): ProjectEntity {
		const entity = new ProjectEntity();

		Object.assign(entity, model);

		return entity;
	}
}
