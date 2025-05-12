// src/infrastructure/database/seeds/nec-seeds/nec-telecomunicaciones-seeds.ts
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
 * Semillas para plantillas de cálculo de infraestructura de telecomunicaciones (NEC-SB-TE)
 */
export async function seedTelecomunicacionesTemplates(connection = null) {
	// Si no se proporciona una conexión, obtenemos la instancia
	if (!connection) {
		connection = AppDataSource.getInstance();
	}

	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	console.log("📡 Creando plantillas de Telecomunicaciones (NEC-SB-TE)...");

	// Verificar si ya existen plantillas con tag NEC-SB-TE
	const existingCount = await templateRepository.count({
		where: {
			tags: In(["NEC-SB-TE"]),
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de Telecomunicaciones. Omitiendo...`
		);
		return;
	}

	try {
		// 1. PLANTILLA: DIMENSIONAMIENTO DE CUARTOS TÉCNICOS
		const cuartosTecnicosTemplate = templateRepository.create({
			name: "Dimensionamiento de Cuartos Técnicos ICCT (NEC-SB-TE)",
			description:
				"Calcula las dimensiones mínimas de cuartos técnicos para infraestructura de telecomunicaciones según la NEC.",
			type: CalculationType.TELECOMMUNICATIONS,
			targetProfession: ProfessionType.TELECOMMUNICATIONS_ENGINEER,
			formula: `
        // Determinar dimensiones para CCTI (Cuarto Común de Telecomunicaciones Inferior)
        let cctiLargo, cctiAncho, cctiAlto;
        let cctiArea, cctiVolumen;
        
        if (numeroPisos < 4) {
          cctiLargo = 2.0;
          cctiAncho = 1.0;
          cctiAlto = 2.3;
        } else if (numeroPisos >= 4 && numeroPisos <= 10) {
          cctiLargo = 2.0;
          cctiAncho = 2.0;
          cctiAlto = 2.3;
        } else {
          cctiLargo = 3.0;
          cctiAncho = 2.0;
          cctiAlto = 2.3;
        }
        
        cctiArea = cctiLargo * cctiAncho;
        cctiVolumen = cctiArea * cctiAlto;
        
        // Determinar dimensiones para CCTS (Cuarto Común de Telecomunicaciones Superior)
        let cctsLargo, cctsAncho, cctsAlto;
        let cctsArea, cctsVolumen;
        
        if (numeroPisos < 10) {
          cctsLargo = 2.0;
          cctsAncho = 2.0;
          cctsAlto = 2.3;
        } else {
          cctsLargo = 3.0;
          cctsAncho = 2.0;
          cctsAlto = 2.3;
        }
        
        cctsArea = cctsLargo * cctsAncho;
        cctsVolumen = cctsArea * cctsAlto;
        
        // Cálculo de área de ventilación mínima (5% de la superficie de paredes)
        const areaParedes = 2 * cctiAlto * (cctiLargo + cctiAncho);
        const areaVentilacionMinima = areaParedes * 0.05;
        
        // Determinar necesidad de CCTS
        const requiereCCTS = numeroPisos > 1;
        
        return {
          cctiLargo,
          cctiAncho, 
          cctiAlto,
          cctiArea,
          cctiVolumen,
          cctsLargo,
          cctsAncho,
          cctsAlto,
          cctsArea,
          cctsVolumen,
          areaParedes,
          areaVentilacionMinima,
          requiereCCTS
        };
      `,
			necReference: "NEC-SB-TE, Tabla 1 y 2",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SB-TE", "telecomunicaciones", "cuartos técnicos", "ICCT"],
			shareLevel: "public",
		});

		await templateRepository.save(cuartosTecnicosTemplate);

		// Parámetros para cuartos técnicos
		const cuartosTecnicosParams = [
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "numeroPisos",
				description: "Número de pisos del edificio",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1,
				defaultValue: "5",
				helpText: "Cantidad total de pisos del edificio",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctiLargo",
				description: "Largo del CCTI",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 2,
				unitOfMeasure: "m",
				helpText:
					"Largo mínimo del Cuarto Común de Telecomunicaciones Inferior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctiAncho",
				description: "Ancho del CCTI",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 3,
				unitOfMeasure: "m",
				helpText:
					"Ancho mínimo del Cuarto Común de Telecomunicaciones Inferior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctiAlto",
				description: "Alto del CCTI",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 4,
				unitOfMeasure: "m",
				helpText:
					"Altura mínima del Cuarto Común de Telecomunicaciones Inferior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctiArea",
				description: "Área del CCTI",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 5,
				unitOfMeasure: "m²",
				helpText:
					"Área resultante del Cuarto Común de Telecomunicaciones Inferior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctiVolumen",
				description: "Volumen del CCTI",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "m³",
				helpText:
					"Volumen resultante del Cuarto Común de Telecomunicaciones Inferior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctsLargo",
				description: "Largo del CCTS",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "m",
				helpText:
					"Largo mínimo del Cuarto Común de Telecomunicaciones Superior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctsAncho",
				description: "Ancho del CCTS",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "m",
				helpText:
					"Ancho mínimo del Cuarto Común de Telecomunicaciones Superior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctsAlto",
				description: "Alto del CCTS",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "m",
				helpText:
					"Altura mínima del Cuarto Común de Telecomunicaciones Superior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctsArea",
				description: "Área del CCTS",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "m²",
				helpText:
					"Área resultante del Cuarto Común de Telecomunicaciones Superior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "cctsVolumen",
				description: "Volumen del CCTS",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "m³",
				helpText:
					"Volumen resultante del Cuarto Común de Telecomunicaciones Superior",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "areaParedes",
				description: "Área de paredes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "m²",
				helpText: "Área total de las paredes del cuarto",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "areaVentilacionMinima",
				description: "Área de ventilación mínima",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "m²",
				helpText:
					"Área mínima de ventilación requerida (5% del área de paredes)",
			}),
			parameterRepository.create({
				calculationTemplateId: cuartosTecnicosTemplate.id,
				name: "requiereCCTS",
				description: "¿Requiere CCTS?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				helpText:
					"Indica si se requiere Cuarto Común de Telecomunicaciones Superior",
			}),
		];

		await parameterRepository.save(cuartosTecnicosParams);

		// 2. PLANTILLA: DIMENSIONAMIENTO DE CANALIZACIONES ICCT
		const canalizacionesTemplate = templateRepository.create({
			name: "Dimensionamiento de Canalizaciones ICCT (NEC-SB-TE)",
			description:
				"Calcula las dimensiones de las canalizaciones para infraestructura de telecomunicaciones según la NEC.",
			type: CalculationType.TELECOMMUNICATIONS,
			targetProfession: ProfessionType.TELECOMMUNICATIONS_ENGINEER,
			formula: `
        // Dimensionamiento de canalización externa (CE)
        let numeroDuctosCE = 2; // Mínimo requerido por norma
        
        // Si hay más de 20 abonados, aumentar ductos
        if (numeroAbonados > 20) {
          numeroDuctosCE = Math.ceil(numeroAbonados / 20) + 1; // +1 para reserva
        }
        
        // Limitar a máximo 6 ductos por practicidad
        numeroDuctosCE = Math.min(numeroDuctosCE, 6);
        
        // Dimensionamiento de canalización secundaria (CS)
        let numeroDuctosCS = 2; // Mínimo requerido por norma
        
        // Para grandes edificios aumentar capacidad
        if (numeroPisos > 5 || numeroAbonados > 25) {
          numeroDuctosCS = 3;
        }
        
        if (numeroPisos > 10 || numeroAbonados > 50) {
          numeroDuctosCS = 4;
        }
        
        // Dimensionamiento de canalización de abonado (CU)
        let numeroDuctosCU = 2; // Mínimo requerido por norma
        
        // Ajustar según tipo y tamaño de vivienda
        if (tipoVivienda === "especial" || areaConstruccion > 300) {
          numeroDuctosCU = 3;
        }
        
        // Dimensionamiento de ducto vertical
        const anchoDuctoVertical = 0.8; // m
        const profundidadDuctoVertical = 1.0; // m
        const areaDuctoVertical = anchoDuctoVertical * profundidadDuctoVertical;
        
        // Dimensionamiento de cajas de paso
        const dimensionCajaPasoAreasComunales = 0.8; // m (dimensión de lado)
        const dimensionCajaPasoEdificio = 0.2; // m (dimensión de lado)
        const dimensionCajaPasoAbonado = 0.1; // m (dimensión de lado)
        
        // Cálculo de cajas de paso necesarias según longitud de canalización
        const cajasPasoCanalizacionExterna = Math.ceil(longitudCanalizacionExterna / 30);
        const cajasPasoCanalizacionSecundaria = Math.ceil(longitudCanalizacionSecundaria / 15);
        
        return {
          numeroDuctosCE,
          numeroDuctosCS,
          numeroDuctosCU,
          anchoDuctoVertical,
          profundidadDuctoVertical,
          areaDuctoVertical,
          dimensionCajaPasoAreasComunales,
          dimensionCajaPasoEdificio,
          dimensionCajaPasoAbonado,
          cajasPasoCanalizacionExterna,
          cajasPasoCanalizacionSecundaria
        };
      `,
			necReference: "NEC-SB-TE, Sección 3",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SB-TE", "telecomunicaciones", "canalizaciones", "ICCT"],
			shareLevel: "public",
		});

		await templateRepository.save(canalizacionesTemplate);

		// Parámetros para canalizaciones
		const canalizacionesParams = [
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "numeroPisos",
				description: "Número de pisos del edificio",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1,
				defaultValue: "5",
				helpText: "Cantidad total de pisos del edificio",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "numeroAbonados",
				description: "Número de abonados",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1,
				defaultValue: "15",
				helpText: "Cantidad total de abonados o viviendas",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "tipoVivienda",
				description: "Tipo de vivienda",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				defaultValue: "estandar",
				allowedValues: JSON.stringify(["estandar", "especial"]),
				helpText: "Clasificación de la vivienda (estándar o especial)",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "areaConstruccion",
				description: "Área de construcción",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 20,
				defaultValue: "150",
				unitOfMeasure: "m²",
				helpText: "Área de construcción promedio por vivienda",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "longitudCanalizacionExterna",
				description: "Longitud de canalización externa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 1,
				defaultValue: "35",
				unitOfMeasure: "m",
				helpText: "Longitud de la canalización externa",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "longitudCanalizacionSecundaria",
				description: "Longitud de canalización secundaria",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 1,
				defaultValue: "20",
				unitOfMeasure: "m",
				helpText: "Longitud de la canalización secundaria",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "numeroDuctosCE",
				description: "Número de ductos de canalización externa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				helpText:
					'Cantidad de ductos PVC de 110 mm (4") para canalización externa',
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "numeroDuctosCS",
				description: "Número de ductos de canalización secundaria",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				helpText:
					'Cantidad de mangueras de 25.40 mm (1") para canalización secundaria',
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "numeroDuctosCU",
				description: "Número de ductos de canalización de abonado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				helpText:
					'Cantidad de mangueras de 19.00 mm (¾") para canalización de abonado',
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "anchoDuctoVertical",
				description: "Ancho del ducto vertical",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "m",
				helpText: "Ancho mínimo del ducto vertical",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "profundidadDuctoVertical",
				description: "Profundidad del ducto vertical",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "m",
				helpText: "Profundidad mínima del ducto vertical",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "areaDuctoVertical",
				description: "Área del ducto vertical",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "m²",
				helpText: "Área del ducto vertical",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "cajasPasoCanalizacionExterna",
				description: "Cajas de paso para canalización externa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				helpText:
					"Número de cajas de paso necesarias para la canalización externa",
			}),
			parameterRepository.create({
				calculationTemplateId: canalizacionesTemplate.id,
				name: "cajasPasoCanalizacionSecundaria",
				description: "Cajas de paso para canalización secundaria",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				helpText:
					"Número de cajas de paso necesarias para la canalización secundaria",
			}),
		];

		await parameterRepository.save(canalizacionesParams);

		console.log(
			"✅ Plantillas de Telecomunicaciones (NEC-SB-TE) creadas exitosamente"
		);
	} catch (error) {
		console.error("❌ Error al crear plantillas de Telecomunicaciones:", error);
		throw error;
	}
}
