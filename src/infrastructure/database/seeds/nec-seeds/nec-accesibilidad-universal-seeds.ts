// src/infrastructure/database/seeds/nec-seeds/nec-accesibilidad-universal-seeds.ts
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
 * Semillas para plantillas de cálculo de accesibilidad universal (NEC-HS-AU)
 */
export async function seedAccesibilidadUniversalTemplates() {
	const connection = AppDataSource.getInstance();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	console.log(
		"♿ Creando plantillas de Accesibilidad Universal (NEC-HS-AU)..."
	);

	// Verificar si ya existen plantillas con tag NEC-HS-AU
	const existingCount = await templateRepository.count({
		where: {
			tags: In(["NEC-HS-AU"]),
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de Accesibilidad Universal. Omitiendo...`
		);
		return;
	}

	try {
		// 1. PLANTILLA: CÁLCULO DE RAMPAS ACCESIBLES
		const rampasAccesiblesTemplate = templateRepository.create({
			name: "Cálculo de Rampas Accesibles (NEC-HS-AU)",
			description:
				"Diseña rampas accesibles según los requisitos de la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.ARCHITECTURE,
			targetProfession: ProfessionType.ARCHITECT,
			formula: `
        // 1. Cálculo de pendiente de la rampa
        const pendientePorcentaje = (alturaRampa / longitudHorizontal) * 100;
        
        // 2. Verificación de pendiente según normativa
        let pendienteMaxima;
        let cumplePendiente;
        
        if (longitudHorizontal <= 3000) {
          pendienteMaxima = 12;
        } else if (longitudHorizontal <= 10000) {
          pendienteMaxima = 8;
        } else {
          pendienteMaxima = 8;
        }
        
        cumplePendiente = pendientePorcentaje <= pendienteMaxima;
        
        // 3. Verificación de pendiente transversal
        const cumplePendienteTransversal = pendienteTransversal <= 2;
        
        // 4. Verificación de longitud máxima sin descanso
        const cumpleLongitudMaxima = longitudHorizontal <= 10000;
        
        // 5. Verificación del ancho mínimo
        const cumpleAnchoMinimo = anchoRampa >= 1200;
        
        // 6. Cálculo de descansos necesarios
        const descansosPorLongitud = Math.floor(longitudHorizontal / 10000);
        
        // 7. Cálculo de área mínima de descanso
        const areaDescansoMinima = 1200 * 1500;
        
        // 8. Verificación de requisitos para pasamanos
        const requiereDobleBaranda = alturaRampa > 150; // mm
        
        // 9. Resumen de cumplimiento
        const cumplimientoTotal = 
          cumplePendiente && 
          cumplePendienteTransversal && 
          cumpleLongitudMaxima && 
          cumpleAnchoMinimo;
        
        return {
          pendientePorcentaje,
          pendienteMaxima,
          cumplePendiente,
          cumplePendienteTransversal,
          cumpleLongitudMaxima,
          cumpleAnchoMinimo,
          descansosPorLongitud,
          areaDescansoMinima,
          requiereDobleBaranda,
          cumplimientoTotal
        };
      `,
			necReference: "NEC-HS-AU, Sección 1",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-HS-AU", "accesibilidad", "rampas", "discapacidad"],
			shareLevel: "public",
		});

		await templateRepository.save(rampasAccesiblesTemplate);

		// Parámetros para rampas accesibles
		const rampasAccesiblesParams = [
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "alturaRampa",
				description: "Altura a salvar por la rampa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 10,
				defaultValue: "300",
				unitOfMeasure: "mm",
				helpText: "Altura vertical que debe salvar la rampa",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "longitudHorizontal",
				description: "Longitud horizontal de la rampa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 300,
				defaultValue: "3600",
				unitOfMeasure: "mm",
				helpText: "Longitud horizontal proyectada de la rampa",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "pendienteTransversal",
				description: "Pendiente transversal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0,
				maxValue: 5,
				defaultValue: "1",
				unitOfMeasure: "%",
				helpText: "Pendiente transversal de la rampa (máximo 2%)",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "anchoRampa",
				description: "Ancho de la rampa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 900,
				defaultValue: "1200",
				unitOfMeasure: "mm",
				helpText: "Ancho libre entre pasamanos (mínimo 1200 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "pendientePorcentaje",
				description: "Pendiente calculada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 5,
				unitOfMeasure: "%",
				helpText: "Pendiente calculada de la rampa",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "pendienteMaxima",
				description: "Pendiente máxima permitida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "%",
				helpText: "Pendiente máxima permitida según normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "cumplePendiente",
				description: "¿Cumple pendiente?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				helpText: "Indica si la pendiente cumple con la normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "cumplePendienteTransversal",
				description: "¿Cumple pendiente transversal?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				helpText: "Indica si la pendiente transversal cumple con la normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "cumpleLongitudMaxima",
				description: "¿Cumple longitud máxima?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				helpText: "Indica si la longitud de tramo cumple con la normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "cumpleAnchoMinimo",
				description: "¿Cumple ancho mínimo?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				helpText: "Indica si el ancho cumple con la normativa",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "descansosPorLongitud",
				description: "Número de descansos necesarios",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				helpText: "Cantidad de descansos necesarios por longitud",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "areaDescansoMinima",
				description: "Área mínima de descanso",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "mm²",
				helpText: "Área mínima requerida para descansos",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "requiereDobleBaranda",
				description: "¿Requiere doble baranda?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				helpText: "Indica si se requiere doble baranda",
			}),
			parameterRepository.create({
				calculationTemplateId: rampasAccesiblesTemplate.id,
				name: "cumplimientoTotal",
				description: "¿Cumple todos los requisitos?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				helpText: "Indica si cumple con todos los requisitos normativos",
			}),
		];

		await parameterRepository.save(rampasAccesiblesParams);

		// 2. PLANTILLA: DIMENSIONAMIENTO DE SERVICIOS HIGIÉNICOS ACCESIBLES
		const sanitariosAccesiblesTemplate = templateRepository.create({
			name: "Dimensionamiento de Servicios Higiénicos Accesibles (NEC-HS-AU)",
			description:
				"Calcula dimensiones y requisitos para servicios higiénicos accesibles según la NEC.",
			type: CalculationType.ARCHITECTURE,
			targetProfession: ProfessionType.ARCHITECT,
			formula: `
        // Verificación de dimensiones mínimas
        const opcion1 = longitudCabina === 2300 && anchoCabina === 1650;
        const opcion2 = longitudCabina === 2100 && anchoCabina === 1650;
        const cumpleDimensionesMinimas = opcion1 || opcion2;
        
        // Verificación de área para giro de silla de ruedas
        const diametroGiro = 1500; // mm
        const areaGiro = Math.PI * Math.pow(diametroGiro/2, 2);
        const areaDisponible = longitudCabina * anchoCabina;
        const cumpleAreaGiro = areaDisponible >= areaGiro && 
                              Math.min(longitudCabina, anchoCabina) >= diametroGiro;
        
        // Verificación de altura del inodoro
        const cumpleAlturaInodoro = alturaInodoro >= 450 && alturaInodoro <= 500;
        
        // Verificación de altura del lavamanos
        const cumpleAlturaLavamanos = alturaLavamanos === 850;
        
        // Verificación de espacio libre lateral
        const cumpleEspacioLateral = espacioLateralInodoro >= 900;
        
        // Verificación de distancia eje-pared
        const cumpleDistanciaEje = distanciaEjePared === 500;
        
        // Verificación de barras de apoyo
        const cumpleBarrasApoyo = 
          alturaBarra >= 700 && alturaBarra <= 750 &&
          longitudBarraLateral >= 800 &&
          longitudBarraPosterior >= 600;
        
        // Verificación de espacio libre bajo lavamanos
        const cumpleEspacioLavamanos = 
          espacioInferiorLavamanos >= 700 &&
          profundidadLavamanos >= 600;
        
        // Cálculo de espacio total necesario con puerta
        const espacioTotalNecesario = {
          longitudTotal: longitudCabina + espacioAperturaPuerta,
          anchoTotal: anchoCabina
        };
        
        // Verificación total
        const cumplimientoTotal = 
          cumpleDimensionesMinimas && 
          cumpleAreaGiro && 
          cumpleAlturaInodoro && 
          cumpleAlturaLavamanos && 
          cumpleEspacioLateral && 
          cumpleDistanciaEje && 
          cumpleBarrasApoyo &&
          cumpleEspacioLavamanos;
        
        return {
          cumpleDimensionesMinimas,
          areaGiro,
          areaDisponible,
          cumpleAreaGiro,
          cumpleAlturaInodoro,
          cumpleAlturaLavamanos,
          cumpleEspacioLateral,
          cumpleDistanciaEje,
          cumpleBarrasApoyo,
          cumpleEspacioLavamanos,
          espacioTotalNecesario,
          cumplimientoTotal
        };
      `,
			necReference: "NEC-HS-AU, Sección 2.4",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-HS-AU", "accesibilidad", "baños", "servicios higiénicos"],
			shareLevel: "public",
		});

		await templateRepository.save(sanitariosAccesiblesTemplate);

		// Parámetros para sanitarios accesibles
		const sanitariosAccesiblesParams = [
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "longitudCabina",
				description: "Longitud de la cabina",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1500,
				defaultValue: "2300",
				unitOfMeasure: "mm",
				helpText: "Longitud de la cabina sanitaria (2300 mm o 2100 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "anchoCabina",
				description: "Ancho de la cabina",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1500,
				defaultValue: "1650",
				unitOfMeasure: "mm",
				helpText: "Ancho de la cabina sanitaria (mínimo 1650 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "alturaInodoro",
				description: "Altura del inodoro",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 400,
				maxValue: 550,
				defaultValue: "450",
				unitOfMeasure: "mm",
				helpText: "Altura del inodoro desde el nivel del piso (450-500 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "alturaLavamanos",
				description: "Altura del lavamanos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 800,
				maxValue: 900,
				defaultValue: "850",
				unitOfMeasure: "mm",
				helpText: "Altura del lavamanos desde el nivel del piso (850 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "espacioLateralInodoro",
				description: "Espacio lateral del inodoro",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 800,
				defaultValue: "900",
				unitOfMeasure: "mm",
				helpText: "Espacio libre lateral para transferencia (mínimo 900 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "distanciaEjePared",
				description: "Distancia del eje a la pared",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 400,
				maxValue: 600,
				defaultValue: "500",
				unitOfMeasure: "mm",
				helpText: "Distancia desde el eje del inodoro a la pared (500 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "alturaBarra",
				description: "Altura de las barras de apoyo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 650,
				maxValue: 800,
				defaultValue: "750",
				unitOfMeasure: "mm",
				helpText: "Altura de las barras de apoyo (700-750 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "longitudBarraLateral",
				description: "Longitud de la barra lateral",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 8,
				isRequired: true,
				minValue: 600,
				defaultValue: "800",
				unitOfMeasure: "mm",
				helpText: "Longitud de la barra de apoyo lateral (mínimo 800 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "longitudBarraPosterior",
				description: "Longitud de la barra posterior",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 9,
				isRequired: true,
				minValue: 500,
				defaultValue: "600",
				unitOfMeasure: "mm",
				helpText: "Longitud de la barra de apoyo posterior (mínimo 600 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "espacioInferiorLavamanos",
				description: "Espacio inferior del lavamanos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 10,
				isRequired: true,
				minValue: 600,
				defaultValue: "700",
				unitOfMeasure: "mm",
				helpText: "Altura libre bajo el lavamanos (mínimo 700 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "profundidadLavamanos",
				description: "Profundidad del lavamanos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 11,
				isRequired: true,
				minValue: 500,
				defaultValue: "600",
				unitOfMeasure: "mm",
				helpText:
					"Profundidad del espacio libre bajo el lavamanos (mínimo 600 mm)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "espacioAperturaPuerta",
				description: "Espacio para apertura de puerta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 12,
				isRequired: true,
				minValue: 0,
				defaultValue: "900",
				unitOfMeasure: "mm",
				helpText:
					"Espacio adicional para apertura de puerta (0 si es corredera)",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "cumpleDimensionesMinimas",
				description: "¿Cumple dimensiones mínimas?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				helpText: "Indica si cumple con las dimensiones mínimas de la cabina",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "areaGiro",
				description: "Área necesaria para giro",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				unitOfMeasure: "mm²",
				helpText: "Área necesaria para un giro completo en silla de ruedas",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "areaDisponible",
				description: "Área disponible",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "mm²",
				helpText: "Área disponible en la cabina",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "cumpleAreaGiro",
				description: "¿Cumple área de giro?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 16,
				helpText:
					"Indica si cumple con el área mínima para giro en silla de ruedas",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "cumpleAlturaInodoro",
				description: "¿Cumple altura de inodoro?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 17,
				helpText: "Indica si cumple con la altura reglamentaria del inodoro",
			}),
			parameterRepository.create({
				calculationTemplateId: sanitariosAccesiblesTemplate.id,
				name: "cumplimientoTotal",
				description: "¿Cumple todos los requisitos?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 18,
				helpText: "Indica si cumple con todos los requisitos normativos",
			}),
		];

		await parameterRepository.save(sanitariosAccesiblesParams);

		console.log(
			"✅ Plantillas de Accesibilidad Universal (NEC-HS-AU) creadas exitosamente"
		);
	} catch (error) {
		console.error(
			"❌ Error al crear plantillas de Accesibilidad Universal:",
			error
		);
		throw error;
	}
}