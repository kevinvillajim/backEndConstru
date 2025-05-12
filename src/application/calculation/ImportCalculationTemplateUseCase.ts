// src/application/calculation/ImportCalculationTemplateUseCase.ts
import {v4 as uuidv4} from "uuid";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {CalculationParameterRepository} from "../../domain/repositories/CalculationParameterRepository";
import {TemplateValidationService} from "../../domain/services/TemplateValidationService";
import {TemplateExportData} from "./ExportCalculationTemplateUseCase";
import {
	CalculationType,
	ProfessionType,
	TemplateSource,
} from "../../domain/models/calculation/CalculationTemplate";

export interface ImportResult {
	success: boolean;
	templateId?: string;
	templateName?: string;
	errors?: string[];
	warnings?: string[];
}

export class ImportCalculationTemplateUseCase {
	constructor(
		private calculationTemplateRepository: CalculationTemplateRepository,
		private calculationParameterRepository: CalculationParameterRepository,
		private templateValidationService: TemplateValidationService
	) {}

	/**
	 * Importa una plantilla de cálculo desde un formato exportado
	 * @param importData Datos de la plantilla exportada
	 * @param userId ID del usuario que realiza la importación
	 */
	async execute(
		importData: TemplateExportData,
		userId: string
	): Promise<ImportResult> {
		try {
			// 1. Validar versión de formato de exportación
			if (
				!importData.exportVersion ||
				!this.isCompatibleVersion(importData.exportVersion)
			) {
				return {
					success: false,
					errors: [
						`Formato de exportación incompatible: ${importData.exportVersion}`,
					],
				};
			}

			// 2. Validar datos básicos de la plantilla
			const templateData = importData.templateData;
			const parameters = importData.parameters;

			if (!templateData || !parameters || !Array.isArray(parameters)) {
				return {
					success: false,
					errors: ["Formato de importación inválido"],
				};
			}

			// 3. Verificar si el nombre de la plantilla ya existe para este usuario
			const existingTemplates =
				await this.calculationTemplateRepository.findByUser(userId);
			const existingTemplate = existingTemplates.find(
				(t) => t.name.toLowerCase() === templateData.name.toLowerCase()
			);

			// Preparar advertencias
			const warnings: string[] = [];

			if (existingTemplate) {
				// Modificar el nombre para evitar duplicados
				const newName = `${templateData.name} (Importada ${new Date().toLocaleDateString()})`;
				templateData.name = newName;
				warnings.push(
					`El nombre de la plantilla ya existe. Renombrada a "${newName}"`
				);
			}

			// 4. Crear estructura para validación
			const validationTemplate = {
				...templateData,
				parameters: parameters.map((p) => ({
					...p,
					// Asignar IDs temporales para validación
					id: uuidv4(),
				})),
			};

			// 5. Validar la plantilla y sus parámetros
			const validation =
				this.templateValidationService.validateTemplate(validationTemplate);

			if (!validation.isValid) {
				return {
					success: false,
					errors: [
						"La plantilla importada contiene errores:",
						...validation.errors,
					],
				};
			}

			// 6. Preparar el objeto para crear la plantilla (sin parámetros)
			const createTemplateData = {
				name: templateData.name,
				description: templateData.description,
				type: templateData.type as CalculationType,
				targetProfession: templateData.targetProfession as ProfessionType,
				formula: templateData.formula,
				necReference: templateData.necReference,
				isActive: true,
				version: 1, // Siempre comenzar en versión 1
				source: TemplateSource.USER, // Marcar como creada por usuario
				createdBy: userId,
				isVerified: false, // Requerirá verificación
				isFeatured: false,
				tags: templateData.tags || [],
				shareLevel: templateData.shareLevel || "private",
				parameters: [], // Crear plantilla sin parámetros inicialmente
			};

			// 7. Crear la plantilla en la base de datos
			const createdTemplate =
				await this.calculationTemplateRepository.create(createTemplateData);

			// 8. Crear los parámetros asociados a la plantilla
			const parametersWithTemplateId = parameters.map((p) => ({
				name: p.name,
				description: p.description,
				dataType: p.dataType,
				scope: p.scope,
				displayOrder: p.displayOrder,
				isRequired: p.isRequired,
				defaultValue: p.defaultValue,
				minValue: p.minValue,
				maxValue: p.maxValue,
				regexPattern: p.regexPattern,
				unitOfMeasure: p.unitOfMeasure,
				allowedValues: p.allowedValues,
				helpText: p.helpText,
				dependsOnParameters: p.dependsOnParameters,
				formula: p.formula,
				calculationTemplateId: createdTemplate.id, // Añadir el ID de la plantilla creada
			}));

			await this.calculationParameterRepository.createMany(
				parametersWithTemplateId
			);

			// 9. Retornar resultado exitoso
			return {
				success: true,
				templateId: createdTemplate.id,
				templateName: createdTemplate.name,
				warnings: warnings.length > 0 ? warnings : undefined,
			};
		} catch (error) {
			console.error("Error al importar plantilla:", error);
			return {
				success: false,
				errors: [(error as Error).message || "Error al importar plantilla"],
			};
		}
	}

	/**
	 * Importa múltiples plantillas desde un archivo de exportación
	 */
	async executeMultiple(
		importData: {exports: TemplateExportData[]},
		userId: string
	): Promise<{
		results: ImportResult[];
		summary: {success: number; failed: number};
	}> {
		const results: ImportResult[] = [];
		let successCount = 0;
		let failCount = 0;

		if (!importData.exports || !Array.isArray(importData.exports)) {
			return {
				results: [
					{
						success: false,
						errors: ["Formato de importación múltiple inválido"],
					},
				],
				summary: {success: 0, failed: 1},
			};
		}

		// Procesar cada plantilla
		for (const templateExport of importData.exports) {
			const result = await this.execute(templateExport, userId);
			results.push(result);

			if (result.success) {
				successCount++;
			} else {
				failCount++;
			}
		}

		return {
			results,
			summary: {
				success: successCount,
				failed: failCount,
			},
		};
	}

	/**
	 * Verifica si la versión del formato de exportación es compatible
	 */
	private isCompatibleVersion(version: string): boolean {
		// Por ahora solo soportamos la versión 1.0
		return version.startsWith("1.");
	}
}
