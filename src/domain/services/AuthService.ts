// src/domain/services/AuthService.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {User, UserRole} from "../models/user/User";

export interface TokenPayload {
	userId: string;
	email: string;
	role: string;
	iat?: number;
	exp?: number;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export class AuthService {
	private accessTokenSecret: string;
	private refreshTokenSecret: string;
	private accessTokenExpiry: string;
	private refreshTokenExpiry: string;

	constructor() {
		this.accessTokenSecret =
			process.env.JWT_ACCESS_SECRET || "access_secret_key";
		this.refreshTokenSecret =
			process.env.JWT_REFRESH_SECRET || "refresh_secret_key";
		this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || "15m"; // 15 minutes
		this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || "7d"; // 7 days
	}

	/**
	 * Generate JWT tokens (access token and refresh token)
	 */
	generateTokens(user: User): AuthTokens {
		const payload: TokenPayload = {
			userId: user.id,
			email: user.email,
			role: user.role,
		};

		// Usar @ts-ignore para evitar errores de tipo en jwt.sign
		// @ts-ignore - Ignoramos el error de tipo ya que sabemos que funciona correctamente
		const accessToken = jwt.sign(payload, this.accessTokenSecret, {
			expiresIn: this.accessTokenExpiry,
		});

		// @ts-ignore - Ignoramos el error de tipo ya que sabemos que funciona correctamente
		const refreshToken = jwt.sign(payload, this.refreshTokenSecret as string, {
			expiresIn: this.refreshTokenExpiry as string,
		});

		return {
			accessToken,
			refreshToken,
		};
	}

	/**
	 * Verify the access token
	 */
	verifyAccessToken(token: string): TokenPayload {
		try {
			const decoded = jwt.verify(token, this.accessTokenSecret) as TokenPayload;
			return decoded;
		} catch (error) {
			throw new Error("Invalid access token");
		}
	}

	/**
	 * Verify the refresh token
	 */
	verifyRefreshToken(token: string): TokenPayload {
		try {
			const decoded = jwt.verify(
				token,
				this.refreshTokenSecret
			) as TokenPayload;
			return decoded;
		} catch (error) {
			throw new Error("Invalid refresh token");
		}
	}

	/**
	 * Hash a password
	 */
	async hashPassword(password: string): Promise<string> {
		const salt = await bcrypt.genSalt(10);
		return bcrypt.hash(password, salt);
	}

	/**
	 * Compare a password with a hash
	 */
	async comparePassword(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}

	/**
	 * Check if a user has the required roles
	 */
	hasRole(user: User, requiredRoles: UserRole[]): boolean {
		return requiredRoles.includes(user.role as UserRole);
	}
}
