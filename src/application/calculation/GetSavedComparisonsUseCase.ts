import { CalculationComparisonRepository } from "../../domain/repositories/CalculationComparisonRepository";

// src/application/calculation/GetSavedComparisonsUseCase.ts
export class GetSavedComparisonsUseCase {
	constructor(
		private calculationComparisonRepository: CalculationComparisonRepository
	) {}

	async execute(userId: string): Promise<any[]> {
		return await this.calculationComparisonRepository.findByUserId(userId);
	}
}
