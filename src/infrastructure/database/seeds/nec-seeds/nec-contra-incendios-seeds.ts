// src/infrastructure/database/seeds/nec-seeds/nec-contra-incendios-seeds.ts
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
 * Semillas para plantillas de cálculo para protección contra incendios (NEC-HS-CI)
 */
export async function seedContraIncendiosTemplates() {
	const connection = AppDataSource.getInstance();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	console.log(
		"🧯 Creando plantillas de Protección Contra Incendios (NEC-HS-CI)..."
	);

	// Verificar si ya existen plantillas con tag NEC-HS-CI
	const existingCount = await templateRepository.count({
		where: {
			tags: In(["NEC-HS-CI"]),
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de Protección Contra Incendios. Omitiendo...`
		);
		return;
	}

	try {
		// 1. PLANTILLA: VERIFICACIÓN DE MEDIOS DE EGRESO
		const mediosEgresoTemplate = templateRepository.create({
			name: "Verificación de Medios de Egreso (NEC-HS-CI)",
			description:
				"Verifica los requisitos de medios de egreso para edificaciones según la normativa contra incendios.",
			type: CalculationType.FIRE_SAFETY,
			targetProfession: ProfessionType.ARCHITECT,
			formula: `
        // Verificación de altura de la edificación
        const alturaMetros = numeroPisos * alturaEntrepisos / 1000;
        
        // Determinar requisitos según altura
        let mediosEgresoMinimo = 1;
        let permiteEscaleraTijera = false;
        
        if (alturaMetros > 28) {
          mediosEgresoMinimo = 2;
          
          if (alturaMetros <= 36) {
            permiteEscaleraTijera = true;
          }
        }
        
        // Verificar si cumple con el número mínimo de medios de egreso
        const cumpleNumeroMediosEgreso = numeroMediosEgreso >= mediosEgresoMinimo;
        
        // Verificar distancia máxima de recorrido
        const cumpleDistanciaMaxima = distanciaRecorrido <= 25;
        
        // Verificar ocupación
        let ocupacionClasificada = "";
        let ocupacionPersonas = 0;
        
        if (tipoOcupacion === "reunionPublica") {
          ocupacionClasificada = "Reuniones Públicas";
          // Según NFPA 101, Cap. 6
          ocupacionPersonas = Math.ceil(areaEdificacion / factorCarga);
          
          if (ocupacionPersonas < 50) {
            ocupacionClasificada = "No clasificada como Reunión Pública";
          }
        } else if (tipoOcupacion === "educacional") {
          ocupacionClasificada = "Educacional";
          ocupacionPersonas = Math.ceil(areaEdificacion / factorCarga);
          
          if (ocupacionPersonas < 6 || horasSemanales < 12) {
            ocupacionClasificada = "No clasificada como Educacional";
          }
        } else {
          ocupacionClasificada = tipoOcupacion;
          ocupacionPersonas = Math.ceil(areaEdificacion / factorCarga);
        }
        
        // Verificar si escaleras cumplen como medios de egreso
        const cumpleAnchoPasillos = anchoPasillos >= 1200;
        const cumpleAnchoEscaleras = anchoEscaleras >= 1200;
        
        // Verificar protecciones adicionales
        const requiereSistemaRociadores = alturaMetros > 30;
        
        // Evaluación general de cumplimiento
        const cumplimientoTotal = 
          cumpleNumeroMediosEgreso && 
          cumpleDistanciaMaxima && 
          cumpleAnchoPasillos && 
          cumpleAnchoEscaleras;
        
        return {
          alturaMetros,
          mediosEgresoMinimo,
          permiteEscaleraTijera,
          cumpleNumeroMediosEgreso,
          cumpleDistanciaMaxima,
          ocupacionClasificada,
          ocupacionPersonas,
          cumpleAnchoPasillos,
          cumpleAnchoEscaleras,
          requiereSistemaRociadores,
          cumplimientoTotal
        };
      `,
			necReference: "NEC-HS-CI, Sección 3",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-HS-CI", "contra incendios", "medios de egreso", "evacuación"],
			shareLevel: "public",
		});

		await templateRepository.save(mediosEgresoTemplate);

		// Parámetros para medios de egreso
		const mediosEgresoParams = [
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "numeroPisos",
				description: "Número de pisos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1,
				defaultValue: "8",
				helpText: "Número total de pisos de la edificación",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "alturaEntrepisos",
				description: "Altura entre pisos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 2500,
				defaultValue: "3500",
				unitOfMeasure: "mm",
				helpText: "Altura promedio entre pisos",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "numeroMediosEgreso",
				description: "Número de medios de egreso",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 1,
				defaultValue: "2",
				helpText: "Número de medios de egreso provistos en la edificación",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "distanciaRecorrido",
				description: "Distancia máxima de recorrido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 1,
				defaultValue: "22",
				unitOfMeasure: "m",
				helpText: "Distancia máxima de recorrido hasta una salida",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "tipoOcupacion",
				description: "Tipo de ocupación",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				defaultValue: "reunionPublica",
				allowedValues: JSON.stringify([
					"reunionPublica",
					"educacional",
					"guarderia",
					"saludInternacion",
					"saludAmbulatoria",
					"detencion",
					"residencial",
					"mercantil",
					"oficinas",
					"industrial",
					"almacenamiento",
				]),
				helpText: "Clasificación del tipo de ocupación según NFPA 101",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "areaEdificacion",
				description: "Área de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 10,
				defaultValue: "1500",
				unitOfMeasure: "m²",
				helpText: "Área total de la edificación o del piso analizado",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "factorCarga",
				description: "Factor de carga de ocupantes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "1.4",
				unitOfMeasure: "m²/persona",
				helpText: "Factor de carga de ocupantes según el tipo de uso",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "horasSemanales",
				description: "Horas semanales (educacional)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: false,
				minValue: 0,
				defaultValue: "40",
				unitOfMeasure: "h",
				helpText:
					"Horas semanales de ocupación (relevante para ocupación educacional)",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "anchoPasillos",
				description: "Ancho de pasillos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 900,
				defaultValue: "1200",
				unitOfMeasure: "mm",
				helpText: "Ancho libre de los pasillos de evacuación",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "anchoEscaleras",
				description: "Ancho de escaleras",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 900,
				defaultValue: "1200",
				unitOfMeasure: "mm",
				helpText: "Ancho libre de las escaleras de evacuación",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "alturaMetros",
				description: "Altura de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "m",
				helpText: "Altura total calculada de la edificación",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "mediosEgresoMinimo",
				description: "Medios de egreso mínimos requeridos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				helpText: "Número mínimo de medios de egreso requeridos por normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "permiteEscaleraTijera",
				description: "¿Permite escalera tipo tijera?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				helpText: "Indica si se permite el uso de escalera tipo tijera",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "cumpleNumeroMediosEgreso",
				description: "¿Cumple número de medios de egreso?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				helpText: "Indica si cumple con el número mínimo de medios de egreso",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "cumpleDistanciaMaxima",
				description: "¿Cumple distancia máxima?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				helpText: "Indica si cumple con la distancia máxima de recorrido",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "ocupacionClasificada",
				description: "Clasificación de ocupación",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				helpText: "Clasificación final del tipo de ocupación",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "ocupacionPersonas",
				description: "Cantidad de ocupantes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				helpText: "Cantidad estimada de ocupantes",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "requiereSistemaRociadores",
				description: "¿Requiere sistema de rociadores?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
				helpText: "Indica si se requiere sistema de rociadores automáticos",
			}),
			parameterRepository.create({
				calculationTemplateId: mediosEgresoTemplate.id,
				name: "cumplimientoTotal",
				description: "¿Cumple todos los requisitos?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 19,
				helpText: "Indica si cumple con todos los requisitos evaluados",
			}),
		];

		await parameterRepository.save(mediosEgresoParams);

		// 2. PLANTILLA: CÁLCULO DE EXTINTORES PORTÁTILES
		const extintoresTemplate = templateRepository.create({
			name: "Cálculo de Extintores Portátiles (NEC-HS-CI)",
			description:
				"Calcula la cantidad y tipo de extintores portátiles necesarios según la normativa.",
			type: CalculationType.FIRE_SAFETY,
			targetProfession: ProfessionType.SAFETY_ENGINEER,
			formula: `
        // Clasificación de riesgo
        let clasificacionRiesgo;
        let distanciaMaxima;
        let areaMaximaCubierta;
        
        if (tipoRiesgo === "bajo") {
          clasificacionRiesgo = "Riesgo Bajo (Ligero)";
          distanciaMaxima = 15;
          areaMaximaCubierta = 278; // m²
        } else if (tipoRiesgo === "moderado") {
          clasificacionRiesgo = "Riesgo Moderado (Ordinario)";
          distanciaMaxima = 10;
          areaMaximaCubierta = 139; // m²
        } else {
          clasificacionRiesgo = "Riesgo Alto (Extra)";
          distanciaMaxima = 6;
          areaMaximaCubierta = 93; // m²
        }
        
        // Cálculo de extintores necesarios por área
        const extintoresPorArea = Math.ceil(areaCubierta / areaMaximaCubierta);
        
        // Verificar si cumple con la distancia máxima
        const cumpleDistanciaMaxima = distanciaMaximaRecorrido <= distanciaMaxima;
        
        // Determinar la clasificación UL requerida según el área y riesgo
        let clasificacionUL;
        
        if (tipoRiesgo === "bajo") {
          clasificacionUL = "2-A";
        } else if (tipoRiesgo === "moderado") {
          clasificacionUL = "2-A:10-B:C";
        } else {
          clasificacionUL = "4-A:40-B:C";
        }
        
        // Determinar si se requieren extintores especiales
        let requiereExtintorClaseK = false;
        let requiereExtintorClaseD = false;
        
        if (incluyeCocina) {
          requiereExtintorClaseK = true;
        }
        
        if (incluyeMetalesCombustibles) {
          requiereExtintorClaseD = true;
        }
        
        // Calcular distribución recomendada
        const areaPromedioExtintor = areaCubierta / extintoresPorArea;
        const radioPromedioExtintor = Math.sqrt(areaPromedioExtintor / Math.PI);
        
        // Cantidad total de extintores
        let cantidadTotalExtintores = extintoresPorArea;
        
        if (requiereExtintorClaseK) {
          cantidadTotalExtintores += numeroCocinasComerciales;
        }
        
        if (requiereExtintorClaseD) {
          cantidadTotalExtintores += numeroAreasMetalesCombustibles;
        }
        
        return {
          clasificacionRiesgo,
          distanciaMaxima,
          areaMaximaCubierta,
          extintoresPorArea,
          cumpleDistanciaMaxima,
          clasificacionUL,
          requiereExtintorClaseK,
          requiereExtintorClaseD,
          areaPromedioExtintor,
          radioPromedioExtintor,
          cantidadTotalExtintores
        };
      `,
			necReference: "NEC-HS-CI, NFPA 10",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-HS-CI", "contra incendios", "extintores", "seguridad"],
			shareLevel: "public",
		});

		await templateRepository.save(extintoresTemplate);

		// Parámetros para extintores
		const extintoresParams = [
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "tipoRiesgo",
				description: "Tipo de riesgo",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				defaultValue: "moderado",
				allowedValues: JSON.stringify(["bajo", "moderado", "alto"]),
				helpText: "Clasificación del riesgo según NFPA 10",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "areaCubierta",
				description: "Área a cubrir",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 10,
				defaultValue: "500",
				unitOfMeasure: "m²",
				helpText: "Área total a cubrir con extintores",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "distanciaMaximaRecorrido",
				description: "Distancia máxima de recorrido propuesta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 1,
				defaultValue: "10",
				unitOfMeasure: "m",
				helpText: "Distancia máxima de recorrido hasta un extintor",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "incluyeCocina",
				description: "¿Incluye cocina comercial?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				defaultValue: "false",
				helpText: "Indica si el área incluye cocina comercial",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "numeroCocinasComerciales",
				description: "Número de cocinas comerciales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0,
				defaultValue: "0",
				helpText: "Cantidad de cocinas comerciales en el área",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "incluyeMetalesCombustibles",
				description: "¿Incluye metales combustibles?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				defaultValue: "false",
				helpText: "Indica si existen áreas con metales combustibles",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "numeroAreasMetalesCombustibles",
				description: "Número de áreas con metales combustibles",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 0,
				defaultValue: "0",
				helpText: "Cantidad de áreas con metales combustibles",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "clasificacionRiesgo",
				description: "Clasificación de riesgo",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				helpText: "Clasificación del riesgo según NFPA",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "distanciaMaxima",
				description: "Distancia máxima normativa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "m",
				helpText: "Distancia máxima de recorrido según normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "areaMaximaCubierta",
				description: "Área máxima por extintor",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "m²",
				helpText: "Área máxima que puede cubrir un extintor según normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "extintoresPorArea",
				description: "Extintores requeridos por área",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				helpText: "Cantidad de extintores requeridos según el área a cubrir",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "cumpleDistanciaMaxima",
				description: "¿Cumple distancia máxima?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				helpText: "Indica si cumple con la distancia máxima normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "clasificacionUL",
				description: "Clasificación UL requerida",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				helpText: "Clasificación UL mínima requerida para los extintores",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "requiereExtintorClaseK",
				description: "¿Requiere extintor Clase K?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				helpText: "Indica si se requieren extintores Clase K para cocinas",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "requiereExtintorClaseD",
				description: "¿Requiere extintor Clase D?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				helpText:
					"Indica si se requieren extintores Clase D para metales combustibles",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "areaPromedioExtintor",
				description: "Área promedio por extintor",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "m²",
				helpText: "Área promedio que cubrirá cada extintor",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "radioPromedioExtintor",
				description: "Radio promedio de cobertura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "m",
				helpText: "Radio promedio de cobertura de cada extintor",
			}),
			parameterRepository.create({
				calculationTemplateId: extintoresTemplate.id,
				name: "cantidadTotalExtintores",
				description: "Cantidad total de extintores",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
				helpText: "Cantidad total de extintores requeridos de todos los tipos",
			}),
		];

		await parameterRepository.save(extintoresParams);

		console.log(
			"✅ Plantillas de Protección Contra Incendios (NEC-HS-CI) creadas exitosamente"
		);
	} catch (error) {
		console.error(
			"❌ Error al crear plantillas de Protección Contra Incendios:",
			error
		);
		throw error;
	}
}
