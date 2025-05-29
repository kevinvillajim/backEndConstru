// src/infrastructure/database/entities/AuthorCreditEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {UserCalculationTemplateEntity} from "./UserCalculationTemplateEntity";
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";

export enum CreditType {
	FULL_AUTHOR = "full_author", // "Creada por [Usuario]"
	CONTRIBUTOR = "contributor", // "Basada en trabajo de [Usuario]"
	INSPIRATION = "inspiration", // "Inspirada en plantilla de [Usuario]"
	COLLABORATOR = "collaborator", // "En colaboración con [Usuario]"
	REVIEWER = "reviewer", // "Revisada por [Usuario]"
}

export enum CreditVisibility {
	PUBLIC = "public", // Visible para todos
	RESTRICTED = "restricted", // Solo para usuarios registrados
	PRIVATE = "private", // Solo para el autor y admins
}

@Entity("author_credits")
@Index("IDX_credit_verified", ["verifiedTemplateId"])
@Index("IDX_credit_author", ["originalAuthorId"])
@Index("IDX_credit_visible", ["isVisible", "visibility"])
@Index("IDX_credit_type", ["creditType"])
@Index("IDX_credit_original", ["originalPersonalTemplateId"])
export class AuthorCreditEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "verified_template_id"})
	verifiedTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "verified_template_id"})
	verifiedTemplate: CalculationTemplateEntity;

	@Column({name: "original_personal_template_id"})
	originalPersonalTemplateId: string;

	@ManyToOne(() => UserCalculationTemplateEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "original_personal_template_id"})
	originalPersonalTemplate: UserCalculationTemplateEntity;

	@Column({name: "original_author_id"})
	originalAuthorId: string;

	@ManyToOne(() => UserEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "original_author_id"})
	originalAuthor: UserEntity;

	@Column({
		name: "credit_type",
		type: "enum",
		enum: CreditType,
		default: CreditType.FULL_AUTHOR,
	})
	creditType: CreditType;

	@Column({name: "credit_text", type: "text"})
	creditText: string;

	@Column({name: "custom_attribution", type: "text", nullable: true})
	customAttribution: string; // Texto personalizado de atribución

	@Column({name: "is_visible", default: true})
	isVisible: boolean;

	@Column({
		name: "visibility",
		type: "enum",
		enum: CreditVisibility,
		default: CreditVisibility.PUBLIC,
	})
	visibility: CreditVisibility;

	// Información adicional del crédito
	@Column({name: "contribution_description", type: "text", nullable: true})
	contributionDescription: string; // Descripción específica de la contribución

	@Column({
		name: "contribution_percentage",
		type: "decimal",
		precision: 5,
		scale: 2,
		nullable: true,
	})
	contributionPercentage: number; // Porcentaje de contribución (0-100)

	@Column({name: "original_creation_date", type: "timestamp", nullable: true})
	originalCreationDate: Date; // Fecha de creación de la plantilla original

	@Column({name: "promotion_date", type: "timestamp", nullable: true})
	promotionDate: Date; // Fecha cuando se promovió a verificada

	// Datos del contexto de promoción
	@Column({name: "promotion_request_id", nullable: true})
	promotionRequestId: string; // Referencia a la solicitud de promoción

	@Column({name: "metrics_at_promotion", type: "json", nullable: true})
	metricsAtPromotion: {
		usageCount: number;
		uniqueUsers: number;
		averageRating: number;
		successRate: number;
		rankingPosition: number;
	};

	// Sistema de recompensas
	@Column({name: "points_awarded", type: "int", default: 0})
	pointsAwarded: number; // Puntos otorgados al autor

	@Column({name: "badge_earned", nullable: true})
	badgeEarned: string; // Badge otorgado (ej: "Innovator", "Top Contributor")

	@Column({
		name: "recognition_level",
		type: "enum",
		enum: ["bronze", "silver", "gold", "platinum"],
		nullable: true,
	})
	recognitionLevel: string;

	// Configuración de visualización
	@Column({name: "display_order", type: "int", default: 0})
	displayOrder: number; // Orden de visualización cuando hay múltiples créditos

	@Column({name: "show_author_contact", default: false})
	showAuthorContact: boolean; // Si mostrar información de contacto del autor

	@Column({name: "show_original_date", default: true})
	showOriginalDate: boolean; // Si mostrar fecha de creación original

	// Auditoría y aprobación
	@Column({name: "approved_by", nullable: true})
	approvedBy: string; // Admin que aprobó el crédito

	@Column({name: "approved_at", type: "timestamp", nullable: true})
	approvedAt: Date;

	@Column({name: "approval_notes", type: "text", nullable: true})
	approvalNotes: string;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
