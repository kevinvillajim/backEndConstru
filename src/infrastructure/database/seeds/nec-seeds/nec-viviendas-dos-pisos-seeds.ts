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
export async function seedViviendasDosPisosTemplates() {
	const connection = AppDataSource.getInstance();
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

		await parameterRepository.save(resistenciaEstructuralParams);

		console.log(
			"✅ Plantillas de Viviendas (NEC-SE-VIVIENDA) creadas exitosamente"
		);
	} catch (error) {
		console.error("❌ Error al crear plantillas de Viviendas:", error);
		throw error;
	}
}
