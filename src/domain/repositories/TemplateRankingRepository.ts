// src/domain/repositories/TemplateRankingRepository.ts
import {
	CreateRankingDTO,
	UpdateRankingDTO,
	RankingData,
	TrendingTemplate,
} from "../models/tracking/TemplateRanking";

export interface TemplateRankingRepository {
	/**
	 * Crea un nuevo ranking
	 */
	create(rankingData: CreateRankingDTO): Promise<any>;

	/**
	 * Actualiza un ranking existente
	 */
	update(id: string, updateData: UpdateRankingDTO): Promise<any | null>;

	/**
	 * Encuentra rankings por período
	 */
	findByPeriod(
		period: "daily" | "weekly" | "monthly" | "yearly",
		periodStart: Date,
		templateType?: "personal" | "verified",
		limit?: number
	): Promise<any[]>;

	/**
	 * Encuentra rankings de una plantilla específica
	 */
	findByTemplate(
		templateId: string,
		templateType: "personal" | "verified",
		period?: "daily" | "weekly" | "monthly" | "yearly",
		limit?: number
	): Promise<any[]>;

	/**
	 * Obtiene ranking actual
	 */
	getCurrentRanking(
		period: "daily" | "weekly" | "monthly" | "yearly",
		templateType?: "personal" | "verified",
		limit?: number
	): Promise<any[]>;

	/**
	 * Obtiene plantillas trending
	 */
	getTrendingTemplates(
		period: "daily" | "weekly" | "monthly" | "yearly",
		templateType?: "personal" | "verified",
		limit?: number
	): Promise<TrendingTemplate[]>;

	/**
	 * Obtiene historial de ranking de una plantilla
	 */
	getRankingHistory(
		templateId: string,
		templateType: "personal" | "verified",
		period: "daily" | "weekly" | "monthly" | "yearly",
		months?: number
	): Promise<Array<{date: Date; position: number; score: number}>>;

	/**
	 * Crea o actualiza múltiples rankings en batch
	 */
	bulkUpsert(rankings: CreateRankingDTO[]): Promise<void>;

	/**
	 * Calcula y actualiza posiciones de ranking
	 */
	calculateAndUpdateRanks(
		period: "daily" | "weekly" | "monthly" | "yearly",
		periodStart: Date,
		templateType?: "personal" | "verified"
	): Promise<void>;

	/**
	 * Obtiene top performers por métrica
	 */
	getTopPerformers(
		period: "daily" | "weekly" | "monthly" | "yearly",
		metric: "usage" | "users" | "rating" | "trend",
		limit?: number
	): Promise<RankingData[]>;

	/**
	 * Análisis de competencia para una plantilla
	 */
	getCompetitionAnalysis(
		templateId: string,
		templateType: "personal" | "verified",
		period: "daily" | "weekly" | "monthly" | "yearly"
	): Promise<{
		currentRank: number;
		totalCompetitors: number;
		percentile: number;
		nearbyCompetitors: RankingData[];
	}>;

	/**
	 * Elimina rankings antiguos
	 */
	deleteOldRankings(olderThanDays: number): Promise<number>;
}
