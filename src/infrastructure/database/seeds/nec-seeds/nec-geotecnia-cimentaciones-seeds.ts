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
