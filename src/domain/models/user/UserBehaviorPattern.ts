/**
 * Modelo que representa el patrón de comportamiento del usuario
 */
export interface UserBehaviorPattern {
	userId: string;
	frequentMaterials: Array<{
		materialId: string;
		frequency: number;
		name?: string;
	}>;
	frequentCategories: Array<{
		categoryId: string;
		frequency: number;
		name?: string;
	}>;
	searchPatterns: Array<{term: string; frequency: number}>;
	preferredCalculationTypes: Array<{type: string; frequency: number}>;
	sessionMetrics: {
		averageDuration: number;
		averageActionsPerSession: number;
		mostActiveTimeOfDay: string;
	};
	projectPreferences: {
		preferredProjectTypes: string[];
		averageProjectDuration: number;
		averageBudgetRange: {min: number; max: number};
	};
}
