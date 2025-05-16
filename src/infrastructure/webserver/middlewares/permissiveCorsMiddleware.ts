// src/infrastructure/webserver/middlewares/permissiveCorsMiddleware.ts

import cors from "cors";
import {Request, Response, NextFunction} from "express";

// Un middleware extremadamente permisivo - USAR SOLO PARA DEPURACIÓN EN DESARROLLO
export const permissiveCorsMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Permitir cualquier origen
	const origin = req.headers.origin;
	if (origin) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		console.log(`Permitiendo acceso desde: ${origin}`);
	}

	// Permitir todas las cabeceras y métodos
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, PATCH, DELETE, OPTIONS"
	);
	res.setHeader("Access-Control-Allow-Headers", "*");
	res.setHeader("Access-Control-Allow-Credentials", "true");

	// Responder inmediatamente a solicitudes preflight
	if (req.method === "OPTIONS") {
		res.status(204).end();
		return;
	}

	next();
};

// Un middleware basado en cors para desarrollo - USAR SOLO PARA DEPURACIÓN
export const permissiveStandardCorsMiddleware = cors({
	origin: true, // Permite cualquier origen
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: ["*"], // Permite cualquier cabecera
	optionsSuccessStatus: 204,
});
