// src/infrastructure/database/seeds/nec-seeds/nec-madera-seeds.ts
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
 * Semillas para plantillas de cálculo de estructuras de madera (NEC-SE-MD)
 */
export async function seedMaderaCalculations() {
	const connection = AppDataSource.getInstance();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	console.log(
		"📊 Creando plantillas para estructuras de madera (NEC-SE-MD)..."
	);

	// Verificar si ya existen plantillas con tag NEC-SE-MD
	const existingCount = await templateRepository.count({
		where: {
			tags: ["NEC-SE-MD"],
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de Estructuras de Madera. Omitiendo...`
		);
		return;
	}

	try {
		// 1. PLANTILLA: CÁLCULO DE CONTENIDO DE HUMEDAD
		const contenidoHumedadTemplate = templateRepository.create({
			name: "Contenido de Humedad de la Madera (NEC-SE-MD)",
			description:
				"Calcula el contenido de humedad en la madera para determinar su idoneidad en construcción según NEC-SE-MD.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo del contenido de humedad
        const contenidoHumedad = ((pesoVerde - pesoSeco) / pesoSeco) * 100;
        
        // Evaluación según límites de la norma
        let condicionHumedad = "";
        let esAdecuada = false;
        
        if (contenidoHumedad <= 12) {
          condicionHumedad = "Seca al aire";
          esAdecuada = true;
        } else if (contenidoHumedad <= 19) {
          condicionHumedad = "Comercialmente seca";
          esAdecuada = true;
        } else if (contenidoHumedad <= 30) {
          condicionHumedad = "Parcialmente seca";
          esAdecuada = false;
        } else {
          condicionHumedad = "Verde o húmeda";
          esAdecuada = false;
        }
        
        // Calcular cambio dimensional esperado
        let cambioEsperado = 0;
        
        if (contenidoHumedad > contenidoHumedadObjetivo) {
          const diferencia = contenidoHumedad - contenidoHumedadObjetivo;
          // Factor de contracción promedio para maderas
          const factorContraccion = coeficienteContraccion / 100;
          cambioEsperado = (diferencia / psf) * factorContraccion;
        }
        
        return {
          contenidoHumedad,
          condicionHumedad,
          esAdecuada,
          cambioEsperado,
          recomendacion: esAdecuada ? "Apta para uso estructural" : "Requiere secado adicional"
        };
      `,
			necReference: "NEC-SE-MD, Sección 5.2",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-MD", "madera", "humedad", "estructural"],
			shareLevel: "public",
		});

		await templateRepository.save(contenidoHumedadTemplate);

		// Parámetros para contenido de humedad
		const contenidoHumedadParams = [
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "pesoVerde",
				description: "Peso en estado verde o inicial",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 10,
				defaultValue: "1200",
				unitOfMeasure: "g",
				helpText: "Peso de la muestra en estado inicial",
			}),
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "pesoSeco",
				description: "Peso seco al horno",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 10,
				defaultValue: "1000",
				unitOfMeasure: "g",
				helpText: "Peso de la muestra secada al horno",
			}),
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "contenidoHumedadObjetivo",
				description: "Contenido de humedad objetivo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 8,
				maxValue: 19,
				defaultValue: "12",
				unitOfMeasure: "%",
				helpText: "Contenido de humedad deseado para la aplicación",
			}),
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "psf",
				description: "Punto de saturación de fibras",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 25,
				maxValue: 35,
				defaultValue: "30",
				unitOfMeasure: "%",
				helpText: "Punto de saturación de fibras (típicamente 30%)",
			}),
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "coeficienteContraccion",
				description: "Coeficiente de contracción total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 1,
				maxValue: 15,
				defaultValue: "7.5",
				unitOfMeasure: "%",
				helpText: "Coeficiente de contracción total del PSF al estado anhidro",
			}),
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "contenidoHumedad",
				description: "Contenido de humedad calculado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "%",
			}),
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "condicionHumedad",
				description: "Condición de humedad",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
			}),
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "esAdecuada",
				description: "¿Es adecuada para construcción?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
			}),
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "cambioEsperado",
				description: "Cambio dimensional esperado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "%",
			}),
			parameterRepository.create({
				calculationTemplateId: contenidoHumedadTemplate.id,
				name: "recomendacion",
				description: "Recomendación de uso",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
			}),
		];

		await parameterRepository.save(contenidoHumedadParams);

		// 2. PLANTILLA: CÁLCULO DE ESFUERZOS ADMISIBLES
		const esfuerzosAdmisiblesTemplate = templateRepository.create({
			name: "Esfuerzos Admisibles en Madera (NEC-SE-MD)",
			description:
				"Calcula los esfuerzos admisibles para estructuras de madera considerando factores de modificación según NEC-SE-MD.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Determinar los esfuerzos básicos según el grupo de madera
        let fbBasico, ftBasico, fcBasico, fvBasico, fpBasico, eBasico;
        
        switch(grupoMadera) {
          case "A":
            fbBasico = 23.1;
            ftBasico = 14.5;
            fcBasico = 14.5;
            fvBasico = 1.5;
            fpBasico = 4.1;
            eBasico = 13000;
            break;
          case "B":
            fbBasico = 16.5;
            ftBasico = 10.5;
            fcBasico = 11.0;
            fvBasico = 1.2;
            fpBasico = 2.8;
            eBasico = 10000;
            break;
          case "C":
            fbBasico = 11.0;
            ftBasico = 7.5;
            fcBasico = 8.0;
            fvBasico = 0.8;
            fpBasico = 2.0;
            eBasico = 9000;
            break;
          default:
            fbBasico = 0;
            ftBasico = 0;
            fcBasico = 0;
            fvBasico = 0;
            fpBasico = 0;
            eBasico = 0;
        }
        
        // Calcular los factores de modificación según condiciones
        let CD, Cm, Ct, CL, Cf, Cr, Cp, Cv;
        
        // Factor de duración de carga (CD)
        switch(duracionCarga) {
          case "permanente":
            CD = 0.9;
            break;
          case "diez_anios":
            CD = 1.0;
            break;
          case "dos_meses":
            CD = 1.15;
            break;
          case "siete_dias":
            CD = 1.25;
            break;
          case "diez_minutos":
            CD = 1.6;
            break;
          case "impacto":
            CD = 2.0;
            break;
          default:
            CD = 1.0;
        }
        
        // Factor de contenido de humedad (Cm)
        // Suponemos que es para flexión en este ejemplo
        if (contenidoHumedad <= 12) {
          Cm = 1.0;
        } else if (contenidoHumedad <= 13) {
          Cm = 0.96;
        } else if (contenidoHumedad <= 14) {
          Cm = 0.91;
        } else if (contenidoHumedad <= 15) {
          Cm = 0.87;
        } else if (contenidoHumedad <= 16) {
          Cm = 0.83;
        } else if (contenidoHumedad <= 17) {
          Cm = 0.79;
        } else if (contenidoHumedad <= 18) {
          Cm = 0.74;
        } else {
          Cm = 0.70;
        }
        
        // Factor de temperatura (Ct)
        if (temperatura <= 37) {
          Ct = 1.0;
        } else if (temperatura <= 52) {
          Ct = 0.8;
        } else if (temperatura <= 65) {
          Ct = 0.6;
        } else {
          Ct = 0.4;
        }
        
        // Simplificación para los demás factores
        CL = 1.0; // Factor de estabilidad lateral
        Cf = 1.0; // Factor de forma
        Cr = 1.0; // Factor de redistribución
        Cp = 1.0; // Factor de estabilidad de columnas
        Cv = 1.0; // Factor de cortante
        
        // Calcular los esfuerzos admisibles modificados
        const fbAdm = fbBasico * CD * Cm * Ct * CL * Cf * Cr;
        const ftAdm = ftBasico * CD * Cm * Ct;
        const fcAdm = fcBasico * CD * Cm * Ct * Cp;
        const fvAdm = fvBasico * CD * Cm * Ct * Cv;
        const fpAdm = fpBasico * CD * Cm * Ct;
        const eAdm = eBasico * Cm * Ct;
        
        return {
          fbAdm,
          ftAdm,
          fcAdm,
          fvAdm,
          fpAdm,
          eAdm,
          factorDuracionCarga: CD,
          factorHumedad: Cm,
          factorTemperatura: Ct
        };
      `,
			necReference: "NEC-SE-MD, Sección 5.5",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-MD", "madera", "esfuerzos admisibles", "estructural"],
			shareLevel: "public",
		});

		await templateRepository.save(esfuerzosAdmisiblesTemplate);

		// Parámetros para esfuerzos admisibles
		const esfuerzosAdmisiblesParams = [
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "grupoMadera",
				description: "Grupo de madera",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				defaultValue: "B",
				allowedValues: JSON.stringify(["A", "B", "C"]),
				helpText: "Grupo estructural de la madera según densidad",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "duracionCarga",
				description: "Duración de la carga",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				defaultValue: "diez_anios",
				allowedValues: JSON.stringify([
					"permanente",
					"diez_anios",
					"dos_meses",
					"siete_dias",
					"diez_minutos",
					"impacto",
				]),
				helpText: "Duración de la carga aplicada a la estructura",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "contenidoHumedad",
				description: "Contenido de humedad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 8,
				maxValue: 30,
				defaultValue: "12",
				unitOfMeasure: "%",
				helpText: "Contenido de humedad de la madera",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "temperatura",
				description: "Temperatura de servicio",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0,
				maxValue: 100,
				defaultValue: "25",
				unitOfMeasure: "°C",
				helpText: "Temperatura de servicio de la estructura",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "fbAdm",
				description: "Esfuerzo admisible a flexión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 5,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "ftAdm",
				description: "Esfuerzo admisible a tracción",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "fcAdm",
				description: "Esfuerzo admisible a compresión paralela",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "fvAdm",
				description: "Esfuerzo admisible a cortante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "fpAdm",
				description: "Esfuerzo admisible a compresión perpendicular",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "eAdm",
				description: "Módulo de elasticidad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "factorDuracionCarga",
				description: "Factor de duración de carga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "factorHumedad",
				description: "Factor de contenido de humedad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
			}),
			parameterRepository.create({
				calculationTemplateId: esfuerzosAdmisiblesTemplate.id,
				name: "factorTemperatura",
				description: "Factor de temperatura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
			}),
		];

		await parameterRepository.save(esfuerzosAdmisiblesParams);

		console.log(
			"✅ Plantillas de Estructuras de Madera (NEC-SE-MD) creadas exitosamente"
		);
	} catch (error) {
		console.error(
			"❌ Error al crear plantillas de Estructuras de Madera:",
			error
		);
		throw error;
	}
}
