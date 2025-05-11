// src/infrastructure/database/seeds/nec-seeds/nec-mamposteria-seeds.ts
import {AppDataSource} from "../../data-source";
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
 * Semillas para plantillas de cálculo de mampostería estructural (NEC-SE-MP)
 */
export async function seedMamposteriaTemplates() {
	const connection = AppDataSource.getInstance();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	console.log(
		"🧱 Creando plantillas de Mampostería Estructural (NEC-SE-MP)..."
	);

	// Verificar si ya existen plantillas con tag NEC-SE-MP
	const existingCount = await templateRepository.count({
		where: {
			tags: ["NEC-SE-MP"],
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de Mampostería Estructural. Omitiendo...`
		);
		return;
	}

	try {
		// 1. PLANTILLA: RESISTENCIA A CARGA AXIAL DE MUROS
		const resistenciaAxialTemplate = templateRepository.create({
			name: "Resistencia a Carga Axial de Muros (NEC-SE-MP)",
			description:
				"Calcula la resistencia a carga axial de muros de mampostería según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo de coeficiente de reducción por esbeltez
        const h_prima = alturaEfectivaElemento;
        const t = espesorEfectivoElemento;
        const Re = 1 - Math.pow((h_prima / (40 * t)), 3);
        
        // Cálculo del área efectiva
        const Ae = areaEfectivaSeccion;
        
        // Cálculo de la resistencia axial teórica
        const Ast = areaAceroRefuerzo;
        const P0 = 0.85 * resistenciaCompresionMamposteria * (Ae - Ast) + Ast * resistenciaFluenciaAcero;
        
        // Limitación de P0
        const P0_limite = resistenciaCompresionMamposteria * Ae;
        const P0_final = Math.min(P0, P0_limite);
        
        // Cálculo de la resistencia nominal
        const Pn = 0.80 * P0_final * Re;
        
        // Resistencia de diseño (aplicando factor de reducción)
        const factorReduccion = 0.60; // Para compresión y flexo-compresión (paralela al plano)
        const Pu = factorReduccion * Pn;
        
        return {
          Re,
          P0,
          P0_limite,
          P0_final,
          Pn,
          Pu
        };
      `,
			necReference: "NEC-SE-MP, Sección 1.4",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-MP", "mampostería", "estructural", "resistencia axial"],
			shareLevel: "public",
		});

		await templateRepository.save(resistenciaAxialTemplate);

		// Parámetros para resistencia axial
		const resistenciaAxialParams = [
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "alturaEfectivaElemento",
				description: "Altura efectiva del elemento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "3000",
				unitOfMeasure: "mm",
				helpText: "Altura efectiva del muro (h')",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "espesorEfectivoElemento",
				description: "Espesor efectivo del elemento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "150",
				unitOfMeasure: "mm",
				helpText: "Espesor efectivo del muro (t)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "areaEfectivaSeccion",
				description: "Área efectiva de la sección",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.001,
				defaultValue: "45000",
				unitOfMeasure: "mm²",
				helpText: "Área efectiva de la sección (Ae)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "areaAceroRefuerzo",
				description: "Área total del acero de refuerzo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0,
				defaultValue: "200",
				unitOfMeasure: "mm²",
				helpText: "Área total del acero de refuerzo (Ast)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "resistenciaCompresionMamposteria",
				description: "Resistencia a compresión de la mampostería (f'm)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 8,
				maxValue: 28,
				defaultValue: "10",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a compresión de la mampostería (f'm)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "resistenciaFluenciaAcero",
				description: "Resistencia a la fluencia del acero (fy)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 400,
				defaultValue: "420",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a la fluencia del acero de refuerzo (fy)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "Re",
				description: "Coeficiente de reducción por esbeltez",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				helpText: "Coeficiente de reducción por esbeltez (Re)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "P0",
				description: "Máxima resistencia axial teórica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "N",
				helpText: "Máxima resistencia axial teórica (P0)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "P0_limite",
				description: "Límite de resistencia axial según norma",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "N",
				helpText: "Límite máximo de P0 según normativa (f'm·Ae)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "P0_final",
				description: "Resistencia axial teórica considerando limitaciones",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "N",
				helpText: "Valor de P0 considerando las limitaciones normativas",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "Pn",
				description: "Resistencia nominal a carga axial",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "N",
				helpText: "Resistencia nominal a carga axial (Pn = 0.80·P0·Re)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaAxialTemplate.id,
				name: "Pu",
				description: "Resistencia de diseño a carga axial",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "N",
				helpText: "Resistencia de diseño a carga axial (φPn)",
			}),
		];

		await parameterRepository.save(resistenciaAxialParams);

		// 2. PLANTILLA: RESISTENCIA A FLEXIÓN DE MUROS
		const resistenciaFlexionTemplate = templateRepository.create({
			name: "Resistencia a Flexión de Muros (NEC-SE-MP)",
			description:
				"Calcula la resistencia a flexión de muros de mampostería según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Profundidad del bloque rectangular equivalente de esfuerzos
        const a = (areaAceroTrabajoAcero * resistenciaFluenciaAcero) / (0.85 * resistenciaCompresionMamposteria * anchoSeccion);
        
        // Cálculo del momento nominal para secciones con refuerzo a tracción
        const d = distanciaExtremoComprimidoAcero;
        const Mn = areaAceroTrabajoAcero * resistenciaFluenciaAcero * (d - a/2);
        
        // Factor de reducción de resistencia para flexión
        const factorReduccion = 0.85; // Para flexión (paralela al plano)
        
        // Momento de diseño
        const Mu = factorReduccion * Mn;
        
        return {
          a,
          Mn,
          Mu
        };
      `,
			necReference: "NEC-SE-MP, Sección 1.5",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-MP", "mampostería", "estructural", "resistencia flexión"],
			shareLevel: "public",
		});

		await templateRepository.save(resistenciaFlexionTemplate);

		// Parámetros para resistencia a flexión
		const resistenciaFlexionParams = [
			parameterRepository.create({
				calculationTemplateId: resistenciaFlexionTemplate.id,
				name: "areaAceroTrabajoAcero",
				description: "Área de acero a tracción",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "200",
				unitOfMeasure: "mm²",
				helpText: "Área del acero de refuerzo a tracción (As)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaFlexionTemplate.id,
				name: "resistenciaFluenciaAcero",
				description: "Resistencia a la fluencia del acero (fy)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 400,
				defaultValue: "420",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a la fluencia del acero de refuerzo (fy)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaFlexionTemplate.id,
				name: "resistenciaCompresionMamposteria",
				description: "Resistencia a compresión de la mampostería (f'm)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 8,
				maxValue: 28,
				defaultValue: "10",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a compresión de la mampostería (f'm)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaFlexionTemplate.id,
				name: "anchoSeccion",
				description: "Ancho de la sección",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "150",
				unitOfMeasure: "mm",
				helpText: "Ancho de la sección (b)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaFlexionTemplate.id,
				name: "distanciaExtremoComprimidoAcero",
				description: "Distancia del extremo comprimido al acero",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "120",
				unitOfMeasure: "mm",
				helpText:
					"Distancia desde la fibra extrema en compresión al centroide del refuerzo en tracción (d)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaFlexionTemplate.id,
				name: "a",
				description: "Profundidad del bloque rectangular equivalente",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "mm",
				helpText:
					"Profundidad del bloque rectangular equivalente de esfuerzos (a)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaFlexionTemplate.id,
				name: "Mn",
				description: "Momento nominal resistente",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "N·mm",
				helpText: "Momento nominal resistente (Mn)",
			}),
			parameterRepository.create({
				calculationTemplateId: resistenciaFlexionTemplate.id,
				name: "Mu",
				description: "Momento de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "N·mm",
				helpText: "Momento de diseño (Mu = φMn)",
			}),
		];

		await parameterRepository.save(resistenciaFlexionParams);

		// 3. PLANTILLA: LONGITUD DE DESARROLLO Y ANCLAJES
		const longitudDesarrolloTemplate = templateRepository.create({
			name: "Longitud de Desarrollo de Refuerzo (NEC-SE-MP)",
			description:
				"Calcula la longitud de desarrollo requerida para barras de refuerzo en mampostería según la NEC.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Diámetro de la barra
        const db = diametroBarra;
        
        // Recubrimiento del refuerzo (no debe exceder 5db)
        const K = Math.min(recubrimientoRefuerzo, 5 * db);
        
        // Longitud de desarrollo específica
        const lde = (1.8 * resistenciaCompresionMamposteria * K * Math.pow(db, 2)) / resistenciaFluenciaAcero;
        
        // Limitación según normativa
        const lde_limite = db * resistenciaFluenciaAcero / (5.2 * Math.sqrt(resistenciaCompresionMamposteria));
        
        // Longitud de desarrollo específica final (valor menor)
        const lde_final = Math.min(lde, lde_limite);
        
        // Factor de reducción para desarrollo
        const phi = 1.5;
        
        // Longitud de desarrollo requerida
        const ld = lde_final / phi;
        
        // Verificar longitud mínima de 300 mm
        const ld_final = Math.max(ld, 300);
        
        return {
          lde,
          lde_limite,
          lde_final,
          ld,
          ld_final
        };
      `,
			necReference: "NEC-SE-MP, Sección 1.2",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: [
				"NEC-SE-MP",
				"mampostería",
				"estructural",
				"longitud desarrollo",
				"anclajes",
			],
			shareLevel: "public",
		});

		await templateRepository.save(longitudDesarrolloTemplate);

		// Parámetros para longitud de desarrollo
		const longitudDesarrolloParams = [
			parameterRepository.create({
				calculationTemplateId: longitudDesarrolloTemplate.id,
				name: "diametroBarra",
				description: "Diámetro de la barra",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 6,
				maxValue: 32,
				defaultValue: "12",
				unitOfMeasure: "mm",
				helpText: "Diámetro de la barra de refuerzo (db)",
			}),
			parameterRepository.create({
				calculationTemplateId: longitudDesarrolloTemplate.id,
				name: "recubrimientoRefuerzo",
				description: "Recubrimiento del refuerzo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 6,
				defaultValue: "40",
				unitOfMeasure: "mm",
				helpText: "Recubrimiento del refuerzo (K)",
			}),
			parameterRepository.create({
				calculationTemplateId: longitudDesarrolloTemplate.id,
				name: "resistenciaCompresionMamposteria",
				description: "Resistencia a compresión de la mampostería (f'm)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 8,
				maxValue: 28,
				defaultValue: "10",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a compresión de la mampostería (f'm)",
			}),
			parameterRepository.create({
				calculationTemplateId: longitudDesarrolloTemplate.id,
				name: "resistenciaFluenciaAcero",
				description: "Resistencia a la fluencia del acero (fy)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 400,
				defaultValue: "420",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a la fluencia del acero de refuerzo (fy)",
			}),
			parameterRepository.create({
				calculationTemplateId: longitudDesarrolloTemplate.id,
				name: "lde",
				description: "Longitud de desarrollo específica calculada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 5,
				unitOfMeasure: "mm",
				helpText: "Longitud de desarrollo específica calculada (lde)",
			}),
			parameterRepository.create({
				calculationTemplateId: longitudDesarrolloTemplate.id,
				name: "lde_limite",
				description: "Límite de longitud de desarrollo específica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "mm",
				helpText: "Límite de longitud de desarrollo específica según normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: longitudDesarrolloTemplate.id,
				name: "lde_final",
				description: "Longitud de desarrollo específica final",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "mm",
				helpText: "Longitud de desarrollo específica final (menor valor)",
			}),
			parameterRepository.create({
				calculationTemplateId: longitudDesarrolloTemplate.id,
				name: "ld",
				description: "Longitud de desarrollo requerida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "mm",
				helpText: "Longitud de desarrollo requerida (ld = lde/φ)",
			}),
			parameterRepository.create({
				calculationTemplateId: longitudDesarrolloTemplate.id,
				name: "ld_final",
				description: "Longitud de desarrollo requerida final",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "mm",
				helpText:
					"Longitud de desarrollo requerida final (considerando mínimo de 300 mm)",
			}),
		];

		await parameterRepository.save(longitudDesarrolloParams);

		console.log(
			"✅ Plantillas de Mampostería Estructural (NEC-SE-MP) creadas exitosamente"
		);
	} catch (error) {
		console.error(
			"❌ Error al crear plantillas de Mampostería Estructural:",
			error
		);
		throw error;
	}
}
