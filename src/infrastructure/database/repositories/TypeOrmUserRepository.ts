// src/infrastructure/database/repositories/TypeOrmUserRepository.ts
import {Repository} from "typeorm";
import {User} from "@domain/models/user/User";
import {UserRepository} from "@domain/repositories/UserRepository";
import {UserEntity} from "../entities/UserEntity";
import { AppDataSource } from "../data-source";
import crypto from "crypto";

export class TypeOrmUserRepository implements UserRepository {
	private repository: Repository<UserEntity>;

	constructor() {
		if (!AppDataSource.isInitialized) {
			throw new Error("Database is not initialized");
		}
		this.repository = AppDataSource.getRepository(UserEntity);
	}

	async findById(id: string): Promise<User | null> {
		const user = await this.repository.findOne({
			where: {id},
		});

		return user ? this.toDomainModel(user) : null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const user = await this.repository.findOne({
			where: {email},
		});

		return user ? this.toDomainModel(user) : null;
	}

	async findByVerificationToken(token: string): Promise<User[]> {
		const users = await this.repository.find({
			where: {verificationToken: token},
		});

		return users.map((user) => this.toDomainModel(user));
	}

	async create(user: Omit<User, "id">): Promise<User> {
		const userEntity = this.toEntity(user as User);
		const savedUser = await this.repository.save(userEntity);
		return this.toDomainModel(savedUser);
	}

	async update(id: string, userData: Partial<User>): Promise<User | null> {
		await this.repository.update(id, userData);
		return this.findById(id);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.softDelete(id);
		return result.affected !== 0;
	}

	async findByResetToken(token: string): Promise<User[]> {
		const users = await this.repository.find({
			where: {passwordResetToken: token},
		});
		return users.map((user) => this.toDomainModel(user));
	}

	private toDomainModel(entity: UserEntity): User {
		return {
			id: entity.id,
			firstName: entity.firstName,
			lastName: entity.lastName,
			email: entity.email,
			password: entity.password,
			phone: entity.phone,
			mobilePhone: entity.mobilePhone,
			dateOfBirth: entity.dateOfBirth,
			nationalId: entity.nationalId,
			gender: entity.gender,
			profilePicture: entity.profilePicture,
			professionalType: entity.professionalType,
			specializations: entity.specializations,
			yearsOfExperience: entity.yearsOfExperience,
			educationLevel: entity.educationLevel,
			certifications: entity.certifications,
			bio: entity.bio,
			role: entity.role,
			subscriptionPlan: entity.subscriptionPlan,
			subscriptionExpiresAt: entity.subscriptionExpiresAt,
			company: entity.company,
			addresses: entity.addresses
				? entity.addresses.map((addr) => ({
						id: addr.id || crypto.randomUUID(), // Asegúrate de tener crypto importado
						street: addr.street,
						number: addr.number,
						city: addr.city,
						province: addr.province,
						postalCode: addr.postalCode,
						country: addr.country,
						reference: addr.reference,
						isMain: addr.isMain,
					}))
				: undefined,
			preferences: entity.preferences,
			stats: entity.stats,
			interests: entity.interests,
			referralCode: entity.referralCode,
			referredBy: entity.referredBy,
			socialLinks: entity.socialLinks,
			isActive: entity.isActive,
			isVerified: entity.isVerified,
			verificationToken: entity.verificationToken,
			passwordResetToken: entity.passwordResetToken,
			passwordResetExpires: entity.passwordResetExpires,
			adminId: entity.adminId,
			// Incluir campos de 2FA
			twoFactorEnabled: entity.twoFactorEnabled,
			twoFactorSecret: entity.twoFactorSecret,
			recoveryCodes: entity.recoveryCodes,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
		};
	}

	private toEntity(model: User | Omit<User, "id">): UserEntity {
		const entity = new UserEntity();
		Object.assign(entity, model);
		return entity;
	}
}