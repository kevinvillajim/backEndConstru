// src/infrastructure/webserver/routes/authRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {
	validateLoginRequest,
	validateRegisterRequest,
	validateForgotPasswordRequest,
	validatePasswordResetRequest,
} from "../validators/authValidator";
import {getAuthController} from "../../config/service-factory";

const router = Router();

// Auth routes
router.post("/login", validateLoginRequest, (req, res) => {
	const authController = getAuthController();
	return authController.login(req, res);
});

router.post("/register", validateRegisterRequest, (req, res) => {
	const authController = getAuthController();
	return authController.register(req, res);
});

router.post("/refresh-token", (req, res) => {
	const authController = getAuthController();
	return authController.refreshToken(req, res);
});

router.post("/logout", (req, res) => {
	const authController = getAuthController();
	return authController.logout(req, res);
});

router.get("/verify-email/:token", (req, res) => {
	const authController = getAuthController();
	return authController.verifyEmail(req, res);
});

if (process.env.NODE_ENV === "development") {
	router.get("/dev-verify/:email", (req, res) => {
		const authController = getAuthController();
		return authController.devVerifyEmail(req, res);
	});
}

router.post("/forgot-password", validateForgotPasswordRequest, (req, res) => {
	const authController = getAuthController();
	return authController.forgotPassword(req, res);
});

router.post(
	"/reset-password/:token",
	validatePasswordResetRequest,
	(req, res) => {
		const authController = getAuthController();
		return authController.resetPassword(req, res);
	}
);

// Protected routes
router.get("/profile", authenticate, (req, res) => {
	const authController = getAuthController();
	return authController.getProfile(req, res);
});

export default router;
