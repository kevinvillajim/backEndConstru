// src/infrastructure/webserver/routes/authRoutes.ts
import {Router} from "express";
import {AuthController} from "../controllers/AuthController";
import { authenticate } from "../middlewares/authMiddleware";
import {
	validateLoginRequest,
	validateRegisterRequest,
	validateForgotPasswordRequest,
	validatePasswordResetRequest,
} from "../validators/authValidator";
import {container} from "../../config/container";

const router = Router();

console.log("Iniciando resolución de AuthController desde container");


// Get controller from container
try {
	const authController = container.resolve<AuthController>("AuthController");

	console.log("AuthController resuelto. Verificando propiedades:");
	console.log("- authService:", typeof authController["authService"]);
	console.log("- userRepository:", typeof authController["userRepository"]);

	if (!authController.userRepository) {
		console.error(
			"ERROR CRÍTICO: userRepository es null/undefined en el AuthController"
		);
		console.log(
			"Registros disponibles en container:",
			Object.keys(container.registrations)
		);

		// Intentar resolver directamente
		try {
			const userRepo = container.resolve("userRepository");
			console.log("userRepository resuelto directamente:", typeof userRepo);
		} catch (e) {
			console.error("Error al resolver userRepository directamente:", e);
		}
	}

	// Auth routes
	router.post("/login", validateLoginRequest, (req, res) =>
		authController.login(req, res)
	);
	router.post("/register", validateRegisterRequest, (req, res) =>
		authController.register(req, res)
	);
	router.post("/refresh-token", (req, res) =>
		authController.refreshToken(req, res)
	);
	router.post("/logout", (req, res) => authController.logout(req, res));
	router.get("/verify-email/:token", (req, res) =>
		authController.verifyEmail(req, res)
	);
	router.post("/forgot-password", validateForgotPasswordRequest, (req, res) =>
		authController.forgotPassword(req, res)
	);
	router.post(
		"/reset-password/:token",
		validatePasswordResetRequest,
		(req, res) => authController.resetPassword(req, res)
	);

	// Protected routes
	router.get("/profile", authenticate, (req, res) =>
		authController.getProfile(req, res)
	);
} catch (error) {
	console.error("Error crítico al resolver AuthController:", error);
}
export default router;