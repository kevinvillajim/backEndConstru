import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export enum UserRole {
	ADMIN = "admin",
	NORMAL = "normal",
	SELLER = "seller",
	WORKER = "worker",
}

export enum SubscriptionPlan {
	FREE = "free",
	PREMIUM = "premium",
	ENTERPRISE = "enterprise",
	CUSTOM = "custom",
}

export enum UserGender {
	MALE = "male",
	FEMALE = "female",
	OTHER = "other",
	PREFER_NOT_TO_SAY = "prefer_not_to_say",
}

export enum ProfessionalType {
	ARCHITECT = "architect",
	CIVIL_ENGINEER = "civil_engineer",
	CONSTRUCTOR = "constructor",
	CONTRACTOR = "contractor",
	ELECTRICIAN = "electrician",
	PLUMBER = "plumber",
	DESIGNER = "designer",
	OTHER = "other",
}

// Interfaces base para direcciones
export interface BaseAddress {
	street: string;
	number: string;
	city: string;
	province: string;
	postalCode: string;
	country: string;
	reference?: string;
}

// Dirección para usuario con flag isMain
export interface UserAddress extends BaseAddress {
	id: string;
	isMain: boolean;
}

// Dirección para empresa (sin flag isMain)
export interface CompanyAddress extends BaseAddress {
	// No incluye isMain
}

export interface UserCompany {
	name: string;
	taxId: string;
	address: CompanyAddress;
	phone: string;
	email: string;
	website?: string;
	position?: string;
	employees?: number;
	yearFounded?: number;
}

export interface UserPreferences {
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
}

export interface UserStats {
	completedProjects: number;
	activeProjects: number;
	totalMaterialsOrdered: number;
	totalSpent: number;
	avgProjectDuration: number;
	lastLoginAt: Date;
	loginCount: number;
}

export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	password: string; // Siempre hash, nunca texto plano
	phone?: string;
	mobilePhone?: string;
	dateOfBirth?: Date;
	nationalId?: string; // Cédula o RUC
	gender?: UserGender;
	profilePicture?: string;
	professionalType?: ProfessionalType;
	specializations?: string[];
	yearsOfExperience?: number;
	educationLevel?: string;
	certifications?: string[];
	bio?: string;
	role: UserRole;
	subscriptionPlan: SubscriptionPlan;
	subscriptionExpiresAt?: Date;
	company?: UserCompany;
	addresses?: UserAddress[];
	preferences?: UserPreferences;
	stats?: UserStats;
	interests?: string[];
	referralCode?: string;
	referredBy?: string;
	socialLinks?: {
		facebook?: string;
		instagram?: string;
		linkedin?: string;
		twitter?: string;
	};
	isActive: boolean;
	isVerified: boolean;
	verificationToken?: string;
	passwordResetToken?: string;
	passwordResetExpires?: Date;
	adminId?: string;
	twoFactorEnabled?: boolean;
	twoFactorSecret?: string;
	recoveryCodes?: string[];
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

export type CreateUserDTO = Omit<User, "id" | "createdAt" | "updatedAt">;

export class RegisterUserDTO {
	@IsNotEmpty()
	firstName: string;

	@IsNotEmpty()
	lastName: string;

	@IsEmail()
	email: string;

	@MinLength(8)
	password: string;
}
