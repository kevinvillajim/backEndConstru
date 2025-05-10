// src/infrastructure/database/seeds/nec-seeds/energy-efficiency-templates.ts
import {AppDataSource} from "../../data-source";
import {CalculationTemplateEntity} from "../../entities/CalculationTemplateEntity";
import {CalculationParameterEntity} from "../../entities/CalculationParameterEntity";
import {
	CalculationType,
	ProfessionType,
	TemplateSource,
} from "../../../../domain/models/calculation/CalculationTemplate";
import {
	ParameterDataType,
	ParameterScope,
} from "../../../../domain/models/calculation/CalculationParameter";

/**
 * Semillas para plantillas de cálculo de eficiencia energética según NEC-HS-EE
 */
export async function seedEficienciaEnergeticaTemplates() {
	const connection = await AppDataSource.initialize();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	// Verificar si ya existen plantillas (evitar duplicados)
	const existingCount = await templateRepository.count({
		where: {
			necReference: "NEC-HS-EE",
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de eficiencia energética. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla 1: Cálculo de Coeficiente Global de Transferencia de Calor
		const coeficienteGlobalTemplate = templateRepository.create({
			name: "Coeficiente Global de Transferencia de Calor",
			description:
				"Calcula el coeficiente global de transferencia de calor (G) para edificaciones según NEC-HS-EE.",
			type: CalculationType.EFFICIENCY,
			targetProfession: ProfessionType.ARCHITECT,
			formula: `
        // Cálculo del coeficiente global
        const G = ((Um * Sm) + (Ut * St) + (Up * Sp) + (Uv * Sv)) / VT;
        
        // Verificación de cumplimiento
        const cumple = G <= Gbase;
        
        // Calcular áreas totales
        const areaTotal = Sm + St + Sp + Sv;
        
        // Calcular porcentajes
        const porcMuros = (Sm / areaTotal) * 100;
        const porcTecho = (St / areaTotal) * 100;
        const porcPiso = (Sp / areaTotal) * 100;
        const porcVentanas = (Sv / areaTotal) * 100;
        
        return {
          coeficienteG: G,
          cumplimiento: cumple,
          areaEnvolvente: areaTotal,
          porcentajeMuros: porcMuros,
          porcentajeTecho: porcTecho,
          porcentajePiso: porcPiso,
          porcentajeVentanas: porcVentanas
        };
      `,
			necReference: "NEC-HS-EE, Capítulo 13.4",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: [
				"eficiencia energética",
				"transmitancia térmica",
				"envolvente",
				"NEC-HS-EE",
			],
		});

		await templateRepository.save(coeficienteGlobalTemplate);

		// Parámetros para plantilla de Coeficiente Global
		const coeficienteGlobalParams = [
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "Um",
				description: "Coef. transferencia de calor de muros",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				maxValue: 5.0,
				defaultValue: "2.0",
				unitOfMeasure: "W/m²K",
				helpText: "Coeficiente de transferencia de calor para muros exteriores",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "Ut",
				description: "Coef. transferencia de calor de techo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.1,
				maxValue: 5.0,
				defaultValue: "1.5",
				unitOfMeasure: "W/m²K",
				helpText: "Coeficiente de transferencia de calor para techos",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "Up",
				description: "Coef. transferencia de calor de piso",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.1,
				maxValue: 5.0,
				defaultValue: "1.2",
				unitOfMeasure: "W/m²K",
				helpText: "Coeficiente de transferencia de calor para pisos",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "Uv",
				description: "Coef. transferencia de calor de ventanas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 1.0,
				maxValue: 7.0,
				defaultValue: "5.7",
				unitOfMeasure: "W/m²K",
				helpText: "Coeficiente de transferencia de calor para ventanas",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "Sm",
				description: "Superficie total de muros exteriores",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 1,
				defaultValue: "100",
				unitOfMeasure: "m²",
				helpText: "Área total de muros que separan del exterior",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "St",
				description: "Superficie total de techo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 1,
				defaultValue: "50",
				unitOfMeasure: "m²",
				helpText: "Área total de techo expuesto al exterior",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "Sp",
				description: "Superficie total de piso",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 1,
				defaultValue: "50",
				unitOfMeasure: "m²",
				helpText: "Área total de piso en contacto con el exterior o suelo",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "Sv",
				description: "Superficie total de ventanas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 1,
				defaultValue: "15",
				unitOfMeasure: "m²",
				helpText: "Área total de ventanas y elementos translúcidos",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "VT",
				description: "Volumen interior total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 10,
				defaultValue: "300",
				unitOfMeasure: "m³",
				helpText: "Volumen interior total de la edificación",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "Gbase",
				description: "Coeficiente G base de referencia",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 0.5,
				maxValue: 5.0,
				defaultValue: "2.5",
				unitOfMeasure: "W/m³K",
				helpText: "Coeficiente G base según zona climática",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "coeficienteG",
				description: "Coeficiente global de transferencia",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "W/m³K",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "cumplimiento",
				description: "¿Cumple con normativa?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "areaEnvolvente",
				description: "Área total de la envolvente",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "porcentajeMuros",
				description: "Porcentaje de muros",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				unitOfMeasure: "%",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "porcentajeTecho",
				description: "Porcentaje de techo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "%",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "porcentajePiso",
				description: "Porcentaje de piso",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "%",
			}),
			parameterRepository.create({
				calculationTemplateId: coeficienteGlobalTemplate.id,
				name: "porcentajeVentanas",
				description: "Porcentaje de ventanas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "%",
			}),
		];

		await parameterRepository.save(coeficienteGlobalParams);

		// Plantilla 2: Cálculo de Ventilación Natural
		const ventilacionTemplate = templateRepository.create({
			name: "Cálculo de Ventilación Natural",
			description:
				"Calcula los requerimientos de ventilación natural según NEC-HS-EE para confort y ahorro energético.",
			type: CalculationType.EFFICIENCY,
			targetProfession: ProfessionType.ARCHITECT,
			formula: `
        // Cálculo de requerimiento de aire fresco
        const Qtot = 0.15 * Apiso + 3.5 * (Ndorm + 1);
        
        // Cálculo de área mínima de ventanas para ventilación
        const Amin = Qtot / (CvFv * v);
        
        // Verificar cumplimiento con áreas actuales
        const cumple = Av >= Amin;
        
        // Porcentaje de apertura respecto al área de piso
        const porcApertura = (Av / Apiso) * 100;
        
        return {
          requerimientoAire: Qtot,
          areaVentilacionMinima: Amin,
          cumplimiento: cumple,
          porcentajeApertura: porcApertura
        };
      `,
			necReference: "NEC-HS-EE, Capítulo 13.5",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: [
				"eficiencia energética",
				"ventilación",
				"aire fresco",
				"NEC-HS-EE",
			],
		});

		await templateRepository.save(ventilacionTemplate);

		// Parámetros para plantilla de Ventilación
		const ventilacionParams = [
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "Apiso",
				description: "Área de la vivienda",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 10,
				defaultValue: "80",
				unitOfMeasure: "m²",
				helpText: "Área total de la vivienda o espacio a ventilar",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "Ndorm",
				description: "Número de dormitorios",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1,
				defaultValue: "2",
				helpText: "Número de dormitorios en la vivienda (mínimo 1)",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "Av",
				description: "Área de ventanas practicables",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "5",
				unitOfMeasure: "m²",
				helpText: "Área total de ventanas que se pueden abrir para ventilación",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "v",
				description: "Velocidad del viento de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.1,
				maxValue: 5.0,
				defaultValue: "1.0",
				unitOfMeasure: "m/s",
				helpText: "Velocidad promedio del viento en la zona",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "CvFv",
				description: "Coeficiente de ventilación efectiva",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0.1,
				maxValue: 1.0,
				defaultValue: "0.6",
				helpText:
					"Coeficiente que considera el tipo de ventana y efectividad (0.1-0.6)",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "requerimientoAire",
				description: "Requerimiento de aire fresco",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "l/s",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "areaVentilacionMinima",
				description: "Área mínima de ventilación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "cumplimiento",
				description: "¿Cumple con requerimiento?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "porcentajeApertura",
				description: "Porcentaje de apertura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "%",
			}),
		];

		await parameterRepository.save(ventilacionParams);

		console.log("Plantillas de eficiencia energética creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de eficiencia energética:", error);
	} finally {
		await connection.destroy();
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedEnergyEfficiencyTemplates()
		.then(() =>
			console.log("Seeding de plantillas de eficiencia energética completado")
		)
		.catch((error) =>
			console.error("Error en seeding de eficiencia energética:", error)
		);
}
