// src/infrastructure/database/seeds/nec-seeds/renewable-energy-templates.ts
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
 * Semillas para plantillas de cálculo de energías renovables según NEC-HS-ER
 */
export async function seedEnergiasRenovablesTemplates(connection = null) {
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
		where: {
			necReference: "NEC-HS-ER",
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de energías renovables. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla 1: Cálculo de Demanda Energética para ACS
		const demandaACSTemplate = templateRepository.create({
			name: "Cálculo de Demanda Energética para ACS",
			description:
				"Calcula la demanda energética para agua caliente sanitaria según NEC-HS-ER.",
			type: CalculationType.EFFICIENCY,
			targetProfession: ProfessionType.ARCHITECT,
			formula: `
        // Densidad y calor específico del agua
        const rho = 1; // kg/l a 25°C
        const cp = 4.184; // kJ/kg·°C a 25°C
        
        // Cálculo de la demanda diaria según tipo de edificación y ocupación
        let demandaDiaria = 0;
        if (tipoEdificacion === "vivienda") {
          // Para viviendas familiares
          demandaDiaria = consumoPersona * numPersonas;
        } else {
          // Para otras edificaciones
          demandaDiaria = consumoPersona * numPersonas * factorCentralizacion;
        }
        
        // Cálculo de la demanda energética diaria
        const Qdia = (rho * cp * demandaDiaria * (TACS - Tred)) / 3600; // kWh/día
        
        // Cálculo de la demanda energética mensual
        const Lmes = Qdia * diasMes * (TACS - Tred); // kWh/mes
        
        // Calcular contribución solar mínima según zona climática
        let contribucionMinima = 0;
        if (demandaDiaria <= 5000) {
          switch(zonaClimatica) {
            case "I": contribucionMinima = 0.3; break;
            case "II": contribucionMinima = 0.4; break;
            case "III": contribucionMinima = 0.5; break;
            case "IV": contribucionMinima = 0.55; break;
            case "V": contribucionMinima = 0.6; break;
            case "VI": contribucionMinima = 0.65; break;
          }
        } else if (demandaDiaria <= 10000) {
          switch(zonaClimatica) {
            case "I": contribucionMinima = 0.35; break;
            case "II": contribucionMinima = 0.45; break;
            case "III": contribucionMinima = 0.55; break;
            case "IV": contribucionMinima = 0.6; break;
            case "V": contribucionMinima = 0.65; break;
            case "VI": contribucionMinima = 0.7; break;
          }
        } else {
          switch(zonaClimatica) {
            case "I": contribucionMinima = 0.4; break;
            case "II": contribucionMinima = 0.5; break;
            case "III": contribucionMinima = 0.6; break;
            case "IV": contribucionMinima = 0.65; break;
            case "V": contribucionMinima = 0.7; break;
            case "VI": contribucionMinima = 0.75; break;
          }
        }
        
        return {
          demandaDiaria: demandaDiaria,
          demandaEnergeticaDiaria: Qdia,
          demandaEnergeticaMensual: Lmes,
          contribucionSolarMinima: contribucionMinima,
          energiaSolarMinima: Lmes * contribucionMinima
        };
      `,
			necReference: "NEC-HS-ER, Sección 1.4",
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
				"energías renovables",
				"agua caliente sanitaria",
				"ACS",
				"solar térmica",
				"NEC-HS-ER",
			],
		});

		await templateRepository.save(demandaACSTemplate);

		// Parámetros para plantilla de Demanda Energética ACS
		const demandaACSParams = [
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "tipoEdificacion",
				description: "Tipo de edificación",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				defaultValue: "vivienda",
				allowedValues: JSON.stringify([
					"vivienda",
					"hotel",
					"hospital",
					"escuela",
					"oficina",
					"comercial",
					"otro",
				]),
				helpText: "Tipo de edificación según su uso principal",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "consumoPersona",
				description: "Consumo de ACS por persona",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1,
				maxValue: 100,
				defaultValue: "28",
				unitOfMeasure: "l/día",
				helpText:
					"Consumo de agua caliente a 60°C por persona y día según tipo de edificación",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "numPersonas",
				description: "Número de personas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 1,
				defaultValue: "4",
				helpText: "Número de personas en la edificación",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "factorCentralizacion",
				description: "Factor de centralización",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.7,
				maxValue: 1.0,
				defaultValue: "1.0",
				helpText:
					"Factor de centralización según número de viviendas (1.0 para edificios individuales)",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "TACS",
				description: "Temperatura de ACS",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 40,
				maxValue: 70,
				defaultValue: "60",
				unitOfMeasure: "°C",
				helpText: "Temperatura de referencia del agua caliente sanitaria",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "Tred",
				description: "Temperatura de agua fría",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 5,
				maxValue: 25,
				defaultValue: "15",
				unitOfMeasure: "°C",
				helpText: "Temperatura del agua fría de la red",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "diasMes",
				description: "Días del mes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 28,
				maxValue: 31,
				defaultValue: "30",
				helpText: "Número de días del mes para el cálculo",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "zonaClimatica",
				description: "Zona climática",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				defaultValue: "III",
				allowedValues: JSON.stringify(["I", "II", "III", "IV", "V", "VI"]),
				helpText: "Zona climática según irradiación solar en Ecuador",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "demandaDiaria",
				description: "Demanda diaria de ACS",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "l/día",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "demandaEnergeticaDiaria",
				description: "Demanda energética diaria",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "kWh/día",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "demandaEnergeticaMensual",
				description: "Demanda energética mensual",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "kWh/mes",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "contribucionSolarMinima",
				description: "Contribución solar mínima",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "fracción",
			}),
			parameterRepository.create({
				calculationTemplateId: demandaACSTemplate.id,
				name: "energiaSolarMinima",
				description: "Energía solar mínima requerida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "kWh/mes",
			}),
		];

		await parameterRepository.save(demandaACSParams);

		// Plantilla 2: Dimensionamiento de Sistema Solar Térmico
		const sistemasSolaresTemplate = templateRepository.create({
			name: "Dimensionamiento de Sistema Solar Térmico",
			description:
				"Dimensiona un sistema solar térmico para ACS según el método F-Chart de la NEC-HS-ER.",
			type: CalculationType.EFFICIENCY,
			targetProfession: ProfessionType.ARCHITECT,
			formula: `
        // Cálculo del área de captación necesaria
        const A_captacion = demandaEnergetica / (radiacionDisponible * rendimientoMedio * 0.9); // 0.9 factor para considerar pérdidas
        
        // Número de captadores necesarios
        const numCaptadores = Math.ceil(A_captacion / areaCaptador);
        
        // Área total de captación
        const A_total = numCaptadores * areaCaptador;
        
        // Dimensionamiento del acumulador
        const V_min = 50 * A_total; // Mínimo según norma: 50 < V/A < 180
        const V_max = 180 * A_total; // Máximo según norma
        
        // Volumen recomendado según demanda diaria
        const V_recomendado = 0.8 * demandaDiaria; // 0.8*M ≤ V ≤ 1.2*M
        
        // Volumen final del acumulador (respetando límites)
        let V_acumulador = V_recomendado;
        if (V_acumulador < V_min) {
          V_acumulador = V_min;
        } else if (V_acumulador > V_max) {
          V_acumulador = V_max;
        }
        
        // Dimensionamiento del intercambiador
        const potenciaIntercambiador = 500 * A_total; // W
        
        // Cálculo de la fracción solar (método simplificado)
        const coeficienteMedio = rendimientoMedio * 0.9; // Eficiencia global del sistema
        const aporteSolar = A_total * radiacionDisponible * coeficienteMedio; // kWh/mes
        const fraccionSolar = aporteSolar / demandaEnergetica;
        
        // Volumen del vaso de expansión (aproximado)
        const volumenCircuito = 1.5 * A_total; // 1.5 litros por m2 de captador (aproximado)
        const Ce = 0.065; // Coeficiente de expansión para mezcla anticongelante
        const Cpre = 2; // Coeficiente de presión típico
        const vasoExpansion = (volumenCircuito * Ce * Cpre) + (2 * numCaptadores); // 2 litros por captador como volumen de vapor
        
        return {
          areaCaptacionNecesaria: A_captacion,
          areaCaptacionTotal: A_total,
          numeroCaptadores: numCaptadores,
          volumenMinAcumulador: V_min,
          volumenMaxAcumulador: V_max,
          volumenRecomendado: V_recomendado,
          volumenFinalAcumulador: V_acumulador,
          potenciaIntercambiador: potenciaIntercambiador / 1000, // kW
          fraccionSolar: fraccionSolar,
          volumenVasoExpansion: vasoExpansion
        };
      `,
			necReference: "NEC-HS-ER, Sección 1.5",
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
				"energías renovables",
				"solar térmica",
				"F-Chart",
				"dimensionamiento",
				"NEC-HS-ER",
			],
		});

		await templateRepository.save(sistemasSolaresTemplate);

		// Parámetros para plantilla de Dimensionamiento de Sistema Solar
		const sistemasSolaresParams = [
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "demandaEnergetica",
				description: "Demanda energética mensual",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 10,
				defaultValue: "300",
				unitOfMeasure: "kWh/mes",
				helpText:
					"Demanda energética mensual para agua caliente sanitaria (desde cálculo previo)",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "demandaDiaria",
				description: "Demanda diaria de ACS",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 10,
				defaultValue: "112",
				unitOfMeasure: "l/día",
				helpText: "Demanda diaria de agua caliente sanitaria a 60°C",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "radiacionDisponible",
				description: "Radiación solar disponible",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 2,
				maxValue: 7,
				defaultValue: "4.5",
				unitOfMeasure: "kWh/m²·día",
				helpText: "Radiación solar promedio diaria en el plano del captador",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "rendimientoMedio",
				description: "Rendimiento medio del captador",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.3,
				maxValue: 0.8,
				defaultValue: "0.45",
				helpText: "Rendimiento medio del captador solar en condiciones reales",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "areaCaptador",
				description: "Área del captador unitario",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 1,
				maxValue: 3,
				defaultValue: "2.0",
				unitOfMeasure: "m²",
				helpText: "Área de apertura de un captador individual",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "areaCaptacionNecesaria",
				description: "Área de captación necesaria",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "areaCaptacionTotal",
				description: "Área de captación total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "numeroCaptadores",
				description: "Número de captadores",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "volumenMinAcumulador",
				description: "Volumen mínimo del acumulador",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "l",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "volumenMaxAcumulador",
				description: "Volumen máximo del acumulador",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "l",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "volumenRecomendado",
				description: "Volumen recomendado según demanda",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "l",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "volumenFinalAcumulador",
				description: "Volumen final del acumulador",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "l",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "potenciaIntercambiador",
				description: "Potencia del intercambiador",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "kW",
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "fraccionSolar",
				description: "Fracción solar estimada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
			}),
			parameterRepository.create({
				calculationTemplateId: sistemasSolaresTemplate.id,
				name: "volumenVasoExpansion",
				description: "Volumen del vaso de expansión",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "l",
			}),
		];

		await parameterRepository.save(sistemasSolaresParams);

		console.log("Plantillas de energías renovables creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de energías renovables:", error);
	} finally {
		if (shouldCloseConnection) {
			await connection.destroy();
		}
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedEnergiasRenovablesTemplates()
		.then(() =>
			console.log("Seeding de plantillas de energías renovables completado")
		)
		.catch((error) =>
			console.error("Error en seeding de energías renovables:", error)
		);
}
