// src/infrastructure/webserver/middlewares/securityHeadersMiddleware.ts

import {Request, Response, NextFunction} from "express";

export const securityHeadersMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	// Configurar CSP para permitir peticiones al API
	res.header(
		"Content-Security-Policy",
		"default-src 'self'; connect-src 'self' http://localhost:4000; script-src 'self' 'unsafe-inline'"
	);

	// Otros encabezados de seguridad recomendados
	res.header("X-XSS-Protection", "1; mode=block");
	res.header("X-Content-Type-Options", "nosniff");
	res.header("X-Frame-Options", "DENY");

	next();
};

// Y añadirlo en bootstrap.ts:
// app.use(securityHeadersMiddleware);
