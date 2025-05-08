// src/infrastructure/webserver/middlewares/authMiddleware.ts
import {Request, Response, NextFunction} from "express";
import {User, UserRole} from "../../../domain/models/user/User";
import {UserRepository} from "../../../domain/repositories/UserRepository";
import {AuthService} from "../../../domain/services/AuthService";
import {container} from "../../config/container";

// Asegurar que TypeScript reconozca req.user
export interface RequestWithUser extends Request {
	user?: User;
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
		// Get the authentication service and user repository
		const authService = container.resolve<AuthService>("authService");
		const userRepository = container.resolve<UserRepository>("userRepository");

		// Get token from Authorization header (fallback) or cookie (preferred)
		let token = req.cookies.accessToken;

		// Fallback to Authorization header if cookie is not present
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

		// Verify the token
		const decoded = authService.verifyAccessToken(token);

		// Verify that the user exists in the database
		const user = await userRepository.findById(decoded.userId);

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

		// Add the user to the request
		req.user = user;

		next();
	} catch (error) {
		console.error("Error de autenticación:", error);

		// Try to refresh the token if the access token has expired
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

		// Check if user has any of the required roles
		const authService = container.resolve<AuthService>("authService");
		if (!authService.hasRole(req.user, roles)) {
			res.status(403).json({
				success: false,
				message: "No tienes permiso para acceder a este recurso",
			});
			return;
		}

		next();
	};
};
