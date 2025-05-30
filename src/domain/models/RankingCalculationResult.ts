// src/domain/models/RankingCalculationResult.ts
export interface RankingCalculationResult {
	totalRankingsCalculated: number;
	personalTemplates: number;
	verifiedTemplates: number;
	topTemplate?: {
		templateId: string;
		templateType: string;
		score: number;
	};
}
