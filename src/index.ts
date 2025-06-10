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
import http from "http";
import {AppDataSource} from "./infrastructure/database/data-source";
import {initializeServices} from "./infrastructure/config/service-factory";
import {WebSocketService} from "./infrastructure/websocket/WebSocketService";
import {setupSwagger} from "./infrastructure/webserver/docs/swagger";

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

		// Create HTTP server
		const server = http.createServer(app);

		// Initialize WebSocket service
		WebSocketService.getInstance(server);

		// Middlewares and configuration
		const limiter = rateLimit({
			windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
			max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
			standardHeaders: true,
			legacyHeaders: false,
		});

		// Configuración CORS unificada
		const corsOptions = {
			origin: function (origin, callback) {
				// Lista de orígenes permitidos
				const allowedOrigins = [
					"http://localhost:5173",
					"http://127.0.0.1:5173",
					"http://localhost:4000",
					"http://127.0.0.1:4000",
					"http://localhost",
					"http://127.0.0.1",
				];

				// Permitir solicitudes sin origen (como herramientas de desarrollo)
				if (!origin) return callback(null, true);

				if (allowedOrigins.indexOf(origin) !== -1) {
					callback(null, origin);
				} else {
					console.log(`Origen bloqueado por CORS: ${origin}`);
					// En desarrollo, permitir todos los orígenes para facilitar pruebas
					if (process.env.NODE_ENV !== "production") {
						callback(null, origin);
					} else {
						callback(new Error("No permitido por CORS"), false);
					}
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
		};

		// Aplicar una única configuración CORS
		app.use(cors(corsOptions));

		// Middleware de registro para depuración
		app.use((req, res, next) => {
			if (process.env.NODE_ENV !== "production") {
				console.log(
					`Solicitud: ${req.method} ${req.path} desde ${req.headers.origin || "origen desconocido"}`
				);

				// Configuración CSP que permite conexiones tanto a localhost como a 127.0.0.1
				res.setHeader(
					"Content-Security-Policy",
					"default-src 'self'; img-src 'self' data:; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
				);
			}
			next();
		});

		const authLimiter = rateLimit({
			windowMs: 15 * 60 * 1000, // 15 minutos
			max: 5, // 5 intentos fallidos
			skipSuccessfulRequests: true,
		});

		app.use(
			helmet({
				contentSecurityPolicy: false,
				crossOriginResourcePolicy: false, // Importante: permitir recursos cross-origin
				crossOriginOpenerPolicy: false, // Importante: permitir ventanas cross-origin
			})
		);

		app.use(express.urlencoded({extended: true}));
		app.use(express.json());
		app.use(cookieParser());
		app.use(limiter);

		app.use("/api/auth/login", authLimiter);
		app.use("/api/auth/2fa/validate", authLimiter);

		// Basic route
		app.get("/", (req, res) => {
			res.send("ConstructorAPP API");
		});

		// Setup Swagger documentation
		setupSwagger(app);

		// Import routes AFTER services are initialized
		const authRoutes =
			require("./infrastructure/webserver/routes/authRoutes").default;
		const calculationRoutes =
			require("./infrastructure/webserver/routes/calculationRoutes").default;
		const budgetRoutes =
			require("./infrastructure/webserver/routes/budgetRoutes").default;
		const projectScheduleRoutes =
			require("./infrastructure/webserver/routes/projectScheduleRoutes").default;
		const notificationRoutes =
			require("./infrastructure/webserver/routes/notificationRoutes").default;
		const progressReportRoutes =
			require("./infrastructure/webserver/routes/progressReportRoutes").default;
		const materialRequestRoutes =
			require("./infrastructure/webserver/routes/materialRequestRoutes").default;
		const materialRoutes =
			require("./infrastructure/webserver/routes/materialRoutes").default;
		const templateImportExportRoutes =
			require("./infrastructure/webserver/routes/templateImportExportRoutes").default;
		const supplierIntegrationRoutes =
			require("./infrastructure/webserver/routes/supplierIntegrationRoutes").default;
		const materialPropertyRoutes =
			require("./infrastructure/webserver/routes/materialPropertyRoutes").default;
		const projectDashboardRoutes =
			require("./infrastructure/webserver/routes/projectDashboardRoutes").default;
		const projectMetricsRoutes =
			require("./infrastructure/webserver/routes/projectMetricsRoutes").default;
		const orderRoutes =
			require("./infrastructure/webserver/routes/orderRoutes").default;
		const advancedRecommendationRoutes =
			require("./infrastructure/webserver/routes/advancedRecommendationRoutes").default;
		const twoFactorAuthRoutes =
			require("./infrastructure/webserver/routes/twoFactorAuthRoutes").default;
		const invoiceRoutes =
			require("./infrastructure/webserver/routes/invoiceRoutes").default;
		const userRoutes =
			require("./infrastructure/webserver/routes/userRoutes").default;
		const accountingRoutes =
			require("./infrastructure/webserver/routes/accountingRoutes").default;
		const enhancedProjectDashboardRoutes =
			require("./infrastructure/webserver/routes/enhancedProjectDashboardRoutes").default;
		const projectPredictionRoutes =
			require("./infrastructure/webserver/routes/projectPredictionRoutes").default;
		// *** NUEVO: Importar rutas de plantillas personales ***
		const userTemplateRoutes =
			require("./infrastructure/webserver/routes/userTemplateRoutes").default;
		const adminPromotionRoutes =
			require("./infrastructure/webserver/routes/adminPromotionRoutes").default;
		const templateAnalyticsRoutes =
			require("./infrastructure/webserver/routes/templateAnalyticsRoutes").default;
		const materialCalculationRoutes =
			require("./infrastructure/webserver/routes/materialCalculationRoutes").default;

		
		// Configure routes
		app.use("/api/auth", authRoutes);
		app.use("/api/auth/2fa", twoFactorAuthRoutes);
		app.use("/api/calculations", calculationRoutes);
		app.use("/api/calculations/templates", templateImportExportRoutes);
		app.use("/api/user-templates", userTemplateRoutes);
		app.use("/api/analytics", templateAnalyticsRoutes);
		app.use("/api/admin/promotions", adminPromotionRoutes);
		app.use("/api/budgets", budgetRoutes);
		app.use("/api/schedule", projectScheduleRoutes);
		app.use("/api/notifications", notificationRoutes);
		app.use("/api/reports", progressReportRoutes);
		app.use("/api/material-requests", materialRequestRoutes);
		app.use("/api/materials", materialRoutes);
		app.use("/api/material-properties", materialPropertyRoutes);
		app.use("/api/supplier-integration", supplierIntegrationRoutes);
		app.use("/api/dashboards", projectDashboardRoutes);
		app.use("/api/dashboards/enhanced", enhancedProjectDashboardRoutes);
		app.use("/api/metrics", projectMetricsRoutes);
		app.use("/api/orders", orderRoutes);
		app.use("/api/recommendations/advanced", advancedRecommendationRoutes);
		app.use("/api/invoices", invoiceRoutes);
		app.use("/api/users", userRoutes);
		app.use("/api/accounting", accountingRoutes);
		app.use("/api/predictions", projectPredictionRoutes);
		app.use("/api/material-calculation", materialCalculationRoutes);
		
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
			console.log(
				`API Documentation available at http://localhost:${PORT}/api-docs`
			);
			console.log("✅ User Templates system active at /api/user-templates");
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
