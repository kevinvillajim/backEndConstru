// src/infrastructure/database/seeds/specialized-templates.ts
import { AppDataSource } from "../data-source";
import { CalculationTemplateEntity } from "../entities/CalculationTemplateEntity";
import { CalculationParameterEntity } from "../entities/CalculationParameterEntity";
import {
  CalculationType,
  ProfessionType,
  TemplateSource,
} from "../../../domain/models/calculation/CalculationTemplate";
import {
  ParameterDataType,
  ParameterScope,
} from "../../../domain/models/calculation/CalculationParameter";

/**
 * Semillas para plantillas de cálculo de instalaciones especializadas
 */
export async function seedSpecializedTemplates() {
  const connection = await AppDataSource.initialize();
  const templateRepository = connection.getRepository(
    CalculationTemplateEntity
  );
  const parameterRepository = connection.getRepository(
    CalculationParameterEntity
  );

  try {
    // 1. Plantilla para cálculo de tubería de agua fría
    const plumbingTemplate = templateRepository.create({
      name: "Cálculo de tubería de agua fría",
      description:
        "Calcula el diámetro óptimo de tubería de agua fría y la cantidad necesaria según el caudal y la longitud del recorrido",
      type: CalculationType.INSTALLATION,
      targetProfession: ProfessionType.PLUMBER,
      formula: `
        // Convertir las unidades
        const flowRateLS = flowRate / 60; // Convertir de L/min a L/s
        const flowRateM3S = flowRateLS / 1000; // Convertir de L/s a m³/s
        
        // Calcular área de sección transversal requerida
        const velocity = 1.5; // Velocidad recomendada en m/s para agua fría residencial
        const area = flowRateM3S / velocity; // m²
        
        // Calcular diámetro teórico
        const theoreticalDiameter = Math.sqrt((4 * area) / Math.PI) * 1000; // En mm
        
        // Seleccionar diámetro comercial más cercano
        const commercialDiameters = [12, 20, 25, 32, 40, 50, 63, 75, 90, 110];
        let selectedDiameter = commercialDiameters[0];
        
        for (const diameter of commercialDiameters) {
          if (diameter >= theoreticalDiameter) {
            selectedDiameter = diameter;
            break;
          }
        }
        
        // Calcular longitud total con factor de desperdicio
        const totalLength = pipeLength * 1.1; // 10% adicional por desperdicios
        
        // Calcular número de accesorios
        const elbowCount = Math.ceil(pipeLength / 5); // Aproximado: un codo cada 5 metros
        const teeCount = Math.ceil(fixtures / 2); // Aproximado: una tee cada 2 aparatos
        
        // Calcular costo aproximado
        const pipeUnitPrice = 2.5 * (selectedDiameter / 20); // Precio aproximado en USD/m
        const pipeCost = pipeUnitPrice * totalLength;
        
        const elbowUnitPrice = 1.2 * (selectedDiameter / 20);
        const elbowCost = elbowUnitPrice * elbowCount;
        
        const teeUnitPrice = 1.5 * (selectedDiameter / 20);
        const teeCost = teeUnitPrice * teeCount;
        
        const totalCost = pipeCost + elbowCost + teeCost;
        
        // Preparar los materiales para presupuesto
        const materials = [
          {
            description: \`Tubería PVC ${selectedDiameter}mm\`,
            quantity: totalLength,
            unitOfMeasure: "m",
            unitPrice: pipeUnitPrice,
            category: "Plomería"
          },
          {
            description: \`Codo PVC ${selectedDiameter}mm x 90°\`,
            quantity: elbowCount,
            unitOfMeasure: "und",
            unitPrice: elbowUnitPrice,
            category: "Plomería"
          },
          {
            description: \`Tee PVC ${selectedDiameter}mm\`,
            quantity: teeCount,
            unitOfMeasure: "und",
            unitPrice: teeUnitPrice,
            category: "Plomería"
          }
        ];
        
        return {
          theoreticalDiameter,
          selectedDiameter,
          totalLength,
          elbowCount,
          teeCount,
          totalCost,
          materials
        };
      `,
      necReference: "NEC-HS-CI, Capítulo 16",
      isActive: true,
      isVerified: true,
      isFeatured: true,
      version: 1,
      source: TemplateSource.SYSTEM,
      shareLevel: "public",
      usageCount: 0,
      averageRating: 0,
      ratingCount: 0,
      tags: ["plomería", "agua fría", "tubería", "instalación"],
    });

    await templateRepository.save(plumbingTemplate);

    // Parámetros para plantilla de plomería
    const plumbingParams = [
      parameterRepository.create({
        calculationTemplateId: plumbingTemplate.id,
        name: "flowRate",
        description: "Caudal requerido",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.INPUT,
        displayOrder: 1,
        isRequired: true,
        minValue: 1,
        maxValue: 1000,
        defaultValue: "12",
        unitOfMeasure: "L/min",
        helpText: "Caudal total requerido para todos los aparatos sanitarios",
      }),
      parameterRepository.create({
        calculationTemplateId: plumbingTemplate.id,
        name: "pipeLength",
        description: "Longitud aproximada de tubería",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.INPUT,
        displayOrder: 2,
        isRequired: true,
        minValue: 1,
        maxValue: 500,
        defaultValue: "15",
        unitOfMeasure: "m",
        helpText: "Longitud total de tubería requerida",
      }),
      parameterRepository.create({
        calculationTemplateId: plumbingTemplate.id,
        name: "fixtures",
        description: "Número de aparatos sanitarios",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.INPUT,
        displayOrder: 3,
        isRequired: true,
        minValue: 1,
        maxValue: 50,
        defaultValue: "3",
        unitOfMeasure: "unidades",
        helpText: "Cantidad de aparatos sanitarios (lavabos, inodoros, duchas, etc.)",
      }),
      parameterRepository.create({
        calculationTemplateId: plumbingTemplate.id,
        name: "theoreticalDiameter",
        description: "Diámetro teórico de tubería",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 4,
        unitOfMeasure: "mm",
        formula: "Math.sqrt((4 * (flowRate / 60 / 1000) / 1.5) / Math.PI) * 1000",
      }),
      parameterRepository.create({
        calculationTemplateId: plumbingTemplate.id,
        name: "selectedDiameter",
        description: "Diámetro comercial recomendado",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 5,
        unitOfMeasure: "mm",
      }),
      parameterRepository.create({
        calculationTemplateId: plumbingTemplate.id,
        name: "totalLength",
        description: "Longitud total con desperdicio",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 6,
        unitOfMeasure: "m",
        formula: "pipeLength * 1.1",
      }),
      parameterRepository.create({
        calculationTemplateId: plumbingTemplate.id,
        name: "elbowCount",
        description: "Cantidad estimada de codos",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 7,
        unitOfMeasure: "unidades",
        formula: "Math.ceil(pipeLength / 5)",
      }),
      parameterRepository.create({
        calculationTemplateId: plumbingTemplate.id,
        name: "teeCount",
        description: "Cantidad estimada de tees",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 8,
        unitOfMeasure: "unidades",
        formula: "Math.ceil(fixtures / 2)",
      }),
      parameterRepository.create({
        calculationTemplateId: plumbingTemplate.id,
        name: "totalCost",
        description: "Costo total estimado",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 9,
        unitOfMeasure: "USD",
      }),
    ];

    await parameterRepository.save(plumbingParams);

    // 2. Plantilla para cálculo de circuito eléctrico residencial
    const electricalTemplate = templateRepository.create({
      name: "Cálculo de circuito eléctrico residencial",
      description:
        "Determina el calibre de cable, protección y ductos necesarios para un circuito eléctrico residencial",
      type: CalculationType.INSTALLATION,
      targetProfession: ProfessionType.ELECTRICIAN,
      formula: `
        // Voltaje estándar residencial Ecuador
        const voltage = 120; // Voltios
        
        // Calcular corriente
        const current = totalPower / voltage; // Amperios
        
        // Aplicar factor de seguridad
        const designCurrent = current * 1.25;
        
        // Determinar calibre de cable
        let wireGauge = "14 AWG";
        let maxCurrent = 15;
        
        if (designCurrent <= 15) {
          wireGauge = "14 AWG";
          maxCurrent = 15;
        } else if (designCurrent <= 20) {
          wireGauge = "12 AWG";
          maxCurrent = 20;
        } else if (designCurrent <= 30) {
          wireGauge = "10 AWG";
          maxCurrent = 30;
        } else if (designCurrent <= 40) {
          wireGauge = "8 AWG";
          maxCurrent = 40;
        } else if (designCurrent <= 55) {
          wireGauge = "6 AWG";
          maxCurrent = 55;
        } else {
          wireGauge = "Requiere cálculo especial";
          maxCurrent = 0;
        }
        
        // Determinar protección
        let breakerSize = 0;
        
        if (maxCurrent === 15) breakerSize = 15;
        else if (maxCurrent === 20) breakerSize = 20;
        else if (maxCurrent === 30) breakerSize = 30;
        else if (maxCurrent === 40) breakerSize = 40;
        else if (maxCurrent === 55) breakerSize = 50;
        else breakerSize = 0;
        
        // Determinar tamaño de ducto
        let conduitSize = "1/2 pulgada";
        
        if (wireGauge === "14 AWG" || wireGauge === "12 AWG") {
          conduitSize = "1/2 pulgada";
        } else if (wireGauge === "10 AWG" || wireGauge === "8 AWG") {
          conduitSize = "3/4 pulgada";
        } else if (wireGauge === "6 AWG") {
          conduitSize = "1 pulgada";
        } else {
          conduitSize = "Requiere cálculo especial";
        }
        
        // Calcular caída de tensión
        const resistivity = {
          "14 AWG": 8.286,
          "12 AWG": 5.21,
          "10 AWG": 3.277,
          "8 AWG": 2.061,
          "6 AWG": 1.296
        };
        
        let voltageDrop = 0;
        
        if (resistivity[wireGauge]) {
          // Resistencia = Resistividad * Longitud / 1000 (en ohms)
          const resistance = resistivity[wireGauge] * circuitLength / 1000;
          
          // Caída de tensión = Corriente * Resistencia
          voltageDrop = current * resistance;
        }
        
        // Verificar si la caída de tensión es aceptable (< 3%)
        const voltageDropPercentage = (voltageDrop / voltage) * 100;
        const isVoltageDropAcceptable = voltageDropPercentage < 3;
        
        // Calcular longitud total de cable (3 hilos: fase, neutro, tierra)
        const totalWireLength = circuitLength * 3;
        
        // Calcular costos aproximados
        const wirePricesPerMeter = {
          "14 AWG": 1.2,
          "12 AWG": 1.5,
          "10 AWG": 2.3,
          "8 AWG": 3.8,
          "6 AWG": 5.5
        };
        
        const conduitPricesPerMeter = {
          "1/2 pulgada": 1.8,
          "3/4 pulgada": 2.5,
          "1 pulgada": 3.7
        };
        
        const breakerPrices = {
          15: 12,
          20: 15,
          30: 25,
          40: 35,
          50: 45
        };
        
        let wireCost = 0;
        let conduitCost = 0;
        let breakerCost = 0;
        
        if (wirePricesPerMeter[wireGauge]) {
          wireCost = wirePricesPerMeter[wireGauge] * totalWireLength;
        }
        
        if (conduitPricesPerMeter[conduitSize]) {
          conduitCost = conduitPricesPerMeter[conduitSize] * circuitLength;
        }
        
        if (breakerPrices[breakerSize]) {
          breakerCost = breakerPrices[breakerSize];
        }
        
        const totalCost = wireCost + conduitCost + breakerCost;
        
        // Preparar los materiales para presupuesto
        const materials = [
          {
            description: \`Cable ${wireGauge} THHN\`,
            quantity: totalWireLength,
            unitOfMeasure: "m",
            unitPrice: wirePricesPerMeter[wireGauge] || 0,
            category: "Eléctrico"
          },
          {
            description: \`Tubería conduit PVC ${conduitSize}\`,
            quantity: circuitLength,
            unitOfMeasure: "m",
            unitPrice: conduitPricesPerMeter[conduitSize] || 0,
            category: "Eléctrico"
          },
          {
            description: \`Breaker ${breakerSize}A\`,
            quantity: 1,
            unitOfMeasure: "und",
            unitPrice: breakerPrices[breakerSize] || 0,
            category: "Eléctrico"
          }
        ];
        
        return {
          current,
          designCurrent,
          wireGauge,
          breakerSize,
          conduitSize,
          voltageDrop,
          voltageDropPercentage,
          isVoltageDropAcceptable,
          totalWireLength,
          totalCost,
          materials
        };
      `,
      necReference: "NEC-SB-IE, Capítulo 10",
      isActive: true,
      isVerified: true,
      isFeatured: true,
      version: 1,
      source: TemplateSource.SYSTEM,
      shareLevel: "public",
      usageCount: 0,
      averageRating: 0,
      ratingCount: 0,
      tags: ["eléctrico", "circuito", "cable", "instalación"],
    });

    await templateRepository.save(electricalTemplate);

    // Parámetros para plantilla eléctrica
    const electricalParams = [
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "totalPower",
        description: "Potencia total del circuito",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.INPUT,
        displayOrder: 1,
        isRequired: true,
        minValue: 100,
        maxValue: 10000,
        defaultValue: "1500",
        unitOfMeasure: "W",
        helpText: "Suma de la potencia de todos los aparatos conectados al circuito",
      }),
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "circuitLength",
        description: "Longitud del circuito",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.INPUT,
        displayOrder: 2,
        isRequired: true,
        minValue: 1,
        maxValue: 100,
        defaultValue: "15",
        unitOfMeasure: "m",
        helpText: "Distancia desde el tablero hasta el punto más lejano del circuito",
      }),
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "current",
        description: "Corriente nominal",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 3,
        unitOfMeasure: "A",
        formula: "totalPower / 120",
      }),
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "designCurrent",
        description: "Corriente de diseño",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 4,
        unitOfMeasure: "A",
        formula: "(totalPower / 120) * 1.25",
      }),
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "wireGauge",
        description: "Calibre de cable recomendado",
        dataType: ParameterDataType.STRING,
        scope: ParameterScope.OUTPUT,
        displayOrder: 5,
      }),
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "breakerSize",
        description: "Capacidad del breaker",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 6,
        unitOfMeasure: "A",
      }),
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "conduitSize",
        description: "Tamaño de tubería conduit",
        dataType: ParameterDataType.STRING,
        scope: ParameterScope.OUTPUT,
        displayOrder: 7,
      }),
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "voltageDropPercentage",
        description: "Porcentaje de caída de tensión",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 8,
        unitOfMeasure: "%",
      }),
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "isVoltageDropAcceptable",
        description: "¿Caída de tensión aceptable?",
        dataType: ParameterDataType.BOOLEAN,
        scope: ParameterScope.OUTPUT,
        displayOrder: 9,
      }),
      parameterRepository.create({
        calculationTemplateId: electricalTemplate.id,
        name: "totalCost",
        description: "Costo total estimado",
        dataType: ParameterDataType.NUMBER,
        scope: ParameterScope.OUTPUT,
        displayOrder: 10,
        unitOfMeasure: "USD",
      }),
    ];

    await parameterRepository.save(electricalParams);

    console.log("Plantillas de cálculo especializadas creadas exitosamente");
  } catch (error) {
    console.error("Error al crear plantillas de cálculo:", error);
  } finally {
    await connection.destroy();
  }
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
  seedSpecializedTemplates()
    .then(() => console.log("Seeding completado"))
    .catch((error) => console.error("Error en seeding:", error));
}