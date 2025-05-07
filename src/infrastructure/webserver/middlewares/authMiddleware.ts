// src/infrastructure/webserver/middlewares/authMiddleware.ts
import {Request, Response, NextFunction} from "express";
import {UserRepository} from "../../../domain/repositories/UserRepository";
import jwt from "jsonwebtoken";
import {container} from "../../config/container";

// Interfaz para el payload del token JWT
interface TokenPayload {
	userId: string;
	email: string;
	role: string;
	iat: number;
	exp: number;
}

/**
 * Middleware para verificar la autenticación del usuario
 */
export const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Obtener el token del header de autorización
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			res.status(401).json({
				success: false,
				message: "Acceso no autorizado. Token no proporcionado",
			});
			return;
		}

		// Extraer el token
		const token = authHeader.split(" ")[1];

		// Verificar el token
		const secret = process.env.JWT_SECRET || "default_secret_key";
		const decoded = jwt.verify(token, secret) as TokenPayload;

		// Verificar que el usuario existe en la base de datos
		const userRepository = container.resolve<UserRepository>("userRepository");
		const user = await userRepository.findById(decoded.userId);

		if (!user) {
			res.status(401).json({
				success: false,
				message: "Usuario no encontrado",
			});
			return;
		}

		// Añadir el usuario a la solicitud
		req.user = user;

		next();
	} catch (error) {
		console.error("Error de autenticación:", error);

		res.status(401).json({
			success: false,
			message: "Token inválido o expirado",
		});
	}
};

/**
 * Middleware para verificar roles específicos
 */
export const authorize = (roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({
				success: false,
				message: "Acceso no autorizado",
			});
			return;
		}

		if (!roles.includes(req.user.role)) {
			res.status(403).json({
				success: false,
				message: "No tienes permiso para acceder a este recurso",
			});
			return;
		}

		next();
	};
};
