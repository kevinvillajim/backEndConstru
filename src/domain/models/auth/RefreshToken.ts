// src/domain/models/auth/RefreshToken.ts
export interface RefreshToken {
	id: string;
	token: string;
	userId: string;
	expiresAt: Date;
	revoked: boolean;
	createdAt: Date;
}

export type CreateRefreshTokenDTO = Omit<RefreshToken, "id" | "createdAt">;
