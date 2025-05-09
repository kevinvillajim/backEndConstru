// src/index.ts
import "reflect-metadata";
import "module-alias/register";
import "./bootstrap";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import {DatabaseService} from "./infrastructure/database/database.service";
import {container} from "./infrastructure/config/container";
import {AppDataSource} from "./infrastructure/database/data-source";

// Importar rutas DESPUÉS de inicializar la DB
let authRoutes: any;
let calculationRoutes: any;

// Cargar variables de entorno
dotenv.config();

// Función para iniciar la aplicación
async function bootstrap() {
	try {
		// Inicializar la base de datos primero
		const dbService = DatabaseService.getInstance();
		await dbService.initialize();
		console.log("Base de datos inicializada correctamente");

		// Solo importar rutas DESPUÉS de que la DB esté inicializada
		authRoutes =
			require("./infrastructure/webserver/routes/authRoutes").default;
		calculationRoutes =
			require("./infrastructure/webserver/routes/calculationRoutes").default;

		// Inicializar Express
		const app = express();

		// Middlewares y configuración
		const limiter = rateLimit({
			windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
			max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
			standardHeaders: true,
			legacyHeaders: false,
		});

		const corsOptions = {
			origin: process.env.CORS_ORIGIN || "http://localhost:4000",
			credentials: true,
			methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		};

		app.use(cors(corsOptions));
		app.use(helmet());
		app.use(express.json());
		app.use(express.urlencoded({extended: true}));
		app.use(cookieParser());
		app.use(limiter);

		// Ruta básica
		app.get("/", (req, res) => {
			res.send("ConstructorAPP API");
		});

		// Configurar rutas
		app.use("/api/auth", authRoutes);
		app.use("/api/calculations", calculationRoutes);

		// Manejo global de errores
		app.use(
			(
				err: any,
				req: express.Request,
				res: express.Response,
				next: express.NextFunction
			) => {
				console.error(err.stack);
				res.status(500).send({
					success: false,
					message: "Algo salió mal!",
					error:
						process.env.NODE_ENV === "development" ? err.message : undefined,
				});
			}
		);

		// Iniciar servidor
		const PORT = process.env.PORT || 4000;
		app.listen(PORT, () => {
			console.log(`Servidor ejecutándose en el puerto ${PORT}`);
		});

		return app;
	} catch (error) {
		console.error("Error al iniciar la aplicación:", error);
		process.exit(1);
	}
}

// Iniciar la aplicación
bootstrap();

// Para testing
export default bootstrap;
