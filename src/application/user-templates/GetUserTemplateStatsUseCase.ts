// src/application/user-templates/GetUserTemplateStatsUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {UserTemplateStats} from "../../domain/models/calculation/UserCalculationTemplate";

export class GetUserTemplateStatsUseCase {
	constructor(
		private userTemplateRepository: UserCalculationTemplateRepository
	) {}

	async execute(userId: string): Promise<UserTemplateStats> {
		return await this.userTemplateRepository.getStats(userId);
	}
}
