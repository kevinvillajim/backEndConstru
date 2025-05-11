// src/infrastructure/database/seeds/nec-seeds/nec-instalaciones-electricas-seeds.ts
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
 * Semillas para plantillas de cálculo de instalaciones eléctricas (NEC-SB-IE)
 */
export async function seedInstalacionesElectricasTemplates() {
	const connection = AppDataSource.getInstance();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	console.log(
		"⚡ Creando plantillas de Instalaciones Eléctricas (NEC-SB-IE)..."
	);

	// Verificar si ya existen plantillas con tag NEC-SB-IE
	const existingCount = await templateRepository.count({
		where: {
			tags: ["NEC-SB-IE"],
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de Instalaciones Eléctricas. Omitiendo...`
		);
		return;
	}

	try {
		// 1. PLANTILLA: CÁLCULO DE DEMANDA ELÉCTRICA RESIDENCIAL
		const demandaElectricaTemplate = templateRepository.create({
			name: "Cálculo de Demanda Eléctrica Residencial (NEC-SB-IE)",
			description:
				"Calcula la demanda eléctrica de una vivienda residencial según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.ELECTRICAL,
			targetProfession: ProfessionType.ELECTRICAL_ENGINEER,
			formula: `
        // Determinar tipo de vivienda según área
        let tipoVivienda;
        let fdIluminacion;
        let fdTomacorrientes;
        
        if (areaVivienda < 80) {
          tipoVivienda = "Pequeña";
          fdIluminacion = 0.70;
          fdTomacorrientes = 0.50;
        } else if (areaVivienda < 200) {
          tipoVivienda = "Mediana";
          fdIluminacion = 0.70;
          fdTomacorrientes = 0.50;
        } else if (areaVivienda < 300) {
          tipoVivienda = "Mediana grande";
          fdIluminacion = 0.55;
          fdTomacorrientes = 0.40;
        } else if (areaVivienda < 400) {
          tipoVivienda = "Grande";
          fdIluminacion = 0.55;
          fdTomacorrientes = 0.40;
        } else {
          tipoVivienda = "Especial";
          fdIluminacion = 0.53;
          fdTomacorrientes = 0.30;
        }
        
        // Cálculo de potencia y demanda de iluminación
        const potenciaIluminacion = circuitosIluminacion * puntosIluminacion * 100; // W
        const demandaIluminacion = potenciaIluminacion * fdIluminacion;
        
        // Cálculo de potencia y demanda de tomacorrientes
        const potenciaTomacorrientes = circuitosTomacorrientes * puntosTomacorriente * 200; // W
        const demandaTomacorrientes = potenciaTomacorrientes * fdTomacorrientes;
        
        // Cálculo de demanda de cargas especiales
        let factorDemandaCargasEspeciales;
        const sumaPotenciaCargasEspeciales = sumaCargasEspeciales;
        
        if (cantidadCargasEspeciales <= 1) {
          factorDemandaCargasEspeciales = 1.0;
        } else if (sumaPotenciaCargasEspeciales < 10000) {
          factorDemandaCargasEspeciales = 0.80;
        } else if (sumaPotenciaCargasEspeciales < 20000) {
          factorDemandaCargasEspeciales = 0.75;
        } else {
          factorDemandaCargasEspeciales = 0.65;
        }
        
        const demandaCargasEspeciales = sumaPotenciaCargasEspeciales * factorDemandaCargasEspeciales;
        
        // Demanda total
        const demandaTotal = demandaIluminacion + demandaTomacorrientes + demandaCargasEspeciales;
        
        // Cálculo de corriente
        const corrienteTotal = demandaTotal / voltajeNominal;
        
        return {
          tipoVivienda,
          fdIluminacion,
          fdTomacorrientes,
          potenciaIluminacion,
          demandaIluminacion,
          potenciaTomacorrientes,
          demandaTomacorrientes,
          factorDemandaCargasEspeciales,
          demandaCargasEspeciales,
          demandaTotal,
          corrienteTotal
        };
      `,
			necReference: "NEC-SB-IE, Sección 1.1",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SB-IE", "eléctrico", "demanda eléctrica", "residencial"],
			shareLevel: "public",
		});

		await templateRepository.save(demandaElectricaTemplate);

		// Parámetros para demanda eléctrica
		const demandaElectricaParams = [
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "areaVivienda",
				description: "Área de la vivienda",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 10,
				defaultValue: "120",
				unitOfMeasure: "m²",
				helpText: "Área de construcción de la vivienda",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "circuitosIluminacion",
				description: "Número de circuitos de iluminación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1,
				defaultValue: "2",
				helpText: "Cantidad de circuitos de iluminación",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "puntosIluminacion",
				description: "Puntos de iluminación por circuito",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 1,
				maxValue: 15,
				defaultValue: "10",
				helpText:
					"Cantidad promedio de puntos de iluminación por circuito (máximo 15)",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "circuitosTomacorrientes",
				description: "Número de circuitos de tomacorrientes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 1,
				defaultValue: "2",
				helpText: "Cantidad de circuitos de tomacorrientes",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "puntosTomacorriente",
				description: "Puntos de tomacorriente por circuito",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 1,
				maxValue: 10,
				defaultValue: "8",
				helpText:
					"Cantidad promedio de puntos de tomacorriente por circuito (máximo 10)",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "cantidadCargasEspeciales",
				description: "Cantidad de cargas especiales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0,
				defaultValue: "2",
				helpText:
					"Número total de cargas especiales (ducha, cocina, horno, etc.)",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "sumaCargasEspeciales",
				description: "Suma de potencias de cargas especiales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 0,
				defaultValue: "9500",
				unitOfMeasure: "W",
				helpText: "Suma de potencias de todas las cargas especiales (W)",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "voltajeNominal",
				description: "Voltaje nominal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 110,
				defaultValue: "120",
				unitOfMeasure: "V",
				helpText: "Voltaje nominal de la instalación",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "tipoVivienda",
				description: "Clasificación de vivienda",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				helpText: "Clasificación de la vivienda según área",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "potenciaIluminacion",
				description: "Potencia total de iluminación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "W",
				helpText: "Potencia total instalada de iluminación",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "demandaIluminacion",
				description: "Demanda de iluminación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "W",
				helpText: "Demanda de iluminación considerando factor de demanda",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "potenciaTomacorrientes",
				description: "Potencia total de tomacorrientes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "W",
				helpText: "Potencia total instalada de tomacorrientes",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "demandaTomacorrientes",
				description: "Demanda de tomacorrientes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "W",
				helpText: "Demanda de tomacorrientes considerando factor de demanda",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "factorDemandaCargasEspeciales",
				description: "Factor de demanda de cargas especiales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				helpText: "Factor de demanda aplicado a las cargas especiales",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "demandaCargasEspeciales",
				description: "Demanda de cargas especiales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "W",
				helpText: "Demanda de cargas especiales considerando factor de demanda",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "demandaTotal",
				description: "Demanda total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "W",
				helpText: "Demanda total de la instalación eléctrica",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaElectricaTemplate.id,
				name: "corrienteTotal",
				description: "Corriente total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "A",
				helpText: "Corriente total de la instalación",
			}),
		];

		await parameterRepository.save(demandaElectricaParams);

		// 2. PLANTILLA: DIMENSIONAMIENTO DE CONDUCTORES Y PROTECCIONES
		const dimensionamientoTemplate = templateRepository.create({
			name: "Dimensionamiento de Conductores y Protecciones (NEC-SB-IE)",
			description:
				"Calcula el calibre de conductores y protecciones para circuitos eléctricos según la NEC.",
			type: CalculationType.ELECTRICAL,
			targetProfession: ProfessionType.ELECTRICAL_ENGINEER,
			formula: `
        // 1. Cálculo de corriente de diseño
        const corrienteDiseño = corrienteCarga * 1.25; // 125% de la corriente de carga
        
        // 2. Selección del calibre del conductor
        let calibreConductor;
        let capacidadConductor;
        
        if (corrienteDiseño <= 15) {
          calibreConductor = "14 AWG";
          capacidadConductor = 15;
        } else if (corrienteDiseño <= 20) {
          calibreConductor = "12 AWG";
          capacidadConductor = 20;
        } else if (corrienteDiseño <= 30) {
          calibreConductor = "10 AWG";
          capacidadConductor = 30;
        } else if (corrienteDiseño <= 40) {
          calibreConductor = "8 AWG";
          capacidadConductor = 40;
        } else if (corrienteDiseño <= 60) {
          calibreConductor = "6 AWG";
          capacidadConductor = 60;
        } else if (corrienteDiseño <= 100) {
          calibreConductor = "4 AWG";
          capacidadConductor = 100;
        } else {
          calibreConductor = "Requiere cálculo específico";
          capacidadConductor = 0;
        }
        
        // 3. Dimensionamiento de la protección
        let capacidadProteccion;
        
        if (calibreConductor === "14 AWG") {
          capacidadProteccion = 15;
        } else if (calibreConductor === "12 AWG") {
          capacidadProteccion = 20;
        } else if (calibreConductor === "10 AWG") {
          capacidadProteccion = 30;
        } else if (calibreConductor === "8 AWG") {
          capacidadProteccion = 40;
        } else if (calibreConductor === "6 AWG") {
          capacidadProteccion = 50;
        } else if (calibreConductor === "4 AWG") {
          capacidadProteccion = 100;
        } else {
          capacidadProteccion = 0;
        }
        
        // 4. Dimensionamiento del conductor de tierra
        let calibreTierra;
        
        if (capacidadProteccion <= 15) {
          calibreTierra = "14 AWG";
        } else if (capacidadProteccion <= 20) {
          calibreTierra = "12 AWG";
        } else if (capacidadProteccion <= 60) {
          calibreTierra = "10 AWG";
        } else if (capacidadProteccion <= 100) {
          calibreTierra = "8 AWG";
        } else if (capacidadProteccion <= 200) {
          calibreTierra = "6 AWG";
        } else {
          calibreTierra = "Requiere cálculo específico";
        }
        
        return {
          corrienteDiseño,
          calibreConductor,
          capacidadConductor,
          capacidadProteccion,
          calibreTierra
        };
      `,
			necReference: "NEC-SB-IE, Sección 1.2",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SB-IE", "eléctrico", "conductores", "protecciones"],
			shareLevel: "public",
		});

		await templateRepository.save(dimensionamientoTemplate);

		// Parámetros para dimensionamiento
		const dimensionamientoParams = [
			parameterRepository.create({
				calculationTemplateId: dimensionamientoTemplate.id,
				name: "corrienteCarga",
				description: "Corriente de carga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "15",
				unitOfMeasure: "A",
				helpText: "Corriente nominal de la carga",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoTemplate.id,
				name: "corrienteDiseño",
				description: "Corriente de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 2,
				unitOfMeasure: "A",
				helpText: "Corriente de diseño (125% de la corriente de carga)",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoTemplate.id,
				name: "calibreConductor",
				description: "Calibre del conductor",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 3,
				helpText: "Calibre del conductor recomendado",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoTemplate.id,
				name: "capacidadConductor",
				description: "Capacidad del conductor",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 4,
				unitOfMeasure: "A",
				helpText: "Capacidad de corriente del conductor seleccionado",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoTemplate.id,
				name: "capacidadProteccion",
				description: "Capacidad de protección",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 5,
				unitOfMeasure: "A",
				helpText: "Capacidad del interruptor termomagnético recomendado",
			}),
			parameterRepository.create({
				calculationTemplateId: dimensionamientoTemplate.id,
				name: "calibreTierra",
				description: "Calibre del conductor de tierra",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				helpText: "Calibre del conductor de tierra recomendado",
			}),
		];

		await parameterRepository.save(dimensionamientoParams);

		// 3. PLANTILLA: CÁLCULO DE CIRCUITOS MÍNIMOS
		const circuitosMinimosTemplate = templateRepository.create({
			name: "Cálculo de Circuitos Mínimos para Vivienda (NEC-SB-IE)",
			description:
				"Determina el número mínimo de circuitos de iluminación y tomacorrientes para una vivienda según la NEC.",
			type: CalculationType.ELECTRICAL,
			targetProfession: ProfessionType.ELECTRICAL_ENGINEER,
			formula: `
        // Determinación de circuitos mínimos según el área de construcción
        let circuitosMinimosIluminacion;
        let circuitosMinimosTC;
        let tipoVivienda;
        
        if (areaConstruccion < 80) {
          circuitosMinimosIluminacion = 1;
          circuitosMinimosTC = 1;
          tipoVivienda = "Pequeña";
        } else if (areaConstruccion < 201) {
          circuitosMinimosIluminacion = 2;
          circuitosMinimosTC = 2;
          tipoVivienda = "Mediana";
        } else if (areaConstruccion < 301) {
          circuitosMinimosIluminacion = 3;
          circuitosMinimosTC = 3;
          tipoVivienda = "Mediana grande";
        } else if (areaConstruccion < 401) {
          circuitosMinimosIluminacion = 4;
          circuitosMinimosTC = 4;
          tipoVivienda = "Grande";
        } else {
          // Para viviendas especiales: 1 circuito por cada 100 m² o fracción
          circuitosMinimosIluminacion = Math.ceil(areaConstruccion / 100);
          circuitosMinimosTC = Math.ceil(areaConstruccion / 100);
          tipoVivienda = "Especial";
        }
        
        // Cálculo de circuitos para cargas especiales
        let circuitosCargasEspeciales = 0;
        
        if (incluyeCocinaElectrica) {
          circuitosCargasEspeciales += 1;
        }
        
        if (incluyeHornoElectrico) {
          circuitosCargasEspeciales += 1;
        }
        
        if (incluyeDuchaElectrica) {
          circuitosCargasEspeciales += cantidadDuchasElectricas;
        }
        
        if (incluyeCalefon) {
          circuitosCargasEspeciales += 1;
        }
        
        if (incluyeAireAcondicionado) {
          circuitosCargasEspeciales += cantidadAireAcondicionado;
        }
        
        // Conteo de circuitos totales
        const totalCircuitos = circuitosMinimosIluminacion + circuitosMinimosTC + circuitosCargasEspeciales;
        
        // Recomendación de circuitos de reserva
        const circuitosReserva = Math.ceil(totalCircuitos / 5); // 1 por cada 5 circuitos
        
        // Número total recomendado de circuitos
        const totalCircuitosRecomendados = totalCircuitos + circuitosReserva;
        
        return {
          tipoVivienda,
          circuitosMinimosIluminacion,
          circuitosMinimosTC,
          circuitosCargasEspeciales,
          totalCircuitos,
          circuitosReserva,
          totalCircuitosRecomendados
        };
      `,
			necReference: "NEC-SB-IE, Sección 2.1 y 3.3",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SB-IE", "eléctrico", "circuitos", "residencial"],
			shareLevel: "public",
		});

		await templateRepository.save(circuitosMinimosTemplate);

		// Parámetros para circuitos mínimos
		const circuitosMinimosParams = [
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "areaConstruccion",
				description: "Área de construcción",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 10,
				defaultValue: "150",
				unitOfMeasure: "m²",
				helpText: "Área total de construcción de la vivienda",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "incluyeCocinaElectrica",
				description: "¿Incluye cocina eléctrica?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				defaultValue: "true",
				helpText: "Indicar si la vivienda incluye cocina eléctrica",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "incluyeHornoElectrico",
				description: "¿Incluye horno eléctrico?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				defaultValue: "false",
				helpText: "Indicar si la vivienda incluye horno eléctrico",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "incluyeDuchaElectrica",
				description: "¿Incluye ducha(s) eléctrica(s)?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				defaultValue: "true",
				helpText: "Indicar si la vivienda incluye duchas eléctricas",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "cantidadDuchasElectricas",
				description: "Cantidad de duchas eléctricas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0,
				defaultValue: "2",
				helpText: "Número de duchas eléctricas en la vivienda",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "incluyeCalefon",
				description: "¿Incluye calefón eléctrico?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				defaultValue: "false",
				helpText: "Indicar si la vivienda incluye calefón eléctrico",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "incluyeAireAcondicionado",
				description: "¿Incluye aire acondicionado?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				defaultValue: "false",
				helpText: "Indicar si la vivienda incluye aire acondicionado",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "cantidadAireAcondicionado",
				description: "Cantidad de equipos de aire acondicionado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 0,
				defaultValue: "0",
				helpText: "Número de equipos de aire acondicionado en la vivienda",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "tipoVivienda",
				description: "Tipo de vivienda",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				helpText: "Clasificación de la vivienda según el área",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "circuitosMinimosIluminacion",
				description: "Circuitos mínimos de iluminación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				helpText: "Número mínimo de circuitos de iluminación según normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "circuitosMinimosTC",
				description: "Circuitos mínimos de tomacorrientes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				helpText:
					"Número mínimo de circuitos de tomacorrientes según normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "circuitosCargasEspeciales",
				description: "Circuitos para cargas especiales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				helpText: "Número de circuitos para cargas especiales",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "totalCircuitos",
				description: "Total de circuitos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				helpText: "Número total de circuitos requeridos",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "circuitosReserva",
				description: "Circuitos de reserva",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				helpText: "Número recomendado de circuitos de reserva",
			}),
			parameterRepository.create({
				calculationTemplateId: circuitosMinimosTemplate.id,
				name: "totalCircuitosRecomendados",
				description: "Total de circuitos recomendados",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				helpText: "Número total de circuitos recomendados, incluyendo reserva",
			}),
		];

		await parameterRepository.save(circuitosMinimosParams);

		console.log(
			"✅ Plantillas de Instalaciones Eléctricas (NEC-SB-IE) creadas exitosamente"
		);
	} catch (error) {
		console.error(
			"❌ Error al crear plantillas de Instalaciones Eléctricas:",
			error
		);
		throw error;
	}
}
