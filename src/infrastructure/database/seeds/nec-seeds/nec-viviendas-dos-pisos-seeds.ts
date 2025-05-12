// src/infrastructure/database/seeds/nec-seeds/nec-vivienda-seeds.ts
import { AppDataSource } from "../../data-source";
import {In} from "typeorm";
import {
	CalculationTemplateEntity,
	CalculationType,
	ProfessionType,
	TemplateSource,
} from "../../entities/CalculationTemplateEntity";
import {
	CalculationParameterEntity,
	ParameterDataType,
	ParameterScope,
} from "../../entities/CalculationParameterEntity";

/**
 * Semillas para plantillas de cálculo de viviendas hasta 2 pisos (NEC-SE-VIVIENDA)
 */
export async function seedViviendasDosPisosTemplates(connection = null) {
	// Si no se proporciona una conexión, obtenemos la instancia
	if (!connection) {
		connection = AppDataSource.getInstance();
	}

	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	console.log("📊 Creando plantillas para viviendas (NEC-SE-VIVIENDA)...");

	// Verificar si ya existen plantillas con tag NEC-SE-VIVIENDA
	const existingCount = await templateRepository.count({
		where: {
			tags: In(["NEC-SE-VIVIENDA"]),
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de Viviendas. Omitiendo...`
		);
		return;
	}

	try {
		// 1. PLANTILLA: ÍNDICE DE DENSIDAD DE MUROS
		const densidadMurosTemplate = templateRepository.create({
			name: "Índice de Densidad de Muros (NEC-SE-VIVIENDA)",
			description:
				"Calcula el índice de densidad de muros según la Norma Ecuatoriana de la Construcción para viviendas hasta 2 pisos.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo del área total en planta
        const areaTotal = ancho * largo;
        
        // Cálculo del área total de muros en dirección X
        let areaMurosX = 0;
        for (let i = 0; i < murosDireccionX.length; i++) {
          const muro = murosDireccionX[i];
          areaMurosX += muro.longitud * muro.espesor;
        }
        
        // Cálculo del área total de muros en dirección Y
        let areaMurosY = 0;
        for (let i = 0; i < murosDireccionY.length; i++) {
          const muro = murosDireccionY[i];
          areaMurosY += muro.longitud * muro.espesor;
        }
        
        // Cálculo del índice de densidad en ambas direcciones
        const indiceDensidadX = (areaMurosX / areaTotal) * 100;
        const indiceDensidadY = (areaMurosY / areaTotal) * 100;
        
        // Determinar índice mínimo según pisos y zona sísmica
        let indiceMinimoRequerido;
        if (numeroPisos === 1) {
          indiceMinimoRequerido = 1.0;
        } else if (numeroPisos === 2) {
          indiceMinimoRequerido = 1.5;
        } else {
          indiceMinimoRequerido = 2.0; // Para casos no estándar
        }
        
        // Verificación de cumplimiento
        const cumpleX = indiceDensidadX >= indiceMinimoRequerido;
        const cumpleY = indiceDensidadY >= indiceMinimoRequerido;
        const cumpleTotal = cumpleX && cumpleY;
        
        return {
          areaTotal,
          areaMurosX,
          areaMurosY,
          indiceDensidadX,
          indiceDensidadY,
          indiceMinimoRequerido,
          cumpleX,
          cumpleY,
          cumpleTotal
        };
      `,
			necReference: "NEC-SE-VIVIENDA, Capítulo 5.2",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-VIVIENDA", "viviendas", "muros", "densidad"],
			shareLevel: "public",
		});

		await templateRepository.save(densidadMurosTemplate);

		// Parámetros para índice de densidad de muros
		const densidadMurosParams = [
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "ancho",
				description: "Ancho de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1,
				defaultValue: "8",
				unitOfMeasure: "m",
				helpText: "Ancho total de la edificación en planta",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "largo",
				description: "Largo de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1,
				defaultValue: "10",
				unitOfMeasure: "m",
				helpText: "Largo total de la edificación en planta",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "murosDireccionX",
				description: "Muros en dirección X",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				defaultValue: JSON.stringify([
					{longitud: 4, espesor: 0.15},
					{longitud: 3, espesor: 0.15},
					{longitud: 2.5, espesor: 0.15},
				]),
				helpText: "Lista de muros en dirección X con su longitud y espesor",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "murosDireccionY",
				description: "Muros en dirección Y",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				defaultValue: JSON.stringify([
					{longitud: 6, espesor: 0.15},
					{longitud: 4, espesor: 0.15},
					{longitud: 3, espesor: 0.15},
				]),
				helpText: "Lista de muros en dirección Y con su longitud y espesor",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "numeroPisos",
				description: "Número de pisos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 1,
				maxValue: 2,
				defaultValue: "2",
				helpText: "Número de pisos de la vivienda (1 o 2)",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "areaTotal",
				description: "Área total en planta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "areaMurosX",
				description: "Área total de muros en X",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "areaMurosY",
				description: "Área total de muros en Y",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "indiceDensidadX",
				description: "Índice de densidad en X",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "%",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "indiceDensidadY",
				description: "Índice de densidad en Y",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "%",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "indiceMinimoRequerido",
				description: "Índice mínimo requerido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "%",
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "cumpleX",
				description: "¿Cumple en dirección X?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "cumpleY",
				description: "¿Cumple en dirección Y?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
			}),
			parameterRepository.create({
				calculationTemplateId: densidadMurosTemplate.id,
				name: "cumpleTotal",
				description: "¿Cumple normativa?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
			}),
		];

		await parameterRepository.save(densidadMurosParams);

		// 2. PLANTILLA: VERIFICACIÓN DE RESISTENCIA ESTRUCTURAL
		const resistenciaEstructuralTemplate = templateRepository.create({
			name: "Verificación de Resistencia Estructural (NEC-SE-VIVIENDA)",
			description:
				"Verifica si la resistencia lateral de la estructura cumple con la demanda sísmica según NEC-SE-VIVIENDA.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo del cortante basal (demanda sísmica)
        const Vbase = Z * C * W / R;
        
        // Cálculo de resistencia lateral de muros en X
        let resistenciaLateralX = 0;
        for (let i = 0; i < murosDireccionX.length; i++) {
          const muro = murosDireccionX[i];
          resistenciaLateralX += muro.longitud * resistenciaUnitaria;
        }
        
        // Cálculo de resistencia lateral de muros en Y
        let resistenciaLateralY = 0;
        for (let i = 0; i < murosDireccionY.length; i++) {
          const muro = murosDireccionY[i];
          resistenciaLateralY += muro.longitud * resistenciaUnitaria;
        }
        
        // Verificación de cumplimiento
        const cumpleX = resistenciaLateralX >= Vbase;
        const cumpleY = resistenciaLateralY >= Vbase;
        const cumpleTotal = cumpleX && cumpleY;
        
        return {
          demandaSismica: Vbase,
          resistenciaLateralX,
          resistenciaLateralY,
          relacioResistenciaDemandaX: resistenciaLateralX / Vbase,
          relacioResistenciaDemandaY: resistenciaLateralY / Vbase,
          cumpleX,
          cumpleY,
          cumpleTotal
        };
      `,
			necReference: "NEC-SE-VIVIENDA, Capítulo 5.3",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-VIVIENDA", "resistencia", "muros", "verificación sísmica"],
			shareLevel: "public",
		});

		await templateRepository.save(resistenciaEstructuralTemplate);

		// Parámetros para verificación de resistencia estructural
		const resistenciaEstructuralParams = [
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "Z",
				description: "Factor de zona sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.15,
				maxValue: 0.5,
				defaultValue: "0.4",
				helpText: "Factor de zona según ubicación geográfica",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "C",
				description: "Coeficiente de respuesta sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 2.0,
				maxValue: 3.0,
				defaultValue: "2.4",
				helpText: "2.4 para Costa y Galápagos, 3.0 para Sierra y Oriente",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "W",
				description: "Peso sísmico (carga muerta)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 10,
				defaultValue: "500",
				unitOfMeasure: "kN",
				helpText: "Peso total de la estructura (carga muerta)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "R",
				description: "Factor de reducción sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 1,
				maxValue: 3,
				defaultValue: "3",
				helpText: "3 para mampostería confinada o reforzada",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "murosDireccionX",
				description: "Muros en dirección X",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				defaultValue: JSON.stringify([
					{longitud: 4, espesor: 0.15},
					{longitud: 3, espesor: 0.15},
					{longitud: 2.5, espesor: 0.15},
				]),
				helpText: "Lista de muros en dirección X con su longitud y espesor",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "murosDireccionY",
				description: "Muros en dirección Y",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				defaultValue: JSON.stringify([
					{longitud: 6, espesor: 0.15},
					{longitud: 4, espesor: 0.15},
					{longitud: 3, espesor: 0.15},
				]),
				helpText: "Lista de muros en dirección Y con su longitud y espesor",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "resistenciaUnitaria",
				description: "Resistencia lateral unitaria",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 5,
				maxValue: 30,
				defaultValue: "15",
				unitOfMeasure: "kN/m",
				helpText: "Resistencia lateral por unidad de longitud del muro",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "demandaSismica",
				description: "Demanda sísmica (cortante basal)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "resistenciaLateralX",
				description: "Resistencia lateral en X",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "resistenciaLateralY",
				description: "Resistencia lateral en Y",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "relacioResistenciaDemandaX",
				description: "Relación resistencia/demanda X",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "relacioResistenciaDemandaY",
				description: "Relación resistencia/demanda Y",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "cumpleX",
				description: "¿Cumple en dirección X?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "cumpleY",
				description: "¿Cumple en dirección Y?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaEstructuralTemplate.id,
				name: "cumpleTotal",
				description: "¿Cumple normativa?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
			}),
		];

		// PLANTILLA: DIMENSIONAMIENTO DE ELEMENTOS ESTRUCTURALES PARA VIVIENDAS
		const dimensionamientoElementosTemplate = templateRepository.create({
			name: "Dimensionamiento de Elementos Estructurales para Viviendas (NEC-SE-VIVIENDA)",
			description:
				"Dimensiona elementos estructurales para viviendas de hasta 2 pisos según NEC-SE-VIVIENDA.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
    // Dimensiones mínimas para columnas
    let dimensionColumnasPB, dimensionColumnasPA;
    
    if (numeroPisos === 1) {
      dimensionColumnasPB = "20×20 cm";
    } else if (numeroPisos === 2) {
      dimensionColumnasPB = "25×25 cm";
      dimensionColumnasPA = "20×20 cm";
    }
    
    // Dimensiones mínimas para vigas
    let dimensionVigasPB, dimensionVigasPA;
    
    if (numeroPisos === 1) {
      dimensionVigasPB = "15×20 cm";
    } else if (numeroPisos === 2) {
      dimensionVigasPB = "20×20 cm";
      dimensionVigasPA = "15×20 cm";
    }
    
    // Dimensionamiento de cimentación corrida
    let dimensionCimentacion = "25×20 cm";
    
    if (numeroPisos === 2) {
      dimensionCimentacion = "30×30 cm";
    }
    
    // Verificación de limitaciones geométricas
    const relacionLargoAncho = largo / ancho;
    const cumpleRelacion = relacionLargoAncho <= 4;
    
    const dimensionMaxima = Math.max(largo, ancho);
    const cumpleDimensionMaxima = dimensionMaxima <= 30;
    
    const cumpleRequisitoJuntas = !cumpleRelacion || !cumpleDimensionMaxima;
    const anchoJuntaSismica = 2.5; // cm
    
    // Verificación de altura máxima
    const alturaMaximaPermitida = tipoTecho === "plano" ? 6 : 8; // metros
    const cumpleAlturaMaxima = alturaEdificio <= alturaMaximaPermitida;
    
    // Verificación de separación máxima entre elementos de confinamiento
    const cumpleSeparacionMaxima = separacionMaxima <= 4;
    
    return {
      dimensionColumnasPB,
      dimensionColumnasPA,
      dimensionVigasPB,
      dimensionVigasPA,
      dimensionCimentacion,
      relacionLargoAncho,
      cumpleRelacionLargoAncho: cumpleRelacion,
      cumpleDimensionMaxima,
      requiereJuntaSismica: cumpleRequisitoJuntas,
      anchoJuntaSismica: cumpleRequisitoJuntas ? anchoJuntaSismica : 0,
      alturaMaximaPermitida,
      cumpleAlturaMaxima,
      cumpleSeparacionMaxima
    };
  `,
			necReference: "NEC-SE-VIVIENDA, Capítulo 4",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-VIVIENDA", "dimensionamiento", "viviendas", "dos pisos"],
			shareLevel: "public",
		});

		await templateRepository.save(dimensionamientoElementosTemplate);

		// Parámetros para dimensionamiento de elementos
		const dimensionamientoElementosParams = [
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "numeroPisos",
				description: "Número de pisos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1,
				maxValue: 2,
				defaultValue: "2",
				helpText: "Número de pisos de la vivienda (1 o 2)",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "largo",
				description: "Largo de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 3,
				defaultValue: "10",
				unitOfMeasure: "m",
				helpText: "Largo total de la edificación",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "ancho",
				description: "Ancho de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 3,
				defaultValue: "8",
				unitOfMeasure: "m",
				helpText: "Ancho total de la edificación",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "tipoTecho",
				description: "Tipo de techo",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				defaultValue: "plano",
				allowedValues: JSON.stringify(["plano", "inclinado"]),
				helpText: "Tipo de techo de la vivienda",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "alturaEdificio",
				description: "Altura de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 2.5,
				defaultValue: "5.5",
				unitOfMeasure: "m",
				helpText: "Altura total de la edificación desde el nivel de suelo",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "separacionMaxima",
				description: "Separación máxima entre columnas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 1,
				defaultValue: "4",
				unitOfMeasure: "m",
				helpText: "Separación máxima entre elementos de confinamiento",
			}),
			// Parámetros de salida
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "dimensionColumnasPB",
				description: "Dimensión de columnas planta baja",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "dimensionColumnasPA",
				description: "Dimensión de columnas planta alta",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "dimensionVigasPB",
				description: "Dimensión de vigas planta baja",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "dimensionVigasPA",
				description: "Dimensión de vigas planta alta",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "dimensionCimentacion",
				description: "Dimensión de cimentación corrida",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "relacionLargoAncho",
				description: "Relación largo/ancho",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "cumpleRelacionLargoAncho",
				description: "¿Cumple relación largo/ancho?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "cumpleDimensionMaxima",
				description: "¿Cumple dimensión máxima?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "requiereJuntaSismica",
				description: "¿Requiere junta sísmica?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "anchoJuntaSismica",
				description: "Ancho de junta sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "cm",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "alturaMaximaPermitida",
				description: "Altura máxima permitida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "m",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "cumpleAlturaMaxima",
				description: "¿Cumple altura máxima?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoElementosTemplate.id,
				name: "cumpleSeparacionMaxima",
				description: "¿Cumple separación máxima?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 19,
			}),
		];

		await parameterRepository.save(dimensionamientoElementosParams);

		await parameterRepository.save(resistenciaEstructuralParams);

		console.log(
			"✅ Plantillas de Viviendas (NEC-SE-VIVIENDA) creadas exitosamente"
		);
	} catch (error) {
		console.error("❌ Error al crear plantillas de Viviendas:", error);
		throw error;
	}
}
