// src/infrastructure/database/seeds/nec-seeds/nec-diseno-sismico-seeds.ts
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
 * Semillas para plantillas de cálculo de diseño sísmico (NEC-SE-DS)
 */
export async function seedDisenoSismicoTemplates() {
	const connection = AppDataSource.getInstance();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	console.log("📊 Creando plantillas de cálculo sísmico (NEC-SE-DS)...");

	// Verificar si ya existen plantillas con tag NEC-SE-DS
	const existingCount = await templateRepository.count({
		where: {
			tags: In(["NEC-SE-DS"]),
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de Diseño Sísmico. Omitiendo...`
		);
		return;
	}

	try {
		// 1. PLANTILLA: CORTANTE BASAL DE DISEÑO
		const cortanteBasalTemplate = templateRepository.create({
			name: "Cortante Basal de Diseño (NEC-SE-DS)",
			description:
				"Calcula el cortante basal de diseño según la Norma Ecuatoriana de la Construcción para diseño sismo-resistente.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
                // Cálculo del espectro de aceleración
                let eta;
                if (region === "Costa" && provincia !== "Esmeraldas") {
                    eta = 1.80;
                } else if (region === "Sierra" || region === "Galapagos" || provincia === "Esmeraldas") {
                    eta = 2.48;
                } else if (region === "Oriente") {
                    eta = 2.60;
                }
                
                // Período límite (Tc)
                const Tc = 0.55 * Fs * (Fd/Fa);
                
                // Factor r (1.0 para todos los suelos excepto tipo E)
                const r = tipoSuelo === "E" ? 1.5 : 1.0;
                
                // Cálculo del espectro de diseño
                let Sa;
                if (T <= Tc) {
                    Sa = eta * Z * Fa;
                } else {
                    Sa = eta * Z * Fa * Math.pow(Tc/T, r);
                }
                
                // Cortante basal
                const V = (I * Sa * W) / (R * PhiP * PhiE);
                
                // Peso sísmico efectivo ajustado si hay mezanine
                const Weff = conMezanine ? W + 0.25 * L : W;
                
                // Cortante basal final
                const cortanteBasal = (I * Sa * Weff) / (R * PhiP * PhiE);
                
                return {
                    cortanteBasal,
                    Sa,
                    factorUsado: I,
                    factorReduccion: R,
                    irregularidadPlanta: PhiP,
                    irregularidadElevacion: PhiE,
                    pesoReactivo: Weff,
                    periodoLimite: Tc,
                    factorAmplificacion: eta
                };
            `,
			necReference: "NEC-SE-DS, Sección 6.3.2",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-DS", "sísmica", "estructural", "cortante basal"],
			shareLevel: "public",
		});

		await templateRepository.save(cortanteBasalTemplate);

		// Parámetros para cortante basal
		const cortanteBasalParams = [
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "Z",
				description: "Factor de zona sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.15,
				maxValue: 0.5,
				defaultValue: "0.4",
				helpText:
					"Factor que depende de la ubicación geográfica del proyecto (0.15 a 0.50)",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "I",
				description: "Factor de importancia",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				defaultValue: "1.0",
				minValue: 1.0,
				maxValue: 1.5,
				helpText:
					"1.0 para estructuras comunes, 1.3 para estructuras importantes, 1.5 para estructuras esenciales",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "R",
				description: "Factor de reducción de resistencia sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 1,
				maxValue: 8,
				defaultValue: "6",
				helpText: "Depende del sistema estructural, entre 1 y 8",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "T",
				description: "Período de vibración",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.1,
				maxValue: 4.0,
				defaultValue: "0.5",
				unitOfMeasure: "s",
				helpText: "Período fundamental de la estructura en segundos",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "PhiP",
				description: "Coeficiente de regularidad en planta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0.9,
				maxValue: 1.0,
				defaultValue: "1.0",
				helpText: "1.0 para edificios regulares, 0.9 para irregulares",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "PhiE",
				description: "Coeficiente de regularidad en elevación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0.9,
				maxValue: 1.0,
				defaultValue: "1.0",
				helpText: "1.0 para edificios regulares, 0.9 para irregulares",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "W",
				description: "Carga reactiva (carga muerta total)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 1,
				defaultValue: "1000",
				unitOfMeasure: "kN",
				helpText: "Carga muerta total de la estructura",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "L",
				description: "Carga viva (sobrecarga)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: false,
				minValue: 0,
				defaultValue: "0",
				unitOfMeasure: "kN",
				helpText: "Carga viva total de la estructura (opcional)",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "conMezanine",
				description: "¿Incluye mezanines?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				defaultValue: "false",
				helpText:
					"Seleccione si la estructura tiene mezanines (entrepiso parcial)",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "Fa",
				description: "Coeficiente de amplificación de suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 0.5,
				maxValue: 2.0,
				defaultValue: "1.2",
				helpText:
					"Coeficiente de amplificación de espectro para períodos cortos",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "Fd",
				description: "Coeficiente de amplificación de suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 11,
				isRequired: true,
				minValue: 0.5,
				maxValue: 2.0,
				defaultValue: "1.15",
				helpText: "Coeficiente de amplificación para desplazamientos",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "Fs",
				description: "Coeficiente de comportamiento no lineal de suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 12,
				isRequired: true,
				minValue: 0.5,
				maxValue: 2.0,
				defaultValue: "1.0",
				helpText: "Coeficiente de comportamiento no lineal del suelo",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "tipoSuelo",
				description: "Tipo de suelo",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 13,
				isRequired: true,
				defaultValue: "C",
				allowedValues: JSON.stringify(["A", "B", "C", "D", "E", "F"]),
				helpText: "Tipo de suelo según clasificación NEC",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "region",
				description: "Región geográfica",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 14,
				isRequired: true,
				defaultValue: "Sierra",
				allowedValues: JSON.stringify([
					"Costa",
					"Sierra",
					"Oriente",
					"Galapagos",
				]),
				helpText: "Región geográfica para el factor η",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "provincia",
				description: "Provincia",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 15,
				isRequired: false,
				defaultValue: "",
				allowedValues: JSON.stringify([
					"",
					"Azuay",
					"Bolívar",
					"Cañar",
					"Carchi",
					"Chimborazo",
					"Cotopaxi",
					"El Oro",
					"Esmeraldas",
					"Galápagos",
					"Guayas",
					"Imbabura",
					"Loja",
					"Los Ríos",
					"Manabí",
					"Morona Santiago",
					"Napo",
					"Orellana",
					"Pastaza",
					"Pichincha",
					"Santa Elena",
					"Santo Domingo",
					"Sucumbíos",
					"Tungurahua",
					"Zamora Chinchipe",
				]),
				helpText: "Provincia (requerido para región Costa)",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "Sa",
				description: "Aceleración espectral",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				unitOfMeasure: "g",
			}),
			parameterRepository.create({
				calculationTemplateId: cortanteBasalTemplate.id,
				name: "cortanteBasal",
				description: "Cortante basal de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				unitOfMeasure: "kN",
			}),
		];

		await parameterRepository.save(cortanteBasalParams);

		// 2. PLANTILLA: ESPECTRO DE DISEÑO
		const espectroDiseno = templateRepository.create({
			name: "Espectro Elástico de Diseño (NEC-SE-DS)",
			description:
				"Calcula el espectro elástico de diseño según la Norma Ecuatoriana de la Construcción para diferentes períodos.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
                // Factor η según región geográfica
                let eta;
                if (region === "Costa" && provincia !== "Esmeraldas") {
                    eta = 1.80;
                } else if (region === "Sierra" || region === "Galapagos" || provincia === "Esmeraldas") {
                    eta = 2.48;
                } else if (region === "Oriente") {
                    eta = 2.60;
                }
                
                // Período límite de retorno Tc
                const Tc = 0.55 * Fs * (Fd/Fa);
                
                // Factor r (1.0 para todos los suelos excepto tipo E)
                const r = tipoSuelo === "E" ? 1.5 : 1.0;
                
                // Cálculo de los puntos del espectro
                const puntos = [];
                const numPuntos = 100; // Número de puntos para graficar el espectro
                const Tmax = 4.0; // Período máximo para el espectro
                
                for (let i = 0; i <= numPuntos; i++) {
                    const T = (Tmax * i) / numPuntos;
                    let Sa;
                    
                    if (T <= Tc) {
                        Sa = eta * Z * Fa; // Meseta del espectro
                    } else {
                        Sa = eta * Z * Fa * Math.pow(Tc/T, r); // Parte descendente del espectro
                    }
                    
                    puntos.push({periodo: T, aceleracion: Sa});
                }
                
                // Puntos característicos
                const Sa0 = eta * Z * Fa; // Aceleración en la meseta
                const Tl = 2.4 * Fd; // Período límite para espectro de desplazamientos
                
                return {
                    espectro: puntos,
                    Tc,
                    Tl,
                    Sa0,
                    periodoMeseta: Tc,
                    factorZona: Z,
                    factorSuelo: Fa,
                    factorAmplificacion: eta
                };
            `,
			necReference: "NEC-SE-DS, Sección 3.3",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-DS", "sísmica", "estructural", "espectro de diseño"],
			shareLevel: "public",
		});

		await templateRepository.save(espectroDiseno);

		// Parámetros para espectro de diseño
		const espectroParameters = [
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "Z",
				description: "Factor de zona sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.15,
				maxValue: 0.5,
				defaultValue: "0.4",
				helpText:
					"Factor que depende de la ubicación geográfica del proyecto (0.15 a 0.50)",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "Fa",
				description: "Coeficiente de amplificación de suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.5,
				maxValue: 2.0,
				defaultValue: "1.2",
				helpText:
					"Coeficiente de amplificación de espectro para períodos cortos",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "Fd",
				description: "Coeficiente de amplificación de suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.5,
				maxValue: 2.0,
				defaultValue: "1.15",
				helpText: "Coeficiente de amplificación para desplazamientos",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "Fs",
				description: "Coeficiente de comportamiento no lineal de suelo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.5,
				maxValue: 2.0,
				defaultValue: "1.0",
				helpText: "Coeficiente de comportamiento no lineal del suelo",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "tipoSuelo",
				description: "Tipo de suelo",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				defaultValue: "C",
				allowedValues: JSON.stringify(["A", "B", "C", "D", "E", "F"]),
				helpText: "Tipo de suelo según clasificación NEC",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "region",
				description: "Región geográfica",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				defaultValue: "Sierra",
				allowedValues: JSON.stringify([
					"Costa",
					"Sierra",
					"Oriente",
					"Galapagos",
				]),
				helpText: "Región geográfica para el factor η",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "provincia",
				description: "Provincia",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: false,
				defaultValue: "",
				allowedValues: JSON.stringify([
					"",
					"Azuay",
					"Bolívar",
					"Cañar",
					"Carchi",
					"Chimborazo",
					"Cotopaxi",
					"El Oro",
					"Esmeraldas",
					"Galápagos",
					"Guayas",
					"Imbabura",
					"Loja",
					"Los Ríos",
					"Manabí",
					"Morona Santiago",
					"Napo",
					"Orellana",
					"Pastaza",
					"Pichincha",
					"Santa Elena",
					"Santo Domingo",
					"Sucumbíos",
					"Tungurahua",
					"Zamora Chinchipe",
				]),
				helpText: "Provincia (requerido para región Costa)",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "Tc",
				description: "Período límite para meseta espectral",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "s",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "Tl",
				description: "Período límite para espectro de desplazamientos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "s",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "Sa0",
				description: "Aceleración en la meseta espectral",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "g",
			}),
			parameterRepository.create({
				calculationTemplateId: espectroDiseno.id,
				name: "espectro",
				description: "Puntos del espectro",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
			}),
		];

		await parameterRepository.save(espectroParameters);

		// 3. PLANTILLA: PERÍODO FUNDAMENTAL APROXIMADO
		const periodoFundamental = templateRepository.create({
			name: "Período Fundamental Aproximado (NEC-SE-DS)",
			description:
				"Estima el período fundamental de vibración de la estructura según el método simplificado de la NEC.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
                // Cálculo del período fundamental aproximado según Método 1 NEC-SE-DS
                let Ct, alpha;
                
                switch(sistemaEstructural) {
                    case "portico_acero_sin_arriostramientos":
                        Ct = 0.072;
                        alpha = 0.8;
                        break;
                    case "portico_acero_con_arriostramientos":
                        Ct = 0.073;
                        alpha = 0.75;
                        break;
                    case "portico_hormigon_sin_muros":
                        Ct = 0.055;
                        alpha = 0.9;
                        break;
                    case "portico_hormigon_con_muros":
                    case "mamposteria":
                        Ct = 0.055;
                        alpha = 0.75;
                        break;
                    default:
                        Ct = 0.055;
                        alpha = 0.75;
                }
                
                // Para estructuras con muros estructurales, se puede usar el método de Cw
                if (sistemaEstructural === "portico_hormigon_con_muros" || sistemaEstructural === "mamposteria") {
                    if (usarMetodoCw && AB > 0 && sumatoriaMuros > 0) {
                        const Cw = (1/AB) * sumatoriaMuros;
                        Ct = 0.0055 / Math.sqrt(Cw);
                    }
                }
                
                // Ta = Ct * hn^α
                const Ta = Ct * Math.pow(alturaEdificio, alpha);
                
                // Limitación según tipo de suelo
                let Tmax;
                if (tipoSuelo === "C" || tipoSuelo === "D" || tipoSuelo === "E") {
                    Tmax = 1.3 * Ta; // Para tipo de suelo C, D o E
                } else {
                    Tmax = 1.1 * Ta; // Para tipo de suelo A o B
                }
                
                // Si se ha proporcionado un T alternativo (por análisis modal), limitarlo
                const Tfinal = T > 0 ? Math.min(T, Tmax) : Ta;
                
                return {
                    periodoFundamental: Ta,
                    periodoMaximo: Tmax,
                    periodoFinal: Tfinal,
                    coeficienteCt: Ct,
                    exponenteAlpha: alpha,
                    clasificacionSistema: sistemaEstructural
                };
            `,
			necReference: "NEC-SE-DS, Sección 6.3.3",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-DS", "sísmica", "estructural", "período fundamental"],
			shareLevel: "public",
		});

		await templateRepository.save(periodoFundamental);

		// Parámetros para período fundamental
		const periodoParameters = [
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "sistemaEstructural",
				description: "Sistema estructural",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				defaultValue: "portico_hormigon_sin_muros",
				allowedValues: JSON.stringify([
					"portico_acero_sin_arriostramientos",
					"portico_acero_con_arriostramientos",
					"portico_hormigon_sin_muros",
					"portico_hormigon_con_muros",
					"mamposteria",
				]),
				helpText: "Tipo de sistema estructural según clasificación NEC",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "alturaEdificio",
				description: "Altura de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 3,
				maxValue: 200,
				defaultValue: "12",
				unitOfMeasure: "m",
				helpText:
					"Altura total de la edificación desde el nivel base hasta el último piso",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "tipoSuelo",
				description: "Tipo de suelo",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				defaultValue: "C",
				allowedValues: JSON.stringify(["A", "B", "C", "D", "E", "F"]),
				helpText: "Tipo de suelo según clasificación NEC",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "T",
				description: "Período calculado por método 2 (opcional)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: false,
				minValue: 0,
				unitOfMeasure: "s",
				helpText: "Si se conoce el periodo por análisis modal, ingresar aquí",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "usarMetodoCw",
				description: "Usar método de Cw para muros estructurales",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: false,
				defaultValue: "false",
				helpText:
					"Activa el cálculo mediante parámetro Cw para muros estructurales",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "AB",
				description: "Área de la edificación en planta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: false,
				minValue: 0,
				defaultValue: "0",
				unitOfMeasure: "m²",
				helpText:
					"Área en planta (solo para estructuras con muros estructurales)",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "sumatoriaMuros",
				description: "Sumatoria de parámetros de muros estructurales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: false,
				minValue: 0,
				defaultValue: "0",
				helpText: "Suma de (Awi×(hi/lwi)²) para todos los muros",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "periodoFundamental",
				description: "Período fundamental aproximado (Ta)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				isRequired: false,
				unitOfMeasure: "s",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "periodoMaximo",
				description: "Período máximo permitido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				isRequired: false,
				unitOfMeasure: "s",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "periodoFinal",
				description: "Período de diseño final",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				isRequired: false,
				unitOfMeasure: "s",
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "coeficienteCt",
				description: "Coeficiente Ct utilizado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				isRequired: false,
			}),
			parameterRepository.create({
				calculationTemplateId: periodoFundamental.id,
				name: "exponenteAlpha",
				description: "Exponente Alpha utilizado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				isRequired: false,
			}),
		];

		await parameterRepository.save(periodoParameters);

		// 4. PLANTILLA: DERIVAS DE PISO
		const derivasPiso = templateRepository.create({
			name: "Verificación de Derivas de Piso (NEC-SE-DS)",
			description:
				"Verificación de las derivas inelásticas de piso según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
                // Cálculo de derivas inelásticas máximas
                const derivasInelasticas = [];
                const derivasElasticas = [];
                const cumplimientoValores = [];
                
                // Deriva máxima permitida según NEC-SE-DS
                let deltaPermitido;
                if (sistemaEstructural === "mamposteria") {
                    deltaPermitido = 0.01; // Para mampostería
                } else {
                    deltaPermitido = 0.02; // Para hormigón armado, acero o madera
                }
                
                // Calcular deriva inelástica para cada piso
                for (let i = 0; i < desplazamientos.length; i++) {
                    let deltaE;
                    
                    if (i === 0) {
                        // Para el primer piso, la deriva es el desplazamiento dividido por altura
                        deltaE = desplazamientos[i] / alturasPiso[i];
                    } else {
                        // Para pisos superiores, la deriva es la diferencia de desplazamientos dividida por altura
                        deltaE = (desplazamientos[i] - desplazamientos[i-1]) / alturasPiso[i];
                    }
                    
                    derivasElasticas.push(deltaE);
                    
                    // Deriva inelástica según NEC-SE-DS
                    const deltaM = 0.75 * R * deltaE;
                    derivasInelasticas.push(deltaM);
                    cumplimientoValores.push(deltaM <= deltaPermitido);
                }
                
                // Determinar si todas las derivas cumplen
                const cumplenTodas = cumplimientoValores.every(cumple => cumple);
                
                return {
                    derivasElasticas,
                    derivasInelasticas,
                    derivaMaximaPermitida: deltaPermitido,
                    cumplimiento: cumplimientoValores,
                    cumplimientoGeneral: cumplenTodas
                };
            `,
			necReference: "NEC-SE-DS, Sección 4.2.2",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-DS", "sísmica", "estructural", "derivas de piso"],
			shareLevel: "public",
		});

		await templateRepository.save(derivasPiso);

		// Parámetros para derivas de piso
		const derivasParameters = [
			parameterRepository.create({
				calculationTemplateId: derivasPiso.id,
				name: "desplazamientos",
				description: "Desplazamientos elásticos de cada piso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				defaultValue: JSON.stringify([10, 18, 24, 28]),
				unitOfMeasure: "mm",
				helpText:
					"Ingrese los desplazamientos elásticos de cada piso en milímetros, de abajo hacia arriba",
			}),
			parameterRepository.create({
				calculationTemplateId: derivasPiso.id,
				name: "alturasPiso",
				description: "Alturas de entrepiso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				defaultValue: JSON.stringify([3.0, 3.0, 3.0, 3.0]),
				unitOfMeasure: "m",
				helpText:
					"Ingrese las alturas de cada piso en metros, de abajo hacia arriba",
			}),
			parameterRepository.create({
				calculationTemplateId: derivasPiso.id,
				name: "R",
				description: "Factor de reducción de resistencia sísmica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 1,
				maxValue: 8,
				defaultValue: "6",
				helpText:
					"Factor de reducción de resistencia según el sistema estructural",
			}),
			parameterRepository.create({
				calculationTemplateId: derivasPiso.id,
				name: "sistemaEstructural",
				description: "Sistema estructural",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				defaultValue: "hormigon_armado",
				allowedValues: JSON.stringify([
					"hormigon_armado",
					"acero",
					"madera",
					"mamposteria",
				]),
				helpText: "Tipo de sistema estructural según clasificación NEC",
			}),
			parameterRepository.create({
				calculationTemplateId: derivasPiso.id,
				name: "derivasElasticas",
				description: "Derivas elásticas de piso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.OUTPUT,
				displayOrder: 5,
			}),
			parameterRepository.create({
				calculationTemplateId: derivasPiso.id,
				name: "derivasInelasticas",
				description: "Derivas inelásticas de piso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
			}),
			parameterRepository.create({
				calculationTemplateId: derivasPiso.id,
				name: "derivaMaximaPermitida",
				description: "Deriva máxima permitida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
			}),
			parameterRepository.create({
				calculationTemplateId: derivasPiso.id,
				name: "cumplimiento",
				description: "Cumplimiento por piso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
			}),
			parameterRepository.create({
				calculationTemplateId: derivasPiso.id,
				name: "cumplimientoGeneral",
				description: "Cumplimiento general",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
			}),
		];

		await parameterRepository.save(derivasParameters);

		// 5. PLANTILLA: DISTRIBUCIÓN DE FUERZAS SÍSMICAS
		const distribucionFuerzas = templateRepository.create({
			name: "Distribución Vertical de Fuerzas Sísmicas (NEC-SE-DS)",
			description:
				"Calcula la distribución vertical de fuerzas sísmicas según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
                // Cálculo de distribución vertical de fuerzas sísmicas
                const n = pesos.length; // Número de pisos
                const fuerzas = [];
                let sumatoriaWiHik = 0;
                
                // Cálculo de valor k según período
                let k;
                if (T <= 0.5) {
                    k = 1.0;
                } else if (T > 0.5 && T <= 2.5) {
                    k = 0.75 + 0.5 * T;
                } else {
                    k = 2.0;
                }
                
                // Calcular sumatoria de Wi * Hi^k
                for (let i = 0; i < n; i++) {
                    sumatoriaWiHik += pesos[i] * Math.pow(alturas[i], k);
                }
                
                // Calcular fuerza en cada nivel
                for (let i = 0; i < n; i++) {
                    const fx = (pesos[i] * Math.pow(alturas[i], k) / sumatoriaWiHik) * cortanteBasal;
                    fuerzas.push(fx);
                }
                
                // Calcular cortante de piso
                const cortantesPiso = [];
                for (let i = 0; i < n; i++) {
                    let cortantePiso = 0;
                    for (let j = i; j < n; j++) {
                        cortantePiso += fuerzas[j];
                    }
                    cortantesPiso.push(cortantePiso);
                }
                
                // Calcular momentos de volcamiento
                const momentosVolcamiento = [];
                for (let i = 0; i < n; i++) {
                    let momentoVolcamiento = 0;
                    for (let j = i; j < n; j++) {
                        momentoVolcamiento += fuerzas[j] * (alturas[j] - alturas[i]);
                    }
                    momentosVolcamiento.push(momentoVolcamiento);
                }
                
                return {
                    factorK: k,
                    fuerzasPorPiso: fuerzas,
                    cortantesPorPiso: cortantesPiso,
                    momentosVolcamiento,
                    sumatoriaPesos: pesos.reduce((sum, peso) => sum + peso, 0)
                };
            `,
			necReference: "NEC-SE-DS, Sección 6.3.5",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-DS", "sísmica", "estructural", "fuerzas sísmicas"],
			shareLevel: "public",
		});

		await templateRepository.save(distribucionFuerzas);

		// Parámetros para distribución de fuerzas
		const distribucionParameters = [
			parameterRepository.create({
				calculationTemplateId: distribucionFuerzas.id,
				name: "cortanteBasal",
				description: "Cortante basal de diseño",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1,
				defaultValue: "1000",
				unitOfMeasure: "kN",
				helpText: "Valor del cortante basal total calculado previamente",
			}),
			parameterRepository.create({
				calculationTemplateId: distribucionFuerzas.id,
				name: "pesos",
				description: "Pesos por piso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				defaultValue: JSON.stringify([500, 500, 400, 300]),
				unitOfMeasure: "kN",
				helpText:
					"Ingrese los pesos sísmicos de cada piso en kN, de abajo hacia arriba",
			}),
			parameterRepository.create({
				calculationTemplateId: distribucionFuerzas.id,
				name: "alturas",
				description: "Alturas acumuladas de cada piso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				defaultValue: JSON.stringify([3, 6, 9, 12]),
				unitOfMeasure: "m",
				helpText:
					"Ingrese las alturas acumuladas de cada piso en m, de abajo hacia arriba",
			}),
			parameterRepository.create({
				calculationTemplateId: distribucionFuerzas.id,
				name: "T",
				description: "Período fundamental de la estructura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.1,
				maxValue: 4.0,
				defaultValue: "0.5",
				unitOfMeasure: "s",
				helpText: "Período fundamental calculado previamente",
			}),
			parameterRepository.create({
				calculationTemplateId: distribucionFuerzas.id,
				name: "factorK",
				description: "Factor k para distribución de fuerzas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 5,
			}),
			parameterRepository.create({
				calculationTemplateId: distribucionFuerzas.id,
				name: "fuerzasPorPiso",
				description: "Fuerzas sísmicas por piso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: distribucionFuerzas.id,
				name: "cortantesPorPiso",
				description: "Cortantes por piso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: distribucionFuerzas.id,
				name: "momentosVolcamiento",
				description: "Momentos de volcamiento por piso",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "kN·m",
			}),
			parameterRepository.create({
				calculationTemplateId: distribucionFuerzas.id,
				name: "sumatoriaPesos",
				description: "Sumatoria de pesos totales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "kN",
			}),
		];

		await parameterRepository.save(distribucionParameters);

		console.log(
			"✅ Plantillas de Diseño Sísmico (NEC-SE-DS) creadas exitosamente"
		);
	} catch (error) {
		console.error("❌ Error al crear plantillas de Diseño Sísmico:", error);
		throw error;
	}
}
