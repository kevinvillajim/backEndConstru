// src/domain/repositories/TemplateSuggestionRepository.ts
export interface TemplateSuggestionRepository {
	findByTemplateId(templateId: string): Promise<any[]>;
	findByUserId(userId: string): Promise<any[]>;
	create(suggestion: any): Promise<any>;
	update(id: string, data: any): Promise<any>;
	findPendingSuggestions(): Promise<any[]>;
	updateStatus(id: string, status: string, reviewedBy?: string): Promise<any>;
}
