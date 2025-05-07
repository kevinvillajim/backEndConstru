// src/infrastructure/database/seeds/calculation-templates.ts
import {AppDataSource} from "../data-source";
import {CalculationTemplateEntity} from "../entities/CalculationTemplateEntity";
import {CalculationParameterEntity} from "../entities/CalculationParameterEntity";
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
 * Semillas para plantillas de cálculo predefinidas
 */
export async function seedCalculationTemplates() {
	const connection = await AppDataSource.initialize();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	// Verificar si ya hay plantillas (evitar duplicados)
	const existingCount = await templateRepository.count();
	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de cálculo. Omitiendo seeding.`
		);
		return;
	}

	try {
		// Plantilla 1: Cálculo de área de losa rectangular
		const rectangularSlabTemplate = templateRepository.create({
			name: "Cálculo de Área de Losa Rectangular",
			description:
				"Calcula el área de una losa rectangular y la cantidad de materiales necesarios para su construcción, incluyendo hormigón, acero y encofrado.",
			type: CalculationType.AREA_VOLUME,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        const area = length * width;
        const thickness = height;
        const concreteVolume = area * thickness;
        const steelWeight = area * steelRatio;
        const formworkArea = 2 * (length + width) * height + area;
        
        return {
          area,
          concreteVolume,
          steelWeight,
          formworkArea
        };
      `,
			necReference: "NEC-SE-HM, Capítulo 4",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["losa", "hormigón", "área", "volumen"],
		});

		await templateRepository.save(rectangularSlabTemplate);

		// Parámetros para plantilla 1
		const rectangularSlabParams = [
			parameterRepository.create({
				calculationTemplateId: rectangularSlabTemplate.id,
				name: "length",
				description: "Longitud de la losa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				unitOfMeasure: "m",
				helpText: "Ingrese la longitud de la losa en metros",
			}),
			parameterRepository.create({
				calculationTemplateId: rectangularSlabTemplate.id,
				name: "width",
				description: "Ancho de la losa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.1,
				unitOfMeasure: "m",
				helpText: "Ingrese el ancho de la losa en metros",
			}),
			parameterRepository.create({
				calculationTemplateId: rectangularSlabTemplate.id,
				name: "height",
				description: "Espesor de la losa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.05,
				maxValue: 0.5,
				defaultValue: "0.2",
				unitOfMeasure: "m",
				helpText:
					"Ingrese el espesor de la losa en metros (normalmente entre 0.05m y 0.5m)",
			}),
			parameterRepository.create({
				calculationTemplateId: rectangularSlabTemplate.id,
				name: "steelRatio",
				description: "Cuantía de acero",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 10,
				maxValue: 150,
				defaultValue: "85",
				unitOfMeasure: "kg/m²",
				helpText:
					"Cantidad de acero por metro cuadrado (típicamente entre 10-150 kg/m²)",
			}),
			parameterRepository.create({
				calculationTemplateId: rectangularSlabTemplate.id,
				name: "area",
				description: "Área de la losa",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 5,
				isRequired: false,
				unitOfMeasure: "m²",
				formula: "length * width",
			}),
			parameterRepository.create({
				calculationTemplateId: rectangularSlabTemplate.id,
				name: "concreteVolume",
				description: "Volumen de hormigón requerido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				isRequired: false,
				unitOfMeasure: "m³",
				formula: "length * width * height",
			}),
			parameterRepository.create({
				calculationTemplateId: rectangularSlabTemplate.id,
				name: "steelWeight",
				description: "Peso total de acero requerido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				isRequired: false,
				unitOfMeasure: "kg",
				formula: "length * width * steelRatio",
			}),
			parameterRepository.create({
				calculationTemplateId: rectangularSlabTemplate.id,
				name: "formworkArea",
				description: "Área de encofrado necesaria",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				isRequired: false,
				unitOfMeasure: "m²",
				formula: "2 * (length + width) * height + (length * width)",
			}),
		];

		await parameterRepository.save(rectangularSlabParams);

		// Plantilla 2: Cálculo de materiales para mampostería
		const masonryTemplate = templateRepository.create({
			name: "Cálculo de Materiales para Mampostería",
			description:
				"Calcula la cantidad de ladrillos, mortero y otros materiales necesarios para construir una pared de mampostería.",
			type: CalculationType.MATERIAL_ESTIMATION,
			targetProfession: ProfessionType.CONTRACTOR, // Cambiado de CONSTRUCTOR a CONTRACTOR
			formula: `
    // Calcular área de pared
    const wallArea = length * height;
    
    // Descontar área de aberturas
    const openingsArea = openingsCount > 0 ? openingsWidth * openingsHeight * openingsCount : 0;
    const netArea = wallArea - openingsArea;
    
    // Calcular cantidad de ladrillos
    const brickArea = brickLength * brickHeight;
    const morterFactor = 1.05; // 5% adicional por juntas
    const bricksPerSquareMeter = morterFactor / brickArea;
    const totalBricks = Math.ceil(netArea * bricksPerSquareMeter);
    
    // Calcular mortero
    // Aprox. 0.03 m³ de mortero por m² de pared
    const mortarVolume = netArea * 0.03;
    
    // Calcular materiales para mortero (1:4 cemento:arena)
    // 1 m³ de mortero: 350 kg cemento, 1.1 m³ arena
    const cementWeight = mortarVolume * 350; // kg
    const sandVolume = mortarVolume * 1.1; // m³
    
    return {
      wallArea,
      netArea,
      totalBricks,
      mortarVolume,
      cementWeight,
      sandVolume
    };
  `,
			necReference: "NEC-SE-VIVIENDA, Capítulo 6",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["mampostería", "ladrillo", "mortero", "pared", "material"],
		});

		await templateRepository.save(masonryTemplate);

		// Parámetros para plantilla 2
		const masonryParams = [
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "length",
				description: "Longitud de la pared",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				unitOfMeasure: "m",
				helpText: "Ingrese la longitud de la pared en metros",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "height",
				description: "Altura de la pared",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.1,
				unitOfMeasure: "m",
				helpText: "Ingrese la altura de la pared en metros",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "brickLength",
				description: "Longitud del ladrillo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.05,
				defaultValue: "0.29",
				unitOfMeasure: "m",
				helpText:
					"Longitud del ladrillo en metros (típicamente 29 cm = 0.29 m)",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "brickHeight",
				description: "Altura del ladrillo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.05,
				defaultValue: "0.09",
				unitOfMeasure: "m",
				helpText: "Altura del ladrillo en metros (típicamente 9 cm = 0.09 m)",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "openingsCount",
				description: "Número de aberturas (ventanas/puertas)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0,
				defaultValue: "0",
				helpText: "Cantidad de aberturas en la pared (ventanas, puertas, etc.)",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "openingsWidth",
				description: "Ancho promedio de aberturas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: false,
				minValue: 0,
				defaultValue: "1",
				unitOfMeasure: "m",
				helpText: "Ancho promedio de las aberturas en metros",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "openingsHeight",
				description: "Altura promedio de aberturas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: false,
				minValue: 0,
				defaultValue: "2",
				unitOfMeasure: "m",
				helpText: "Altura promedio de las aberturas en metros",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "wallArea",
				description: "Área total de la pared",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				isRequired: false,
				unitOfMeasure: "m²",
				formula: "length * height",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "netArea",
				description: "Área neta (descontando aberturas)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				isRequired: false,
				unitOfMeasure: "m²",
				formula:
					"length * height - (openingsCount > 0 ? openingsWidth * openingsHeight * openingsCount : 0)",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "totalBricks",
				description: "Cantidad total de ladrillos",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				isRequired: false,
				unitOfMeasure: "unidades",
				formula:
					"Math.ceil((length * height - (openingsCount > 0 ? openingsWidth * openingsHeight * openingsCount : 0)) * (1.05 / (brickLength * brickHeight)))",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "mortarVolume",
				description: "Volumen de mortero",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				isRequired: false,
				unitOfMeasure: "m³",
				formula:
					"(length * height - (openingsCount > 0 ? openingsWidth * openingsHeight * openingsCount : 0)) * 0.03",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "cementWeight",
				description: "Peso de cemento requerido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				isRequired: false,
				unitOfMeasure: "kg",
				formula:
					"(length * height - (openingsCount > 0 ? openingsWidth * openingsHeight * openingsCount : 0)) * 0.03 * 350",
			}),
			parameterRepository.create({
				calculationTemplateId: masonryTemplate.id,
				name: "sandVolume",
				description: "Volumen de arena requerido",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				isRequired: false,
				unitOfMeasure: "m³",
				formula:
					"(length * height - (openingsCount > 0 ? openingsWidth * openingsHeight * openingsCount : 0)) * 0.03 * 1.1",
			}),
		];

		await parameterRepository.save(masonryParams);

		// Plantilla 3: Cálculo estructural - Diseño de viga de hormigón armado
		const beamDesignTemplate = templateRepository.create({
			name: "Diseño de Viga de Hormigón Armado",
			description:
				"Calcula el diseño preliminar de una viga de hormigón armado según la norma ecuatoriana de construcción (NEC).",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Conversión de unidades a sistema MKS
        const span = length; // m
        const loadkNm = load / 1000; // kN/m (convertir de N/m)
        
        // Cálculo de momento flector máximo (viga simplemente apoyada)
        const maxMoment = (loadkNm * Math.pow(span, 2)) / 8; // kN·m
        
        // Estimación de dimensiones
        // h ≈ L/10 a L/12 para vigas
        const recommendedHeight = span / 10; // m
        // b ≈ 0.3h a 0.7h
        const recommendedWidth = 0.5 * recommendedHeight; // m
        
        // Verificar si las dimensiones proporcionadas son adecuadas
        const height = beamHeight > 0 ? beamHeight : recommendedHeight;
        const width = beamWidth > 0 ? beamWidth : recommendedWidth;
        
        // Resistencia de diseño
        const fc = concreteStrength * 1000; // Pa (N/m²)
        const fy = steelStrength * 1000000; // Pa (N/m²)
        
        // Cálculo del área de acero requerido (método simplificado)
        // Asumiendo un brazo de palanca de 0.9d donde d = h - recubrimiento
        const d = height - 0.05; // m (asumiendo 5 cm de recubrimiento)
        const requiredAs = (maxMoment * 1000) / (0.9 * d * (fy / 1.15)); // m²
        
        // Convertir a cm²
        const requiredAsCm2 = requiredAs * 10000;
        
        // Verificar cuantía mínima (0.33% según NEC)
        const minAs = 0.0033 * width * height * 10000; // cm²
        const finalAs = Math.max(requiredAsCm2, minAs);
        
        // Verificación de cuantía máxima (2.5% según NEC)
        const maxAs = 0.025 * width * height * 10000; // cm²
        const isOverReinforced = finalAs > maxAs;
        
        // Número de varillas según diámetro seleccionado
        // Área de varilla en cm² según diámetro en mm
        const barArea = Math.PI * Math.pow(barDiameter / 20, 2); // cm²
        const barsCount = Math.ceil(finalAs / barArea);
        
        // Verificar si caben las varillas en el ancho
        // Espaciamiento mínimo entre barras = max(25mm, diámetro)
        const minSpacing = Math.max(0.025, barDiameter / 1000); // m
        const widthNeeded = barsCount * (barDiameter / 1000) + (barsCount - 1) * minSpacing + 2 * 0.05; // m
        const fitsWidth = widthNeeded <= width;
        
        // Separación entre varillas
        const spacing = fitsWidth ? 
          (width - 2 * 0.05 - barsCount * (barDiameter / 1000)) / (barsCount - 1) : 
          0; // m
        
        return {
          maxMoment,
          recommendedHeight,
          recommendedWidth,
          requiredAs: finalAs,
          barsCount,
          widthNeeded,
          fitsWidth,
          spacing: spacing * 100, // convertir a cm
          isOverReinforced
        };
      `,
			necReference: "NEC-SE-HM, Capítulo 4.2",
			isActive: true,
			isVerified: true,
			isFeatured: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			shareLevel: "public",
			usageCount: 0,
			averageRating: 0,
			ratingCount: 0,
			tags: ["estructura", "viga", "hormigón armado", "acero"],
		});

		await templateRepository.save(beamDesignTemplate);

		// Parámetros para plantilla 3
		const beamDesignParams = [
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "length",
				description: "Luz libre de la viga",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 1,
				maxValue: 20,
				unitOfMeasure: "m",
				helpText: "Distancia entre apoyos de la viga en metros",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "load",
				description: "Carga distribuida total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 1000,
				defaultValue: "15000",
				unitOfMeasure: "N/m",
				helpText:
					"Carga total (muerta + viva) por metro lineal de viga en Newtons/metro",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "beamHeight",
				description: "Altura de la viga (opcional)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: false,
				minValue: 0.2,
				maxValue: 2,
				defaultValue: "0",
				unitOfMeasure: "m",
				helpText:
					"Altura (peralte) de la viga en metros. Si se deja en 0, se calculará automáticamente",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "beamWidth",
				description: "Ancho de la viga (opcional)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: false,
				minValue: 0.2,
				maxValue: 1,
				defaultValue: "0",
				unitOfMeasure: "m",
				helpText:
					"Ancho de la viga en metros. Si se deja en 0, se calculará automáticamente",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "concreteStrength",
				description: "Resistencia del hormigón",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 21,
				maxValue: 50,
				defaultValue: "21",
				unitOfMeasure: "MPa",
				helpText: "Resistencia característica del hormigón en MPa (f'c)",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "steelStrength",
				description: "Resistencia del acero",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 420,
				maxValue: 520,
				defaultValue: "420",
				unitOfMeasure: "MPa",
				helpText: "Resistencia característica del acero en MPa (fy)",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "barDiameter",
				description: "Diámetro de varilla a utilizar",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				defaultValue: "16",
				allowedValues: JSON.stringify([
					8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36,
				]),
				unitOfMeasure: "mm",
				helpText: "Diámetro de las varillas de acero en milímetros",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "maxMoment",
				description: "Momento flector máximo",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				isRequired: false,
				unitOfMeasure: "kN·m",
				formula: "(load / 1000) * Math.pow(length, 2) / 8",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "recommendedHeight",
				description: "Altura recomendada",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				isRequired: false,
				unitOfMeasure: "m",
				formula: "length / 10",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "recommendedWidth",
				description: "Ancho recomendado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				isRequired: false,
				unitOfMeasure: "m",
				formula: "recommendedHeight * 0.5",
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "requiredAs",
				description: "Área de acero requerida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				isRequired: false,
				unitOfMeasure: "cm²",
				formula: `
          const height = beamHeight > 0 ? beamHeight : (length / 10);
          const width = beamWidth > 0 ? beamWidth : (height * 0.5);
          const d = height - 0.05;
          const maxMomentN = (load / 1000) * Math.pow(length, 2) / 8 * 1000;
          const as = maxMomentN / (0.9 * d * (steelStrength * 1000000 / 1.15)) * 10000;
          const minAs = 0.0033 * width * height * 10000;
          return Math.max(as, minAs);
        `,
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "barsCount",
				description: "Número de varillas requeridas",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				isRequired: false,
				unitOfMeasure: "unidades",
				formula: `
          const height = beamHeight > 0 ? beamHeight : (length / 10);
          const width = beamWidth > 0 ? beamWidth : (height * 0.5);
          const d = height - 0.05;
          const maxMomentN = (load / 1000) * Math.pow(length, 2) / 8 * 1000;
          const as = maxMomentN / (0.9 * d * (steelStrength * 1000000 / 1.15)) * 10000;
          const minAs = 0.0033 * width * height * 10000;
          const requiredAs = Math.max(as, minAs);
          const barArea = Math.PI * Math.pow(barDiameter / 20, 2);
          return Math.ceil(requiredAs / barArea);
        `,
			}),
			parameterRepository.create({
				calculationTemplateId: beamDesignTemplate.id,
				name: "isOverReinforced",
				description: "¿Excede cuantía máxima?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				isRequired: false,
				formula: `
          const height = beamHeight > 0 ? beamHeight : (length / 10);
          const width = beamWidth > 0 ? beamWidth : (height * 0.5);
          const d = height - 0.05;
          const maxMomentN = (load / 1000) * Math.pow(length, 2) / 8 * 1000;
          const as = maxMomentN / (0.9 * d * (steelStrength * 1000000 / 1.15)) * 10000;
          const minAs = 0.0033 * width * height * 10000;
          const requiredAs = Math.max(as, minAs);
          const maxAs = 0.025 * width * height * 10000;
          return requiredAs > maxAs;
        `,
			}),
		];

		await parameterRepository.save(beamDesignParams);

		console.log("Plantillas de cálculo iniciales creadas exitosamente");
	} catch (error) {
		console.error("Error al crear plantillas de cálculo:", error);
	} finally {
		await connection.destroy();
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedCalculationTemplates()
		.then(() => console.log("Seeding completado"))
		.catch((error) => console.error("Error en seeding:", error));
}
