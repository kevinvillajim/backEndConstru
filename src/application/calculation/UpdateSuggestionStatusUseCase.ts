import { TemplateSuggestionRepository } from "../../domain/repositories/TemplateSuggestionRepository";

// src/application/calculation/UpdateSuggestionStatusUseCase.ts
export class UpdateSuggestionStatusUseCase {
	constructor(
		private templateSuggestionRepository: TemplateSuggestionRepository
	) {}

	async execute(
		suggestionId: string,
		status: string,
		reviewedBy: string
	): Promise<any> {
		return await this.templateSuggestionRepository.updateStatus(
			suggestionId,
			status,
			reviewedBy
		);
	}
}
