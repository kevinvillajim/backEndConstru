// src/infrastructure/database/seeds/nec-seeds/nec-cargas-seeds.ts
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
 * Semillas para plantillas de cálculo de cargas no sísmicas (NEC-SE-CG)
 */
export async function seedCargasNoSismicasTemplates() {
	const connection = AppDataSource.getInstance();
	const templateRepository = connection.getRepository(
		CalculationTemplateEntity
	);
	const parameterRepository = connection.getRepository(
		CalculationParameterEntity
	);

	console.log("📊 Creando plantillas de cálculo de cargas (NEC-SE-CG)...");

	// Verificar si ya existen plantillas con tag NEC-SE-CG
	const existingCount = await templateRepository.count({
		where: {
			tags: ["NEC-SE-CG"],
		},
	});

	if (existingCount > 0) {
		console.log(
			`Ya existen ${existingCount} plantillas de Cargas No Sísmicas. Omitiendo...`
		);
		return;
	}

	try {
		// 1. PLANTILLA: CÁLCULO DE CARGAS MUERTAS
		const cargasMuertasTemplate = templateRepository.create({
			name: "Cálculo de Cargas Muertas (NEC-SE-CG)",
			description:
				"Calcula el peso propio y cargas muertas de una estructura según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo del área
        const area = longitud * ancho;
        
        // Cálculo de cargas muertas
        const pesoPropio = area * cargaElementosEstructurales;
        const pesoAcabados = area * cargaAcabados;
        const pesoParedes = area * cargaParedes;
        const pesoInstalaciones = area * cargaInstalaciones;
        
        // Carga muerta total
        const cargaMuertaTotal = pesoPropio + pesoAcabados + pesoParedes + pesoInstalaciones;
        
        // Carga muerta por unidad de área
        const cargaMuertaUnitaria = cargaMuertaTotal / area;
        
        return {
          area,
          pesoPropio,
          pesoAcabados,
          pesoParedes,
          pesoInstalaciones,
          cargaMuertaTotal,
          cargaMuertaUnitaria
        };
      `,
			necReference: "NEC-SE-CG, Sección 3.2",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-CG", "cargas", "estructural", "cargas muertas"],
			shareLevel: "public",
		});

		await templateRepository.save(cargasMuertasTemplate);

		// Parámetros para cargas muertas
		const cargasMuertasParams = [
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "longitud",
				description: "Longitud del área",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "10",
				unitOfMeasure: "m",
				helpText: "Longitud del área a analizar",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "ancho",
				description: "Ancho del área",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "10",
				unitOfMeasure: "m",
				helpText: "Ancho del área a analizar",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "cargaElementosEstructurales",
				description: "Carga de elementos estructurales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0,
				defaultValue: "3.0",
				unitOfMeasure: "kN/m²",
				helpText:
					"Carga por unidad de área correspondiente a elementos estructurales",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "cargaAcabados",
				description: "Carga de acabados",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0,
				defaultValue: "1.5",
				unitOfMeasure: "kN/m²",
				helpText: "Carga por unidad de área correspondiente a acabados",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "cargaParedes",
				description: "Carga de paredes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0,
				defaultValue: "2.0",
				unitOfMeasure: "kN/m²",
				helpText: "Carga por unidad de área correspondiente a paredes",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "cargaInstalaciones",
				description: "Carga de instalaciones",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0,
				defaultValue: "0.5",
				unitOfMeasure: "kN/m²",
				helpText: "Carga por unidad de área correspondiente a instalaciones",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "area",
				description: "Área de la edificación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "pesoPropio",
				description: "Peso propio de elementos estructurales",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "pesoAcabados",
				description: "Peso de acabados",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "pesoParedes",
				description: "Peso de paredes",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "pesoInstalaciones",
				description: "Peso de instalaciones",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "cargaMuertaTotal",
				description: "Carga muerta total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasMuertasTemplate.id,
				name: "cargaMuertaUnitaria",
				description: "Carga muerta por unidad de área",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 13,
				unitOfMeasure: "kN/m²",
			}),
		];

		await parameterRepository.save(cargasMuertasParams);

		// 2. PLANTILLA: CÁLCULO DE CARGAS VIVAS
		const cargasVivasTemplate = templateRepository.create({
			name: "Cálculo de Cargas Vivas (NEC-SE-CG)",
			description:
				"Calcula las cargas vivas de ocupación según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo del área
        const area = longitud * ancho;
        
        // Cálculo de carga viva total (sin reducción)
        const cargaVivaSinReduccion = area * cargaVivaNominal;
        
        // Cálculo de reducción de carga viva
        let factorReduccion = 1.0;
        const areaInfluencia = area * kLL;
        
        // Aplicar reducción según NEC-SE-CG si se cumple condición
        if (aplicarReduccion && areaInfluencia >= 35) {
          // L = Lo * (0.25 + 4.5/sqrt(kLL*A))
          factorReduccion = 0.25 + (4.5 / Math.sqrt(areaInfluencia));
          // Factor no menor que 0.4 para elementos que reciben carga de un solo nivel
          if (factorReduccion < 0.4 && !elementoMultinivel) {
            factorReduccion = 0.4;
          }
          // Factor no menor que 0.6 para otros elementos
          else if (factorReduccion < 0.6 && elementoMultinivel) {
            factorReduccion = 0.6;
          }
          // Factor no mayor que 1.0 en ningún caso
          if (factorReduccion > 1.0) {
            factorReduccion = 1.0;
          }
        }
        
        // Carga viva reducida
        const cargaVivaReducida = cargaVivaSinReduccion * factorReduccion;
        
        return {
          area,
          cargaVivaSinReduccion,
          areaInfluencia,
          factorReduccion,
          cargaVivaReducida,
          cargaVivaUnitariaReducida: cargaVivaReducida / area
        };
      `,
			necReference: "NEC-SE-CG, Sección 4.2.3",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-CG", "cargas", "estructural", "cargas vivas"],
			shareLevel: "public",
		});

		await templateRepository.save(cargasVivasTemplate);

		// Parámetros para cargas vivas
		const cargasVivasParams = [
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "longitud",
				description: "Longitud del área",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "10",
				unitOfMeasure: "m",
				helpText: "Longitud del área a analizar",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "ancho",
				description: "Ancho del área",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "10",
				unitOfMeasure: "m",
				helpText: "Ancho del área a analizar",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "cargaVivaNominal",
				description: "Carga viva nominal según ocupación",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.5,
				defaultValue: "2.0",
				unitOfMeasure: "kN/m²",
				helpText: "Valor nominal de carga viva según tipo de ocupación",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "kLL",
				description: "Factor de elemento cargado",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0.1,
				maxValue: 4.0,
				defaultValue: "1.0",
				helpText:
					"Factor de elemento cargado (4 para columnas, 2 para vigas, 1 para losas)",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "aplicarReduccion",
				description: "¿Aplicar reducción de carga viva?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				defaultValue: "true",
				helpText:
					"Seleccione si se debe aplicar la reducción de carga viva por área",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "elementoMultinivel",
				description: "¿Elemento que recibe carga de múltiples niveles?",
				dataType: ParameterDataType.BOOLEAN,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				defaultValue: "false",
				helpText: "Seleccione si el elemento recibe carga de más de un nivel",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "area",
				description: "Área del elemento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "cargaVivaSinReduccion",
				description: "Carga viva sin reducción",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "areaInfluencia",
				description: "Área de influencia",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "factorReduccion",
				description: "Factor de reducción",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "cargaVivaReducida",
				description: "Carga viva reducida total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 11,
				unitOfMeasure: "kN",
			}),
			parameterRepository.create({
				calculationTemplateId: cargasVivasTemplate.id,
				name: "cargaVivaUnitariaReducida",
				description: "Carga viva reducida por unidad de área",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 12,
				unitOfMeasure: "kN/m²",
			}),
		];

		await parameterRepository.save(cargasVivasParams);

		// 3. PLANTILLA: CÁLCULO DE CARGA DE GRANIZO
		const cargaGranizoTemplate = templateRepository.create({
			name: "Cálculo de Carga de Granizo (NEC-SE-CG)",
			description:
				"Calcula la carga de granizo según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo del área
        const area = longitud * ancho;
        
        // Verificar altitud y pendiente
        let cargaGranizo = 0;
        
        if (altitud >= 1500) {
          if (pendienteCubierta <= 15) {
            // Para cubiertas con pendiente ≤ 15°
            cargaGranizo = 0.5; // kN/m²
          } else if (pendienteCubierta > 15 && pendienteCubierta < 50) {
            // Para cubiertas con pendiente entre 15° y 50°
            cargaGranizo = 0.5 * (1 - (pendienteCubierta - 15) / 35);
          }
          // Para pendientes ≥ 50°, la carga es 0
        }
        
        // Cálculo de carga total
        const cargaGranizoTotal = cargaGranizo * area;
        
        return {
          area,
          cargaGranizo,
          cargaGranizoTotal,
          altitudConsiderada: altitud,
          pendienteConsiderada: pendienteCubierta
        };
      `,
			necReference: "NEC-SE-CG, Sección 3.2.4",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-CG", "cargas", "estructural", "granizo"],
			shareLevel: "public",
		});

		await templateRepository.save(cargaGranizoTemplate);

		// Parámetros para carga de granizo
		const cargaGranizoParams = [
			parameterRepository.create({
				calculationTemplateId: cargaGranizoTemplate.id,
				name: "longitud",
				description: "Longitud de la cubierta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "10",
				unitOfMeasure: "m",
				helpText: "Longitud de la cubierta a analizar",
			}),
			parameterRepository.create({
				calculationTemplateId: cargaGranizoTemplate.id,
				name: "ancho",
				description: "Ancho de la cubierta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "10",
				unitOfMeasure: "m",
				helpText: "Ancho de la cubierta a analizar",
			}),
			parameterRepository.create({
				calculationTemplateId: cargaGranizoTemplate.id,
				name: "altitud",
				description: "Altitud del sitio",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0,
				maxValue: 6000,
				defaultValue: "2800",
				unitOfMeasure: "msnm",
				helpText: "Altitud sobre el nivel del mar del sitio",
			}),
			parameterRepository.create({
				calculationTemplateId: cargaGranizoTemplate.id,
				name: "pendienteCubierta",
				description: "Pendiente de la cubierta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0,
				maxValue: 90,
				defaultValue: "15",
				unitOfMeasure: "grados",
				helpText: "Pendiente de la cubierta en grados",
			}),
			parameterRepository.create({
				calculationTemplateId: cargaGranizoTemplate.id,
				name: "area",
				description: "Área de la cubierta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 5,
				unitOfMeasure: "m²",
			}),
			parameterRepository.create({
				calculationTemplateId: cargaGranizoTemplate.id,
				name: "cargaGranizo",
				description: "Carga de granizo por unidad de área",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 6,
				unitOfMeasure: "kN/m²",
			}),
			parameterRepository.create({
				calculationTemplateId: cargaGranizoTemplate.id,
				name: "cargaGranizoTotal",
				description: "Carga de granizo total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "kN",
			}),
		];

		await parameterRepository.save(cargaGranizoParams);

		// 4. PLANTILLA: CÁLCULO DE PRESIÓN DE VIENTO
		const presionVientoTemplate = templateRepository.create({
			name: "Cálculo de Presión de Viento (NEC-SE-CG)",
			description:
				"Calcula la presión de viento sobre una estructura según la Norma Ecuatoriana de la Construcción.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Presión calculada según NEC-SE-CG
        // P = (1/2)ρVb²ce·cf
        
        // Densidad del aire a 15°C a nivel del mar
        const densidadAire = 1.225; // kg/m³
        
        // Velocidad corregida por altura
        const velocidadCorregida = velocidadViento * factorCorrecionAltura;
        
        // Presión dinámica de viento
        const presionDinamica = 0.5 * densidadAire * Math.pow(velocidadCorregida, 2) / 1000; // kN/m²
        
        // Presión de viento según el tipo
        let presionViento;
        if (tipoPresion === "barlovento") {
          presionViento = presionDinamica * coeficienteEntorno * 0.8; // Presión positiva típica
        } else if (tipoPresion === "sotavento") {
          presionViento = presionDinamica * coeficienteEntorno * (-0.5); // Presión negativa típica
        } else if (tipoPresion === "cubiertaPlana") {
          presionViento = presionDinamica * coeficienteEntorno * (-0.7); // Succión en cubierta plana
        } else {
          // Calcular con coeficiente forma proporcionado
          presionViento = presionDinamica * coeficienteEntorno * coeficienteForma;
        }
        
        // Fuerza total sobre el área
        const fuerzaViento = presionViento * area;
        
        return {
          velocidadCorregida,
          presionDinamica,
          presionViento,
          fuerzaViento,
          coeficienteEntornoUsado: coeficienteEntorno,
          coeficienteFormaUsado: coeficienteForma
        };
      `,
			necReference: "NEC-SE-CG, Sección 3.2.4",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-CG", "cargas", "estructural", "viento"],
			shareLevel: "public",
		});

		await templateRepository.save(presionVientoTemplate);

		// Parámetros para presión de viento
		const presionVientoParams = [
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "velocidadViento",
				description: "Velocidad de viento básica",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 10,
				maxValue: 200,
				defaultValue: "75",
				unitOfMeasure: "km/h",
				helpText: "Velocidad básica del viento (mínimo 75 km/h según NEC)",
			}),
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "factorCorrecionAltura",
				description: "Factor de corrección por altura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0.5,
				maxValue: 2.0,
				defaultValue: "1.0",
				helpText: "Factor de corrección que considera la altura del elemento",
			}),
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "coeficienteEntorno",
				description: "Coeficiente de entorno/altura",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0.5,
				maxValue: 3.0,
				defaultValue: "1.5",
				helpText: "Coeficiente que considera la exposición y altura",
			}),
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "coeficienteForma",
				description: "Coeficiente de forma",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: -2.0,
				maxValue: 2.0,
				defaultValue: "0.8",
				helpText:
					"Coeficiente que depende de la forma del elemento (+ presión, - succión)",
			}),
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "tipoPresion",
				description: "Ubicación respecto al viento",
				dataType: ParameterDataType.ENUM,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				defaultValue: "barlovento",
				allowedValues: JSON.stringify([
					"barlovento",
					"sotavento",
					"cubiertaPlana",
					"personalizado",
				]),
				helpText: "Ubicación del elemento respecto a la dirección del viento",
			}),
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "area",
				description: "Área expuesta",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0.1,
				defaultValue: "10",
				unitOfMeasure: "m²",
				helpText: "Área expuesta al viento",
			}),
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "velocidadCorregida",
				description: "Velocidad de viento corregida",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 7,
				unitOfMeasure: "km/h",
			}),
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "presionDinamica",
				description: "Presión dinámica de viento",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				unitOfMeasure: "kN/m²",
			}),
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "presionViento",
				description: "Presión de viento resultante",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				unitOfMeasure: "kN/m²",
			}),
			parameterRepository.create({
				calculationTemplateId: presionVientoTemplate.id,
				name: "fuerzaViento",
				description: "Fuerza de viento total",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.OUTPUT,
				displayOrder: 10,
				unitOfMeasure: "kN",
			}),
		];

		await parameterRepository.save(presionVientoParams);

		// 5. PLANTILLA: COMBINACIONES DE CARGA
		const combinacionesCargaTemplate = templateRepository.create({
			name: "Combinaciones de Carga (NEC-SE-CG)",
			description:
				"Calcula las combinaciones de carga según la Norma Ecuatoriana de la Construcción utilizando el método LRFD.",
			type: CalculationType.STRUCTURAL,
			targetProfession: ProfessionType.CIVIL_ENGINEER,
			formula: `
        // Cálculo de combinaciones de carga según NEC-SE-CG
        // Método LRFD (Load and Resistance Factor Design)
        
        // Combinación 1: 1.4D
        const combinacion1 = 1.4 * cargaMuerta;
        
        // Combinación 2: 1.2D + 1.6L + 0.5(Lr o S o R)
        let cargaTechoMax = Math.max(cargaTecho, cargaNieve, cargaLluvia);
        const combinacion2 = 1.2 * cargaMuerta + 1.6 * cargaViva + 0.5 * cargaTechoMax;
        
        // Combinación 3: 1.2D + 1.6(Lr o S o R) + (L o 0.5W)
        const combinacion3a = 1.2 * cargaMuerta + 1.6 * cargaTechoMax + cargaViva;
        const combinacion3b = 1.2 * cargaMuerta + 1.6 * cargaTechoMax + 0.5 * cargaViento;
        const combinacion3 = Math.max(combinacion3a, combinacion3b);
        
        // Combinación 4: 1.2D + 1.0W + L + 0.5(Lr o S o R)
        const combinacion4 = 1.2 * cargaMuerta + 1.0 * cargaViento + cargaViva + 0.5 * cargaTechoMax;
        
        // Combinación 5: 1.2D + 1.0E + L + 0.2S
        const combinacion5 = 1.2 * cargaMuerta + 1.0 * cargaSismo + cargaViva + 0.2 * cargaNieve;
        
        // Combinación 6: 0.9D + 1.0W
        const combinacion6 = 0.9 * cargaMuerta + 1.0 * cargaViento;
        
        // Combinación 7: 0.9D + 1.0E
        const combinacion7 = 0.9 * cargaMuerta + 1.0 * cargaSismo;
        
        // Encontrar la combinación crítica (máxima)
        const combinaciones = [
          { nombre: "1.4D", valor: combinacion1 },
          { nombre: "1.2D + 1.6L + 0.5(Lr,S,R)", valor: combinacion2 },
          { nombre: "1.2D + 1.6(Lr,S,R) + (L,0.5W)", valor: combinacion3 },
          { nombre: "1.2D + 1.0W + L + 0.5(Lr,S,R)", valor: combinacion4 },
          { nombre: "1.2D + 1.0E + L + 0.2S", valor: combinacion5 },
          { nombre: "0.9D + 1.0W", valor: combinacion6 },
          { nombre: "0.9D + 1.0E", valor: combinacion7 }
        ];
        
        // Ordenar combinaciones de mayor a menor
        combinaciones.sort((a, b) => b.valor - a.valor);
        
        return {
          combinaciones,
          combinacionCritica: combinaciones[0],
          combinacion1,
          combinacion2,
          combinacion3,
          combinacion4,
          combinacion5,
          combinacion6,
          combinacion7
        };
      `,
			necReference: "NEC-SE-CG, Sección 3.4.3",
			isActive: true,
			version: 1,
			source: TemplateSource.SYSTEM,
			isVerified: true,
			isFeatured: true,
			tags: ["NEC-SE-CG", "cargas", "estructural", "combinaciones de carga"],
			shareLevel: "public",
		});

		await templateRepository.save(combinacionesCargaTemplate);

		// Parámetros para combinaciones de carga
		const combinacionesCargaParams = [
			parameterRepository.create({
				calculationTemplateId: combinacionesCargaTemplate.id,
				name: "cargaMuerta",
				description: "Carga muerta (D)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 1,
				isRequired: true,
				minValue: 0,
				defaultValue: "500",
				unitOfMeasure: "kN",
				helpText: "Carga muerta total de la estructura",
			}),
			parameterRepository.create({
				calculationTemplateId: combinacionesCargaTemplate.id,
				name: "cargaViva",
				description: "Carga viva (L)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 2,
				isRequired: true,
				minValue: 0,
				defaultValue: "200",
				unitOfMeasure: "kN",
				helpText: "Carga viva total de la estructura",
			}),
			parameterRepository.create({
				calculationTemplateId: combinacionesCargaTemplate.id,
				name: "cargaTecho",
				description: "Carga viva de techo (Lr)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 3,
				isRequired: true,
				minValue: 0,
				defaultValue: "70",
				unitOfMeasure: "kN",
				helpText: "Carga viva de techo",
			}),
			parameterRepository.create({
				calculationTemplateId: combinacionesCargaTemplate.id,
				name: "cargaNieve",
				description: "Carga de nieve (S)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 4,
				isRequired: true,
				minValue: 0,
				defaultValue: "50",
				unitOfMeasure: "kN",
				helpText: "Carga de nieve o granizo",
			}),
			parameterRepository.create({
				calculationTemplateId: combinacionesCargaTemplate.id,
				name: "cargaLluvia",
				description: "Carga de lluvia (R)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 5,
				isRequired: true,
				minValue: 0,
				defaultValue: "30",
				unitOfMeasure: "kN",
				helpText: "Carga de lluvia",
			}),
			parameterRepository.create({
				calculationTemplateId: combinacionesCargaTemplate.id,
				name: "cargaViento",
				description: "Carga de viento (W)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 6,
				isRequired: true,
				minValue: 0,
				defaultValue: "80",
				unitOfMeasure: "kN",
				helpText: "Carga de viento",
			}),
			parameterRepository.create({
				calculationTemplateId: combinacionesCargaTemplate.id,
				name: "cargaSismo",
				description: "Carga de sismo (E)",
				dataType: ParameterDataType.NUMBER,
				scope: ParameterScope.INPUT,
				displayOrder: 7,
				isRequired: true,
				minValue: 0,
				defaultValue: "150",
				unitOfMeasure: "kN",
				helpText: "Carga de sismo",
			}),
			parameterRepository.create({
				calculationTemplateId: combinacionesCargaTemplate.id,
				name: "combinaciones",
				description: "Todas las combinaciones de carga",
				dataType: ParameterDataType.ARRAY,
				scope: ParameterScope.OUTPUT,
				displayOrder: 8,
				helpText: "Lista de todas las combinaciones de carga calculadas",
			}),
			parameterRepository.create({
				calculationTemplateId: combinacionesCargaTemplate.id,
				name: "combinacionCritica",
				description: "Combinación crítica",
				dataType: ParameterDataType.OBJECT,
				scope: ParameterScope.OUTPUT,
				displayOrder: 9,
				helpText: "Combinación de carga con el valor más alto",
			}),
		];

		await parameterRepository.save(combinacionesCargaParams);

		console.log(
			"✅ Plantillas de Cargas No Sísmicas (NEC-SE-CG) creadas exitosamente"
		);
	} catch (error) {
		console.error("❌ Error al crear plantillas de Cargas No Sísmicas:", error);
		throw error;
	}
}
