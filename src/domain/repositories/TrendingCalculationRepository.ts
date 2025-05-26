// src/domain/repositories/TrendingCalculationRepository.ts
export interface TrendingCalculationRepository {
	findTrendingByPeriod(period: string, limit?: number): Promise<any[]>;
	updateTrendingData(data: any[]): Promise<void>;
	calculateTrendingScores(period: string): Promise<void>;
	createTrendingEntry(data: any): Promise<any>;
	getCurrentPeriodData(period: any): Promise<any[]>;
}
