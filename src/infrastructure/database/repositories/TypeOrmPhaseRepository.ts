// src/infrastructure/database/repositories/TypeOrmPhaseRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {PhaseRepository} from "@domain/repositories/PhaseRepository";
import {Phase} from "@domain/models/project/Phase";
import {PhaseEntity} from "../entities/PhaseEntity";

export class TypeOrmPhaseRepository implements PhaseRepository {
	private repository: Repository<PhaseEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(PhaseEntity);
	}

	async findById(id: string): Promise<Phase | null> {
		const phase = await this.repository.findOne({
			where: {id},
			relations: ["tasks"],
		});

		return phase ? this.toDomainModel(phase) : null;
	}

	async findByProject(projectId: string): Promise<Phase[]> {
		const phases = await this.repository.find({
			where: {projectId},
			order: {startDate: "ASC"},
		});

		return phases.map((phase) => this.toDomainModel(phase));
	}

	async create(phase: Phase): Promise<Phase> {
		const phaseEntity = this.toEntity(phase);
		const savedPhase = await this.repository.save(phaseEntity);
		return this.toDomainModel(savedPhase);
	}

	async createMany(phases: Phase[]): Promise<Phase[]> {
		const phaseEntities = phases.map((phase) => this.toEntity(phase));
		const savedPhases = await this.repository.save(phaseEntities);
		return savedPhases.map((phase) => this.toDomainModel(phase));
	}

	async update(id: string, phaseData: Partial<Phase>): Promise<Phase | null> {
		const phase = await this.repository.findOne({where: {id}});

		if (!phase) return null;

		// Actualizar campos
		Object.assign(phase, phaseData);

		const updatedPhase = await this.repository.save(phase);
		return this.toDomainModel(updatedPhase);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.softDelete(id);
		return result.affected !== 0;
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: PhaseEntity): Phase {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			startDate: entity.startDate,
			endDate: entity.endDate,
			completionPercentage: entity.completionPercentage,
			projectId: entity.projectId,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
		};
	}

	private toEntity(model: Phase): PhaseEntity {
		const entity = new PhaseEntity();

		Object.assign(entity, model);

		return entity;
	}
}
