// src/infrastructure/webserver/controllers/TemplateImportExportController.ts
import {Request, Response} from "express";
import {ExportCalculationTemplateUseCase} from "../../../application/calculation/ExportCalculationTemplateUseCase";
import {ImportCalculationTemplateUseCase} from "../../../application/calculation/ImportCalculationTemplateUseCase";
import {handleError} from "../utils/errorHandler";
import {User} from "../../../domain/models/user/User";

interface RequestWithUser extends Request {
	user?: User;
}

export class TemplateImportExportController {
	constructor(
		private exportCalculationTemplateUseCase: ExportCalculationTemplateUseCase,
		private importCalculationTemplateUseCase: ImportCalculationTemplateUseCase
	) {}

	/**
	 * Exporta una plantilla específica
	 */
	async exportTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {templateId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const exportData = await this.exportCalculationTemplateUseCase.execute(
				templateId,
				req.user.id
			);

			// Preparar nombre de archivo
			const filename = `template_${templateId}_${new Date().toISOString().split("T")[0]}.json`;

			// Opción 1: Descargar como archivo
			res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
			res.setHeader("Content-Type", "application/json");
			res.status(200).json(exportData);

			// Opción 2: Devolver como respuesta normal (comentar la opción 1 y usar esta si prefieres)
			/*
      res.status(200).json({
        success: true,
        data: exportData,
        filename: filename
      });
      */
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al exportar plantilla",
			});
		}
	}

	/**
	 * Exporta múltiples plantillas según filtros
	 */
	async exportMultipleTemplates(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Obtener filtros desde query params
			const {type, profession, tags} = req.query;

			const filters: any = {};

			if (type) filters.types = [type];
			if (profession) filters.targetProfessions = [profession];
			if (tags) {
				// Si es un string, convertir a array
				filters.tags = typeof tags === "string" ? [tags] : tags;
			}

			const result =
				await this.exportCalculationTemplateUseCase.executeMultiple(
					req.user.id,
					filters
				);

			// Preparar nombre de archivo
			const filename = `templates_export_${new Date().toISOString().split("T")[0]}.json`;

			// Opción 1: Descargar como archivo
			res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
			res.setHeader("Content-Type", "application/json");
			res.status(200).json({exports: result.exports});

			// Opción 2: Devolver como respuesta normal
			/*
      res.status(200).json({
        success: true,
        data: { exports: result.exports },
        total: result.total,
        filename: filename
      });
      */
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al exportar plantillas",
			});
		}
	}

	/**
	 * Importa una plantilla desde un archivo
	 */
	async importTemplate(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Obtener datos de la plantilla del cuerpo de la petición
			const importData = req.body;

			// Validar estructura básica de datos
			if (!importData || !importData.templateData || !importData.parameters) {
				res.status(400).json({
					success: false,
					message: "Formato de importación inválido",
				});
				return;
			}

			// Importar la plantilla
			const result = await this.importCalculationTemplateUseCase.execute(
				importData,
				req.user.id
			);

			if (result.success) {
				res.status(201).json({
					success: true,
					message: "Plantilla importada exitosamente",
					data: {
						templateId: result.templateId,
						templateName: result.templateName,
					},
					warnings: result.warnings,
				});
			} else {
				res.status(400).json({
					success: false,
					message: "Error al importar plantilla",
					errors: result.errors,
				});
			}
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al importar plantilla",
			});
		}
	}

	/**
	 * Importa múltiples plantillas desde un archivo
	 */
	async importMultipleTemplates(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Obtener datos del cuerpo de la petición
			const importData = req.body;

			// Validar estructura básica
			if (
				!importData ||
				!importData.exports ||
				!Array.isArray(importData.exports)
			) {
				res.status(400).json({
					success: false,
					message: "Formato de importación inválido",
				});
				return;
			}

			// Importar plantillas
			const result =
				await this.importCalculationTemplateUseCase.executeMultiple(
					importData,
					req.user.id
				);

			res.status(200).json({
				success: true,
				message: `Importación completada: ${result.summary.success} exitosas, ${result.summary.failed} fallidas`,
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al importar plantillas",
			});
		}
	}
}
