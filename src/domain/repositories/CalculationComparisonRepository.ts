// src/domain/repositories/CalculationComparisonRepository.ts
export interface CalculationComparisonRepository {
	findByUserId(userId: string): Promise<any[]>;
	create(comparison: any): Promise<any>;
	update(id: string, data: any): Promise<any>;
	delete(id: string): Promise<boolean>;
	findById(id: string): Promise<any | null>;
}
