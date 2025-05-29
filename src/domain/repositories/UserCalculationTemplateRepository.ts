// src/domain/repositories/UserCalculationTemplateRepository.ts
import {
	UserCalculationTemplate,
	CreateUserCalculationTemplateDTO,
	UpdateUserCalculationTemplateDTO,
	DuplicateTemplateDTO,
	CreateFromResultDTO,
	UserTemplateFilters,
	UserTemplateStats,
	UserTemplateStatus,
} from "../models/calculation/UserCalculationTemplate";

export interface UserCalculationTemplateRepository {
	// === CRUD BÁSICO ===
	/**
	 * Encuentra todas las plantillas de un usuario con filtros opcionales
	 */
	findByUserId(
		userId: string,
		filters?: UserTemplateFilters,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{templates: UserCalculationTemplate[]; total: number}>;

	/**
	 * Encuentra una plantilla específica por ID
	 */
	findById(id: string): Promise<UserCalculationTemplate | null>;

	/**
	 * Encuentra una plantilla específica por ID y usuario (para verificar permisos)
	 */
	findByIdAndUserId(
		id: string,
		userId: string
	): Promise<UserCalculationTemplate | null>;

	/**
	 * Crea una nueva plantilla personal
	 */
	create(
		template: CreateUserCalculationTemplateDTO
	): Promise<UserCalculationTemplate>;

	/**
	 * Actualiza una plantilla existente
	 */
	update(
		id: string,
		templateData: UpdateUserCalculationTemplateDTO
	): Promise<UserCalculationTemplate | null>;

	/**
	 * Elimina una plantilla (soft delete o hard delete según configuración)
	 */
	delete(id: string): Promise<boolean>;

	// === OPERACIONES ESPECIALES ===
	/**
	 * Duplica una plantilla oficial a la tabla de plantillas personales
	 */
	duplicateFromOfficial(
		duplicateData: DuplicateTemplateDTO
	): Promise<UserCalculationTemplate>;

	/**
	 * Crea una plantilla personal desde un resultado de cálculo
	 */
	createFromResult(
		resultData: CreateFromResultDTO
	): Promise<UserCalculationTemplate>;

	// === CONSULTAS ESPECÍFICAS ===
	/**
	 * Encuentra plantillas por estado específico
	 */
	findByStatus(
		userId: string,
		status: UserTemplateStatus
	): Promise<UserCalculationTemplate[]>;

	/**
	 * Encuentra plantillas públicas de otros usuarios
	 */
	findPublicTemplates(
		excludeUserId?: string,
		filters?: Omit<UserTemplateFilters, "status">,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{templates: UserCalculationTemplate[]; total: number}>;

	/**
	 * Encuentra plantillas compartidas con un usuario específico
	 */
	findSharedWithUser(userId: string): Promise<UserCalculationTemplate[]>;

	/**
	 * Verifica si un usuario tiene acceso a una plantilla (propietario o compartida)
	 */
	hasUserAccess(templateId: string, userId: string): Promise<boolean>;

	/**
	 * Encuentra plantillas por categoría
	 */
	findByCategory(
		userId: string,
		category: string
	): Promise<UserCalculationTemplate[]>;

	/**
	 * Busca plantillas por término de búsqueda
	 */
	searchTemplates(
		userId: string,
		searchTerm: string,
		includeShared?: boolean
	): Promise<UserCalculationTemplate[]>;

	// === GESTIÓN DE COMPARTICIÓN ===
	/**
	 * Comparte una plantilla con otros usuarios
	 */
	shareTemplate(templateId: string, userIds: string[]): Promise<boolean>;

	/**
	 * Deja de compartir una plantilla con usuarios específicos
	 */
	unshareTemplate(templateId: string, userIds: string[]): Promise<boolean>;

	/**
	 * Obtiene la lista de usuarios con quienes se ha compartido una plantilla
	 */
	getSharedUsers(templateId: string): Promise<string[]>;

	// === ESTADÍSTICAS Y MÉTRICAS ===
	/**
	 * Obtiene estadísticas de plantillas del usuario
	 */
	getStats(userId: string): Promise<UserTemplateStats>;

	/**
	 * Incrementa el contador de uso de una plantilla
	 */
	incrementUsageCount(id: string): Promise<void>;

	/**
	 * Actualiza las estadísticas de calificación
	 */
	updateRatingStats(
		id: string,
		newRating: number,
		isNewRating: boolean
	): Promise<void>;

	// === VALIDACIONES ===
	/**
	 * Verifica si el nombre de plantilla es único para el usuario
	 */
	isNameUniqueForUser(
		userId: string,
		name: string,
		excludeId?: string
	): Promise<boolean>;

	/**
	 * Cuenta cuántas plantillas tiene un usuario por estado
	 */
	countByStatus(userId: string): Promise<Record<UserTemplateStatus, number>>;

	/**
	 * Obtiene plantillas recientes del usuario (últimos 30 días)
	 */
	findRecentTemplates(
		userId: string,
		days?: number
	): Promise<UserCalculationTemplate[]>;

	// === MANTENIMIENTO ===
	/**
	 * Cambia el estado de una plantilla
	 */
	changeStatus(
		id: string,
		status: UserTemplateStatus
	): Promise<UserCalculationTemplate | null>;

	/**
	 * Archiva plantillas inactivas (por lotes)
	 */
	archiveInactiveTemplates(
		userId: string,
		daysInactive: number
	): Promise<number>;

	/**
	 * Limpia plantillas en borrador antiguas
	 */
	cleanupOldDrafts(userId: string, daysOld: number): Promise<number>;
}
