// src/infrastructure/webserver/routes/materialRequestRoutes.documented.ts
import {Router} from "express";
import {authenticate} from "../../middlewares/authMiddleware";
import {getMaterialRequestController} from "../../../config/service-factory";

const router = Router();

/**
 * @swagger
 * /api/material-requests:
 *   post:
 *     tags:
 *       - MaterialRequests
 *     summary: Crear solicitud de material
 *     description: Crea una nueva solicitud de material para una tarea
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - materialId
 *               - quantity
 *             properties:
 *               taskId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la tarea
 *               materialId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del material
 *               quantity:
 *                 type: number
 *                 description: Cantidad solicitada
 *               notes:
 *                 type: string
 *                 description: Notas adicionales
 *     responses:
 *       201:
 *         description: Solicitud creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Solicitud de material creada exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/MaterialRequest'
 *       400:
 *         description: Parámetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/", authenticate, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.createRequest(req, res);
});

/**
 * @swagger
 * /api/material-requests/{requestId}/approve:
 *   post:
 *     tags:
 *       - MaterialRequests
 *     summary: Aprobar solicitud
 *     description: Aprueba una solicitud de material
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approveQuantity:
 *                 type: number
 *                 description: Cantidad aprobada (por defecto igual a la solicitada)
 *               notes:
 *                 type: string
 *                 description: Notas de aprobación
 *     responses:
 *       200:
 *         description: Solicitud aprobada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Solicitud de material aprobada exitosamente
 *                 data:
 *                   $ref: '#/components/schemas/MaterialRequest'
 *       400:
 *         description: Error al aprobar solicitud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/:requestId/approve", authenticate, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.approveRequest(req, res);
});

/**
 * @swagger
 * /api/material-requests/{requestId}/reject:
 *   post:
 *     tags:
 *       - MaterialRequests
 *     summary: Rechazar solicitud
 *     description: Rechaza una solicitud de material
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Razón del rechazo
 *     responses:
 *       200:
 *         description: Solicitud rechazada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Solicitud de material rechazada
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: REJECTED
 *       400:
 *         description: Error al rechazar solicitud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Solicitud no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:requestId/reject", authenticate, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.rejectRequest(req, res);
});

/**
 * @swagger
 * /api/material-requests/project/{projectId}:
 *   get:
 *     tags:
 *       - MaterialRequests
 *     summary: Solicitudes de un proyecto
 *     description: Obtiene todas las solicitudes de material de un proyecto
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del proyecto
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, delivered]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Solicitudes obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MaterialRequest'
 *       400:
 *         description: Error al obtener solicitudes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/project/:projectId", authenticate, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.getProjectRequests(req, res);
});

/**
 * @swagger
 * /api/material-requests/{requestId}/delivery:
 *   post:
 *     tags:
 *       - MaterialRequests
 *     summary: Confirmar entrega
 *     description: Confirma la recepción de materiales
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receivedQuantity
 *             properties:
 *               receivedQuantity:
 *                 type: number
 *                 description: Cantidad recibida
 *               notes:
 *                 type: string
 *                 description: Notas de recepción
 *     responses:
 *       200:
 *         description: Recepción confirmada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Recepción de material confirmada
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: DELIVERED
 *                     receivedQuantity:
 *                       type: number
 *       400:
 *         description: Error al confirmar recepción
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Solicitud no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:requestId/delivery", authenticate, (req, res) => {
	const materialRequestController = getMaterialRequestController();
	return materialRequestController.confirmDelivery(req, res);
});

export default router;
