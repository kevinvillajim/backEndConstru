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
export async function seedEstructurasAceroTemplates() {
	const connection = await AppDataSource.initialize();
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

		await parameterRepository.save(aceroColumnaParams);

		console.log("Plantillas de cálculo de acero creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de cálculo de acero:", error);
	} finally {
		await connection.destroy();
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedEstructurasAceroTemplates()
		.then(() => console.log("Seeding de plantillas de acero completado"))
		.catch((error) => console.error("Error en seeding de acero:", error));
}
