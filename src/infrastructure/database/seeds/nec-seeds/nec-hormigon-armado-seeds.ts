// src/infrastructure/database/seeds/nec-seeds/nec-hormigon-armado-seeds.ts
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
 * Semillas para plantillas de cálculo de hormigón armado según NEC-SE-HM
 */
export async function seedHormigonArmadoTemplates(connection = null) {
	// Determinamos si necesitamos administrar la conexión nosotros mismos
	const shouldCloseConnection = !connection;

	// Si no se proporcionó una conexión, creamos una nueva
	if (!connection) {
		connection = await AppDataSource.initialize();
	}
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	// Verificar si ya existen plantillas (evitar duplicados)
	const existingCount = await templateRepository.count({
		where: [{necReference: "NEC-SE-HM"}],
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de cálculo de hormigón armado. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla: Diseño de Viga de Hormigón Armado
		const hormigonVigaTemplate = templateRepository.create({
			name: "Diseño de Viga de Hormigón Armado",
			description:
				"Calcula el refuerzo a flexión y cortante para vigas de hormigón armado según NEC-SE-HM.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo de momento último (si no se proporciona)
        const wu = (1.2 * D) + (1.6 * L);
        const Mu = Mu_input > 0 ? Mu_input : (wu * Math.pow(span, 2) / 8) * 1000000; // N·mm
        
        // Cálculo del área de acero requerida para flexión
        const d = h - recubrimiento;
        const Ru = Mu / (phi_flexion * b * Math.pow(d, 2));
        const rho = (0.85 * fc / fy) * (1 - Math.sqrt(1 - (2 * Ru / (0.85 * fc))));
        const As = rho * b * d;
        
        // Verificación de acero mínimo
        const As_min1 = (1.4 / fy) * b * d;
        const As_min2 = (0.3 * Math.sqrt(fc) / fy) * b * d;
        const As_min = Math.max(As_min1, As_min2);
        
        // Verificación de acero máximo
        const rho_balanced = (0.85 * beta1 * fc / fy) * (600 / (600 + fy));
        const rho_max = 0.5 * rho_balanced;
        const As_max = rho_max * b * d;
        
        // Acero final
        const As_final = Math.min(Math.max(As, As_min), As_max);
        
        // Cálculo de cortante
        let Vu;
        if (Vu_input > 0) {
          Vu = Vu_input;
        } else {
          // Cortante en extremos
          Vu = (wu * span / 2) * 1000; // N
        }
        
        const Vc = 0.17 * Math.sqrt(fc) * b * d;
        const Vs = Vu / phi_cortante - Vc;
        
        // Separación de estribos requerida
        let s = 0;
        if (Vs <= 0) {
          // Solo se requiere refuerzo mínimo
          s = d / 2;
        } else {
          // Calcular separación requerida
          s = (Av * fy * d) / Vs;
        }
        
        // Verificar límites de separación
        const s_max_min = Math.min(d / 4, 300);
        const s_max_center = Math.min(d / 2, 300);
        
        return {
          momento_ultimo: Mu / 1000000, // kN·m
          area_acero: As_final,
          acero_minimo: As_min,
          acero_maximo: As_max,
          cortante_ultimo: Vu / 1000, // kN
          resistencia_cortante_concreto: Vc / 1000, // kN
          resistencia_cortante_estribos: Vs / 1000, // kN
          separacion_estribos_extremos: Math.min(s, s_max_min),
          separacion_estribos_centro: Math.min(s, s_max_center)
        };
      `,
			necReference: "NEC-SE-HM, Capítulo 4.2",
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
				"hormigón",
				"viga",
				"estructural",
				"NEC-SE-HM",
				"flexión",
				"cortante",
			],
		});

		await templateRepository.save(hormigonVigaTemplate);

		// Parámetros para plantilla de Viga de Hormigón
		const hormigonVigaParams = [
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "b",
				description: "Ancho de la viga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 200,
				defaultValue: "300",
				unitOfMeasure: "mm",
				helpText: "Ancho mínimo 250mm para elementos sísmicos primarios",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "h",
				description: "Altura de la viga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 300,
				defaultValue: "500",
				unitOfMeasure: "mm",
				helpText: "Altura total de la viga",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "recubrimiento",
				description: "Recubrimiento al refuerzo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 20,
				maxValue: 100,
				defaultValue: "50",
				unitOfMeasure: "mm",
				helpText:
					"Distancia desde la cara externa hasta el centro del refuerzo",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "fc",
				description: "Resistencia del hormigón",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 21,
				maxValue: 50,
				defaultValue: "25",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a compresión del hormigón (f'c)",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "fy",
				description: "Resistencia del acero",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 400,
				maxValue: 550,
				defaultValue: "420",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a fluencia del acero de refuerzo",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "beta1",
				description: "Factor beta1 según f'c",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0.65,
				maxValue: 0.85,
				defaultValue: "0.85",
				helpText: "0.85 para f'c≤28MPa, 0.85-0.05(f'c-28)/7 para f'c>28MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "phi_flexion",
				description: "Factor de reducción para flexión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 0.65,
				maxValue: 0.9,
				defaultValue: "0.9",
				helpText: "Factor Ø=0.9 para flexión, Ø=0.75 para cortante",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "phi_cortante",
				description: "Factor de reducción para cortante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 0.65,
				maxValue: 0.9,
				defaultValue: "0.75",
				helpText: "Factor Ø=0.9 para flexión, Ø=0.75 para cortante",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "Mu_input",
				description: "Momento último (opcional)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: false,
				minValue: 0,
				defaultValue: "0",
				unitOfMeasure: "kN·m",
				helpText: "Si conoce el momento de diseño, ingréselo aquí",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "Vu_input",
				description: "Cortante último (opcional)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: false,
				minValue: 0,
				defaultValue: "0",
				unitOfMeasure: "kN",
				helpText: "Si conoce el cortante de diseño, ingréselo aquí",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "span",
				description: "Luz libre de la viga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 11,
				isRequired: true,
				minValue: 1,
				defaultValue: "5",
				unitOfMeasure: "m",
				helpText: "Luz libre entre apoyos de la viga",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "D",
				description: "Carga muerta distribuida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 12,
				isRequired: true,
				minValue: 0,
				defaultValue: "10",
				unitOfMeasure: "kN/m",
				helpText: "Carga muerta distribuida sobre la viga",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "L",
				description: "Carga viva distribuida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 13,
				isRequired: true,
				minValue: 0,
				defaultValue: "10",
				unitOfMeasure: "kN/m",
				helpText: "Carga viva distribuida sobre la viga",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "Av",
				description: "Área de estribos (2 ramas)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 14,
				isRequired: true,
				minValue: 50,
				defaultValue: "100",
				unitOfMeasure: "mm²",
				helpText:
					"Área transversal de ambas ramas del estribo (Ej: 2×50mm² para Ø8mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "momento_ultimo",
				description: "Momento último de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "kN·m",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "area_acero",
				description: "Área de acero requerida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "acero_minimo",
				description: "Área de acero mínima",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "acero_maximo",
				description: "Área de acero máxima",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "cortante_ultimo",
				description: "Cortante último de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 19,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "resistencia_cortante_concreto",
				description: "Resistencia a cortante del hormigón",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 20,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "resistencia_cortante_estribos",
				description: "Resistencia a cortante requerida de estribos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 21,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "separacion_estribos_extremos",
				description: "Separación de estribos en extremos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 22,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonVigaTemplate.id,
				name: "separacion_estribos_centro",
				description: "Separación de estribos en centro de viga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 23,
				unitOfMeasure: "mm",
			}),
		];

		const hormigonColumnaTemplate = templateRepository.create({
			name: "Diseño de Columna de Hormigón Armado (NEC-SE-HM)",
			description:
				"Verifica y dimensiona columnas de hormigón armado según las normativas NEC-SE-HM.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
    // Verificación de dimensiones mínimas
    const dimensionMinima = esZonaSismica ? 300 : 250; // mm
    const cumpleDimensionMinima = b >= dimensionMinima && h >= dimensionMinima;
    
    // Área de la sección transversal
    const Ag = b * h;
    
    // Cálculo del área de acero
    const cuantiaMinima = 0.01;
    const cuantiaMaxima = 0.03;
    const As_min = cuantiaMinima * Ag;
    const As_max = cuantiaMaxima * Ag;
    
    // Verificación del acero propuesto
    const ρ = As / Ag;
    const cumpleAceroLongitudinal = ρ >= cuantiaMinima && ρ <= cuantiaMaxima;
    
    // Resistencia a compresión de la columna
    const phi = 0.65; // Factor de reducción para elementos en compresión
    const Pn = 0.80 * (0.85 * fc * (Ag - As) + As * fy);
    const Pu_max = phi * Pn;
    const cumpleResistencia = Pu <= Pu_max;
    
    // Longitud de confinamiento (zona crítica)
    const Lo_1 = Math.max(h, b); // Mayor dimensión de la sección
    const Lo_2 = ln / 6; // Sexto de la altura libre
    const Lo_3 = 450; // mm
    const Lo = Math.max(Lo_1, Lo_2, Lo_3);
    
    // Espaciamiento de estribos en zona confinada
    const s_1 = 6 * db_long; // Seis veces el diámetro del refuerzo longitudinal
    const s_2 = Math.min(b, h) / 4; // Cuarta parte de la dimensión más pequeña
    const s_3 = 100; // mm
    const s_confinada = Math.min(s_1, s_2, s_3);
    
    // Espaciamiento de estribos en zona no confinada
    const s_no_confinada = Math.min(6 * db_long, 150);
    
    // Cálculo del área de refuerzo transversal necesario
    // Para confinamiento según diseño sismorresistente
    const bc = b - 2 * recubrimiento - db_estribo; // Dimensión núcleo confinado
    const hc = h - 2 * recubrimiento - db_estribo;
    const Ach = bc * hc; // Área del núcleo confinado
    
    // Cálculo del área de estribos necesaria según NEC-SE-HM
    const Ash_1 = 0.3 * s_confinada * bc * fc * (Ag / Ach - 1) / fy_estribo;
    const Ash_2 = 0.09 * s_confinada * bc * fc / fy_estribo;
    const Ash_req = Math.max(Ash_1, Ash_2);
    
    return {
      areaSeccion: Ag,
      areaAceroMinima: As_min,
      areaAceroMaxima: As_max,
      cuantiaActual: ρ,
      resistenciaNominal: Pn / 1000, // kN
      resistenciaDiseno: Pu_max / 1000, // kN
      longitudConfinamiento: Lo,
      espaciamientoZonaConfinada: s_confinada,
      espaciamientoZonaNoConfinada: s_no_confinada,
      areaEstriboRequerida: Ash_req,
      cumpleDimensiones: cumpleDimensionMinima,
      cumpleAcero: cumpleAceroLongitudinal,
      cumpleResistencia: cumpleResistencia
    };
  `,
			necReference: "NEC-SE-HM, Capítulo 4.3",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["hormigón", "columna", "estructural", "NEC-SE-HM", "compresión"],
		});

		await templateRepository.save(hormigonColumnaTemplate);

		// Parámetros para plantilla de columna de hormigón
		const hormigonColumnaParams = [
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "b",
				description: "Ancho de la columna",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 200,
				defaultValue: "300",
				unitOfMeasure: "mm",
				helpText: "Ancho de la sección transversal de la columna",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "h",
				description: "Altura de la columna",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 200,
				defaultValue: "300",
				unitOfMeasure: "mm",
				helpText: "Altura de la sección transversal de la columna",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "As",
				description: "Área de acero longitudinal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 200,
				defaultValue: "1600",
				unitOfMeasure: "mm²",
				helpText: "Área total de acero longitudinal",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "fc",
				description: "Resistencia del hormigón",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 21,
				maxValue: 50,
				defaultValue: "25",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a compresión del hormigón (f'c)",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "fy",
				description: "Resistencia del acero longitudinal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 400,
				maxValue: 550,
				defaultValue: "420",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a fluencia del acero longitudinal",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "fy_estribo",
				description: "Resistencia del acero transversal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 400,
				maxValue: 550,
				defaultValue: "420",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a fluencia del acero de los estribos",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "ln",
				description: "Altura libre de la columna",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 1000,
				defaultValue: "3000",
				unitOfMeasure: "mm",
				helpText: "Altura libre entre apoyos de la columna",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "Pu",
				description: "Carga axial última",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 10,
				defaultValue: "500",
				unitOfMeasure: "kN",
				helpText: "Carga axial última de diseño (mayorada)",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "esZonaSismica",
				description: "¿Es zona sísmica alta?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				defaultValue: "true",
				helpText:
					"Indica si la edificación está en zona sísmica alta (Z ≥ 0.3)",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "db_long",
				description: "Diámetro de barras longitudinales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 8,
				maxValue: 36,
				defaultValue: "16",
				unitOfMeasure: "mm",
				helpText: "Diámetro de las barras longitudinales",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "db_estribo",
				description: "Diámetro de estribos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 11,
				isRequired: true,
				minValue: 6,
				maxValue: 16,
				defaultValue: "10",
				unitOfMeasure: "mm",
				helpText: "Diámetro de los estribos de confinamiento",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "recubrimiento",
				description: "Recubrimiento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 12,
				isRequired: true,
				minValue: 20,
				maxValue: 75,
				defaultValue: "40",
				unitOfMeasure: "mm",
				helpText: "Recubrimiento libre del acero",
			}),
			// Parámetros de salida
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "areaSeccion",
				description: "Área de la sección",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "areaAceroMinima",
				description: "Área de acero mínima",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "areaAceroMaxima",
				description: "Área de acero máxima",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "cuantiaActual",
				description: "Cuantía de acero actual",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "resistenciaNominal",
				description: "Resistencia nominal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "resistenciaDiseno",
				description: "Resistencia de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "longitudConfinamiento",
				description: "Longitud de confinamiento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 19,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "espaciamientoZonaConfinada",
				description: "Espaciamiento en zona confinada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 20,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "espaciamientoZonaNoConfinada",
				description: "Espaciamiento en zona no confinada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 21,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "areaEstriboRequerida",
				description: "Área de estribo requerida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 22,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "cumpleDimensiones",
				description: "¿Cumple dimensiones mínimas?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 23,
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "cumpleAcero",
				description: "¿Cumple requisitos de acero?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 24,
			}),
			parameterRepository.create({
				calculationTemplateId: hormigonColumnaTemplate.id,
				name: "cumpleResistencia",
				description: "¿Cumple resistencia requerida?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 25,
			}),
		];

		await parameterRepository.save(hormigonColumnaParams);

		// PLANTILLA: CÁLCULO DE MÓDULO DE ELASTICIDAD DEL HORMIGÓN
		const moduloElasticidadTemplate = templateRepository.create({
			name: "Cálculo de Módulo de Elasticidad del Hormigón (NEC-SE-HM)",
			description:
				"Calcula el módulo de elasticidad del hormigón según diferentes métodos de la NEC-SE-HM.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
    // Cálculo del módulo de elasticidad del hormigón según NEC-SE-HM
    
    // Método general (para análisis sísmico, fórmula simplificada)
    const Ec_general = 4.7 * Math.sqrt(fc * 1000); // MPa
    
    // Método según ACI 318
    const wc = densidad * 9.81; // Densidad en kg/m³ convertida a N/m³
    const Ec_ACI = 0.043 * Math.pow(wc, 1.5) * Math.sqrt(fc); // MPa
    
    // Método según agregados de Ecuador
    const Ec_Ecuador = 13000 * Math.sqrt(fc / 10); // MPa
    
    // Determinar el módulo a utilizar según los criterios
    let moduloRecomendado;
    let criterioSeleccion;
    
    if (aplicacionSismica) {
      moduloRecomendado = Ec_general;
      criterioSeleccion = "Análisis sísmico (fórmula simplificada NEC)";
    } else if (agregadosNacionales) {
      moduloRecomendado = Ec_Ecuador;
      criterioSeleccion = "Agregados ecuatorianos";
    } else {
      moduloRecomendado = Ec_ACI;
      criterioSeleccion = "Método ACI 318";
    }
    
    // Reducción para análisis sísmico según elemento
    let factorReduccion = 1.0;
    let inerciaSismica = 0;
    
    switch(tipoElemento) {
      case "viga":
        factorReduccion = 0.5;
        break;
      case "columna":
        factorReduccion = 0.8;
        break;
      case "muro":
        factorReduccion = 0.6;
        break;
      default:
        factorReduccion = 1.0;
    }
    
    const moduloReducido = moduloRecomendado * factorReduccion;
    inerciaSismica = factorReduccion * 100; // Convertido a porcentaje
    
    return {
      moduloGeneral: Ec_general,
      moduloACI: Ec_ACI,
      moduloEcuador: Ec_Ecuador,
      moduloRecomendado,
      criterioSeleccion,
      factorReduccion,
      inerciaSismica,
      moduloReducido
    };
  `,
			necReference: "NEC-SE-HM, Capítulo 3.3.2",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["hormigón", "módulo elasticidad", "estructural", "NEC-SE-HM"],
		});

		await templateRepository.save(moduloElasticidadTemplate);

		// Parámetros para plantilla de módulo de elasticidad
		const moduloElasticidadParams = [
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "fc",
				description: "Resistencia del hormigón",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 21,
				maxValue: 50,
				defaultValue: "25",
				unitOfMeasure: "MPa",
				helpText: "Resistencia a compresión del hormigón (f'c)",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "densidad",
				description: "Densidad del hormigón",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1800,
				maxValue: 2800,
				defaultValue: "2400",
				unitOfMeasure: "kg/m³",
				helpText: "Densidad del hormigón",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "aplicacionSismica",
				description: "¿Para análisis sísmico?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				defaultValue: "true",
				helpText: "Indicar si es para análisis sísmico",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "agregadosNacionales",
				description: "¿Utiliza agregados nacionales?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				defaultValue: "true",
				helpText: "Indicar si utiliza agregados típicos de Ecuador",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "tipoElemento",
				description: "Tipo de elemento estructural",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				defaultValue: "viga",
				allowedValues: JSON.stringify(["viga", "columna", "muro", "otro"]),
				helpText: "Tipo de elemento para reducción de inercia sísmica",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "moduloGeneral",
				description: "Módulo de elasticidad (método general)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "moduloACI",
				description: "Módulo de elasticidad (método ACI)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "moduloEcuador",
				description: "Módulo de elasticidad (agregados Ecuador)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "moduloRecomendado",
				description: "Módulo de elasticidad recomendado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "criterioSeleccion",
				description: "Criterio de selección del módulo",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "factorReduccion",
				description: "Factor de reducción de inercia",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "inerciaSismica",
				description: "Porcentaje de inercia para análisis sísmico",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "%",
			}),
			parameterRepository.create({
				calculationTemplateId: moduloElasticidadTemplate.id,
				name: "moduloReducido",
				description: "Módulo de elasticidad reducido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "MPa",
			}),
		];

		await parameterRepository.save(moduloElasticidadParams);

		await parameterRepository.save(hormigonVigaParams);

		console.log(
			"Plantillas de cálculo de hormigón armado creadas exitosamente"
		);
	} catch (error) {
		console.error(
			"Error al crear plantillas de cálculo de hormigón armado:",
			error
		);
	} finally {
		if (shouldCloseConnection) {
			await connection.destroy();
		}
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedHormigonArmadoTemplates()
		.then(() =>
			console.log("Seeding de plantillas de hormigón armado completado")
		)
		.catch((error) => console.error("Error en seeding de hormigón:", error));
}
