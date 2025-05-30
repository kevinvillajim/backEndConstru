// src/infrastructure/webserver/middlewares/adminAuthMiddleware.ts
import {Request, Response, NextFunction} from "express";
import {RequestWithUser} from "./authMiddleware";
import {UserRole} from "../../../domain/models/user/User";

/**
 * Middleware para verificar que el usuario tenga permisos de administrador
 */
export const requireAdminRole = (
	req: RequestWithUser,
	res: Response,
	next: NextFunction
): void => {
	// Verificar que el usuario esté autenticado
	if (!req.user) {
		res.status(401).json({
			success: false,
			message: "Usuario no autenticado",
		});
		return;
	}

	// Verificar que el usuario tenga rol de admin
	if (req.user.role !== UserRole.ADMIN) {
		res.status(403).json({
			success: false,
			message:
				"Se requieren permisos de administrador para acceder a este recurso",
		});
		return;
	}

	next();
};

/**
 * Middleware para verificar que el usuario sea admin o seller (para algunas operaciones)
 */
export const requireAdminOrSellerRole = (
	req: RequestWithUser,
	res: Response,
	next: NextFunction
): void => {
	if (!req.user) {
		res.status(401).json({
			success: false,
			message: "Usuario no autenticado",
		});
		return;
	}

	const allowedRoles = [UserRole.ADMIN, UserRole.SELLER];
	if (!allowedRoles.includes(req.user.role)) {
		res.status(403).json({
			success: false,
			message: "Se requieren permisos de administrador o vendedor",
		});
		return;
	}

	next();
};

/**
 * Middleware flexible para verificar roles específicos
 */
export const requireRole = (allowedRoles: UserRole[]) => {
	return (req: RequestWithUser, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({
				success: false,
				message: "Usuario no autenticado",
			});
			return;
		}

		if (!allowedRoles.includes(req.user.role)) {
			res.status(403).json({
				success: false,
				message: `Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}`,
			});
			return;
		}

		next();
	};
};
