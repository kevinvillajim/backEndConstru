import cors from "cors";
import {Request, Response, NextFunction} from "express";

// Middleware CORS personalizado para manejar tanto localhost como 127.0.0.1
export const corsMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	// Obtener el origen de la solicitud
	const origin = req.headers.origin;

	// Permitir estos orígenes específicos incluyendo versiones sin puerto
	const allowedOrigins = [
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://localhost:4000",
		"http://127.0.0.1:4000",
		"http://localhost", // Agregado sin puerto
		"http://127.0.0.1", // Agregado sin puerto
	];

	// Si el origen está en nuestra lista de permitidos, establecerlo en la respuesta
	if (origin && allowedOrigins.includes(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
	} else if (origin) {
		// Log para depuración
		console.log(`Origin not in allowed list: ${origin}`);
	}

	// Establecer otros encabezados CORS necesarios
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, PATCH, DELETE, OPTIONS"
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Requested-With, Accept"
	);
	res.setHeader("Access-Control-Allow-Credentials", "true");

	// Manejar solicitudes preflight OPTIONS
	if (req.method === "OPTIONS") {
		res.status(204).end();
		return;
	}

	// Pasar al siguiente middleware
	next();
};

// Exportar también una versión basada en el paquete cors para compatibilidad
export const standardCorsMiddleware = cors({
	origin: function (origin, callback) {
		const allowedOrigins = [
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://localhost:4000",
			"http://127.0.0.1:4000",
			"http://localhost", // Agregado sin puerto
			"http://127.0.0.1", // Agregado sin puerto
		];

		// Permitir solicitudes sin origen (como aplicaciones móviles o curl)
		if (!origin) return callback(null, true);

		if (allowedOrigins.indexOf(origin) !== -1) {
			callback(null, origin);
		} else {
			console.log(`Origin ${origin} not allowed by CORS`);
			// Para depuración, vamos a permitir todos los orígenes temporalmente
			// callback(null, origin); // Descomentar esta línea para permitir todos los orígenes
			callback(null, false);
		}
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
	],
	exposedHeaders: ["Content-Disposition"],
	optionsSuccessStatus: 204,
});
