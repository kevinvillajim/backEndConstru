// src/infrastructure/webserver/routes/twoFactorAuthRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getTwoFactorAuthController} from "../../config/service-factory";

const router = Router();

// Routes for 2FA
router.post("/setup", authenticate, (req, res) => {
	const twoFactorAuthController = getTwoFactorAuthController();
	return twoFactorAuthController.setupTwoFactor(req, res);
});

router.post("/verify", authenticate, (req, res) => {
	const twoFactorAuthController = getTwoFactorAuthController();
	return twoFactorAuthController.verifyAndEnableTwoFactor(req, res);
});

router.post("/disable", authenticate, (req, res) => {
	const twoFactorAuthController = getTwoFactorAuthController();
	return twoFactorAuthController.disableTwoFactor(req, res);
});

router.post("/validate", (req, res) => {
	const twoFactorAuthController = getTwoFactorAuthController();
	return twoFactorAuthController.validateTwoFactorToken(req, res);
});

router.post("/recovery", (req, res) => {
	const twoFactorAuthController = getTwoFactorAuthController();
	return twoFactorAuthController.useRecoveryCode(req, res);
});

export default router;
