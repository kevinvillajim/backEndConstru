// src/infrastructure/database/seeds/nec-seeds/climatization-templates.ts
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
 * Semillas para plantillas de cálculo de climatización según NEC-HS-CL
 */
export async function seedClimatizationTemplates() {
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
			necReference: "NEC-HS-CL",
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de climatización. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla 1: Cálculo de Ventilación Mecánica
		const ventilacionTemplate = templateRepository.create({
			name: "Cálculo de Ventilación Mecánica",
			description:
				"Calcula los requerimientos de ventilación mecánica según NEC-HS-CL.",
			type: CalculationType.HVAC,
			targetProfession: ProfessionType.MECHANICAL_ENGINEER,
			formula: `
        // Cálculo de caudal mínimo de ventilación forzada
        // Caudal mínimo (m³/h) = 1.8 × Pn + 10 × A
        
        const caudalMinimo = 1.8 * potenciaNominal + 10 * areaLocal;
        
        // Cálculo de dimensiones de ductos
        const velocidadReal = tipoEdificacion === "residencial" ? 
            (velocidadDucto < 3.5 ? 3.5 : (velocidadDucto > 6 ? 6 : velocidadDucto)) :
            (velocidadDucto < 5 ? 5 : (velocidadDucto > 8 ? 8 : velocidadDucto));
        
        // Cálculo del área del ducto
        const areaDucto = caudalMinimo / (velocidadReal * 3600); // Convertir a m²
        
        // Cálculo del diámetro equivalente para ducto circular
        const diametroEquivalente = Math.sqrt(4 * areaDucto / Math.PI) * 1000; // en mm
        
        // Cálculo de dimensiones para ducto rectangular
        const relacionAspecto = 0.8; // Relación entre altura y ancho
        const anchoDucto = Math.sqrt(areaDucto / relacionAspecto) * 1000; // en mm
        const alturaDucto = anchoDucto * relacionAspecto; // en mm
        
        // Cálculo de espesor de aislamiento
        let espesorAislamiento;
        if (ubicacionDucto === "interior") {
          espesorAislamiento = tipoDucto === "calienteCalefaccion" ? 20 : 30; // mm
        } else {
          espesorAislamiento = tipoDucto === "calienteCalefaccion" ? 30 : 50; // mm
        }
        
        // Cálculo de estanquidad de los ductos
        const factorEstanquidad = 0.009; // Clase B (estándar)
        const fugasAire = factorEstanquidad * Math.pow(presionEstatica, 0.65);
        
        return {
          caudalMinimo,
          velocidadAplicada: velocidadReal,
          areaDucto,
          diametroEquivalente,
          anchoDuctoRectangular: anchoDucto,
          alturaDuctoRectangular: alturaDucto,
          espesorAislamiento,
          fugasAirePermitidas: fugasAire
        };
      `,
			necReference: "NEC-HS-CL, Capítulo 5.1",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["climatización", "ventilación", "ductos", "HVAC", "NEC-HS-CL"],
		});

		await templateRepository.save(ventilacionTemplate);

		// Parámetros para plantilla de Ventilación
		const ventilacionParams = [
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "potenciaNominal",
				description: "Potencia térmica nominal",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1,
				defaultValue: "50",
				unitOfMeasure: "kW",
				helpText: "Potencia térmica nominal instalada",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "areaLocal",
				description: "Área del local",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1,
				defaultValue: "30",
				unitOfMeasure: "m²",
				helpText: "Superficie del local o sala de máquinas",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "tipoEdificacion",
				description: "Tipo de edificación",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				defaultValue: "residencial",
				allowedValues: JSON.stringify([
					"residencial",
					"edificioPublico",
					"industrial",
				]),
				helpText:
					"Tipo de edificación que determina las velocidades de aire en ductos",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "velocidadDucto",
				description: "Velocidad de aire en ducto",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 3,
				maxValue: 11,
				defaultValue: "5",
				unitOfMeasure: "m/s",
				helpText: "Velocidad del aire en el ducto principal",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "ubicacionDucto",
				description: "Ubicación del ducto",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				defaultValue: "interior",
				allowedValues: JSON.stringify(["interior", "exterior"]),
				helpText:
					"Ubicación del ducto: interior o exterior (afecta al aislamiento)",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "tipoDucto",
				description: "Tipo de ducto",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				defaultValue: "frioAireAcondicionado",
				allowedValues: JSON.stringify([
					"calienteCalefaccion",
					"frioAireAcondicionado",
				]),
				helpText: "Tipo de ducto según su aplicación (aire caliente o frío)",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "presionEstatica",
				description: "Presión estática",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 50,
				maxValue: 2000,
				defaultValue: "500",
				unitOfMeasure: "Pa",
				helpText: "Presión estática en el ducto (afecta a las fugas de aire)",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "caudalMinimo",
				description: "Caudal mínimo de ventilación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "m³/h",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "velocidadAplicada",
				description: "Velocidad aplicada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "m/s",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "areaDucto",
				description: "Área de sección del ducto",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "diametroEquivalente",
				description: "Diámetro equivalente del ducto",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "anchoDuctoRectangular",
				description: "Ancho de ducto rectangular",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "alturaDuctoRectangular",
				description: "Altura de ducto rectangular",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "espesorAislamiento",
				description: "Espesor de aislamiento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 14,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: ventilacionTemplate.id,
				name: "fugasAirePermitidas",
				description: "Fugas de aire permitidas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 15,
				unitOfMeasure: "dm³/s·m²",
			}),
		];

		await parameterRepository.save(ventilacionParams);

		// Plantilla 2: Cálculo de Aislamiento Térmico para Tuberías
		const aislamientoTemplate = templateRepository.create({
			name: "Cálculo de Aislamiento Térmico para Tuberías",
			description:
				"Calcula el espesor de aislamiento para tuberías según NEC-HS-CL.",
			type: CalculationType.HVAC,
			targetProfession: ProfessionType.MECHANICAL_ENGINEER,
			formula: `
        // Cálculo del espesor de aislamiento para tuberías
        // Para superficies de sección circular:
        // d = (D/2) × [EXP((λ/λref) × ln((D + 2dref)/D)) - 1]
        
        // Diámetro interior del aislamiento (igual al diámetro exterior de la tubería)
        const D = diametroTuberia;
        
        // Conductividad de referencia
        const lambda_ref = 0.04; // W/(m.K) a 10°C
        
        // Obtener espesor de referencia según tabla basado en diámetro y temperatura
        let dref = 0;
        
        if (ubicacionTuberia === "interior") {
          if (temperaturaFluido >= 60) {
            // Fluido caliente interior
            if (D <= 35) dref = 25;
            else if (D <= 60) dref = 30;
            else if (D <= 90) dref = 30;
            else if (D <= 140) dref = 30;
            else dref = 35;
          } else if (temperaturaFluido >= 40 && temperaturaFluido < 60) {
            // Fluido templado interior
            if (D <= 35) dref = 20;
            else if (D <= 60) dref = 20;
            else if (D <= 90) dref = 30;
            else if (D <= 140) dref = 30;
            else dref = 30;
          } else {
            // Fluido frío interior
            if (D <= 35) dref = 30;
            else if (D <= 60) dref = 30;
            else if (D <= 90) dref = 30;
            else if (D <= 140) dref = 40;
            else dref = 40;
          }
        } else {
          // Ubicación exterior (agregar 10 mm adicionales)
          if (temperaturaFluido >= 60) {
            // Fluido caliente exterior
            if (D <= 35) dref = 35;
            else if (D <= 60) dref = 40;
            else if (D <= 90) dref = 40;
            else if (D <= 140) dref = 40;
            else dref = 45;
          } else if (temperaturaFluido >= 40 && temperaturaFluido < 60) {
            // Fluido templado exterior
            if (D <= 35) dref = 30;
            else if (D <= 60) dref = 30;
            else if (D <= 90) dref = 40;
            else if (D <= 140) dref = 40;
            else dref = 40;
          } else {
            // Fluido frío exterior
            if (D <= 35) dref = 50;
            else if (D <= 60) dref = 50;
            else if (D <= 90) dref = 50;
            else if (D <= 140) dref = 60;
            else dref = 60;
          }
        }
        
        // Factor de corrección para funcionamiento continuo (agregar 5 mm)
        if (funcionamientoContinuo) {
          dref += 5;
        }
        
        // Cálculo del espesor real según la conductividad térmica del material
        // Fórmula para superficies circulares
        const expTerm = Math.exp((conductividadTermica / lambda_ref) * Math.log((D + 2 * dref) / D));
        const espesorCalculado = (D / 2) * (expTerm - 1);
        
        // Redondear al múltiplo de 5 superior para practicidad
        const espesorFinal = Math.ceil(espesorCalculado / 5) * 5;
        
        return {
          espesorReferencia: dref,
          expTerm,
          espesorCalculado,
          espesorFinal
        };
      `,
			necReference: "NEC-HS-CL, Capítulo 5.2",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["climatización", "aislamiento", "tuberías", "HVAC", "NEC-HS-CL"],
		});

		await templateRepository.save(aislamientoTemplate);

		// Parámetros para plantilla de Aislamiento Térmico
		const aislamientoParams = [
			parameterRepository.create({
				calculationTemplateId: aislamientoTemplate.id,
				name: "diametroTuberia",
				description: "Diámetro exterior de la tubería",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 10,
				maxValue: 300,
				defaultValue: "60",
				unitOfMeasure: "mm",
				helpText: "Diámetro exterior de la tubería a aislar",
			}),
			parameterRepository.create({
				calculationTemplateId: aislamientoTemplate.id,
				name: "temperaturaFluido",
				description: "Temperatura del fluido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: -20,
				maxValue: 180,
				defaultValue: "60",
				unitOfMeasure: "°C",
				helpText: "Temperatura del fluido que circula por la tubería",
			}),
			parameterRepository.create({
				calculationTemplateId: aislamientoTemplate.id,
				name: "ubicacionTuberia",
				description: "Ubicación de la tubería",
				dataType: ParameterDataType.STRING,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				defaultValue: "interior",
				allowedValues: JSON.stringify(["interior", "exterior"]),
				helpText:
					"Ubicación de la tubería: interior o exterior de la edificación",
			}),
			parameterRepository.create({
				calculationTemplateId: aislamientoTemplate.id,
				name: "funcionamientoContinuo",
				description: "¿Funcionamiento continuo?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				defaultValue: "false",
				helpText:
					"Seleccionar si la tubería está en funcionamiento continuo (24h)",
			}),
			parameterRepository.create({
				calculationTemplateId: aislamientoTemplate.id,
				name: "conductividadTermica",
				description: "Conductividad térmica del aislante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0.02,
				maxValue: 0.05,
				defaultValue: "0.035",
				unitOfMeasure: "W/(m·K)",
				helpText: "Conductividad térmica del material aislante a 10°C",
			}),
			parameterRepository.create({
				calculationTemplateId: aislamientoTemplate.id,
				name: "espesorReferencia",
				description: "Espesor de referencia",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: aislamientoTemplate.id,
				name: "espesorCalculado",
				description: "Espesor calculado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "mm",
			}),
			parameterRepository.create({
				calculationTemplateId: aislamientoTemplate.id,
				name: "espesorFinal",
				description: "Espesor final recomendado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "mm",
			}),
		];

		await parameterRepository.save(aislamientoParams);

		console.log("Plantillas de climatización creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de climatización:", error);
	} finally {
		await connection.destroy();
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedClimatizationTemplates()
		.then(() =>
			console.log("Seeding de plantillas de climatización completado")
		)
		.catch((error) =>
			console.error("Error en seeding de climatización:", error)
		);
}
