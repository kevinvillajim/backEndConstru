// src/infrastructure/database/seeds/nec-seeds/seismic-templates.ts
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
 * Semillas para plantillas de cálculo sísmico según NEC-SE-DS
 */
export async function seedSeismicTemplates() {
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
			necReference: "NEC-SE-DS",
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de cálculo sísmico. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla 1: Cálculo de Cortante Basal
		const cortanteBasalTemplate = templateRepository.create({
			name: "Cálculo de Cortante Basal",
			description:
				"Calcula el cortante basal para estructuras según la normativa NEC-SE-DS para diseño sismorresistente.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Espectro de diseño en aceleración
        let Tc = 0.55 * Fs * (Fd / Fa);
        let Sa;
        
        if (T <= Tc) {
          Sa = n * Z * Fa;
        } else {
          Sa = n * Z * Fa * (Tc / T);
        }
        
        // Cortante basal
        const V = (Sa * I * W) / (R * PhiP * PhiE);
        
        return {
          cortanteBasal: V,
          espectroAceleracion: Sa,
          periodoVibracion: T,
          periodoLimite: Tc
        };
      `,
			necReference: "NEC-SE-DS, Capítulo 6.3",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["sismo", "cortante basal", "estructural", "NEC-SE-DS"],
		});

		await templateRepository.save(cortanteBasalTemplate);

		// Parámetros para plantilla de Cortante Basal
		const cortanteBasalParams = [
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "Z",
				description: "Factor de zona sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.15,
				maxValue: 0.5,
				defaultValue: "0.4",
				helpText:
					"Factor de zona según ubicación. Rango: 0.15 (Zona I) a 0.50 (Zona VI)",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "I",
				description: "Factor de importancia de la estructura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1.0,
				maxValue: 1.5,
				defaultValue: "1.0",
				helpText:
					"1.0 (Estructuras comunes), 1.3 (Estructuras importantes), 1.5 (Estructuras esenciales)",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "R",
				description: "Factor de reducción de resistencia sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 1.0,
				maxValue: 8.0,
				defaultValue: "8.0",
				helpText: "Factor según el sistema estructural utilizado (1.0 a 8.0)",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "PhiP",
				description: "Coeficiente de regularidad en planta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.9,
				maxValue: 1.0,
				defaultValue: "1.0",
				helpText: "1.0 para estructuras regulares, 0.9 para irregulares",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "PhiE",
				description: "Coeficiente de regularidad en elevación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0.9,
				maxValue: 1.0,
				defaultValue: "1.0",
				helpText: "1.0 para estructuras regulares, 0.9 para irregulares",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "W",
				description: "Carga sísmica reactiva",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 1,
				unitOfMeasure: "kN",
				helpText: "Carga muerta total más 25% de carga viva de piso",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "n",
				description: "Razón entre aceleración espectral y PGA",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 1.8,
				maxValue: 2.6,
				defaultValue: "2.48",
				helpText:
					"1.8 (Costa), 2.48 (Sierra, Esmeraldas y Galápagos), 2.6 (Oriente)",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "Fa",
				description: "Coeficiente de amplificación de suelo (periodo corto)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 0.75,
				maxValue: 1.5,
				defaultValue: "1.2",
				helpText: "Amplificación para periodos cortos según tipo de suelo",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "Fd",
				description: "Coeficiente de amplificación de suelo (desplazamientos)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 0.75,
				maxValue: 1.6,
				defaultValue: "1.19",
				helpText: "Amplificación para desplazamientos según tipo de suelo",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "Fs",
				description:
					"Coeficiente de amplificación de suelo (comportamiento no lineal)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 0.75,
				maxValue: 1.9,
				defaultValue: "1.28",
				helpText: "Amplificación por comportamiento no lineal del suelo",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "T",
				description: "Periodo fundamental de vibración de la estructura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 11,
				isRequired: true,
				minValue: 0.1,
				unitOfMeasure: "s",
				helpText: "Periodo calculado mediante método aproximado o modal",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "cortanteBasal",
				description: "Cortante basal de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				isRequired: false,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "espectroAceleracion",
				description: "Espectro de aceleración Sa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				isRequired: false,
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "periodoVibracion",
				description: "Periodo de vibración utilizado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				isRequired: false,
				unitOfMeasure: "s",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "periodoLimite",
				description: "Periodo límite Tc del espectro",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				isRequired: false,
				unitOfMeasure: "s",
			}),
		];

		await parameterRepository.save(cortanteBasalParams);

		// Plantilla 2: Cálculo de Periodo de Vibración
		const periodoVibracionTemplate = templateRepository.create({
			name: "Cálculo de Periodo de Vibración",
			description:
				"Calcula el periodo fundamental de vibración de la estructura según los métodos de la NEC-SE-DS.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Método 1 (fórmula aproximada)
        let Ta;
        
        if (tipoEstructura === 'ConMuros') {
          // Estructuras con muros estructurales o mampostería
          const Cw = AB > 0 ? (1 / AB) * sumatoriaMuros : 0;
          const Ct = 0.0055 / Math.sqrt(Cw);
          Ta = Ct * Math.pow(hn, 0.75);
        } else {
          // Otras estructuras
          Ta = Ct * Math.pow(hn, alpha);
        }
        
        // Limitar a valor máximo permitido
        const TaMax = tipoEstructura === 'ConMuros' ? 1.5 * Ta : 1.25 * Ta;
        const TaFinal = T > 0 ? Math.min(T, TaMax) : Ta;
        
        return {
          periodoMetodo1: Ta,
          periodoMaximoPermitido: TaMax,
          periodoFinal: TaFinal
        };
      `,
			necReference: "NEC-SE-DS, Capítulo 6.3.3",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["sismo", "periodo", "vibración", "estructural", "NEC-SE-DS"],
		});

		await templateRepository.save(periodoVibracionTemplate);

		// Parámetros para plantilla de Periodo de Vibración
		const periodoVibracionParams = [
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "tipoEstructura",
				description: "Tipo de estructura",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				defaultValue: "Porticos",
				allowedValues: JSON.stringify(["Porticos", "PorUMuros", "ConMuros"]),
				helpText: "Pórticos sin arriostramientos, con arriostr., o con muros",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "Ct",
				description: "Coeficiente Ct según tipo de estructura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				defaultValue: "0.055",
				helpText:
					"0.072 (acero sin arriostr.), 0.073 (acero con arriostr.), 0.055 (hormigón)",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "alpha",
				description: "Exponente alpha según tipo de estructura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.75,
				maxValue: 0.9,
				defaultValue: "0.9",
				helpText:
					"0.8 (acero sin arriostr.), 0.75 (acero con arriostr.), 0.9 (hormigón)",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "hn",
				description: "Altura máxima de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 1,
				unitOfMeasure: "m",
				helpText:
					"Medida desde la base hasta el nivel más alto de la estructura",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "T",
				description: "Periodo calculado por método 2 (opcional)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: false,
				minValue: 0,
				unitOfMeasure: "s",
				helpText: "Si se conoce el periodo por análisis modal, ingresar aquí",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "AB",
				description: "Área de la edificación en planta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: false,
				minValue: 0,
				defaultValue: "0",
				unitOfMeasure: "m²",
				helpText: "Área en planta (solo para estructuras con muros)",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "sumatoriaMuros",
				description: "Sumatoria parámetros de muros estructurales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: false,
				minValue: 0,
				defaultValue: "0",
				helpText: "Suma de (Ai×(1+0.83×(hi/lwi)²)) para todos los muros",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "periodoMetodo1",
				description: "Periodo calculado por método 1",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				isRequired: false,
				unitOfMeasure: "s",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "periodoMaximoPermitido",
				description: "Periodo máximo permitido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				isRequired: false,
				unitOfMeasure: "s",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoVibracionTemplate.id,
				name: "periodoFinal",
				description: "Periodo de diseño final",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				isRequired: false,
				unitOfMeasure: "s",
			}),
		];

		await parameterRepository.save(periodoVibracionParams);

		console.log("Plantillas de cálculo sísmico creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de cálculo sísmico:", error);
	} finally {
		await connection.destroy();
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedSeismicTemplates()
		.then(() => console.log("Seeding de plantillas sísmicas completado"))
		.catch((error) => console.error("Error en seeding sísmico:", error));
}
