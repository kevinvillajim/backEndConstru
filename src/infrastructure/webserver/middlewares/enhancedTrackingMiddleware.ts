// src/infrastructure/webserver/middlewares/enhancedTrackingMiddleware.ts
import {Request, Response, NextFunction} from "express";
import {RequestWithUser} from "./authMiddleware";
import {getTrackTemplateUsageUseCase} from "../../config/service-factory";

// Interface para el tracking de respuestas
interface TrackingResponse extends Response {
	trackingData?: {
		templateId?: string;
		templateType?: "personal" | "verified";
		calculationResultId?: string;
		startTime?: number;
		wasSuccessful?: boolean;
		errorMessage?: string;
	};
}

/**
 * Middleware para tracking automático de uso de plantillas
 * Se ejecuta después de que se complete una operación de cálculo
 */
export const autoTrackTemplateUsage = (
	req: RequestWithUser,
	res: TrackingResponse,
	next: NextFunction
): void => {
	// Interceptar la respuesta para capturar datos
	const originalSend = res.send;
	const originalJson = res.json;

	// Override del método send
	res.send = function (body: any) {
		processTrackingData(req, res, body);
		return originalSend.call(this, body);
	};

	// Override del método json
	res.json = function (body: any) {
		processTrackingData(req, res, body);
		return originalJson.call(this, body);
	};

	// Marcar tiempo de inicio
	res.trackingData = {
		startTime: Date.now(),
	};

	next();
};

/**
 * Middleware específico para extraer datos de plantilla de la request
 */
export const extractTemplateData = (
	req: RequestWithUser,
	res: TrackingResponse,
	next: NextFunction
): void => {
	// Extraer datos de plantilla según la ruta
	if (req.route?.path?.includes("/calculations/execute")) {
		// Ejecución de cálculo oficial
		if (req.body?.templateId) {
			res.trackingData = {
				...res.trackingData,
				templateId: req.body.templateId,
				templateType: "verified",
			};
		}
	} else if (
		req.route?.path?.includes("/user-templates") &&
		req.route?.path?.includes("/execute")
	) {
		// Ejecución de plantilla personal
		if (req.params?.id) {
			res.trackingData = {
				...res.trackingData,
				templateId: req.params.id,
				templateType: "personal",
			};
		}
	}

	next();
};

/**
 * Procesar datos de tracking después de la respuesta
 */
async function processTrackingData(
	req: RequestWithUser,
	res: TrackingResponse,
	responseBody: any
): Promise<void> {
	try {
		// Solo trackear si hay datos de tracking y usuario autenticado
		if (!res.trackingData || !req.user) {
			return;
		}

		const {templateId, templateType, startTime} = res.trackingData;

		// Solo proceder si tenemos datos esenciales
		if (!templateId || !templateType || !startTime) {
			return;
		}

		// Parsear respuesta para extraer datos de resultado
		let calculationResultId: string | undefined;
		let wasSuccessful = false;
		let errorMessage: string | undefined;

		if (typeof responseBody === "string") {
			try {
				const parsed = JSON.parse(responseBody);
				responseBody = parsed;
			} catch (e) {
				// Si no se puede parsear, asumir que no es JSON
				return;
			}
		}

		// Extraer datos del cuerpo de respuesta
		if (responseBody && typeof responseBody === "object") {
			if (responseBody.success) {
				wasSuccessful = true;
				// Buscar ID de resultado en diferentes estructuras posibles
				calculationResultId =
					responseBody.data?.id ||
					responseBody.data?.calculationId ||
					responseBody.data?.resultId;
			} else {
				wasSuccessful = false;
				errorMessage =
					responseBody.message || responseBody.error || "Error desconocido";
			}
		}

		// Solo trackear si tenemos un resultado de cálculo
		if (!calculationResultId) {
			return;
		}

		// Calcular tiempo de ejecución
		const executionTimeMs = Date.now() - startTime;

		// Obtener datos adicionales de la request
		const projectId = req.body?.projectId || (req.query?.projectId as string);
		const ipAddress = req.ip || req.connection.remoteAddress;
		const userAgent = req.get("User-Agent");

		// Ejecutar tracking de forma asíncrona (no bloquear respuesta)
		setImmediate(async () => {
			try {
				const trackingUseCase = getTrackTemplateUsageUseCase();

				await trackingUseCase.execute({
					templateId,
					templateType,
					userId: req.user!.id,
					projectId,
					calculationResultId,
					ipAddress,
					userAgent,
				});

				console.log(
					`✅ Template usage tracked: ${templateType}:${templateId} by user ${req.user!.id}`
				);
			} catch (trackingError) {
				// Log error pero no afectar la respuesta
				console.error("❌ Error tracking template usage:", trackingError);
			}
		});
	} catch (error) {
		// Log error pero no afectar la respuesta principal
		console.error("❌ Error processing tracking data:", error);
	}
}

/**
 * Middleware para rutas específicas de cálculos que requieren tracking
 */
export const trackCalculationExecution = [
	extractTemplateData,
	autoTrackTemplateUsage,
];

/**
 * Middleware para debugging de tracking (solo desarrollo)
 */
export const debugTracking = (
	req: RequestWithUser,
	res: TrackingResponse,
	next: NextFunction
): void => {
	if (process.env.NODE_ENV === "development") {
		console.log("🔍 Tracking Debug:", {
			route: req.route?.path,
			method: req.method,
			templateId: res.trackingData?.templateId,
			templateType: res.trackingData?.templateType,
			userId: req.user?.id,
		});
	}
	next();
};

/**
 * Wrapper para aplicar tracking automático a rutas específicas
 */
export function withTracking(routeHandler: any) {
	return [
		...trackCalculationExecution,
		...(process.env.NODE_ENV === "development" ? [debugTracking] : []),
		routeHandler,
	];
}
