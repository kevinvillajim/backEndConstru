// src/infrastructure/database/seeds/nec-seeds/glass-templates.ts
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
 * Semillas para plantillas de cálculo de vidrios según NEC-HS-VIDRIO
 */
export async function seedVidriosTemplates() {
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
			necReference: "NEC-HS-VIDRIO",
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de vidrio. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla 1: Cálculo de Espesor de Vidrio y Deformación
		const espesorVidrioTemplate = templateRepository.create({
			name: "Cálculo de Espesor de Vidrio",
			description:
				"Calcula el espesor requerido y la deformación del vidrio según NEC-HS-VIDRIO.",
			type: CalculationType.ARCHITECTURE,
			targetProfession: ProfessionType.ARCHITECT,
			formula: `
        // Cálculo de dimensiones para comparación
        const ladoMayor = Math.max(anchoPanel, altoPanel);
        const ladoMenor = Math.min(anchoPanel, altoPanel);
        const relacionAspecto = ladoMayor / ladoMenor;
        
        // Cálculo para vidrio monolítico
        let espesorMinimo = 0;
        let flechaMaxima = 0;
        
        if (tipoVidrio === "monolitico") {
          // Fórmula aproximada para vidrio monolítico (simplificada)
          // Basada en relación entre presión, área y espesor
          espesorMinimo = ladoMenor * Math.sqrt(presionViento / 100) / 30; // en mm
          
          // Flecha máxima del vidrio
          flechaMaxima = (5 * presionViento * Math.pow(ladoMayor, 4)) / (384 * 70000 * Math.pow(espesorMinimo, 3)); // en mm
        } else if (tipoVidrio === "laminado") {
          // Cálculo para vidrio laminado
          const espesorEquivalente = Math.pow((Math.pow(espesorLamina1, 3) + Math.pow(espesorLamina2, 3)), 1/3);
          espesorMinimo = espesorEquivalente;
          
          // Flecha máxima considerando espesor equivalente
          flechaMaxima = (5 * presionViento * Math.pow(ladoMayor, 4)) / (384 * 70000 * Math.pow(espesorEquivalente, 3)); // en mm
        } else if (tipoVidrio === "templado") {
          // Para vidrio templado, se reduce el espesor requerido por mayor resistencia
          espesorMinimo = ladoMenor * Math.sqrt(presionViento / 100) / 50; // en mm
          
          // Flecha máxima del vidrio templado
          flechaMaxima = (5 * presionViento * Math.pow(ladoMayor, 4)) / (384 * 70000 * Math.pow(espesorMinimo, 3)); // en mm
        }
        
        // Redondear espesor al estándar superior
        const espesoresEstandar = [3, 4, 5, 6, 8, 10, 12, 15, 19, 25];
        let espesorFinal = espesoresEstandar[0];
        
        for (let i = 0; i < espesoresEstandar.length; i++) {
          if (espesoresEstandar[i] >= espesorMinimo) {
            espesorFinal = espesoresEstandar[i];
            break;
          }
        }
        
        // Recalcular flecha con espesor final
        const flechaFinal = (5 * presionViento * Math.pow(ladoMayor, 4)) / (384 * 70000 * Math.pow(espesorFinal, 3)); // en mm
        
        // Comprobación según límites de normativa
        const flechaMaximaPermitida = tipoVidrio === "camara" ? ladoMayor / 225 : ladoMayor / 175;
        const cumpleFlechaMaxima = flechaFinal <= flechaMaximaPermitida;
        const cumpleFlechaAbsoluta = flechaFinal <= 19; // mm
        
        // Cálculo de ancho de contacto para silicona estructural (si aplica)
        let anchoCordSilicona = 0;
        if (sistemaSujecion === "estructural") {
          anchoCordSilicona = (presionViento * ladoMayor) / 14000;
          // Mínimo 6 mm según norma
          anchoCordSilicona = Math.max(anchoCordSilicona, 6);
        }
        
        return {
          espesorMinimo,
          espesorRecomendado: espesorFinal,
          flechaCalculada: flechaFinal,
          flechaMaximaPermitida,
          cumpleFlechaMaxima,
          cumpleFlechaAbsoluta,
          relacionAspecto,
          anchoCordSilicona
        };
      `,
			necReference: "NEC-HS-VIDRIO, Capítulo 4",
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
				"vidrio",
				"arquitectónico",
				"fachadas",
				"espesor",
				"NEC-HS-VIDRIO",
			],
		});

		await templateRepository.save(espesorVidrioTemplate);

		// Parámetros para plantilla de Espesor de Vidrio
		const espesorVidrioParams = [
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "tipoVidrio",
				description: "Tipo de vidrio",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				defaultValue: "monolitico",
				allowedValues: JSON.stringify([
					"monolitico",
					"laminado",
					"templado",
					"camara",
				]),
				helpText: "Tipo de vidrio a utilizar",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "anchoPanel",
				description: "Ancho del panel",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.1,
				maxValue: 10,
				defaultValue: "1.5",
				unitOfMeasure: "m",
				helpText: "Ancho del panel de vidrio",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "altoPanel",
				description: "Alto del panel",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.1,
				maxValue: 10,
				defaultValue: "2.1",
				unitOfMeasure: "m",
				helpText: "Alto del panel de vidrio",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "presionViento",
				description: "Presión de viento de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 100,
				maxValue: 2000,
				defaultValue: "750",
				unitOfMeasure: "Pa",
				helpText: "Presión de viento de diseño según ubicación",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "espesorLamina1",
				description: "Espesor de primera lámina (vidrio laminado)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: false,
				minValue: 3,
				maxValue: 12,
				defaultValue: "4",
				unitOfMeasure: "mm",
				helpText: "Espesor de la primera lámina para vidrio laminado",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "espesorLamina2",
				description: "Espesor de segunda lámina (vidrio laminado)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: false,
				minValue: 3,
				maxValue: 12,
				defaultValue: "4",
				unitOfMeasure: "mm",
				helpText: "Espesor de la segunda lámina para vidrio laminado",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "sistemaSujecion",
				description: "Sistema de sujeción",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				defaultValue: "convencional",
				allowedValues: JSON.stringify(["convencional", "estructural"]),
				helpText:
					"Sistema de sujeción del vidrio (convencional o estructural con silicona)",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "espesorMinimo",
				description: "Espesor mínimo calculado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "espesorRecomendado",
				description: "Espesor recomendado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "flechaCalculada",
				description: "Flecha calculada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "flechaMaximaPermitida",
				description: "Flecha máxima permitida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "cumpleFlechaMaxima",
				description: "¿Cumple flecha máxima?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "cumpleFlechaAbsoluta",
				description: "¿Cumple flecha absoluta?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "relacionAspecto",
				description: "Relación de aspecto del panel",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
			}),
			parameterRepository.create({
				calculationTemplateId: espesorVidrioTemplate.id,
				name: "anchoCordSilicona",
				description: "Ancho del cordón de silicona",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "mm",
			}),
		];

		await parameterRepository.save(espesorVidrioParams);

		// Plantilla 2: Verificación de Fuerzas Sísmicas en Muros Cortina
		const fuerzasSismicasTemplate = templateRepository.create({
			name: "Fuerzas Sísmicas en Muros Cortina",
			description:
				"Calcula las fuerzas sísmicas horizontales y verticales en muros cortina según NEC-HS-VIDRIO.",
			type: CalculationType.ARCHITECTURE,
			targetProfession: ProfessionType.ARCHITECT,
			formula: `
        // Cálculo de fuerzas sísmicas horizontales
        // Fuerza horizontal: Fh = Qp × Cp × Kd
        
        // Coeficiente sísmico para muro cortina
        const Cp = 2.0; // Valor fijo según norma
        
        // Cálculo de la fuerza horizontal
        const fuerzaHorizontal = esfuerzoCorteBase * Cp * factorDesempeno;
        
        // Cálculo de fuerza vertical
        // Fuerza vertical: Fv = 0.67 × (Ao × Pp / g)
        const g = 9.81; // Aceleración de gravedad en m/s²
        const fuerzaVertical = 0.67 * (aceleracionSuelo * pesoTotalElemento / g);
        
        // Cálculo de momento de inercia para perfilería
        // Cálculo para ambos lados del panel (A y B)
        let momentoInerciaA, momentoInerciaB;
        
        if (ladoA > separacionApoyos) {
          // Para lado A mayor que separación entre apoyos
          momentoInerciaA = (presionViento * Math.pow(separacionApoyos, 5)) / (2.4 * Math.pow(10, 12) * moduloElasticidad * deformacionMaxima);
        } else {
          // Para lado A menor o igual que separación entre apoyos
          const ratioA = ladoA / (2 * separacionApoyos);
          momentoInerciaA = (presionViento * Math.pow(separacionApoyos, 4) * ladoA) / (3.84 * Math.pow(10, 13) * moduloElasticidad * deformacionMaxima) * 
                           (25 - 40 * Math.pow(ratioA, 2) + 16 * Math.pow(ratioA, 4));
        }
        
        if (ladoB > separacionApoyos) {
          // Para lado B mayor que separación entre apoyos
          momentoInerciaB = (presionViento * Math.pow(separacionApoyos, 5)) / (2.4 * Math.pow(10, 12) * moduloElasticidad * deformacionMaxima);
        } else {
          // Para lado B menor o igual que separación entre apoyos
          const ratioB = ladoB / (2 * separacionApoyos);
          momentoInerciaB = (presionViento * Math.pow(separacionApoyos, 4) * ladoB) / (3.84 * Math.pow(10, 13) * moduloElasticidad * deformacionMaxima) * 
                           (25 - 40 * Math.pow(ratioB, 2) + 16 * Math.pow(ratioB, 4));
        }
        
        return {
          fuerzaHorizontal,
          fuerzaVertical,
          momentoInerciaLadoA: momentoInerciaA,
          momentoInerciaLadoB: momentoInerciaB
        };
      `,
			necReference: "NEC-HS-VIDRIO, Capítulo 5",
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
				"vidrio",
				"muro cortina",
				"sismo",
				"fuerzas sísmicas",
				"NEC-HS-VIDRIO",
			],
		});

		await templateRepository.save(fuerzasSismicasTemplate);

		// Parámetros para plantilla de Fuerzas Sísmicas
		const fuerzasSismicasParams = [
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "esfuerzoCorteBase",
				description: "Esfuerzo de corte en la base",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "1.5",
				unitOfMeasure: "kN/m²",
				helpText: "Esfuerzo de corte en la base del elemento",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "factorDesempeno",
				description: "Factor de desempeño (Kd)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.75,
				maxValue: 1.35,
				defaultValue: "1.0",
				helpText: "Factor de desempeño (superior=1.35, bueno=1.0, mínimo=0.75)",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "aceleracionSuelo",
				description: "Aceleración efectiva máxima del suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.1,
				maxValue: 0.5,
				defaultValue: "0.4",
				unitOfMeasure: "g",
				helpText: "Aceleración efectiva máxima del suelo (Ao)",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "pesoTotalElemento",
				description: "Peso total del elemento secundario",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 10,
				defaultValue: "500",
				unitOfMeasure: "kg",
				helpText: "Peso total del elemento secundario (muro cortina)",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "presionViento",
				description: "Presión de viento de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 100,
				maxValue: 2000,
				defaultValue: "750",
				unitOfMeasure: "Pa",
				helpText: "Presión de viento de diseño según ubicación",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "ladoA",
				description: "Longitud del lado A del panel",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0.1,
				maxValue: 5,
				defaultValue: "1.5",
				unitOfMeasure: "m",
				helpText: "Longitud del lado A del panel de vidrio",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "ladoB",
				description: "Longitud del lado B del panel",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 0.1,
				maxValue: 5,
				defaultValue: "2.1",
				unitOfMeasure: "m",
				helpText: "Longitud del lado B del panel de vidrio",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "separacionApoyos",
				description: "Separación entre apoyos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 0.1,
				maxValue: 3,
				defaultValue: "1.0",
				unitOfMeasure: "m",
				helpText: "Separación entre apoyos de la perfilería",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "moduloElasticidad",
				description: "Módulo de elasticidad del material",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 60000,
				maxValue: 80000,
				defaultValue: "71000",
				unitOfMeasure: "MPa",
				helpText:
					"Módulo de elasticidad del material de perfiles (71000 MPa para aluminio)",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "deformacionMaxima",
				description: "Deformación máxima permitida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 1,
				maxValue: 25,
				defaultValue: "19",
				unitOfMeasure: "mm",
				helpText: "Deformación máxima permitida (típicamente 19 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "fuerzaHorizontal",
				description: "Fuerza horizontal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "kN/m²",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "fuerzaVertical",
				description: "Fuerza vertical",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "momentoInerciaLadoA",
				description: "Momento de inercia para lado A",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "cm⁴",
			}),
			parameterRepository.create({
				calculationTemplateId: fuerzasSismicasTemplate.id,
				name: "momentoInerciaLadoB",
				description: "Momento de inercia para lado B",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				unitOfMeasure: "cm⁴",
			}),
		];

		await parameterRepository.save(fuerzasSismicasParams);

		console.log("Plantillas de vidrio creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de vidrio:", error);
	} finally {
		await connection.destroy();
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedVidriosTemplates()
		.then(() => console.log("Seeding de plantillas de vidrio completado"))
		.catch((error) => console.error("Error en seeding de vidrio:", error));
}
