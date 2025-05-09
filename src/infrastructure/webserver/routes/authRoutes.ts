// src/infrastructure/webserver/routes/authRoutes.ts
import {Router} from "express";
import { authenticate } from "../middlewares/authMiddleware";
import {
	validateLoginRequest,
	validateRegisterRequest,
	validateForgotPasswordRequest,
	validatePasswordResetRequest,
} from "../validators/authValidator";
import {container} from "../../config/container";

const router = Router();

// Auth routes
router.post("/login", validateLoginRequest, (req, res) => {
	const authController = container.resolve("AuthController");
	return authController.login(req, res);
}
);
router.post("/register", validateRegisterRequest, (req, res) =>
	{
		const authController = container.resolve("AuthController");
		return authController.register(req, res);
	}
);
router.post("/refresh-token", (req, res) => {
	const authController = container.resolve("AuthController");
	return authController.refreshToken(req, res);
});
router.post("/logout", (req, res) => {
	const authController = container.resolve("AuthController");
	return authController.logout(req, res);
});
router.get("/verify-email/:token", (req, res) => {
	const authController = container.resolve("AuthController");
	return authController.verifyEmail(req, res);
});
router.post("/forgot-password", validateForgotPasswordRequest, (req, res) => {
	const authController = container.resolve("AuthController");
	return authController.forgotPassword(req, res);
});
router.post("/reset-password/:token", validatePasswordResetRequest, (req, res) => {
	const authController = container.resolve("AuthController");
	return authController.resetPassword(req, res);
});

// Protected routes
router.get("/profile", authenticate, (req, res) => {
	const authController = container.resolve("AuthController");
	return authController.getProfile(req, res);
});

export default router;