// src/infrastructure/database/repositories/TypeOrmUserRepository.ts
import {Repository} from "typeorm";
import {User} from "@domain/models/user/User";
import {UserRepository} from "@domain/repositories/UserRepository";
import {UserEntity} from "../entities/UserEntity";
import {AppDataSource} from "../data-source";

export class TypeOrmUserRepository implements UserRepository {
	private _repository: Repository<UserEntity> | null = null;

	// Usar getter para obtener el repositorio bajo demanda
	private get repository(): Repository<UserEntity> {
		if (!this._repository) {
			if (!AppDataSource.isInitialized) {
				throw new Error("La base de datos no está inicializada");
			}
			this._repository = AppDataSource.getRepository(UserEntity);
		}
		return this._repository;
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

	async create(user: User): Promise<User> {
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
			company: entity.company
				? {
						name: entity.company.name,
						taxId: entity.company.taxId,
						address: {
							street: entity.company.address.street,
							number: entity.company.address.number,
							city: entity.company.address.city,
							province: entity.company.address.province,
							postalCode: entity.company.address.postalCode,
							country: entity.company.address.country,
							reference: entity.company.address.reference,
						},
						phone: entity.company.phone,
						email: entity.company.email,
						website: entity.company.website,
						position: entity.company.position,
						employees: entity.company.employees,
						yearFounded: entity.company.yearFounded,
					}
				: undefined,
			addresses: entity.addresses,
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
