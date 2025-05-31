// src/domain/repositories/RefreshTokenRepository.ts
import {RefreshToken, CreateRefreshTokenDTO} from "../../domain/models/auth/RefreshToken";

export interface RefreshTokenRepository {
	findByToken(token: string): Promise<RefreshToken | null>;
	create(refreshToken: CreateRefreshTokenDTO): Promise<RefreshToken>;
	revokeByUserId(userId: string): Promise<boolean>;
	revokeByToken(token: string): Promise<boolean>;
	isTokenRevoked(token: string): Promise<boolean>;
}
