// src/infrastructure/database/entities/UserCalculationTemplateEntity.ts
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
import {CalculationTemplateEntity} from "./CalculationTemplateEntity";
import {CalculationResultEntity} from "./CalculationResultEntity";

export enum UserTemplateSourceType {
	CREATED = "created", // Creada desde cero por el usuario
	COPIED = "copied", // Copiada de una plantilla oficial
	FROM_RESULT = "from_result", // Creada desde un resultado de cálculo
}

export enum UserTemplateStatus {
	DRAFT = "draft", // Borrador, en proceso de creación
	ACTIVE = "active", // Activa y lista para usar
	ARCHIVED = "archived", // Archivada, no visible en listas principales
}

export enum UserTemplateDifficulty {
	BASIC = "basic",
	INTERMEDIATE = "intermediate",
	ADVANCED = "advanced",
}

@Entity("user_calculation_templates")
@Index("IDX_user_templates_user", ["userId"])
@Index("IDX_user_templates_category", ["category"])
@Index("IDX_user_templates_status", ["status", "isActive"])
@Index("IDX_user_templates_source", ["sourceType", "originalTemplateId"])
@Index("IDX_user_templates_public", ["isPublic", "isActive"])
@Index("IDX_user_templates_created", ["userId", "createdAt"])
export class UserCalculationTemplateEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	// === PROPIETARIO ===
	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity, {onDelete: "CASCADE"})
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	// === INFORMACIÓN BÁSICA ===
	@Column({length: 255})
	name: string;

	@Column({type: "text"})
	description: string;

	@Column({name: "long_description", type: "text", nullable: true})
	longDescription: string;

	// === ORIGEN Y RELACIÓN ===
	@Column({
		name: "source_type",
		type: "enum",
		enum: UserTemplateSourceType,
	})
	sourceType: UserTemplateSourceType;

	@Column({name: "original_template_id", nullable: true})
	originalTemplateId: string;

	@ManyToOne(() => CalculationTemplateEntity, {
		nullable: true,
		onDelete: "SET NULL",
	})
	@JoinColumn({name: "original_template_id"})
	originalTemplate: CalculationTemplateEntity;

	@Column({name: "source_calculation_result_id", nullable: true})
	sourceCalculationResultId: string;

	@ManyToOne(() => CalculationResultEntity, {
		nullable: true,
		onDelete: "SET NULL",
	})
	@JoinColumn({name: "source_calculation_result_id"})
	sourceCalculationResult: CalculationResultEntity;

	// === CATEGORIZACIÓN ===
	@Column({length: 50})
	category: string;

	@Column({length: 50, nullable: true})
	subcategory: string;

	@Column({name: "target_professions", type: "json"})
	targetProfessions: string[]; // ["architect", "civil_engineer"]

	@Column({
		type: "enum",
		enum: UserTemplateDifficulty,
		default: UserTemplateDifficulty.BASIC,
	})
	difficulty: UserTemplateDifficulty;

	@Column({name: "estimated_time", length: 50, nullable: true})
	estimatedTime: string; // "10-15 min"

	@Column({name: "nec_reference", length: 255, nullable: true})
	necReference: string;

	@Column({type: "json", nullable: true})
	tags: string[]; // ["tag1", "tag2"]

	// === CONTENIDO TÉCNICO (COPIADO COMPLETO) ===
	@Column({type: "longtext"})
	formula: string; // Código JavaScript completo

	@Column({type: "json"})
	parameters: any[]; // Array completo de parámetros

	// === CONFIGURACIÓN ===
	@Column({name: "is_public", default: false})
	isPublic: boolean;

	@Column({name: "is_active", default: true})
	isActive: boolean;

	@Column({length: 10, default: "1.0"})
	version: string;

	@Column({
		type: "enum",
		enum: UserTemplateStatus,
		default: UserTemplateStatus.DRAFT,
	})
	status: UserTemplateStatus;

	// === METADATOS ADICIONALES ===
	@Column({type: "json", nullable: true})
	requirements: string[]; // ["Datos de suelo", "Cargas de diseño"]

	@Column({name: "application_cases", type: "json", nullable: true})
	applicationCases: string[]; // ["Edificios residenciales"]

	@Column({type: "json", nullable: true})
	limitations: string[]; // ["Solo para suelos cohesivos"]

	@Column({name: "shared_with", type: "json", nullable: true})
	sharedWith: string[]; // Array de user IDs

	// === COLABORACIÓN ===
	@Column({type: "json", nullable: true})
	contributors: Array<{
		id: string;
		name: string;
		contributionType: string;
	}>;

	// === ESTADÍSTICAS ===
	@Column({name: "usage_count", type: "int", default: 0})
	usageCount: number;

	@Column({name: "total_ratings", type: "int", default: 0})
	totalRatings: number;

	@Column({
		name: "average_rating",
		type: "decimal",
		precision: 3,
		scale: 2,
		default: 0.0,
	})
	averageRating: number;

	// === FECHAS ===
	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
