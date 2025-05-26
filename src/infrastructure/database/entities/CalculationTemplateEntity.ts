import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import {CalculationParameterEntity} from "./CalculationParameterEntity";
import {UserEntity} from "./UserEntity";

export enum CalculationType {
	AREA_VOLUME = "area_volume",
	STRUCTURAL = "structural",
	MATERIAL_ESTIMATION = "material_estimation",
	BUDGET = "budget",
	INSTALLATION = "installation",
	DESIGN = "design",
	USER_DEFINED = "user_defined", // Nueva categoría para fórmulas personalizadas
	ARCHITECTURE = "architecture",
	HVAC = "HVAC",
	FIRE_SAFETY = "fire_safety",
	EFFICIENCY = "efficiency",
	FOUNDATION = "foundation",
	ELECTRICAL = "electrical",
	TELECOMMUNICATIONS = "telecommunications",
}

export enum ProfessionType {
	ARCHITECT = "architect",
	CIVIL_ENGINEER = "civil_engineer",
	CONSTRUCTION_WORKER = "construction_worker",
	PLUMBER = "plumber",
	ELECTRICIAN = "electrician",
	CONTRACTOR = "contractor",
	ALL = "all",
	SAFETY_ENGINEER = "safety_engineer",
	MECHANICAL_ENGINEER = "mechanical_engineer",
	ELECTRICAL_ENGINEER = "electrical_engineer",
	TELECOMMUNICATIONS_ENGINEER = "telecommunications_engineer",
}

export enum TemplateSource {
	SYSTEM = "system", // Creado por el sistema (predefinido)
	USER = "user", // Creado por un usuario
	COMMUNITY = "community", // Verificado y compartido con la comunidad
	IMPROVED = "improved", // Mejorado basado en feedback y uso
}

@Entity("calculation_templates")
@Index("IDX_calculation_templates_type_verified_active", [
	"type",
	"isVerified",
	"isActive",
])
@Index("IDX_calculation_templates_usage_rating", [
	"usageCount",
	"averageRating",
])
@Index("IDX_calculation_templates_difficulty", ["difficulty"])
@Index("IDX_calculation_templates_target_profession", ["targetProfession"])
export class CalculationTemplateEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text"})
	description: string;

	@Column({
		type: "enum",
		enum: CalculationType,
	})
	type: CalculationType;

	@Column({
		type: "enum",
		enum: ProfessionType,
	})
	targetProfession: ProfessionType;

	@Column({type: "text"})
	formula: string; // Fórmula matemática o código JavaScript

	@Column({name: "nec_reference", nullable: true})
	necReference: string; // Referencia a la NEC

	@Column({name: "is_active", default: true})
	isActive: boolean;

	@Column({name: "version", type: "int", default: 1})
	version: number;

	@Column({name: "parent_template_id", nullable: true})
	parentTemplateId: string; // Para versiones mejoradas, referencia al original

	@ManyToOne(() => CalculationTemplateEntity, {nullable: true})
	@JoinColumn({name: "parent_template_id"})
	parentTemplate: CalculationTemplateEntity;

	@OneToMany(
		() => CalculationTemplateEntity,
		(template) => template.parentTemplate
	)
	derivedTemplates: CalculationTemplateEntity[];

	@Column({
		type: "enum",
		enum: TemplateSource,
		default: TemplateSource.SYSTEM,
	})
	source: TemplateSource;

	@Column({name: "created_by", nullable: true})
	createdBy: string; // Usuario que creó esta plantilla (si es USER o IMPROVED)

	@ManyToOne(() => UserEntity, {nullable: true})
	@JoinColumn({name: "created_by"})
	creator: UserEntity;

	@Column({name: "is_verified", default: false})
	isVerified: boolean; // Si ha sido verificado por un administrador

	@Column({name: "verified_by", nullable: true})
	verifiedBy: string; // Admin que verificó la plantilla

	@Column({name: "verified_at", type: "datetime", nullable: true})
	verifiedAt: Date;

	@Column({name: "is_featured", default: false})
	isFeatured: boolean; // Si aparece destacado en la app

	@Column({name: "usage_count", type: "int", default: 0})
	usageCount: number; // Contador de usos

	@Column({
		name: "average_rating",
		type: "decimal",
		precision: 3,
		scale: 2,
		default: 0,
	})
	averageRating: number; // Calificación promedio (0-5)

	@Column({name: "rating_count", type: "int", default: 0})
	ratingCount: number; // Número de calificaciones recibidas

	@Column({type: "json", nullable: true})
	tags: string[]; // Etiquetas para búsqueda y categorización

	@Column({
		name: "share_level",
		type: "enum",
		enum: ["private", "organization", "public"],
		default: "private",
	})
	shareLevel: string; // Nivel de compartición

	@Column({nullable: true, default: "intermediate"})
	difficulty: string; // 'basic' | 'intermediate' | 'advanced'

	@Column({name: "estimated_time", nullable: true, default: 5})
	estimatedTime: number; // en minutos

	@Column({name: "compliance_level", nullable: true, default: "basic"})
	complianceLevel: string; // 'basic' | 'partial' | 'full'

	@OneToMany(
		() => CalculationParameterEntity,
		(parameter) => parameter.calculationTemplate
	)
	parameters: CalculationParameterEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
