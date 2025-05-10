// src/infrastructure/database/seeds/nec-seeds/structural-templates.ts
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
 * Semillas para plantillas de cálculo estructural según NEC-SE-HM y NEC-SE-AC
 */
export async function seedStructuralTemplates() {
	const connection = await AppDataSource.initialize();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	// Verificar si ya existen plantillas (evitar duplicados)
	const existingCount = await templateRepository.count({
		where: [{necReference: "NEC-SE-HM"}, {necReference: "NEC-SE-AC"}],
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de cálculo estructural. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla 1: Diseño de Viga de Hormigón Armado
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

		await parameterRepository.save(hormigonVigaParams);

		// Plantilla 2: Diseño de Columna de Acero
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

		await parameterRepository.save(aceroColumnaParams);

		console.log("Plantillas de cálculo estructural creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de cálculo estructural:", error);
	} finally {
		await connection.destroy();
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedStructuralTemplates()
		.then(() => console.log("Seeding de plantillas estructurales completado"))
		.catch((error) => console.error("Error en seeding estructural:", error));
}
