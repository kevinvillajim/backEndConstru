// src/domain/repositories/ProjectBudgetRepository.ts
import {ProjectBudget} from "../models/project/ProjectBudget";

export interface ProjectBudgetRepository {
	findById(id: string): Promise<ProjectBudget | null>;
	findByProject(projectId: string): Promise<ProjectBudget[]>;
	findLatestVersion(projectId: string): Promise<ProjectBudget | null>;
	findAll(
		filters?: any,
		pagination?: any
	): Promise<{budgets: ProjectBudget[]; total: number}>;
	create(budget: ProjectBudget): Promise<ProjectBudget>;
	update(
		id: string,
		budgetData: Partial<ProjectBudget>
	): Promise<ProjectBudget | null>;
	delete(id: string): Promise<boolean>;
}
