import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import {AppDataSource} from "./infrastructure/database/data-source";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Inicializar la aplicación Express
const app = express();

// Configuración de límites de tasa
const limiter = rateLimit({
	windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutos por defecto
	max: parseInt(process.env.RATE_LIMIT_MAX || "100"), // Límite cada IP a 100 solicitudes por ventana
	standardHeaders: true, // Devuelve info rate limit en los headers `RateLimit-*`
	legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
});

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(limiter);

// Rutas (se implementarán más adelante)
app.get("/", (req, res) => {
	res.send("ConstructorAPP API");
});

// Manejo de errores
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.error(err.stack);
		res.status(500).send({error: "Algo salió mal!"});
	}
);

// Conectar a la base de datos y iniciar el servidor
const PORT = process.env.PORT || 3000;

AppDataSource.initialize()
	.then(() => {
		console.log("Conexión a la base de datos establecida");
		app.listen(PORT, () => {
			console.log(`Servidor ejecutándose en el puerto ${PORT}`);
		});
	})
	.catch((error) =>
		console.log("Error al conectar a la base de datos:", error)
	);

export default app;
