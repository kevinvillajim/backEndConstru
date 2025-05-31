import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	DeleteDateColumn,
	OneToMany,
	ManyToOne,
	JoinColumn,
	Index,
} from "typeorm";
import {
	UserRole,
	SubscriptionPlan,
	UserGender,
	ProfessionalType,
} from "../../../domain/models/user/User";
import { UserAddressEntity } from "./UserAddressEntity";

@Entity("users")
@Index("IDX_users_subscription_plan", ["subscriptionPlan"])
	
export class UserEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "first_name"})
	firstName: string;

	@Column({name: "last_name"})
	lastName: string;

	@Column({unique: true})
	email: string;

	@Column()
	password: string;

	@Column({nullable: true})
	phone: string;

	@Column({name: "mobile_phone", nullable: true})
	mobilePhone: string;

	@Column({name: "date_of_birth", type: "date", nullable: true})
	dateOfBirth: Date;

	@Column({name: "national_id", nullable: true, comment: "Cédula o RUC"})
	nationalId: string;

	@Column({
		type: "enum",
		enum: UserGender,
		nullable: true,
	})
	gender: UserGender;

	@Column({name: "profile_picture", nullable: true})
	profilePicture: string;

	@Column({
		name: "professional_type",
		type: "enum",
		enum: ProfessionalType,
		nullable: true,
	})
	professionalType: ProfessionalType;

	@Column({name: "specializations", type: "simple-array", nullable: true})
	specializations: string[];

	@Column({name: "years_of_experience", type: "int", nullable: true})
	yearsOfExperience: number;

	@Column({name: "education_level", nullable: true})
	educationLevel: string;

	@Column({type: "simple-array", nullable: true})
	certifications: string[];

	@Column({type: "text", nullable: true})
	bio: string;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.NORMAL,
	})
	role: UserRole;

	@Column({
		name: "subscription_plan",
		type: "enum",
		enum: SubscriptionPlan,
		default: SubscriptionPlan.FREE,
	})
	subscriptionPlan: SubscriptionPlan;

	@Column({name: "subscription_expires_at", type: "datetime", nullable: true})
	subscriptionExpiresAt: Date;

	@Column({
		type: "json",
		nullable: true,
		comment: "Información de la empresa del usuario",
	})
	company: {
		name: string;
		taxId: string;
		address: {
			street: string;
			number: string;
			city: string;
			province: string;
			postalCode: string;
			country: string;
			reference?: string;
		};
		phone: string;
		email: string;
		website?: string;
		position?: string;
		employees?: number;
		yearFounded?: number;
	};

	@OneToMany(() => UserAddressEntity, (address) => address.user)
	addresses: UserAddressEntity[];

	@Column({type: "json", nullable: true, comment: "Preferencias del usuario"})
	preferences: {
		notifications: {
			email: boolean;
			push: boolean;
			sms: boolean;
		};
		projectUpdates: boolean;
		materialRecommendations: boolean;
		pricingAlerts: boolean;
		weeklyReports: boolean;
		languagePreference: string;
	};

	@Column({type: "json", nullable: true, comment: "Estadísticas del usuario"})
	stats: {
		completedProjects: number;
		activeProjects: number;
		totalMaterialsOrdered: number;
		totalSpent: number;
		avgProjectDuration: number;
		lastLoginAt: Date;
		loginCount: number;
	};

	@Column({
		type: "simple-array",
		nullable: true,
		comment: "Intereses del usuario para recomendaciones",
	})
	interests: string[];

	@Column({name: "referral_code", nullable: true})
	referralCode: string;

	@Column({name: "referred_by", nullable: true})
	referredBy: string;

	@Column({type: "json", nullable: true, comment: "Links a redes sociales"})
	socialLinks: {
		facebook?: string;
		instagram?: string;
		linkedin?: string;
		twitter?: string;
	};

	@Column({name: "is_active", default: true})
	isActive: boolean;

	@Column({name: "is_verified", default: false})
	isVerified: boolean;

	@Column({name: "verification_token", nullable: true})
	verificationToken: string;

	@Column({name: "password_reset_token", nullable: true})
	passwordResetToken: string;

	@Column({name: "password_reset_expires", type: "datetime", nullable: true})
	passwordResetExpires: Date;

	@Column({name: "admin_id", nullable: true})
	adminId: string;

	@ManyToOne(() => UserEntity, (user) => user.workers, {nullable: true})
	@JoinColumn({name: "admin_id"})
	admin: UserEntity;

	@OneToMany(() => UserEntity, (user) => user.admin)
	workers: UserEntity[];

	// Campos para autenticación de dos factores
	@Column({name: "two_factor_enabled", default: false})
	twoFactorEnabled: boolean;

	@Column({name: "two_factor_secret", nullable: true})
	twoFactorSecret: string;

	@Column({type: "simple-array", name: "recovery_codes", nullable: true})
	recoveryCodes: string[];

	@Column({nullable: true})
	location: string;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;

	@DeleteDateColumn({name: "deleted_at", nullable: true})
	deletedAt: Date;
}