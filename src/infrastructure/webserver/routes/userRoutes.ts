// src/infrastructure/webserver/routes/userRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {getUserController} from "../../config/service-factory";
import { Request, Response, NextFunction } from "express";

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return function (req: Request, res: Response, next: NextFunction) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

const router = Router();

// User profile routes
router.get("/profile", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	await userController.getProfile(req, res);
}));

// Personal information
router.get("/personal-info", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.getProfile(req, res);
}));

router.put("/personal-info", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.updatePersonalInfo(req, res);
}));

// Professional information
router.get("/professional-info", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.getProfile(req, res);
}));

router.put("/professional-info", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.updateProfessionalInfo(req, res);
}));

// Addresses
router.get("/addresses", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.getAddresses(req, res);
}));

router.post("/addresses", authenticate, asyncHandler(async (req, res) => {
	req.params.addressId = "new";
	const userController = getUserController();
	return userController.updateAddress(req, res);
}));

router.put("/addresses/:addressId", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.updateAddress(req, res);
}));

router.delete("/addresses/:addressId", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.deleteAddress(req, res);
}));

// Preferences
router.get("/preferences", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.getProfile(req, res);
}));

router.put("/preferences", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.updatePreferences(req, res);
}));

// Profile picture
router.post("/profile-picture", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.uploadProfilePicture(req, res);
}));

// User behavior pattern (for recommendations page)
router.get("/behavior-pattern", authenticate, asyncHandler(async (req, res) => {
	const userController = getUserController();
	return userController.getBehaviorPattern(req, res);
}));

export default router;
