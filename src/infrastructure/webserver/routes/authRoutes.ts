// src/infrastructure/webserver/routes/authRoutes.ts
import {Router, Request, Response} from "express";
import {authenticate, RequestWithUser} from "../middlewares/authMiddleware";
import {
	validateLoginRequest,
	validateRegisterRequest,
	validateForgotPasswordRequest,
	validatePasswordResetRequest,
} from "../validators/authValidator";
import {getAuthController} from "../../config/service-factory";

const router = Router();

// Auth routes
router.post("/login", validateLoginRequest, (req: Request, res: Response) => {
	const authController = getAuthController();
	return authController.login(req, res);
});

router.post(
	"/register",
	validateRegisterRequest,
	(req: Request, res: Response) => {
		const authController = getAuthController();
		return authController.register(req, res);
	}
);

router.post("/refresh-token", (req: Request, res: Response) => {
	const authController = getAuthController();
	return authController.refreshToken(req, res);
});

router.post("/logout", (req: Request, res: Response) => {
	const authController = getAuthController();
	return authController.logout(req, res);
});

router.get("/verify-email/:token", (req: Request, res: Response) => {
	const authController = getAuthController();
	return authController.verifyEmail(req, res);
});

if (process.env.NODE_ENV === "development") {
	router.get("/dev-verify/:email", (req: Request, res: Response) => {
		const authController = getAuthController();
		return authController.devVerifyEmail(req, res);
	});
}

router.post(
	"/forgot-password",
	validateForgotPasswordRequest,
	(req: Request, res: Response) => {
		const authController = getAuthController();
		return authController.forgotPassword(req, res);
	}
);

router.post(
	"/reset-password/:token",
	validatePasswordResetRequest,
	(req: Request, res: Response) => {
		const authController = getAuthController();
		return authController.resetPassword(req, res);
	}
);

// Protected routes - AQUÍ usamos RequestWithUser después del middleware authenticate
router.get("/profile", authenticate, (req: RequestWithUser, res: Response) => {
	const authController = getAuthController();
	return authController.getProfile(req, res);
});

router.get("/verify-reset-token/:token", (req: Request, res: Response) => {
	const authController = getAuthController();
	return authController.verifyResetToken(req, res);
});

export default router;