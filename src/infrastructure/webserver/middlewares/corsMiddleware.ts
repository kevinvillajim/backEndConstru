// src/infrastructure/webserver/middlewares/corsMiddleware.ts

import cors from "cors";

const corsOptions = {
	origin: "*", // En producción, deberías limitar esto a los orígenes permitidos
	methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"X-Requested-With",
		"Accept",
	],
	credentials: true,
	maxAge: 86400, // 24 horas en segundos
};

export const corsMiddleware = cors(corsOptions);
