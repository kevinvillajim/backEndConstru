// src/application/budget/GetProjectBudgetsUseCase.ts
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {ProjectBudget} from "../../domain/models/project/ProjectBudget";

export class GetProjectBudgetsUseCase {
	constructor(private projectBudgetRepository: ProjectBudgetRepository) {}

	async execute(
		projectId: string,
		userId: string,
		filters?: any
	): Promise<{budgets: ProjectBudget[]; total: number}> {
		// Verificar existencia del proyecto
		const filterOptions = {
			...filters,
			projectId,
		};

		const pagination = {
			page: filters?.page || 1,
			limit: filters?.limit || 10,
			sortBy: filters?.sortBy || "createdAt",
			sortOrder: filters?.sortOrder || "DESC",
		};

		return this.projectBudgetRepository.findAll(filterOptions, pagination);
	}
}
