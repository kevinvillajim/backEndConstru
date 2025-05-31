// src/infrastructure/database/repositories/TypeOrmRefreshTokenRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {RefreshTokenRepository} from "../../../domain/repositories/RefreshTokenRepository";
import {
	RefreshToken,
	CreateRefreshTokenDTO,
} from "../../../domain/models/auth/RefreshToken";
import {RefreshTokenEntity} from "../entities/RefreshTokenEntity";

export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
	private repository: Repository<RefreshTokenEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(RefreshTokenEntity);
	}

	async findByToken(token: string): Promise<RefreshToken | null> {
		const refreshToken = await this.repository.findOne({
			where: {token},
		});

		return refreshToken ? this.toDomainModel(refreshToken) : null;
	}

	async create(refreshToken: CreateRefreshTokenDTO): Promise<RefreshToken> {
		const entity = this.toEntity(refreshToken);
		const savedToken = await this.repository.save(entity);
		return this.toDomainModel(savedToken);
	}

	async revokeByUserId(userId: string): Promise<boolean> {
		const result = await this.repository.update(
			{userId, revoked: false},
			{revoked: true}
		);
		return result.affected > 0;
	}

	async revokeByToken(token: string): Promise<boolean> {
		const result = await this.repository.update(
			{token, revoked: false},
			{revoked: true}
		);
		return result.affected > 0;
	}

	async isTokenRevoked(token: string): Promise<boolean> {
		const refreshToken = await this.repository.findOne({
			where: {token},
		});
		return !refreshToken || refreshToken.revoked;
	}

	private toDomainModel(entity: RefreshTokenEntity): RefreshToken {
		return {
			id: entity.id,
			token: entity.token,
			userId: entity.userId,
			expiresAt: entity.expiresAt,
			revoked: entity.revoked,
			createdAt: entity.createdAt,
		};
	}

	private toEntity(model: CreateRefreshTokenDTO): RefreshTokenEntity {
		const entity = new RefreshTokenEntity();
		entity.token = model.token;
		entity.userId = model.userId;
		entity.expiresAt = model.expiresAt;
		entity.revoked = model.revoked || false;
		return entity;
	}
}
