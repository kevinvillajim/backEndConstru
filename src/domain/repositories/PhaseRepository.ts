// src/domain/repositories/PhaseRepository.ts
import {Phase} from "../models/project/Phase";

export interface PhaseRepository {
	findById(id: string): Promise<Phase | null>;
	findByProject(projectId: string): Promise<Phase[]>;
	create(phase: Phase): Promise<Phase>;
	createMany(phases: Phase[]): Promise<Phase[]>;
	update(id: string, phaseData: Partial<Phase>): Promise<Phase | null>;
	delete(id: string): Promise<boolean>;
}
