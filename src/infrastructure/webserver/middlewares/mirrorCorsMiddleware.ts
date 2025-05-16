// src/infrastructure/webserver/middlewares/mirrorCorsMiddleware.ts

import {Request, Response, NextFunction} from "express";

/**
 * Este middleware simplemente refleja el origen de la solicitud en la respuesta.
 * Es una solución más directa para problemas CORS persistentes.
 */
export const mirrorCorsMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const origin = req.headers.origin;

	// Si hay un origen, reflejarlo exactamente
	if (origin) {
		console.log(`Reflejando origen CORS: ${origin}`);
		res.setHeader("Access-Control-Allow-Origin", origin);
	} else {
		res.setHeader("Access-Control-Allow-Origin", "*");
	}

	// Configurar correctamente todos los demás encabezados CORS
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, PATCH, DELETE, OPTIONS"
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Requested-With, Accept"
	);
	res.setHeader("Access-Control-Allow-Credentials", "true");

	// Responder inmediatamente a solicitudes preflight OPTIONS
	if (req.method === "OPTIONS") {
		console.log("Respondiendo a solicitud CORS preflight");
		res.status(204).end();
		return;
	}

	// Continuar con la solicitud normal
	next();
};
