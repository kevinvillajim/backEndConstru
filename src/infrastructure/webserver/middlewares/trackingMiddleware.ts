// src/infrastructure/webserver/middlewares/trackingMiddleware.ts
import {Request, Response, NextFunction} from "express";
import {getTrackTemplateUsageUseCase} from "../../config/service-factory";
import {RequestWithUser} from "./authMiddleware";

interface TrackingRequest extends RequestWithUser {
	trackingData?: {
		templateId: string;
		templateType: "personal" | "verified";
		calculationResultId?: string;
		projectId?: string;
	};
}

/**
 * Middleware para tracking automático de uso de plantillas
 */
export const trackTemplateUsage = (templateType: "personal" | "verified") => {
	return async (req: TrackingRequest, res: Response, next: NextFunction) => {
		// Interceptar la respuesta para capturar el resultado del cálculo
		const originalSend = res.send;

		res.send = function (data: any) {
			// Solo trackear si la respuesta fue exitosa y contiene resultado de cálculo
			if (res.statusCode === 200 || res.statusCode === 201) {
				setImmediate(async () => {
					try {
						await trackUsageAfterResponse(req, data, templateType);
					} catch (error) {
						console.error("Error en tracking automático:", error);
						// No afectar la respuesta al usuario
					}
				});
			}

			return originalSend.call(this, data);
		};

		next();
	};
};

/**
 * Procesa el tracking después de enviar la respuesta
 */
async function trackUsageAfterResponse(
	req: TrackingRequest,
	responseData: any,
	templateType: "personal" | "verified"
): Promise<void> {
	try {
		// Parsear datos de respuesta
		let parsedData;
		if (typeof responseData === "string") {
			parsedData = JSON.parse(responseData);
		} else {
			parsedData = responseData;
		}

		// Verificar que sea una respuesta exitosa con datos de cálculo
		if (!parsedData.success || !parsedData.data) {
			return;
		}

		const calculationResult = parsedData.data;

		// Extraer IDs necesarios
		const templateId =
			req.params.id || req.params.templateId || calculationResult.templateId;
		const userId = req.user?.id;
		const calculationResultId = calculationResult.id;
		const projectId = req.body.projectId || req.query.projectId;

		// Validar datos requeridos
		if (!templateId || !userId || !calculationResultId) {
			console.warn("Datos insuficientes para tracking:", {
				templateId,
				userId,
				calculationResultId,
			});
			return;
		}

		// Registrar uso
		const trackingUseCase = getTrackTemplateUsageUseCase();
		await trackingUseCase.execute({
			templateId,
			templateType,
			userId,
			projectId,
			calculationResultId,
			ipAddress: getClientIp(req),
			userAgent: req.get("User-Agent"),
		});

		console.log(
			`✅ Tracking registrado: ${templateType} template ${templateId} por usuario ${userId}`
		);
	} catch (error) {
		console.error("Error procesando tracking:", error);
	}
}

/**
 * Obtiene la IP del cliente considerando proxies
 */
function getClientIp(req: Request): string {
	return (
		(req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
		(req.headers["x-real-ip"] as string) ||
		req.connection.remoteAddress ||
		req.socket.remoteAddress ||
		"unknown"
	);
}

/**
 * Middleware para tracking manual (cuando se quiere controlar específicamente)
 */
export const trackManualUsage = async (
	req: TrackingRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const {templateId, templateType, calculationResultId, projectId} = req.body;
		const userId = req.user?.id;

		if (templateId && templateType && calculationResultId && userId) {
			const trackingUseCase = getTrackTemplateUsageUseCase();
			await trackingUseCase.execute({
				templateId,
				templateType,
				userId,
				projectId,
				calculationResultId,
				ipAddress: getClientIp(req),
				userAgent: req.get("User-Agent"),
			});
		}

		next();
	} catch (error) {
		console.error("Error en tracking manual:", error);
		// No afectar el flujo, continuar
		next();
	}
};

/**
 * Decorator para funciones que necesitan tracking automático
 */
export function WithTracking(templateType: "personal" | "verified") {
	return function (
		target: any,
		propertyName: string,
		descriptor: PropertyDescriptor
	) {
		const method = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			const result = await method.apply(this, args);

			// Si el resultado contiene información de cálculo, registrar uso
			if (result && result.id && args[0] && args[0].user) {
				try {
					const req = args[0];
					const trackingUseCase = getTrackTemplateUsageUseCase();

					await trackingUseCase.execute({
						templateId: req.params.id || req.body.templateId,
						templateType,
						userId: req.user.id,
						calculationResultId: result.id,
						projectId: req.body.projectId,
						ipAddress: getClientIp(req),
						userAgent: req.get("User-Agent"),
					});
				} catch (error) {
					console.error("Error en decorator tracking:", error);
				}
			}

			return result;
		};

		return descriptor;
	};
}
