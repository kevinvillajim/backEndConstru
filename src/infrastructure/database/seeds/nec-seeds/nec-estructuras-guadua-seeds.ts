// src/infrastructure/database/seeds/nec-seeds/guadua-templates.ts
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
 * Semillas para plantillas de cálculo de estructuras de guadúa según NEC-SE-GUADUA
 */
export async function seedEstructurasGuaduaTemplates() {
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
			necReference: "NEC-SE-GUADUA",
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de guadúa. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla 1: Cálculo de Elementos a Flexión
		const flexionGuaduaTemplate = templateRepository.create({
			name: "Cálculo de Elementos de Guadúa a Flexión",
			description:
				"Calcula el esfuerzo y resistencia a flexión de elementos de Guadúa angustifolia Kunth según NEC-SE-GUADUA.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo del área de la sección transversal
        const A = Math.PI * (diametroExterior * espesorPared - Math.pow(espesorPared, 2));
        
        // Cálculo del módulo de sección
        const S = Math.PI * (Math.pow(diametroExterior, 3) - Math.pow(diametroExterior - 2 * espesorPared, 3)) / (32 * diametroExterior);
        
        // Cálculo del momento máximo
        const Mmax = cargaDistribuida * Math.pow(longitud, 2) / 8; // Para viga simplemente apoyada
        
        // Esfuerzo a flexión actuante
        const fb = Mmax / S;
        
        // Cálculo de coeficientes de modificación
        let Cm = 1.0; // Coeficiente por contenido de humedad
        if (contenidoHumedad > 12) {
          // Aplicar reducción según tabla
          if (contenidoHumedad <= 13) Cm = 0.96;
          else if (contenidoHumedad <= 14) Cm = 0.91;
          else if (contenidoHumedad <= 15) Cm = 0.87;
          else if (contenidoHumedad <= 16) Cm = 0.83;
          else if (contenidoHumedad <= 17) Cm = 0.79;
          else if (contenidoHumedad <= 18) Cm = 0.74;
          else Cm = 0.70;
        }
        
        let Ct = 1.0; // Coeficiente por temperatura
        if (temperatura > 37) {
          if (temperatura <= 52) Ct = 0.96;
          else Ct = 0.92;
        }
        
        // Coeficiente de duración de carga
        let CD = 1.0; // Valor para carga permanente
        switch(duracionCarga) {
          case "permanente": CD = 0.9; break;
          case "diez_anios": CD = 1.0; break;
          case "dos_meses": CD = 1.15; break;
          case "siete_dias": CD = 1.25; break;
          case "diez_minutos": CD = 1.6; break;
          case "impacto": CD = 2.0; break;
        }
        
        // Esfuerzo admisible modificado
        const Fb_base = 15; // MPa, según tabla
        const Fb_mod = Fb_base * CD * Cm * Ct;
        
        // Verificación a flexión
        const relacion_demanda = fb / Fb_mod;
        const cumple_flexion = relacion_demanda <= 1.0;
        
        // Cálculo de cortante
        const V = cargaDistribuida * longitud / 2;
        const fv = 3 * V / (2 * A);
        
        // Esfuerzo admisible a cortante modificado
        const Fv_base = 1.2; // MPa, según tabla
        const Fv_mod = Fv_base * CD * Cm * Ct;
        
        // Verificación a cortante
        const relacion_cortante = fv / Fv_mod;
        const cumple_cortante = relacion_cortante <= 1.0;
        
        // Cálculo de deflexión
        const E_mod = 12000 * Cm; // MPa, módulo de elasticidad modificado
        const I = Math.PI * (Math.pow(diametroExterior, 4) - Math.pow(diametroExterior - 2 * espesorPared, 4)) / 64; // Momento de inercia
        
        // Deflexión para viga simplemente apoyada con carga uniforme
        const deflexion = (5 * cargaDistribuida * Math.pow(longitud, 4)) / (384 * E_mod * I);
        
        // Deflexión admisible según tabla NEC
        const deflexion_adm = condicionServicio === "sin_cielo_raso" ? 
            longitud / 240 : // L/240 para vigas sin cielo raso
            longitud / 360;  // L/360 para vigas con cielo raso
        
        const cumple_deflexion = deflexion <= deflexion_adm;
        
        return {
          area: A,
          moduloSeccion: S,
          momentoMaximo: Mmax,
          esfuerzoFlexion: fb,
          esfuerzoAdmisibleMod: Fb_mod,
          relacionDemandaFlexion: relacion_demanda,
          cumpleFlexion: cumple_flexion,
          esfuerzoCortante: fv,
          esfuerzoCortanteAdm: Fv_mod,
          relacionDemandaCortante: relacion_cortante,
          cumpleCortante: cumple_cortante,
          deflexion: deflexion,
          deflexionAdmisible: deflexion_adm,
          cumpleDeflexion: cumple_deflexion
        };
      `,
			necReference: "NEC-SE-GUADUA, Capítulo 4.4",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["guadúa", "bambú", "flexión", "estructural", "NEC-SE-GUADUA"],
		});

		await templateRepository.save(flexionGuaduaTemplate);

		// Parámetros para plantilla de Flexión de Guadúa
		const flexionGuaduaParams = [
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "diametroExterior",
				description: "Diámetro exterior del culmo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 50,
				maxValue: 200,
				defaultValue: "100",
				unitOfMeasure: "mm",
				helpText: "Diámetro exterior del culmo de guadúa",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "espesorPared",
				description: "Espesor de pared del culmo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 5,
				maxValue: 25,
				defaultValue: "10",
				unitOfMeasure: "mm",
				helpText: "Espesor de la pared del culmo de guadúa",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "longitud",
				description: "Longitud del elemento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.5,
				maxValue: 6,
				defaultValue: "3",
				unitOfMeasure: "m",
				helpText: "Longitud del elemento a flexión",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "cargaDistribuida",
				description: "Carga distribuida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "1.5",
				unitOfMeasure: "kN/m",
				helpText: "Carga distribuida sobre el elemento",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "contenidoHumedad",
				description: "Contenido de humedad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 8,
				maxValue: 25,
				defaultValue: "12",
				unitOfMeasure: "%",
				helpText: "Contenido de humedad del material (CH=12% es referencia)",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "temperatura",
				description: "Temperatura de servicio",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 10,
				maxValue: 65,
				defaultValue: "25",
				unitOfMeasure: "°C",
				helpText: "Temperatura de servicio del elemento",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "duracionCarga",
				description: "Duración de la carga",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				defaultValue: "permanente",
				allowedValues: JSON.stringify([
					"permanente",
					"diez_anios",
					"dos_meses",
					"siete_dias",
					"diez_minutos",
					"impacto",
				]),
				helpText: "Duración de la carga aplicada",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "condicionServicio",
				description: "Condición de servicio",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				defaultValue: "sin_cielo_raso",
				allowedValues: JSON.stringify([
					"sin_cielo_raso",
					"con_cielo_raso_panete",
					"con_cielo_raso_otro",
				]),
				helpText: "Condición de servicio para límites de deflexión",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "area",
				description: "Área de la sección",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "moduloSeccion",
				description: "Módulo de sección",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "mm³",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "momentoMaximo",
				description: "Momento máximo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "kN·m",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "esfuerzoFlexion",
				description: "Esfuerzo a flexión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "esfuerzoAdmisibleMod",
				description: "Esfuerzo admisible modificado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "relacionDemandaFlexion",
				description: "Relación demanda/capacidad a flexión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "cumpleFlexion",
				description: "¿Cumple a flexión?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "esfuerzoCortante",
				description: "Esfuerzo a cortante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "esfuerzoCortanteAdm",
				description: "Esfuerzo admisible a cortante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "relacionDemandaCortante",
				description: "Relación demanda/capacidad a cortante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "cumpleCortante",
				description: "¿Cumple a cortante?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 19,
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "deflexion",
				description: "Deflexión calculada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 20,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "deflexionAdmisible",
				description: "Deflexión admisible",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 21,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: flexionGuaduaTemplate.id,
				name: "cumpleDeflexion",
				description: "¿Cumple deflexión?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 22,
			}),
		];

		await parameterRepository.save(flexionGuaduaParams);

		// Plantilla 2: Cálculo de Columnas de Guadúa
		const columnaGuaduaTemplate = templateRepository.create({
			name: "Cálculo de Columnas de Guadúa",
			description:
				"Verifica la capacidad de columnas de Guadúa angustifolia Kunth según NEC-SE-GUADUA.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo del área de la sección transversal
        const A = Math.PI * (diametroExterior * espesorPared - Math.pow(espesorPared, 2));
        
        // Cálculo del radio de giro
        const r = Math.sqrt((Math.pow(diametroExterior, 2) + Math.pow(diametroExterior - 2 * espesorPared, 2)) / 8);
        
        // Longitud efectiva
        const le = longitudColumna * factorLongitudEfectiva;
        
        // Relación de esbeltez
        const lambda = le / r;
        
        // Cálculo de coeficientes de modificación
        let Cm = 1.0; // Coeficiente por contenido de humedad
        if (contenidoHumedad > 12) {
          // Aplicar reducción según tabla
          if (contenidoHumedad <= 13) Cm = 0.96;
          else if (contenidoHumedad <= 14) Cm = 0.91;
          else if (contenidoHumedad <= 15) Cm = 0.87;
          else if (contenidoHumedad <= 16) Cm = 0.83;
          else if (contenidoHumedad <= 17) Cm = 0.79;
          else if (contenidoHumedad <= 18) Cm = 0.74;
          else Cm = 0.70;
        }
        
        let Ct = 1.0; // Coeficiente por temperatura
        if (temperatura > 37) {
          if (temperatura <= 52) Ct = 0.65;
          else Ct = 0.4;
        }
        
        // Coeficiente de duración de carga
        let CD = 1.0; // Valor para carga permanente
        switch(duracionCarga) {
          case "permanente": CD = 0.9; break;
          case "diez_anios": CD = 1.0; break;
          case "dos_meses": CD = 1.15; break;
          case "siete_dias": CD = 1.25; break;
          case "diez_minutos": CD = 1.6; break;
          case "impacto": CD = 2.0; break;
        }
        
        // Esfuerzo admisible modificado a compresión paralela
        const Fc_base = 14; // MPa, según tabla
        const Fc_mod = Fc_base * CD * Cm * Ct;
        
        // Esfuerzo de compresión actuante
        const fc = cargaAxial * 1000 / A; // MPa
        
        // Clasificación de columna según esbeltez
        let tipoColumna = "";
        let capacidadColumna = 0;
        let relacionDemanda = 0;
        
        // Límite entre columnas intermedias y largas
        const E_mod = 7500 * Cm; // MPa, módulo de elasticidad modificado 5%
        const Ck = 2 * Math.PI * Math.PI * E_mod / Fc_mod;
        
        if (lambda < 30) {
          // Columna corta
          tipoColumna = "Corta";
          capacidadColumna = Fc_mod;
          relacionDemanda = fc / Fc_mod;
        } else if (lambda <= Ck) {
          // Columna intermedia
          tipoColumna = "Intermedia";
          capacidadColumna = Fc_mod * (1 - (1/3) * Math.pow(lambda / Ck, 4));
          relacionDemanda = fc / capacidadColumna;
        } else if (lambda <= 150) {
          // Columna larga
          tipoColumna = "Larga";
          capacidadColumna = 0.3 * E_mod / Math.pow(lambda, 2);
          relacionDemanda = fc / capacidadColumna;
        } else {
          // Columna demasiado esbelta
          tipoColumna = "Demasiado Esbelta";
          capacidadColumna = 0;
          relacionDemanda = 999;
        }
        
        // Verificación
        const cumple = relacionDemanda <= 1.0;
        
        return {
          area: A,
          radioGiro: r,
          longitudEfectiva: le,
          relacionEsbeltez: lambda,
          tipoColumna: tipoColumna,
          limiteCk: Ck,
          esfuerzoActuante: fc,
          capacidadColumna: capacidadColumna,
          relacionDemanda: relacionDemanda,
          cumpleCompresion: cumple
        };
      `,
			necReference: "NEC-SE-GUADUA, Capítulo 4.5",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["guadúa", "bambú", "columna", "compresión", "NEC-SE-GUADUA"],
		});

		await templateRepository.save(columnaGuaduaTemplate);

		// Parámetros para plantilla de Columna de Guadúa
		const columnaGuaduaParams = [
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "diametroExterior",
				description: "Diámetro exterior del culmo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 50,
				maxValue: 200,
				defaultValue: "100",
				unitOfMeasure: "mm",
				helpText: "Diámetro exterior del culmo de guadúa",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "espesorPared",
				description: "Espesor de pared del culmo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 5,
				maxValue: 25,
				defaultValue: "10",
				unitOfMeasure: "mm",
				helpText: "Espesor de la pared del culmo de guadúa",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "longitudColumna",
				description: "Longitud de la columna",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.5,
				maxValue: 6,
				defaultValue: "2.5",
				unitOfMeasure: "m",
				helpText: "Longitud de la columna",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "factorLongitudEfectiva",
				description: "Factor de longitud efectiva",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.5,
				maxValue: 2.5,
				defaultValue: "1.0",
				helpText: "Factor de longitud efectiva k (1.0=articulado-articulado)",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "cargaAxial",
				description: "Carga axial",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "5.0",
				unitOfMeasure: "kN",
				helpText: "Carga axial aplicada en la columna",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "contenidoHumedad",
				description: "Contenido de humedad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 8,
				maxValue: 25,
				defaultValue: "12",
				unitOfMeasure: "%",
				helpText: "Contenido de humedad del material (CH=12% es referencia)",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "temperatura",
				description: "Temperatura de servicio",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 10,
				maxValue: 65,
				defaultValue: "25",
				unitOfMeasure: "°C",
				helpText: "Temperatura de servicio del elemento",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "duracionCarga",
				description: "Duración de la carga",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				defaultValue: "permanente",
				allowedValues: JSON.stringify([
					"permanente",
					"diez_anios",
					"dos_meses",
					"siete_dias",
					"diez_minutos",
					"impacto",
				]),
				helpText: "Duración de la carga aplicada",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "area",
				description: "Área de la sección",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "mm²",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "radioGiro",
				description: "Radio de giro",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "longitudEfectiva",
				description: "Longitud efectiva",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "relacionEsbeltez",
				description: "Relación de esbeltez",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "tipoColumna",
				description: "Tipo de columna",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "limiteCk",
				description: "Límite de esbeltez Ck",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "esfuerzoActuante",
				description: "Esfuerzo actuante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "capacidadColumna",
				description: "Capacidad de la columna",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "MPa",
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "relacionDemanda",
				description: "Relación demanda/capacidad",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
			}),
			parameterRepository.create({
				calculationTemplateId: columnaGuaduaTemplate.id,
				name: "cumpleCompresion",
				description: "¿Cumple a compresión?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
			}),
		];

		await parameterRepository.save(columnaGuaduaParams);

		console.log("Plantillas de guadúa creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de guadúa:", error);
	} finally {
		await connection.destroy();
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedGuaduaTemplates()
		.then(() => console.log("Seeding de plantillas de guadúa completado"))
		.catch((error) => console.error("Error en seeding de guadúa:", error));
}
