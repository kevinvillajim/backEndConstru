// src/infrastructure/webserver/utils/queryUtils.ts

/**
 * Utilidades para procesar query parameters en Express
 */

/**
 * Convierte un string de query parameter a boolean
 * @param value - Valor del query parameter
 * @returns Boolean o undefined si no es un valor boolean válido
 */
export function parseBoolean(value: string | undefined): boolean | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	const stringValue = String(value).toLowerCase().trim();

	if (stringValue === "true" || stringValue === "1") {
		return true;
	}

	if (stringValue === "false" || stringValue === "0" || stringValue === "") {
		return false;
	}

	return undefined;
}

/**
 * Convierte un string de query parameter a number
 * @param value - Valor del query parameter
 * @returns Number o undefined si no es un número válido
 */
export function parseNumber(value: string | undefined): number | undefined {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	const parsed = Number(value);
	return isNaN(parsed) ? undefined : parsed;
}

/**
 * Convierte un string separado por comas a array
 * @param value - Valor del query parameter
 * @returns Array de strings o undefined
 */
export function parseArray(value: string | undefined): string[] | undefined {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	return value
		.split(",")
		.map((item) => item.trim())
		.filter((item) => item !== "");
}

/**
 * Interface para filtros de templates
 */
export interface TemplateQueryFilters {
	types?: string[];
	targetProfessions?: string[];
	isActive?: boolean;
	isVerified?: boolean;
	isFeatured?: boolean;
	shareLevel?: string;
	createdBy?: string;
	tags?: string[];
	searchTerm?: string;
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: "ASC" | "DESC";
}

/**
 * Procesa los query parameters para filtros de templates
 * @param query - Objeto query de Express (req.query)
 * @returns Filtros procesados y tipados
 */
export function parseTemplateFilters(query: any): TemplateQueryFilters {
	const filters: TemplateQueryFilters = {};

	// Arrays
	if (query.types) {
		filters.types = parseArray(query.types);
	}

	if (query.targetProfessions) {
		filters.targetProfessions = parseArray(query.targetProfessions);
	}

	if (query.tags) {
		filters.tags = parseArray(query.tags);
	}

	// Booleans - esta es la parte crítica
	const isActive = parseBoolean(query.isActive);
	if (isActive !== undefined) {
		filters.isActive = isActive;
	}

	const isVerified = parseBoolean(query.isVerified);
	if (isVerified !== undefined) {
		filters.isVerified = isVerified;
	}

	const isFeatured = parseBoolean(query.isFeatured);
	if (isFeatured !== undefined) {
		filters.isFeatured = isFeatured;
	}

	// Strings
	if (query.shareLevel && typeof query.shareLevel === "string") {
		filters.shareLevel = query.shareLevel;
	}

	if (query.createdBy && typeof query.createdBy === "string") {
		filters.createdBy = query.createdBy;
	}

	if (query.searchTerm && typeof query.searchTerm === "string") {
		filters.searchTerm = query.searchTerm.trim();
	}

	if (query.sortBy && typeof query.sortBy === "string") {
		filters.sortBy = query.sortBy;
	}

	if (query.sortOrder && typeof query.sortOrder === "string") {
		const sortOrder = query.sortOrder.toUpperCase();
		if (sortOrder === "ASC" || sortOrder === "DESC") {
			filters.sortOrder = sortOrder as "ASC" | "DESC";
		}
	}

	// Numbers
	const page = parseNumber(query.page);
	if (page !== undefined && page > 0) {
		filters.page = page;
	}

	const limit = parseNumber(query.limit);
	if (limit !== undefined && limit > 0 && limit <= 100) {
		filters.limit = limit;
	}

	return filters;
}

/**
 * Middleware para parsear automáticamente booleans en req.query
 * Solo debe usarse en rutas específicas que lo necesiten
 */
export function queryBooleanParser(booleanFields: string[]) {
	return (req: any, res: any, next: any) => {
		for (const field of booleanFields) {
			if (req.query[field] !== undefined) {
				const parsed = parseBoolean(req.query[field]);
				if (parsed !== undefined) {
					req.query[field] = parsed;
				}
			}
		}
		next();
	};
}

/**
 * Valida que los filtros sean válidos
 * @param filters - Filtros a validar
 * @returns Array de errores de validación
 */
export function validateTemplateFilters(
	filters: TemplateQueryFilters
): string[] {
	const errors: string[] = [];

	if (filters.page !== undefined && filters.page < 1) {
		errors.push("page debe ser mayor a 0");
	}

	if (
		filters.limit !== undefined &&
		(filters.limit < 1 || filters.limit > 100)
	) {
		errors.push("limit debe estar entre 1 y 100");
	}

	const validSortFields = [
		"name",
		"createdAt",
		"updatedAt",
		"usageCount",
		"averageRating",
	];
	if (filters.sortBy && !validSortFields.includes(filters.sortBy)) {
		errors.push(`sortBy debe ser uno de: ${validSortFields.join(", ")}`);
	}

	const validShareLevels = ["private", "organization", "public"];
	if (filters.shareLevel && !validShareLevels.includes(filters.shareLevel)) {
		errors.push(`shareLevel debe ser uno de: ${validShareLevels.join(", ")}`);
	}

	return errors;
}

/**
 * Debug helper para logging de query parameters
 */
export function logQueryParams(query: any, routeName: string) {
	if (process.env.NODE_ENV === "development") {
		console.log(`[${routeName}] Raw query params:`, query);
		const parsed = parseTemplateFilters(query);
		console.log(`[${routeName}] Parsed filters:`, parsed);
	}
}
