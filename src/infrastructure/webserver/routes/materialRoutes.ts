// src/infrastructure/webserver/routes/materialRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {
	validateMaterial,
	validateStockUpdate,
} from "../validators/materialValidator";
import {getMaterialController} from "../../config/service-factory";

const router = Router();

// Rutas públicas
router.get("/", (req, res) => {
	const materialController = getMaterialController();
	return materialController.getMaterials(req, res);
});

router.get("/:id", (req, res) => {
	const materialController = getMaterialController();
	return materialController.getMaterialById(req, res);
});

// Rutas protegidas
router.post("/", authenticate, validateMaterial, (req, res) => {
	const materialController = getMaterialController();
	return materialController.createMaterial(req, res);
});

router.put("/:id", authenticate, validateMaterial, (req, res) => {
	const materialController = getMaterialController();
	return materialController.updateMaterial(req, res);
});

router.delete("/:id", authenticate, (req, res) => {
	const materialController = getMaterialController();
	return materialController.deleteMaterial(req, res);
});

router.patch("/:id/stock", authenticate, validateStockUpdate, (req, res) => {
	const materialController = getMaterialController();
	return materialController.updateStock(req, res);
});

router.post("/bulk-update-prices", authenticate, (req, res) => {
	const materialController = getMaterialController();
	return materialController.bulkUpdatePrices(req, res);
});

router.get("/:id/price-history", (req, res) => {
	const materialController = getMaterialController();
	return materialController.getPriceHistory(req, res);
});

router.get(
	"/:materialId/compare-prices",
	authenticate,
	(req, res) => {
		const materialController = getMaterialController();
		return materialController.comparePrices(req, res);
	}
);

export default router;
