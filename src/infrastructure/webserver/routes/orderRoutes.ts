// src/infrastructure/webserver/routes/orderRoutes.ts
import {Router} from "express";
import {authenticate} from "../middlewares/authMiddleware";
import {
	getOrderController,
	getMaterialController,
} from "../../config/service-factory";

const router = Router();

// Rutas para órdenes
router.post("/from-material-requests", authenticate, (req, res) => {
	const orderController = getOrderController();
	return orderController.createFromMaterialRequests(req, res);
});

router.get("/", authenticate, (req, res) => {
	const orderController = getOrderController();
	return orderController.getUserOrders(req, res);
});

router.get("/:orderId", authenticate, (req, res) => {
	const orderController = getOrderController();
	return orderController.getOrderDetails(req, res);
});

router.patch("/:orderId/status", authenticate, (req, res) => {
	const orderController = getOrderController();
	return orderController.updateOrderStatus(req, res);
});

export default router;

// Actualizar src/infrastructure/webserver/routes/materialRoutes.ts
// Agregar endpoint para comparación de precios
router.get(
	"/materials/:materialId/compare-prices",
	authenticate,
	(req, res) => {
		const materialController = getMaterialController();
		return materialController.comparePrices(req, res);
	}
);
