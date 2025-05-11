// src/infrastructure/database/seeds/nec-seeds/foundation-templates.ts
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
 * Semillas para plantillas de cálculo de cimentaciones según NEC-SE-GC
 */
export async function seedGeotecniaCimentacionesTemplates() {
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
			necReference: "NEC-SE-GC",
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de cálculo de cimentaciones. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla 1: Diseño de Zapata Aislada
		const zapataTemplate = templateRepository.create({
			name: "Diseño de Zapata Aislada",
			description:
				"Calcula las dimensiones y el refuerzo para una zapata aislada según NEC-SE-GC.",
			type: CalculationType.FOUNDATION,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo de área requerida
        const qadm_kPa = qadm * 1000; // Convertir a kPa
        const P_total = P + peso_columna;
        const A_req = P_total / qadm_kPa;
        
        // Dimensiones de la zapata (se asumen cuadradas)
        const B_min = Math.sqrt(A_req);
        const B = Math.ceil(B_min / 0.05) * 0.05; // Redondear a múltiplos de 5cm
        
        // Verificar esfuerzo del suelo real con dimensiones redondeadas
        const A_real = B * B;
        const peso_zapata = A_real * h * peso_hormigon;
        const P_total_real = P + peso_columna + peso_zapata;
        const q_real = P_total_real / A_real;
        
        // Diseño estructural
        const d = h - recubrimiento;
        const volado = (B - b_columna) / 2;
        
        // Momento último
        const qu = q_real * FS;
        const Mu = qu * volado * volado / 2;
        
        // Cálculo de acero
        const Ru = Mu / (phi_flexion * B * Math.pow(d, 2));
        const rho = (0.85 * fc / fy) * (1 - Math.sqrt(1 - (2 * Ru / (0.85 * fc))));
        const As_calc = rho * B * d * 1000000; // mm²
        
        // Acero mínimo por temperatura
        const As_min = 0.0018 * B * h * 1000000; // mm²
        
        // Acero final
        const As_final = Math.max(As_calc, As_min);
        
        // Revisión de cortante unidireccional
        const Vu = qu * B * (volado - d);
        const phi_Vc = phi_cortante * 0.17 * Math.sqrt(fc) * B * d * 1000; // N
        const cumple_cortante_uni = Vu <= phi_Vc;
        
        // Revisión de cortante bidireccional (punzonamiento)
        const bo = 2 * (b_columna + d) + 2 * (b_columna + d);
        const phi_Vcp = phi_cortante * 0.33 * Math.sqrt(fc) * bo * d * 1000; // N
        const Apo = (b_columna + d) * (b_columna + d);
        const Vup = qu * (A_real - Apo);
        const cumple_punzonamiento = Vup <= phi_Vcp;
        
        return {
          dimension_zapata: B,
          area_requerida: A_req,
          volado: volado,
          carga_admisible_real: q_real / 1000, // kPa a MPa
          momento_ultimo: Mu,
          acero_calculado: As_calc,
          acero_minimo: As_min,
          acero_requerido: As_final,
          cortante_unidireccional: Vu,
          resistencia_cortante_uni: phi_Vc,
          cumple_cortante_uni: cumple_cortante_uni,
          cortante_punzonamiento: Vup,
          resistencia_punzonamiento: phi_Vcp,
          cumple_punzonamiento: cumple_punzonamiento
        };
      `,
			necReference: "NEC-SE-GC, Capítulo 3.7",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["cimentación", "zapata", "geotecnia", "NEC-SE-GC", "fundación"],
		});

		await templateRepository.save(zapataTemplate);

		// Parámetros para plantilla de Zapata
		const zapataParams = [
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "P",
				description: "Carga de servicio de la columna",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 10,
				defaultValue: "500",
				unitOfMeasure: "kN",
				helpText: "Carga axial de servicio (sin factores de mayoración)",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "qadm",
				description: "Capacidad admisible del suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.05,
				maxValue: 0.5,
				defaultValue: "0.2",
				unitOfMeasure: "MPa",
				helpText:
					"Capacidad portante admisible del suelo (típico: 0.1-0.3 MPa)",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "b_columna",
				description: "Ancho de la columna",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.2,
				defaultValue: "0.4",
				unitOfMeasure: "m",
				helpText: "Dimensión de la columna (se asume sección cuadrada)",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "peso_columna",
				description: "Peso de la columna",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0,
				defaultValue: "10",
				unitOfMeasure: "kN",
				helpText: "Peso propio de la columna hasta nivel de fundación",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "h",
				description: "Espesor de la zapata",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0.2,
				maxValue: 1.0,
				defaultValue: "0.5",
				unitOfMeasure: "m",
				helpText: "Espesor o altura total de la zapata",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "recubrimiento",
				description: "Recubrimiento del acero",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0.05,
				maxValue: 0.1,
				defaultValue: "0.075",
				unitOfMeasure: "m",
				helpText: "Recubrimiento libre al centro del acero de refuerzo",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "fc",
				description: "Resistencia del hormigón",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 21,
				maxValue: 35,
				defaultValue: "25",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a compresión del hormigón (f'c)",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "fy",
				description: "Resistencia del acero",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 400,
				maxValue: 550,
				defaultValue: "420",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a fluencia del acero de refuerzo",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "phi_flexion",
				description: "Factor de reducción para flexión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 0.65,
				maxValue: 0.9,
				defaultValue: "0.9",
				helpText: "Factor Ø=0.9 para flexión",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "phi_cortante",
				description: "Factor de reducción para cortante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 0.65,
				maxValue: 0.9,
				defaultValue: "0.75",
				helpText: "Factor Ø=0.75 para cortante",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "peso_hormigon",
				description: "Peso unitario del hormigón",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 11,
				isRequired: true,
				minValue: 22,
				maxValue: 25,
				defaultValue: "24",
				unitOfMeasure: "kN/m³",
				helpText: "Peso unitario del hormigón armado",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "FS",
				description: "Factor de seguridad para cargas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 12,
				isRequired: true,
				minValue: 1.0,
				maxValue: 3.0,
				defaultValue: "1.6",
				helpText: "Factor para mayorar cargas de servicio",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "dimension_zapata",
				description: "Dimensión de la zapata",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "m",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "area_requerida",
				description: "Área requerida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "volado",
				description: "Volado de la zapata",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "m",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "carga_admisible_real",
				description: "Presión del suelo calculada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "momento_ultimo",
				description: "Momento último en volado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "kN·m",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "acero_calculado",
				description: "Acero calculado por flexión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "acero_minimo",
				description: "Acero mínimo por temperatura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 19,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "acero_requerido",
				description: "Acero requerido total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 20,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "cortante_unidireccional",
				description: "Cortante unidireccional",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 21,
				unitOfMeasure: "N",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "resistencia_cortante_uni",
				description: "Resistencia a cortante unidireccional",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 22,
				unitOfMeasure: "N",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "cumple_cortante_uni",
				description: "¿Cumple cortante unidireccional?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 23,
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "cortante_punzonamiento",
				description: "Cortante por punzonamiento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 24,
				unitOfMeasure: "N",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "resistencia_punzonamiento",
				description: "Resistencia a punzonamiento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 25,
				unitOfMeasure: "N",
			}),
			parameterRepository.create({
				calculationTemplateId: zapataTemplate.id,
				name: "cumple_punzonamiento",
				description: "¿Cumple punzonamiento?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 26,
			}),
		];

		// PLANTILLA: CAPACIDAD PORTANTE DEL SUELO
		const capacidadPortanteTemplate = templateRepository.create({
			name: "Capacidad Portante del Suelo (NEC-SE-GC)",
			description:
				"Calcula la capacidad portante del suelo utilizando la fórmula de Terzaghi según NEC-SE-GC.",
			type: CalculationType.FOUNDATION,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
    // Cálculo de capacidad portante del suelo con ecuación de Terzaghi
    // qu = c'×Nc + γ×Df×Nq + 0.5×γ×B×Nγ
    
    // Factores de capacidad de carga
    let Nc, Nq, Ng;
    
    // Valores según ángulo de fricción interna (tabla de Terzaghi)
    if (phi <= 0) {
      Nc = 5.7;
      Nq = 1.0;
      Ng = 0.0;
    } else if (phi <= 5) {
      Nc = 7.3;
      Nq = 1.6;
      Ng = 0.5;
    } else if (phi <= 10) {
      Nc = 9.6;
      Nq = 2.7;
      Ng = 1.2;
    } else if (phi <= 15) {
      Nc = 12.9;
      Nq = 4.4;
      Ng = 2.5;
    } else if (phi <= 20) {
      Nc = 17.7;
      Nq = 7.4;
      Ng = 5.0;
    } else if (phi <= 25) {
      Nc = 25.1;
      Nq = 12.7;
      Ng = 9.7;
    } else if (phi <= 30) {
      Nc = 37.2;
      Nq = 22.5;
      Ng = 19.7;
    } else if (phi <= 35) {
      Nc = 57.8;
      Nq = 41.4;
      Ng = 42.4;
    } else if (phi <= 40) {
      Nc = 95.7;
      Nq = 81.3;
      Ng = 100.4;
    } else if (phi <= 45) {
      Nc = 172.3;
      Nq = 173.3;
      Ng = 297.5;
    } else {
      Nc = 258.3;
      Nq = 347.5;
      Ng = 780.1;
    }
    
    // Factores de forma
    let Sc, Sq, Sg;
    if (formaZapata === "cuadrada") {
      Sc = 1.3;
      Sq = 1.0;
      Sg = 0.8;
    } else if (formaZapata === "circular") {
      Sc = 1.3;
      Sq = 1.0;
      Sg = 0.6;
    } else { // rectangular o corrida
      Sc = 1.0;
      Sq = 1.0;
      Sg = 1.0;
    }
    
    // Capacidad última del suelo
    const qu = c * Nc * Sc + pesoUnitario * Df * Nq * Sq + 0.5 * pesoUnitario * B * Ng * Sg;
    
    // Capacidad admisible (con factor de seguridad)
    const qadm = qu / FS;
    
    // Verificación de tipo de cimentación
    const relacion_Df_B = Df / B;
    const tipoFundacion = relacion_Df_B < 2 ? "Superficial" : "Profunda";
    
    // Verificación de capacidad para caso sísmico
    const FSsismico = FS * 0.75; // Típicamente 25% menor que el estático
    const qadm_sismico = qu / FSsismico;
    
    return {
      factorCapacidadNc: Nc,
      factorCapacidadNq: Nq,
      factorCapacidadNg: Ng,
      factorFormaSc: Sc,
      factorFormaSq: Sq,
      factorFormaSg: Sg,
      capacidadUltima: qu,
      capacidadAdmisible: qadm,
      capacidadAdmisibleSismica: qadm_sismico,
      clasificacionCimentacion: tipoFundacion,
      relacionDf_B: relacion_Df_B
    };
  `,
			necReference: "NEC-SE-GC, Capítulo 3.2",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["geotecnia", "capacidad portante", "cimentaciones", "NEC-SE-GC"],
		});

		await templateRepository.save(capacidadPortanteTemplate);

		// Parámetros para plantilla de capacidad portante
		const capacidadPortanteParams = [
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "c",
				description: "Cohesión del suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0,
				defaultValue: "10",
				unitOfMeasure: "kPa",
				helpText: "Cohesión del suelo (c')",
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "phi",
				description: "Ángulo de fricción interna",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0,
				maxValue: 50,
				defaultValue: "30",
				unitOfMeasure: "°",
				helpText: "Ángulo de fricción interna del suelo (φ)",
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "pesoUnitario",
				description: "Peso unitario del suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 10,
				maxValue: 25,
				defaultValue: "18",
				unitOfMeasure: "kN/m³",
				helpText: "Peso unitario del suelo (γ)",
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "B",
				description: "Ancho de la cimentación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.3,
				defaultValue: "1.5",
				unitOfMeasure: "m",
				helpText: "Ancho de la cimentación",
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "Df",
				description: "Profundidad de desplante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0.3,
				defaultValue: "1.0",
				unitOfMeasure: "m",
				helpText: "Profundidad de desplante de la cimentación",
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "formaZapata",
				description: "Forma de la zapata",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				defaultValue: "cuadrada",
				allowedValues: JSON.stringify([
					"cuadrada",
					"rectangular",
					"circular",
					"corrida",
				]),
				helpText: "Forma geométrica de la cimentación",
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "FS",
				description: "Factor de seguridad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 1.5,
				maxValue: 5,
				defaultValue: "3.0",
				helpText: "Factor de seguridad para condiciones estáticas",
			}),
			// Parámetros de salida
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "factorCapacidadNc",
				description: "Factor de capacidad Nc",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "factorCapacidadNq",
				description: "Factor de capacidad Nq",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "factorCapacidadNg",
				description: "Factor de capacidad Nγ",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "factorFormaSc",
				description: "Factor de forma Sc",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "factorFormaSq",
				description: "Factor de forma Sq",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "factorFormaSg",
				description: "Factor de forma Sγ",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "capacidadUltima",
				description: "Capacidad portante última",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				unitOfMeasure: "kPa",
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "capacidadAdmisible",
				description: "Capacidad portante admisible",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "kPa",
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "capacidadAdmisibleSismica",
				description: "Capacidad portante admisible sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "kPa",
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "clasificacionCimentacion",
				description: "Clasificación de la cimentación",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
			}),
			parameterRepository.create({
				calculationTemplateId: capacidadPortanteTemplate.id,
				name: "relacionDf_B",
				description: "Relación Df/B",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
			}),
		];

		// PLANTILLA: CAPACIDAD DE CARGA DE PILOTES
		const pilotesTemplate = templateRepository.create({
			name: "Capacidad de Carga de Pilotes (NEC-SE-GC)",
			description:
				"Calcula la capacidad de carga de pilotes según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.FOUNDATION,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
    // Cálculo de área de fuste y punta
    const perimetro = Math.PI * diametroPilote;
    const areaPunta = Math.PI * Math.pow(diametroPilote, 2) / 4;
    
    // Capacidad por fricción lateral (por capas)
    let capacidadFriccion = 0;
    let infoCapas = [];
    
    for (let i = 0; i < estratos.length; i++) {
      const estrato = estratos[i];
      const longitudEstrato = estrato.longitud;
      const areaFuste = perimetro * longitudEstrato;
      
      // Calcular capacidad por fricción según tipo de suelo
      let capacidadEstratoFriccion = 0;
      
      if (estrato.tipo === "cohesivo") {
        // Para suelo cohesivo: fs = α × cu
        const factorAdherencia = estrato.resistenciaCortante <= 25 ? 1.0 : 
                             estrato.resistenciaCortante <= 50 ? 0.9 :
                             estrato.resistenciaCortante <= 75 ? 0.8 : 0.7;
                             
        capacidadEstratoFriccion = factorAdherencia * estrato.resistenciaCortante * areaFuste;
      } else {
        // Para suelo granular: fs = β × σ'v
        const esfuerzoVerticalMedio = estrato.esfuerzoVertical;
        const factorFriccion = Math.tan(estrato.anguloFriccion * Math.PI / 180) * 0.8; // K × tan(δ)
        
        capacidadEstratoFriccion = factorFriccion * esfuerzoVerticalMedio * areaFuste;
      }
      
      capacidadFriccion += capacidadEstratoFriccion;
      
      infoCapas.push({
        capa: i + 1,
        longitud: longitudEstrato,
        capacidadFriccion: capacidadEstratoFriccion
      });
    }
    
    // Capacidad por punta
    let capacidadPunta = 0;
    
    if (tipoSueloPunta === "cohesivo") {
      // Para suelo cohesivo: qt = 9 × cu
      capacidadPunta = 9 * resistenciaCortantePunta * areaPunta;
    } else {
      // Para suelo granular: qt = Nq × σ'v
      let Nq = 0;
      // Valores de Nq según ángulo de fricción (Vesic)
      if (anguloFriccionPunta <= 25) Nq = 10;
      else if (anguloFriccionPunta <= 30) Nq = 20;
      else if (anguloFriccionPunta <= 35) Nq = 40;
      else if (anguloFriccionPunta <= 40) Nq = 80;
      else Nq = 150;
      
      capacidadPunta = Nq * esfuerzoVerticalPunta * areaPunta;
    }
    
    // Capacidad última
    const capacidadUltima = capacidadFriccion + capacidadPunta;
    
    // Capacidad admisible (con factor de seguridad)
    const capacidadAdmisible = capacidadUltima / factorSeguridad;
    
    // Capacidad por componentes
    const porcentajeFriccion = (capacidadFriccion / capacidadUltima) * 100;
    const porcentajePunta = (capacidadPunta / capacidadUltima) * 100;
    
    return {
      capacidadFriccion,
      capacidadPunta,
      capacidadUltima,
      capacidadAdmisible,
      porcentajeFriccion,
      porcentajePunta,
      infoCapas
    };
  `,
			necReference: "NEC-SE-GC, Capítulo 9.4",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["cimentación", "pilotes", "geotecnia", "NEC-SE-GC", "fundación"],
		});

		await templateRepository.save(pilotesTemplate);

		// Parámetros para capacidad de pilotes
		const pilotesParams = [
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "diametroPilote",
				description: "Diámetro del pilote",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.3,
				defaultValue: "0.6",
				unitOfMeasure: "m",
				helpText: "Diámetro del pilote",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "estratos",
				description: "Estratos del suelo",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				defaultValue: JSON.stringify([
					{
						tipo: "cohesivo",
						longitud: 5,
						resistenciaCortante: 40,
						anguloFriccion: 0,
						esfuerzoVertical: 70,
					},
					{
						tipo: "granular",
						longitud: 8,
						resistenciaCortante: 0,
						anguloFriccion: 30,
						esfuerzoVertical: 120,
					},
				]),
				helpText:
					"Información de los estratos del suelo que atraviesa el pilote",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "tipoSueloPunta",
				description: "Tipo de suelo en la punta",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				defaultValue: "granular",
				allowedValues: JSON.stringify(["cohesivo", "granular"]),
				helpText: "Tipo de suelo en la punta del pilote",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "resistenciaCortantePunta",
				description: "Resistencia al corte en punta (cohesivo)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: false,
				minValue: 0,
				defaultValue: "50",
				unitOfMeasure: "kPa",
				helpText:
					"Resistencia al corte no drenada en la punta (para suelo cohesivo)",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "anguloFriccionPunta",
				description: "Ángulo de fricción en punta (granular)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: false,
				minValue: 25,
				maxValue: 45,
				defaultValue: "35",
				unitOfMeasure: "°",
				helpText:
					"Ángulo de fricción interna en la punta (para suelo granular)",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "esfuerzoVerticalPunta",
				description: "Esfuerzo vertical efectivo en punta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 10,
				defaultValue: "200",
				unitOfMeasure: "kPa",
				helpText: "Esfuerzo vertical efectivo en la punta del pilote",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "factorSeguridad",
				description: "Factor de seguridad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 1.5,
				maxValue: 4.0,
				defaultValue: "2.5",
				helpText: "Factor de seguridad para obtener capacidad admisible",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "capacidadFriccion",
				description: "Capacidad por fricción lateral",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "kN",
				helpText: "Capacidad por fricción lateral (Qs)",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "capacidadPunta",
				description: "Capacidad por punta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "kN",
				helpText: "Capacidad por punta (Qt)",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "capacidadUltima",
				description: "Capacidad última",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "kN",
				helpText: "Capacidad última total (Qult = Qs + Qt)",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "capacidadAdmisible",
				description: "Capacidad admisible",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "kN",
				helpText: "Capacidad admisible (Qult / FS)",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "porcentajeFriccion",
				description: "Porcentaje por fricción",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "%",
				helpText: "Porcentaje de la capacidad aportada por fricción",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "porcentajePunta",
				description: "Porcentaje por punta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "%",
				helpText: "Porcentaje de la capacidad aportada por punta",
			}),
			parameterRepository.create({
				calculationTemplateId: pilotesTemplate.id,
				name: "infoCapas",
				description: "Información por capas",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				helpText: "Información detallada de capacidad por cada capa de suelo",
			}),
		];

		await parameterRepository.save(pilotesParams);

		// PLANTILLA: ASENTAMIENTO POR CONSOLIDACIÓN
		const asentamientoTemplate = templateRepository.create({
			name: "Asentamiento por Consolidación (NEC-SE-GC)",
			description:
				"Calcula el asentamiento por consolidación de suelos cohesivos según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.FOUNDATION,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
    // Cálculo del incremento de esfuerzo promedio en el estrato
    let deltaEsfuerzoPromedio;
    if (metodoCalculo === "simplificado") {
      // Método simplificado (para carga rectangular)
      const relacion_B_Z = anchoFundacion / profundidadEstrato;
      const relacion_L_Z = longitudFundacion / profundidadEstrato;
      
      // Factor de influencia aproximado (Método 2:1)
      const factorInfluencia = 1 / ((1 + 2 * (profundidadEstrato / anchoFundacion)) * (1 + 2 * (profundidadEstrato / longitudFundacion)));
      
      deltaEsfuerzoPromedio = cargaNeta * factorInfluencia;
    } else {
      // Método directo (valor proporcionado)
      deltaEsfuerzoPromedio = incrementoEsfuerzoPromedio;
    }
    
    // Cálculo del asentamiento según el tipo de consolidación
    let asentamiento = 0;
    
    if (tipoConsolidacion === "primaria") {
      // Para suelos normalmente consolidados (OCR ≈ 1)
      if (relacionSobreconsolidacion <= 1.1) {
        // Asentamiento por consolidación primaria
        asentamiento = (indiceCompresion * espesorEstrato) / (1 + relacionVaciosInicial) * 
                     Math.log10((esfuerzoEfectivoInicial + deltaEsfuerzoPromedio) / esfuerzoEfectivoInicial);
      } else {
        // Para suelos sobreconsolidados
        const esfuerzoPreconsolidacion = esfuerzoEfectivoInicial * relacionSobreconsolidacion;
        
        if (esfuerzoEfectivoInicial + deltaEsfuerzoPromedio <= esfuerzoPreconsolidacion) {
          // Si no supera la presión de preconsolidación
          asentamiento = (indiceRecompresion * espesorEstrato) / (1 + relacionVaciosInicial) * 
                       Math.log10((esfuerzoEfectivoInicial + deltaEsfuerzoPromedio) / esfuerzoEfectivoInicial);
        } else {
          // Si supera la presión de preconsolidación
          const asentamiento1 = (indiceRecompresion * espesorEstrato) / (1 + relacionVaciosInicial) * 
                             Math.log10(esfuerzoPreconsolidacion / esfuerzoEfectivoInicial);
                             
          const asentamiento2 = (indiceCompresion * espesorEstrato) / (1 + relacionVaciosInicial) * 
                             Math.log10((esfuerzoEfectivoInicial + deltaEsfuerzoPromedio) / esfuerzoPreconsolidacion);
                             
          asentamiento = asentamiento1 + asentamiento2;
        }
      }
    } else {
      // Para consolidación secundaria
      const tiempo = 50 * 365 * 24 * 60 * 60; // 50 años en segundos
      const tiempoReferencia = tiempoConsolidacionPrimaria * 24 * 60 * 60; // días a segundos
      
      asentamiento = indiceCompresionSecundaria * espesorEstrato * Math.log10(tiempo / tiempoReferencia);
    }
    
    // Conversión a centímetros
    const asentamientoCm = asentamiento * 100;
    
    // Evaluación según límites
    let evaluacion = "";
    if (asentamientoCm < 2.5) {
      evaluacion = "Asentamiento despreciable";
    } else if (asentamientoCm < 5) {
      evaluacion = "Asentamiento tolerable para estructuras convencionales";
    } else if (asentamientoCm < 10) {
      evaluacion = "Asentamiento significativo - requiere consideración especial";
    } else {
      evaluacion = "Asentamiento excesivo - requiere medidas de mitigación";
    }
    
    return {
      incrementoEsfuerzoCalculado: deltaEsfuerzoPromedio,
      asentamientoMetros: asentamiento,
      asentamientoCentimetros: asentamientoCm,
      evaluacion
    };
  `,
			necReference: "NEC-SE-GC, Capítulo 5.9",
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
				"geotecnia",
				"asentamiento",
				"consolidación",
				"NEC-SE-GC",
				"suelos cohesivos",
			],
		});

		await templateRepository.save(asentamientoTemplate);

		// Parámetros para asentamiento por consolidación
		const asentamientoParams = [
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "metodoCalculo",
				description: "Método de cálculo",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				defaultValue: "simplificado",
				allowedValues: JSON.stringify(["simplificado", "directo"]),
				helpText: "Método para calcular el incremento de esfuerzo",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "anchoFundacion",
				description: "Ancho de la fundación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: false,
				minValue: 0.5,
				defaultValue: "3.0",
				unitOfMeasure: "m",
				helpText: "Ancho de la fundación (para método simplificado)",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "longitudFundacion",
				description: "Longitud de la fundación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: false,
				minValue: 0.5,
				defaultValue: "3.0",
				unitOfMeasure: "m",
				helpText: "Longitud de la fundación (para método simplificado)",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "cargaNeta",
				description: "Carga neta aplicada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: false,
				minValue: 10,
				defaultValue: "100",
				unitOfMeasure: "kPa",
				helpText: "Carga neta aplicada (para método simplificado)",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "incrementoEsfuerzoPromedio",
				description: "Incremento de esfuerzo promedio",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: false,
				minValue: 10,
				defaultValue: "80",
				unitOfMeasure: "kPa",
				helpText:
					"Incremento de esfuerzo promedio en el estrato (para método directo)",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "profundidadEstrato",
				description: "Profundidad al centro del estrato",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0.5,
				defaultValue: "5.0",
				unitOfMeasure: "m",
				helpText: "Profundidad al centro del estrato compresible",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "tipoConsolidacion",
				description: "Tipo de consolidación",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				defaultValue: "primaria",
				allowedValues: JSON.stringify(["primaria", "secundaria"]),
				helpText: "Tipo de consolidación a considerar",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "espesorEstrato",
				description: "Espesor del estrato compresible",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 0.5,
				defaultValue: "3.0",
				unitOfMeasure: "m",
				helpText: "Espesor del estrato compresible",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "relacionVaciosInicial",
				description: "Relación de vacíos inicial",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 0.3,
				maxValue: 2.0,
				defaultValue: "0.8",
				helpText: "Relación de vacíos inicial del suelo",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "esfuerzoEfectivoInicial",
				description: "Esfuerzo efectivo inicial",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 10,
				defaultValue: "100",
				unitOfMeasure: "kPa",
				helpText: "Esfuerzo efectivo inicial en el centro del estrato",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "relacionSobreconsolidacion",
				description: "Relación de sobreconsolidación (OCR)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 11,
				isRequired: true,
				minValue: 1.0,
				defaultValue: "1.0",
				helpText: "Relación de sobreconsolidación (OCR)",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "indiceCompresion",
				description: "Índice de compresión (Cc)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 12,
				isRequired: true,
				minValue: 0.05,
				maxValue: 1.0,
				defaultValue: "0.3",
				helpText: "Índice de compresión del suelo (Cc)",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "indiceRecompresion",
				description: "Índice de recompresión (Cr)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 13,
				isRequired: true,
				minValue: 0.01,
				maxValue: 0.5,
				defaultValue: "0.05",
				helpText: "Índice de recompresión del suelo (Cr)",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "indiceCompresionSecundaria",
				description: "Índice de compresión secundaria (Cα)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 14,
				isRequired: false,
				minValue: 0.001,
				maxValue: 0.1,
				defaultValue: "0.02",
				helpText:
					"Índice de compresión secundaria (para consolidación secundaria)",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "tiempoConsolidacionPrimaria",
				description: "Tiempo de consolidación primaria",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 15,
				isRequired: false,
				minValue: 1,
				defaultValue: "365",
				unitOfMeasure: "días",
				helpText:
					"Tiempo para completar la consolidación primaria (para consolidación secundaria)",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "incrementoEsfuerzoCalculado",
				description: "Incremento de esfuerzo calculado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "kPa",
				helpText: "Incremento de esfuerzo promedio calculado",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "asentamientoMetros",
				description: "Asentamiento calculado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "m",
				helpText: "Asentamiento calculado en metros",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "asentamientoCentimetros",
				description: "Asentamiento calculado (cm)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
				unitOfMeasure: "cm",
				helpText: "Asentamiento calculado en centímetros",
			}),
			parameterRepository.create({
				calculationTemplateId: asentamientoTemplate.id,
				name: "evaluacion",
				description: "Evaluación del asentamiento",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 19,
				helpText: "Evaluación cualitativa del asentamiento calculado",
			}),
		];

		// PLANTILLA: CORRECCIÓN DE ENSAYO SPT
		const correccionSPTTemplate = templateRepository.create({
			name: "Corrección de Ensayo SPT (NEC-SE-GC)",
			description:
				"Calcula la corrección del número de golpes del ensayo SPT según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.FOUNDATION,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
    // Factor de corrección por energía (CE)
    let CE;
    switch(tipoMartillo) {
      case "seguridad":
        CE = 0.75; // Martillo de seguridad (donut)
        break;
      case "automatico":
        CE = 1.0; // Martillo automático
        break;
      default:
        CE = 0.6; // Martillo manual tipo donut
    }
    
    // Factor de corrección por longitud de barras (CR)
    let CR;
    if (longitudBarras < 3) {
      CR = 0.75;
    } else if (longitudBarras < 4) {
      CR = 0.8;
    } else if (longitudBarras < 6) {
      CR = 0.85;
    } else if (longitudBarras < 10) {
      CR = 0.95;
    } else {
      CR = 1.0;
    }
    
    // Factor de corrección por diámetro de perforación (CB)
    let CB;
    if (diametroPerforacion <= 115) {
      CB = 1.0;
    } else if (diametroPerforacion < 150) {
      CB = 1.05;
    } else {
      CB = 1.15;
    }
    
    // Factor de corrección por toma de muestras (CS)
    let CS;
    if (usaMuestreador) {
      CS = 1.0; // Muestreador estándar
    } else {
      CS = 1.2; // Sin muestreador (liner)
    }
    
    // Valor N₆₀ corregido
    const N60 = Ncampo * CE * CR * CB * CS;
    
    // Corrección adicional por sobrecarga (sólo para suelos granulares)
    let N60corregido = N60;
    
    if (tipoSuelo === "granular") {
      // Factor de corrección por sobrecarga (CN)
      const esfuerzoReferencia = 100; // kPa (presión de referencia)
      const CN = Math.min(Math.sqrt(esfuerzoReferencia / esfuerzoVertical), 2.0);
      
      // Valor corregido por sobrecarga (N₁)₆₀
      N60corregido = N60 * CN;
    }
    
    // Interpretación de la densidad relativa (para suelos granulares)
    let interpretacion = "";
    
    if (tipoSuelo === "granular") {
      if (N60corregido < 4) {
        interpretacion = "Muy suelta";
      } else if (N60corregido < 10) {
        interpretacion = "Suelta";
      } else if (N60corregido < 30) {
        interpretacion = "Medianamente densa";
      } else if (N60corregido < 50) {
        interpretacion = "Densa";
      } else {
        interpretacion = "Muy densa";
      }
    } else {
      // Interpretación para suelos cohesivos
      if (N60 < 2) {
        interpretacion = "Muy blanda";
      } else if (N60 < 4) {
        interpretacion = "Blanda";
      } else if (N60 < 8) {
        interpretacion = "Medianamente firme";
      } else if (N60 < 15) {
        interpretacion = "Firme";
      } else if (N60 < 30) {
        interpretacion = "Muy firme";
      } else {
        interpretacion = "Dura";
      }
    }
    
    return {
      factorEnergía: CE,
      factorLongitud: CR,
      factorDiámetro: CB,
      factorMuestreador: CS,
      N60: N60,
      N60corregido: N60corregido,
      interpretacion
    };
  `,
			necReference: "NEC-SE-GC, Capítulo 3.5",
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
				"geotecnia",
				"SPT",
				"corrección",
				"NEC-SE-GC",
				"ensayo",
				"número de golpes",
			],
		});

		await templateRepository.save(correccionSPTTemplate);

		// Parámetros para corrección SPT
		const correccionSPTParams = [
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "Ncampo",
				description: "Número de golpes en campo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1,
				defaultValue: "15",
				helpText: "Número de golpes obtenido en campo",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "tipoMartillo",
				description: "Tipo de martillo",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				defaultValue: "seguridad",
				allowedValues: JSON.stringify(["manual", "seguridad", "automatico"]),
				helpText: "Tipo de martillo utilizado en el ensayo",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "longitudBarras",
				description: "Longitud de barras",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 1,
				defaultValue: "6",
				unitOfMeasure: "m",
				helpText: "Longitud total de las barras utilizadas",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "diametroPerforacion",
				description: "Diámetro de perforación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 60,
				defaultValue: "100",
				unitOfMeasure: "mm",
				helpText: "Diámetro de la perforación",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "usaMuestreador",
				description: "¿Usa muestreador estándar?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				defaultValue: "true",
				helpText: "Indica si se utiliza muestreador estándar",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "tipoSuelo",
				description: "Tipo de suelo",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				defaultValue: "granular",
				allowedValues: JSON.stringify(["granular", "cohesivo"]),
				helpText: "Tipo principal de suelo en el ensayo",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "esfuerzoVertical",
				description: "Esfuerzo vertical efectivo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 10,
				defaultValue: "80",
				unitOfMeasure: "kPa",
				helpText: "Esfuerzo vertical efectivo en el punto de ensayo",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "factorEnergía",
				description: "Factor de energía (CE)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				helpText: "Factor de corrección por energía",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "factorLongitud",
				description: "Factor de longitud (CR)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				helpText: "Factor de corrección por longitud de barras",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "factorDiámetro",
				description: "Factor de diámetro (CB)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				helpText: "Factor de corrección por diámetro de perforación",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "factorMuestreador",
				description: "Factor de muestreador (CS)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				helpText: "Factor de corrección por muestreador",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "N60",
				description: "N₆₀ corregido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				helpText: "Número de golpes corregido al 60% de energía",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "N60corregido",
				description: "(N₁)₆₀ corregido por sobrecarga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				helpText: "Número de golpes corregido por energía y sobrecarga",
			}),
			parameterRepository.create({
				calculationTemplateId: correccionSPTTemplate.id,
				name: "interpretacion",
				description: "Interpretación del suelo",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				helpText: "Interpretación cualitativa del resultado",
			}),
		];

		await parameterRepository.save(correccionSPTParams);

		await parameterRepository.save(asentamientoParams);

		await parameterRepository.save(capacidadPortanteParams);

		await parameterRepository.save(zapataParams);

		console.log("Plantillas de cálculo de cimentaciones creadas exitosamente");
	} catch (error) {
		console.error(
			"Error al crear plantillas de cálculo de cimentaciones:",
			error
		);
	} finally {
		await connection.destroy();
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedGeotecniaCimentacionesTemplates()
		.then(() =>
			console.log("Seeding de plantillas de cimentaciones completado")
		)
		.catch((error) =>
			console.error("Error en seeding de cimentaciones:", error)
		);
}
