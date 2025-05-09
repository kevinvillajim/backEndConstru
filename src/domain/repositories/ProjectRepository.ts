// src/domain/repositories/ProjectRepository.ts
import {Project} from "../models/project/Project";

export interface ProjectRepository {
	findById(id: string): Promise<Project | null>;
	findByUser(userId: string): Promise<Project[]>;
	create(project: Omit<Project, "id">): Promise<Project>;
	update(id: string, projectData: Partial<Project>): Promise<Project | null>;
	delete(id: string): Promise<boolean>;
}
