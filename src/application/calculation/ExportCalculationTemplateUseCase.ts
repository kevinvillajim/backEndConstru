// src/application/calculation/ExportCalculationTemplateUseCase.ts
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {CalculationParameterRepository} from "../../domain/repositories/CalculationParameterRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {UserRole} from "../../domain/models/user/User";

export interface TemplateExportData {
	templateData: any;
	parameters: any[];
	exportVersion: string;
	exportDate: string;
}

export class ExportCalculationTemplateUseCase {
	constructor(
		private calculationTemplateRepository: CalculationTemplateRepository,
		private calculationParameterRepository: CalculationParameterRepository,
		private userRepository: UserRepository
	) {}

	/**
	 * Exporta una plantilla de cálculo completa con sus parámetros
	 * @param templateId ID de la plantilla a exportar
	 * @param userId ID del usuario que solicita la exportación
	 */
	async execute(
		templateId: string,
		userId: string
	): Promise<TemplateExportData> {
		// 1. Verificar que la plantilla existe
		const template =
			await this.calculationTemplateRepository.findById(templateId);

		if (!template) {
			throw new Error(`Plantilla no encontrada: ${templateId}`);
		}

		// 2. Verificar permisos del usuario
		const user = await this.userRepository.findById(userId);

		if (!user) {
			throw new Error(`Usuario no encontrado: ${userId}`);
		}

		// Plantillas públicas pueden ser exportadas por cualquiera
		// Plantillas privadas solo por el creador o administradores
		if (
			template.shareLevel === "private" &&
			template.createdBy !== userId &&
			user.role !== UserRole.ADMIN
		) {
			throw new Error("No tienes permiso para exportar esta plantilla");
		}

		// 3. Obtener parámetros de la plantilla
		const parameters =
			await this.calculationParameterRepository.findByTemplateId(templateId);

		// 4. Preparar datos para exportación
		const exportData: TemplateExportData = {
			templateData: {
				name: template.name,
				description: template.description,
				type: template.type,
				targetProfession: template.targetProfession,
				formula: template.formula,
				necReference: template.necReference,
				tags: template.tags,
				// No exportamos datos sensibles o específicos de la instancia
				version: template.version,
				source: "IMPORTED", // Marcará la fuente como importada
				shareLevel: "private", // Por defecto, importada como privada
			},
			parameters: parameters.map((param) => ({
				name: param.name,
				description: param.description,
				dataType: param.dataType,
				scope: param.scope,
				displayOrder: param.displayOrder,
				isRequired: param.isRequired,
				defaultValue: param.defaultValue,
				minValue: param.minValue,
				maxValue: param.maxValue,
				regexPattern: param.regexPattern,
				unitOfMeasure: param.unitOfMeasure,
				allowedValues: param.allowedValues,
				helpText: param.helpText,
				dependsOnParameters: param.dependsOnParameters,
				formula: param.formula,
				// No incluimos el ID de la plantilla, se asignará durante la importación
			})),
			exportVersion: "1.0", // Versión del formato de exportación para compatibilidad futura
			exportDate: new Date().toISOString(),
		};

		return exportData;
	}

	/**
	 * Exporta múltiples plantillas que coinciden con los criterios de filtrado
	 */
	async executeMultiple(
		userId: string,
		filters?: any
	): Promise<{exports: TemplateExportData[]; total: number}> {
		// 1. Verificar que el usuario existe
		const user = await this.userRepository.findById(userId);

		if (!user) {
			throw new Error(`Usuario no encontrado: ${userId}`);
		}

		// 2. Obtener plantillas según filtros
		const combinedFilters = {
			...filters,
			// Si el usuario no es admin, sólo ve las públicas y las propias
			...(user.role !== UserRole.ADMIN && {
				$or: [{shareLevel: "public"}, {createdBy: userId}],
			}),
		};

		const {templates, total} = await this.calculationTemplateRepository.findAll(
			combinedFilters,
			{page: 1, limit: 100} // Limitar a 100 plantillas por exportación
		);

		// 3. Exportar cada plantilla
		const exports: TemplateExportData[] = [];

		for (const template of templates) {
			try {
				const exportData = await this.execute(template.id, userId);
				exports.push(exportData);
			} catch (error) {
				console.error(`Error al exportar plantilla ${template.id}:`, error);
				// Continuamos con las demás plantillas
			}
		}

		return {exports, total};
	}
}
