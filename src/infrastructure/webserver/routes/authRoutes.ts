// src/infrastructure/webserver/routes/authRoutes.ts
import {Router} from "express";
import {AuthController} from "../controllers/AuthController";
import { authenticate } from "../middlewares/authMiddleware";
import {validateDTO} from "../middlewares/validationMiddleware";
import {RegisterUserDTO} from "@domain/dtos/user/RegisterUserDTO";
import {
	validateLoginRequest,
	validateRegisterRequest,
	validateForgotPasswordRequest,
	validatePasswordResetRequest,
} from "../validators/authValidator";
import {container} from "../../config/container";

const router = Router();

// Get controller from container
const authController = container.resolve<AuthController>("AuthController");

// Auth routes
router.post("/login", validateLoginRequest, (req, res) => authController.login(req, res));
router.post("/register", validateDTO(RegisterUserDTO), (req, res) =>
	authController.register(req, res)
);
router.post("/refresh-token", (req, res) => authController.refreshToken(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));
router.get("/verify-email/:token", (req, res) => authController.verifyEmail(req, res));
router.post("/forgot-password", validateForgotPasswordRequest, (req, res) => authController.forgotPassword(req, res));
router.post("/reset-password/:token", validatePasswordResetRequest, (req, res) => authController.resetPassword(req, res));

// Protected routes
router.get("/profile", authenticate, (req, res) => authController.getProfile(req, res));

export default router;