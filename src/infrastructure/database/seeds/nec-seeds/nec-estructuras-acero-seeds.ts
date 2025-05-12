// src/infrastructure/database/seeds/nec-seeds/nec-estructuras-acero-seeds.ts
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
 * Semillas para plantillas de cálculo de estructuras de acero según NEC-SE-AC
 */
export async function seedEstructurasAceroTemplates(connection = null) {
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
		where: [{necReference: "NEC-SE-AC"}],
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de cálculo de acero. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla: Diseño de Columna de Acero
		const aceroColumnaTemplate = templateRepository.create({
			name: "Diseño de Columna de Acero",
			description:
				"Verifica la capacidad de una columna de acero según NEC-SE-AC.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Propiedades geométricas
        const I = (b * Math.pow(h, 3)) / 12; // Momento de inercia
        const r = Math.sqrt(I / A); // Radio de giro
        
        // Relación de esbeltez
        const KL_r = K * L * 1000 / r; // convertir L a mm
        
        // Esfuerzos según AISC 360-16
        const Fe = Math.pow(Math.PI, 2) * E / Math.pow(KL_r, 2);
        let Fcr;
        
        if (KL_r <= 4.71 * Math.sqrt(E / Fy)) {
          // Pandeo inelástico
          Fcr = (0.658 * Fy / Fe) * Fy;
        } else {
          // Pandeo elástico
          Fcr = 0.877 * Fe;
        }
        
        // Resistencia nominal
        const Pn = Fcr * A;
        const phi_Pn = phi_c * Pn / 1000; // kN
        
        // Verificación de capacidad
        const ratio = Pu / phi_Pn;
        const cumple = ratio <= 1.0;
        
        return {
          radio_giro: r,
          relacion_esbeltez: KL_r,
          esfuerzo_critico: Fcr,
          resistencia_nominal: Pn / 1000, // kN
          resistencia_diseno: phi_Pn, // kN
          ratio_demanda_capacidad: ratio,
          cumple_resistencia: cumple
        };
      `,
			necReference: "NEC-SE-AC, Capítulo 5.3",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["acero", "columna", "estructural", "NEC-SE-AC", "pandeo"],
		});

		await templateRepository.save(aceroColumnaTemplate);

		// Parámetros para plantilla de Columna de Acero
		const aceroColumnaParams = [
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "perfil",
				description: "Tipo de perfil",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				defaultValue: "I",
				allowedValues: JSON.stringify(["I", "H", "Cajón", "Tubo"]),
				helpText: "Seleccione la forma del perfil de acero",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "b",
				description: "Ancho del perfil",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 50,
				defaultValue: "200",
				unitOfMeasure: "mm",
				helpText: "Ancho total del perfil de acero",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "h",
				description: "Altura del perfil",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 50,
				defaultValue: "200",
				unitOfMeasure: "mm",
				helpText: "Altura total del perfil de acero",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "A",
				description: "Área de la sección transversal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 500,
				defaultValue: "5000",
				unitOfMeasure: "mm²",
				helpText: "Área total de la sección transversal del perfil",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "Fy",
				description: "Esfuerzo de fluencia",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 200,
				maxValue: 500,
				defaultValue: "345",
				unitOfMeasure: "MPa",
				helpText:
					"Esfuerzo de fluencia del acero (A36=250MPa, A572Gr50=345MPa)",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "E",
				description: "Módulo de elasticidad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 190000,
				maxValue: 210000,
				defaultValue: "200000",
				unitOfMeasure: "MPa",
				helpText: "Módulo de elasticidad del acero (aprox. 200000 MPa)",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "L",
				description: "Longitud no arriostrada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 0.5,
				defaultValue: "3.5",
				unitOfMeasure: "m",
				helpText: "Longitud entre puntos de arriostramiento lateral",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "K",
				description: "Factor de longitud efectiva",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 0.5,
				maxValue: 2.0,
				defaultValue: "1.0",
				helpText:
					"Factor K según condiciones de apoyo (empotrado-empotrado=0.5, articulado-articulado=1.0)",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "phi_c",
				description: "Factor de resistencia a compresión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 0.85,
				maxValue: 0.95,
				defaultValue: "0.9",
				helpText: "Factor de resistencia para compresión (LRFD=0.9)",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "Pu",
				description: "Carga axial última",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 10,
				defaultValue: "500",
				unitOfMeasure: "kN",
				helpText: "Carga axial de diseño aplicada en la columna",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "radio_giro",
				description: "Radio de giro",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "relacion_esbeltez",
				description: "Relación de esbeltez KL/r",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "esfuerzo_critico",
				description: "Esfuerzo crítico de pandeo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "resistencia_nominal",
				description: "Resistencia nominal a compresión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "resistencia_diseno",
				description: "Resistencia de diseño a compresión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "ratio_demanda_capacidad",
				description: "Ratio de demanda/capacidad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroColumnaTemplate.id,
				name: "cumple_resistencia",
				description: "¿Cumple con resistencia requerida?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
			}),
		];

		// PLANTILLA: DISEÑO DE VIGA DE ACERO
		const aceroVigaTemplate = templateRepository.create({
			name: "Diseño de Viga de Acero (NEC-SE-AC)",
			description:
				"Calcula la capacidad a flexión y verifica requisitos sismorresistentes para vigas de acero según NEC-SE-AC.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
    // Cálculo de propiedades geométricas
    const Iy = (tw * Math.pow(h, 3)) / 12; // Momento de inercia del alma
    const Ix = (h * Math.pow(tw, 3)) / 12 + 2 * (bf * Math.pow(tf, 3)) / 12 + 2 * bf * tf * Math.pow(h/2, 2); // Momento de inercia de la sección
    const Zx = bf * tf * h + (h - 2*tf) * tw * (h - 2*tf) / 4; // Módulo plástico aproximado
    
    // Verificación de sección compacta
    // Para elementos sísmicamente compactos según AISC 341
    const lambda_f = bf / (2 * tf); // Relación ancho-espesor de alas
    const lambda_w = h / tw; // Relación ancho-espesor del alma
    
    const lambda_ps_f = 0.3 * Math.sqrt(E / Fy); // Límite para patines
    const lambda_ps_w = 2.45 * Math.sqrt(E / Fy); // Límite para alma (Ca ≤ 0.125)
    
    const esCompactaF = lambda_f <= lambda_ps_f;
    const esCompactaW = lambda_w <= lambda_ps_w;
    const seccionCompacta = esCompactaF && esCompactaW;
    
    // Fluencia probable considerando factor de sobrerresistencia
    const Ry = tipoAcero === "A36" ? 1.3 : 
               tipoAcero === "A572Gr50" ? 1.1 : 
               tipoAcero === "A588" ? 1.15 : 1.0;
    
    const Fyp = Ry * Fy; // Fluencia probable
    
    // Resistencia a flexión nominal y de diseño
    const Mn = Fy * Zx; // Momento nominal
    const Mpr = Fyp * Zx; // Momento probable para diseño por capacidad
    const phi_Mn = phi_flexion * Mn; // Momento de diseño
    
    // Verificación de capacidad por flexión
    const ratio_flexion = Mu / phi_Mn;
    const cumpleFlexion = ratio_flexion <= 1.0;
    
    // Verificación para pórticos especiales (SMF)
    const luz_peralte = span * 1000 / h;
    const cumpleLuzPeralte = luz_peralte >= 7; // Para SMF, L/d ≥ 7
    
    // Cálculo de cortante para diseño por capacidad
    const Vu_capacity = 2 * Mpr / span; // Cortante por capacidad en kN
    
    return {
      moduloPlastico: Zx,
      momentoNominal: Mn / 1000000, // kN·m
      momentoDiseno: phi_Mn / 1000000, // kN·m
      momentoProbable: Mpr / 1000000, // kN·m
      relacionLuzPeralte: luz_peralte,
      cortanteCapacidad: Vu_capacity,
      ratioFlexion: ratio_flexion,
      factorSobrerresistencia: Ry,
      relacionPatines: lambda_f,
      relacionAlma: lambda_w,
      limitePatines: lambda_ps_f,
      limiteAlma: lambda_ps_w,
      esSeccionCompacta: seccionCompacta,
      cumpleFlexion: cumpleFlexion,
      cumpleLuzPeralte: cumpleLuzPeralte
    };
  `,
			necReference: "NEC-SE-AC, Capítulo 5.2",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["acero", "viga", "estructural", "NEC-SE-AC", "flexión"],
		});

		await templateRepository.save(aceroVigaTemplate);

		// Parámetros para plantilla de viga de acero
		const aceroVigaParams = [
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "h",
				description: "Altura total de la sección",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 100,
				defaultValue: "400",
				unitOfMeasure: "mm",
				helpText: "Altura total (peralte) de la sección",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "bf",
				description: "Ancho del patín",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 50,
				defaultValue: "200",
				unitOfMeasure: "mm",
				helpText: "Ancho del patín (ala)",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "tf",
				description: "Espesor del patín",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 5,
				defaultValue: "15",
				unitOfMeasure: "mm",
				helpText: "Espesor del patín (ala)",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "tw",
				description: "Espesor del alma",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 3,
				defaultValue: "10",
				unitOfMeasure: "mm",
				helpText: "Espesor del alma",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "Fy",
				description: "Resistencia a la fluencia",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 200,
				maxValue: 500,
				defaultValue: "250",
				unitOfMeasure: "MPa",
				helpText:
					"Resistencia a la fluencia del acero (A36=250MPa, A572Gr50=345MPa)",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "E",
				description: "Módulo de elasticidad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 190000,
				maxValue: 210000,
				defaultValue: "200000",
				unitOfMeasure: "MPa",
				helpText: "Módulo de elasticidad del acero (aprox. 200000 MPa)",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "tipoAcero",
				description: "Tipo de acero",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				defaultValue: "A36",
				allowedValues: JSON.stringify(["A36", "A572Gr50", "A588", "Otro"]),
				helpText: "Tipo de acero según ASTM",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "span",
				description: "Luz de la viga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 1,
				defaultValue: "6",
				unitOfMeasure: "m",
				helpText: "Luz libre de la viga entre apoyos",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "Mu",
				description: "Momento último de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 1,
				defaultValue: "100",
				unitOfMeasure: "kN·m",
				helpText: "Momento último de diseño",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "phi_flexion",
				description: "Factor de resistencia a flexión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 0.85,
				maxValue: 0.95,
				defaultValue: "0.9",
				helpText: "Factor de resistencia para flexión (LRFD=0.9)",
			}),
			// Parámetros de salida
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "moduloPlastico",
				description: "Módulo plástico de la sección",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "mm³",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "momentoNominal",
				description: "Momento nominal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "kN·m",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "momentoDiseno",
				description: "Momento de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "kN·m",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "momentoProbable",
				description: "Momento probable",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				unitOfMeasure: "kN·m",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "relacionLuzPeralte",
				description: "Relación luz/peralte",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "cortanteCapacidad",
				description: "Cortante por capacidad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "ratioFlexion",
				description: "Ratio demanda/capacidad flexión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "factorSobrerresistencia",
				description: "Factor de sobrerresistencia (Ry)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "relacionPatines",
				description: "Relación ancho-espesor patines",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 19,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "relacionAlma",
				description: "Relación altura-espesor alma",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 20,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "limitePatines",
				description: "Límite para patines",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 21,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "limiteAlma",
				description: "Límite para alma",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 22,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "esSeccionCompacta",
				description: "¿Es sección compacta?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 23,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "cumpleFlexion",
				description: "¿Cumple capacidad a flexión?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 24,
			}),
			parameterRepository.create({
				calculationTemplateId: aceroVigaTemplate.id,
				name: "cumpleLuzPeralte",
				description: "¿Cumple relación luz/peralte?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 25,
			}),
		];

		// PLANTILLA: DISEÑO DE CONEXIONES VSR Y ANÁLISIS DE COLUMNA FUERTE-VIGA DÉBIL
		const conexionesAceroTemplate = templateRepository.create({
			name: "Diseño de Conexiones y Relación Columna-Viga (NEC-SE-AC)",
			description:
				"Analiza las conexiones viga-columna de acero y verifica la condición de columna fuerte-viga débil según NEC-SE-AC.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
    // PARTE 1: CONEXIÓN VIGA-COLUMNA (VSR)
    // Cálculo de módulo plástico reducido
    const c = distanciaCortePatines;
    const ZVSR = moduloPlastico - 2 * c * espesorPatines * (alturaViga - espesorPatines);
    
    // Verificación de límites dimensionales para cortes
    const anchoCorte = anchoPatines * factorAnchoCorte;
    const alturaCorte = alturaViga * factorAlturaCorte;
    
    // Verificar límites según normativa
    const cumpleLimiteA = factorAnchoCorte >= 0.5 && factorAnchoCorte <= 0.75;
    const cumpleLimiteB = factorAlturaCorte >= 0.65 && factorAlturaCorte <= 0.85;
    const cumpleLimiteC = distanciaCortePatines >= 0.1 * anchoPatines && distanciaCortePatines <= 0.25 * anchoPatines;
    
    const cumpleLimitesVSR = cumpleLimiteA && cumpleLimiteB && cumpleLimiteC;
    
    // Cálculo de momento probable en la rótula plástica
    const factorSobrerresistencia = tipoAcero === "A36" ? 1.3 : 
                                  tipoAcero === "A572Gr50" ? 1.1 : 
                                  tipoAcero === "A588" ? 1.15 : 1.0;
    
    // Cálculo del factor de amplificación
    const Cpr = factorAmplificacion > 0 ? 
                Math.min(factorAmplificacion, 1.2) : 
                Math.min((Fy + Fu) / (2 * Fy), 1.2);
    
    // Momento probable en la rótula
    const Mpr = Cpr * factorSobrerresistencia * Fy * ZVSR;
    
    // PARTE 2: CONDICIÓN COLUMNA FUERTE-VIGA DÉBIL
    // Cálculo de sumatorias de momentos
    const MpbIzquierdo = momentoPlasticoVigaIzquierda;
    const MpbDerecho = momentoPlasticoVigaDerecha;
    const sumaMpb = MpbIzquierdo + MpbDerecho;
    
    const MpcSuperior = momentoPlasticoColumnaSuperior;
    const MpcInferior = momentoPlasticoColumnaInferior;
    const sumaMpc = MpcSuperior + MpcInferior;
    
    // Relación columna fuerte-viga débil
    const relacionColumnasVigas = sumaMpc / sumaMpb;
    const cumpleRelacionCFVD = relacionColumnasVigas >= 1.0;
    
    return {
      moduloPlasticoReducido: ZVSR,
      factorAmplificacionCpr: Cpr,
      momentoProbableRotula: Mpr,
      relacionColumnasVigas,
      cumpleLimitesVSR,
      cumpleRelacionCFVD
    };
  `,
			necReference: "NEC-SE-AC, Capítulo 5.4",
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
				"acero",
				"conexiones",
				"columna fuerte-viga débil",
				"VSR",
				"NEC-SE-AC",
			],
		});

		await templateRepository.save(conexionesAceroTemplate);

		// Parámetros para conexiones de acero
		const conexionesAceroParams = [
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "moduloPlastico",
				description: "Módulo plástico de la viga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 100000,
				defaultValue: "2000000",
				unitOfMeasure: "mm³",
				helpText: "Módulo plástico original de la sección de la viga",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "alturaViga",
				description: "Altura total de la viga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 100,
				defaultValue: "400",
				unitOfMeasure: "mm",
				helpText: "Altura total (peralte) de la viga",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "anchoPatines",
				description: "Ancho de los patines",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 50,
				defaultValue: "200",
				unitOfMeasure: "mm",
				helpText: "Ancho del patín (ala) de la viga",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "espesorPatines",
				description: "Espesor de los patines",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 5,
				defaultValue: "15",
				unitOfMeasure: "mm",
				helpText: "Espesor del patín (ala) de la viga",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "factorAnchoCorte",
				description: "Factor de ancho de corte (a/bf)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0.5,
				maxValue: 0.75,
				defaultValue: "0.6",
				helpText:
					"Relación entre ancho de corte y ancho del patín (0.5 ≤ a/bf ≤ 0.75)",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "factorAlturaCorte",
				description: "Factor de altura de corte (b/d)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0.65,
				maxValue: 0.85,
				defaultValue: "0.75",
				helpText:
					"Relación entre altura de corte y altura de viga (0.65 ≤ b/d ≤ 0.85)",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "distanciaCortePatines",
				description: "Distancia de corte en patines (c)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 5,
				defaultValue: "30",
				unitOfMeasure: "mm",
				helpText: "Distancia de corte en patines (0.1bf ≤ c ≤ 0.25bf)",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "tipoAcero",
				description: "Tipo de acero",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				defaultValue: "A36",
				allowedValues: JSON.stringify(["A36", "A572Gr50", "A588", "Otro"]),
				helpText: "Tipo de acero según ASTM",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "Fy",
				description: "Esfuerzo de fluencia",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 200,
				maxValue: 500,
				defaultValue: "250",
				unitOfMeasure: "MPa",
				helpText:
					"Esfuerzo de fluencia del acero (A36=250MPa, A572Gr50=345MPa)",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "Fu",
				description: "Resistencia última",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 400,
				maxValue: 700,
				defaultValue: "400",
				unitOfMeasure: "MPa",
				helpText: "Resistencia última del acero (A36=400MPa, A572Gr50=450MPa)",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "factorAmplificacion",
				description: "Factor de amplificación (Cpr)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 11,
				isRequired: false,
				minValue: 0,
				maxValue: 1.2,
				defaultValue: "0",
				helpText: "Factor de amplificación (0 para calcular automáticamente)",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "momentoPlasticoVigaIzquierda",
				description: "Momento plástico viga izquierda",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 12,
				isRequired: true,
				minValue: 0,
				defaultValue: "200",
				unitOfMeasure: "kN·m",
				helpText: "Momento plástico de la viga del lado izquierdo",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "momentoPlasticoVigaDerecha",
				description: "Momento plástico viga derecha",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 13,
				isRequired: true,
				minValue: 0,
				defaultValue: "200",
				unitOfMeasure: "kN·m",
				helpText: "Momento plástico de la viga del lado derecho",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "momentoPlasticoColumnaSuperior",
				description: "Momento plástico columna superior",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 14,
				isRequired: true,
				minValue: 0,
				defaultValue: "300",
				unitOfMeasure: "kN·m",
				helpText: "Momento plástico de la columna superior",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "momentoPlasticoColumnaInferior",
				description: "Momento plástico columna inferior",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 15,
				isRequired: true,
				minValue: 0,
				defaultValue: "300",
				unitOfMeasure: "kN·m",
				helpText: "Momento plástico de la columna inferior",
			}),
			// Parámetros de salida
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "moduloPlasticoReducido",
				description: "Módulo plástico reducido (ZVSR)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "mm³",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "factorAmplificacionCpr",
				description: "Factor de amplificación (Cpr)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "momentoProbableRotula",
				description: "Momento probable en rótula",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
				unitOfMeasure: "kN·m",
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "relacionColumnasVigas",
				description: "Relación columna fuerte-viga débil",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 19,
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "cumpleLimitesVSR",
				description: "¿Cumple límites de conexión VSR?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 20,
			}),
			parameterRepository.create({
				calculationTemplateId: conexionesAceroTemplate.id,
				name: "cumpleRelacionCFVD",
				description: "¿Cumple relación columna fuerte-viga débil?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 21,
			}),
		];

		await parameterRepository.save(conexionesAceroParams);

		await parameterRepository.save(aceroVigaParams);

		await parameterRepository.save(aceroColumnaParams);

		console.log("Plantillas de cálculo de acero creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de cálculo de acero:", error);
	} finally {
		if (shouldCloseConnection) {
			await connection.destroy();
		}
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedEstructurasAceroTemplates()
		.then(() => console.log("Seeding de plantillas de acero completado"))
		.catch((error) => console.error("Error en seeding de acero:", error));
}
