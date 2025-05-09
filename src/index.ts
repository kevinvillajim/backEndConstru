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
import {AppDataSource} from "./infrastructure/database/data-source";
import {initializeServices} from "./infrastructure/config/service-factory";

// Load environment variables
dotenv.config();

// Function to start the application
async function bootstrap() {
	try {
		console.log("Starting application initialization...");

		// Initialize database
		if (!AppDataSource.isInitialized) {
			console.log("Initializing database connection...");
			await AppDataSource.initialize();
			console.log("Database initialized successfully");
		}

		// Initialize services
		initializeServices();

		// Initialize Express
		const app = express();

		// Middlewares and configuration
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

		// Basic route
		app.get("/", (req, res) => {
			res.send("ConstructorAPP API");
		});

		// Import routes AFTER services are initialized
		const authRoutes =
			require("./infrastructure/webserver/routes/authRoutes").default;
		const calculationRoutes =
			require("./infrastructure/webserver/routes/calculationRoutes").default;
		const budgetRoutes =
			require("./infrastructure/webserver/routes/budgetRoutes").default;
		const projectScheduleRoutes =
			require("./infrastructure/webserver/routes/projectScheduleRoutes").default;
		
		// Configure routes
		app.use("/api/auth", authRoutes);
		app.use("/api/calculations", calculationRoutes);
		app.use("/api/budgets", budgetRoutes);
		app.use("/api/schedule", projectScheduleRoutes);

		// Global error handler
		app.use(
			(
				err: any,
				req: express.Request,
				res: express.Response,
				next: express.NextFunction
			) => {
				console.error("Global error handler:", err);
				res.status(500).json({
					success: false,
					message: "Algo salió mal!",
					error:
						process.env.NODE_ENV === "development" ? err.message : undefined,
				});
			}
		);

		// Start server
		const PORT = process.env.PORT || 4000;
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});

		return app;
	} catch (error) {
		console.error("Error starting application:", error);
		process.exit(1);
	}
}

// Start the application
bootstrap();

// For testing
export default bootstrap;
