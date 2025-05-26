import { TemplateSuggestionRepository } from "../../domain/repositories/TemplateSuggestionRepository";

// src/application/calculation/GetSuggestionsUseCase.ts
export class GetSuggestionsUseCase {
	constructor(
		private templateSuggestionRepository: TemplateSuggestionRepository
	) {}

	async execute(templateId: string): Promise<any[]> {
		return await this.templateSuggestionRepository.findByTemplateId(templateId);
	}

	async getUserSuggestions(userId: string): Promise<any[]> {
		return await this.templateSuggestionRepository.findByUserId(userId);
	}

	async getPendingSuggestions(): Promise<any[]> {
		return await this.templateSuggestionRepository.findPendingSuggestions();
	}
}
