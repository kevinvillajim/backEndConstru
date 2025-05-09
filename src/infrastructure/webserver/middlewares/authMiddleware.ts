// src/infrastructure/webserver/middlewares/authMiddleware.ts
import {Request, Response, NextFunction} from "express";
import {User, UserRole} from "../../../domain/models/user/User";
import {AppDataSource} from "../../../infrastructure/database/data-source";
import {UserEntity} from "../../../infrastructure/database/entities/UserEntity";
import {AuthService} from "../../../domain/services/AuthService";

// Define a request with user
export interface RequestWithUser extends Request {
	user?: User;
}

// Get services directly to avoid dependency issues
let authService: AuthService;

function getAuthService() {
	if (!authService) {
		authService = new AuthService();
	}
	return authService;
}

/**
 * Middleware to verify user authentication using HTTP-only cookies
 */
export const authenticate = async (
	req: RequestWithUser,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Get token from cookie or Authorization header
		let token = req.cookies.accessToken;

		if (!token && req.headers.authorization) {
			const authHeader = req.headers.authorization;
			if (authHeader.startsWith("Bearer ")) {
				token = authHeader.split(" ")[1];
			}
		}

		if (!token) {
			res.status(401).json({
				success: false,
				message: "Acceso no autorizado. No se proporcionó token",
			});
			return;
		}

		// Verify token
		const auth = getAuthService();
		const decoded = auth.verifyAccessToken(token);

		// Find user directly from database
		const userRepository = AppDataSource.getRepository(UserEntity);
		const user = await userRepository.findOne({where: {id: decoded.userId}});

		if (!user) {
			res.status(401).json({
				success: false,
				message: "Usuario no encontrado",
			});
			return;
		}

		// Check if user is active
		if (!user.isActive) {
			res.status(401).json({
				success: false,
				message: "Usuario desactivado",
			});
			return;
		}

		// Add user to request
		req.user = user as User;

		next();
	} catch (error) {
		console.error("Error de autenticación:", error);

		// Try to refresh token if available
		if (req.cookies.refreshToken) {
			res.status(401).json({
				success: false,
				message: "Token expirado. Por favor, actualiza el token",
				shouldRefresh: true,
			});
			return;
		}

		res.status(401).json({
			success: false,
			message: "Token inválido o expirado",
			shouldRefresh: false,
		});
	}
};

/**
 * Middleware to check if user has required roles
 */
export const authorize = (roles: UserRole[]) => {
	return (req: RequestWithUser, res: Response, next: NextFunction): void => {
		// User should be set by the authenticate middleware
		if (!req.user) {
			res.status(401).json({
				success: false,
				message: "Acceso no autorizado",
			});
			return;
		}

		// Check if user has required role
		const hasRole = roles.includes(req.user.role as UserRole);

		if (!hasRole) {
			res.status(403).json({
				success: false,
				message: "No tienes permiso para acceder a este recurso",
			});
			return;
		}

		next();
	};
};
