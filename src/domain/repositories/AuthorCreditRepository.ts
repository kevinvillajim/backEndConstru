// src/domain/repositories/AuthorCreditRepository.ts
import {
	CreateAuthorCreditDTO,
	UpdateAuthorCreditDTO,
	AuthorCreditData,
	AuthorStats,
} from "../models/tracking/AuthorCredit";

export interface AuthorCreditRepository {
	/**
	 * Crea un nuevo crédito de autor
	 */
	create(creditData: CreateAuthorCreditDTO): Promise<any>;

	/**
	 * Encuentra un crédito por ID
	 */
	findById(id: string): Promise<any | null>;

	/**
	 * Encuentra créditos por plantilla verificada
	 */
	findByVerifiedTemplate(
		verifiedTemplateId: string,
		onlyVisible?: boolean
	): Promise<any[]>;

	/**
	 * Encuentra créditos por autor
	 */
	findByAuthor(authorId: string, onlyVisible?: boolean): Promise<any[]>;

	/**
	 * Encuentra créditos por tipo
	 */
	findByCreditType(
		creditType:
			| "full_author"
			| "contributor"
			| "inspiration"
			| "collaborator"
			| "reviewer"
	): Promise<any[]>;

	/**
	 * Encuentra créditos recientes
	 */
	findRecentCredits(days?: number): Promise<any[]>;

	/**
	 * Actualiza un crédito
	 */
	update(id: string, updateData: UpdateAuthorCreditDTO): Promise<any | null>;

	/**
	 * Actualiza visibilidad
	 */
	updateVisibility(
		id: string,
		isVisible: boolean,
		visibility?: "public" | "restricted" | "private"
	): Promise<any | null>;

	/**
	 * Aprueba un crédito
	 */
	approve(
		id: string,
		approvedBy: string,
		approvalNotes?: string
	): Promise<any | null>;

	/**
	 * Otorga puntos y badges
	 */
	awardPoints(
		id: string,
		points: number,
		badge?: string,
		recognitionLevel?: "bronze" | "silver" | "gold" | "platinum"
	): Promise<any | null>;

	/**
	 * Obtiene estadísticas de un autor
	 */
	getAuthorStats(authorId: string): Promise<AuthorStats>;

	/**
	 * Obtiene top contribuidores
	 */
	getTopContributors(
		metric?: "credits" | "points" | "recent_activity",
		limit?: number,
		period?: "month" | "quarter" | "year"
	): Promise<
		Array<{
			authorId: string;
			authorName: string;
			value: number;
			rank: number;
		}>
	>;

	/**
	 * Obtiene estadísticas generales de créditos
	 */
	getCreditStatistics(): Promise<{
		total: number;
		byCreditType: Record<string, number>;
		byVisibility: Record<string, number>;
		byRecognitionLevel: Record<string, number>;
		totalPointsAwarded: number;
		averagePointsPerCredit: number;
	}>;

	/**
	 * Elimina un crédito
	 */
	delete(id: string): Promise<boolean>;
}
