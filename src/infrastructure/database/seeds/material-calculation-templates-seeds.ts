// src/infrastructure/database/seeds/material-calculation-templates-seeds.ts
import {AppDataSource} from "../data-source";
import {MaterialCalculationTemplateEntity} from "../entities/MaterialCalculationTemplateEntity";
import {MaterialParameterEntity} from "../entities/MaterialParameterEntity";

export async function seedMaterialCalculationTemplates(): Promise<void> {
	const templateRepository = AppDataSource.getRepository(
		MaterialCalculationTemplateEntity
	);
	const parameterRepository = AppDataSource.getRepository(
		MaterialParameterEntity
	);

	const templates = [
		// MAMPOSTERÍA - Cálculo de Ladrillos
		{
			name: "Cálculo de Ladrillos King Kong",
			description:
				"Calcula la cantidad de ladrillos King Kong (24x13x9 cm) necesarios para un muro, incluyendo mortero de pega.",
			type: "masonry",
			subCategory: "ladrillo_king_kong",
			formula: `
        // Dimensiones del ladrillo King Kong en cm
        const ladrilloLargo = 24;
        const ladrilloAncho = 13;
        const ladrilloAlto = 9;
        
        // Espesor de junta
        const juntaHorizontal = espesurJunta || 1.5;
        const juntaVertical = espesurJunta || 1.5;
        
        // Área efectiva por ladrillo (incluyendo junta)
        const areaLadrilloConJunta = (ladrilloLargo + juntaVertical) * (ladrilloAlto + juntaHorizontal);
        const areaLadrilloM2 = areaLadrilloConJunta / 10000; // Convertir a m²
        
        // Área total del muro
        const areaMuro = largo * alto;
        
        // Descontar vanos si existen
        const areaVanos = (anchoVanos * altoVanos * cantidadVanos) || 0;
        const areaEfectiva = areaMuro - areaVanos;
        
        // Cantidad de ladrillos
        const cantidadLadrillosBase = Math.ceil(areaEfectiva / areaLadrilloM2);
        const cantidadLadrillos = Math.ceil(cantidadLadrillosBase * (1 + desperdicioLadrillos / 100));
        
        // Cálculo de mortero de pega
        const volumenMuroTotal = areaEfectiva * espesurMuro;
        const volumenLadrillos = cantidadLadrillosBase * (ladrilloLargo * ladrilloAncho * ladrilloAlto) / 1000000;
        const volumenMortero = volumenMuroTotal - volumenLadrillos;
        
        // Materiales para mortero (dosificación 1:5)
        const cemento = volumenMortero * 300; // kg de cemento
        const arena = volumenMortero * 0.6; // m³ de arena
        const agua = volumenMortero * 180; // litros de agua
        
        return {
          cantidadLadrillos,
          volumenMortero,
          cemento,
          arena,
          agua,
          areaEfectiva,
          cantidadBolsasCemento: Math.ceil(cemento / 50)
        };
      `,
			materialOutputs: [
				{
					materialName: "Ladrillos King Kong",
					unit: "units",
					description: "Ladrillos King Kong de 24x13x9 cm",
					category: "Mampostería",
					isMain: true,
				},
				{
					materialName: "Cemento",
					unit: "kg",
					description: "Cemento para mortero de pega",
					category: "Cemento",
					isMain: false,
				},
				{
					materialName: "Arena",
					unit: "m3",
					description: "Arena fina para mortero",
					category: "Agregados",
					isMain: false,
				},
				{
					materialName: "Agua",
					unit: "units",
					description: "Agua para mortero (litros)",
					category: "Agua",
					isMain: false,
				},
			],
			wasteFactors: [
				{
					materialType: "ladrillos",
					minWaste: 5,
					averageWaste: 8,
					maxWaste: 12,
					conditions: ["transporte", "cortes", "rotura"],
				},
			],
			parameters: [
				{
					name: "largo",
					description: "Largo del muro",
					dataType: "number",
					scope: "input",
					displayOrder: 1,
					isRequired: true,
					defaultValue: "10",
					minValue: 0.5,
					maxValue: 100,
					unit: "ml",
					helpText: "Longitud total del muro en metros",
				},
				{
					name: "alto",
					description: "Altura del muro",
					dataType: "number",
					scope: "input",
					displayOrder: 2,
					isRequired: true,
					defaultValue: "2.8",
					minValue: 0.5,
					maxValue: 20,
					unit: "ml",
					helpText: "Altura del muro en metros",
				},
				{
					name: "espesurMuro",
					description: "Espesor del muro",
					dataType: "number",
					scope: "input",
					displayOrder: 3,
					isRequired: true,
					defaultValue: "0.15",
					minValue: 0.1,
					maxValue: 0.5,
					unit: "ml",
					helpText: "Espesor del muro en metros",
				},
				{
					name: "espesurJunta",
					description: "Espesor de junta",
					dataType: "number",
					scope: "input",
					displayOrder: 4,
					isRequired: false,
					defaultValue: "1.5",
					minValue: 0.8,
					maxValue: 2.5,
					unit: "ml",
					helpText: "Espesor de la junta de mortero en centímetros",
				},
				{
					name: "anchoVanos",
					description: "Ancho promedio de vanos",
					dataType: "number",
					scope: "input",
					displayOrder: 5,
					isRequired: false,
					defaultValue: "1.2",
					minValue: 0,
					maxValue: 10,
					unit: "ml",
					helpText: "Ancho promedio de puertas y ventanas",
				},
				{
					name: "altoVanos",
					description: "Alto promedio de vanos",
					dataType: "number",
					scope: "input",
					displayOrder: 6,
					isRequired: false,
					defaultValue: "2.1",
					minValue: 0,
					maxValue: 5,
					unit: "ml",
					helpText: "Alto promedio de puertas y ventanas",
				},
				{
					name: "cantidadVanos",
					description: "Cantidad de vanos",
					dataType: "number",
					scope: "input",
					displayOrder: 7,
					isRequired: false,
					defaultValue: "0",
					minValue: 0,
					maxValue: 20,
					unit: "units",
					helpText: "Número total de puertas y ventanas",
				},
				{
					name: "desperdicioLadrillos",
					description: "Desperdicio de ladrillos (%)",
					dataType: "number",
					scope: "input",
					displayOrder: 8,
					isRequired: false,
					defaultValue: "8",
					minValue: 5,
					maxValue: 15,
					unit: "units",
					helpText: "Porcentaje de desperdicio por cortes y roturas",
				},
			],
		},

		// ACABADOS - Cálculo de Cerámicos
		{
			name: "Cálculo de Cerámicos para Piso",
			description:
				"Calcula la cantidad de cerámicos, adhesivo y fragüe necesarios para revestir un piso.",
			type: "finishes",
			subCategory: "ceramico_piso",
			formula: `
        // Área total a revestir
        const areaTotal = largo * ancho;
        
        // Área por pieza cerámica
        const areaPieza = (anchoPieza / 100) * (largoPieza / 100); // Convertir cm a m
        
        // Cantidad de piezas
        const piezasBase = Math.ceil(areaTotal / areaPieza);
        const piezasConDesperdicio = Math.ceil(piezasBase * (1 + desperdicioCeramico / 100));
        
        // Cálculo de adhesivo (según tamaño de llana)
        let consumoAdhesivo;
        switch (tamanoLlana) {
          case '6mm': consumoAdhesivo = 3.5; break;
          case '8mm': consumoAdhesivo = 4.5; break;
          case '10mm': consumoAdhesivo = 5.5; break;
          case '12mm': consumoAdhesivo = 7; break;
          default: consumoAdhesivo = 4.5;
        }
        
        const adhesivo = areaTotal * consumoAdhesivo; // kg
        
        // Cálculo de fragüe/pastina
        const anchoJuntaCm = anchoJunta;
        const espesurPiezaMm = espesurPieza;
        const consumoFrague = ((anchoPieza + largoPieza) / (anchoPieza * largoPieza)) * espesurPiezaMm * anchoJuntaCm * 1.5;
        const frague = areaTotal * consumoFrague / 1000; // kg
        
        return {
          piezasCeramicas: piezasConDesperdicio,
          adhesivo: Math.ceil(adhesivo),
          frague: Math.ceil(frague * 10) / 10,
          areaTotal,
          metrosCuadradosUtiles: piezasBase * areaPieza,
          bolsasAdhesivo: Math.ceil(adhesivo / 25),
          bolsasFrague: Math.ceil(frague / 5)
        };
      `,
			materialOutputs: [
				{
					materialName: "Cerámicos",
					unit: "units",
					description: "Piezas cerámicas para piso",
					category: "Acabados",
					isMain: true,
				},
				{
					materialName: "Adhesivo",
					unit: "kg",
					description: "Adhesivo para cerámicos",
					category: "Adhesivos",
					isMain: false,
				},
				{
					materialName: "Fragüe",
					unit: "kg",
					description: "Fragüe o pastina para juntas",
					category: "Fragüe",
					isMain: false,
				},
			],
			wasteFactors: [
				{
					materialType: "ceramicos",
					minWaste: 10,
					averageWaste: 15,
					maxWaste: 20,
					conditions: ["cortes", "rotura", "diseño_complejo"],
				},
			],
			parameters: [
				{
					name: "largo",
					description: "Largo del área",
					dataType: "number",
					scope: "input",
					displayOrder: 1,
					isRequired: true,
					defaultValue: "5",
					minValue: 0.5,
					maxValue: 50,
					unit: "ml",
					helpText: "Largo del área a revestir en metros",
				},
				{
					name: "ancho",
					description: "Ancho del área",
					dataType: "number",
					scope: "input",
					displayOrder: 2,
					isRequired: true,
					defaultValue: "4",
					minValue: 0.5,
					maxValue: 50,
					unit: "ml",
					helpText: "Ancho del área a revestir en metros",
				},
				{
					name: "anchoPieza",
					description: "Ancho de la pieza cerámica",
					dataType: "number",
					scope: "input",
					displayOrder: 3,
					isRequired: true,
					defaultValue: "30",
					minValue: 10,
					maxValue: 120,
					unit: "ml",
					helpText: "Ancho de la pieza cerámica en centímetros",
				},
				{
					name: "largoPieza",
					description: "Largo de la pieza cerámica",
					dataType: "number",
					scope: "input",
					displayOrder: 4,
					isRequired: true,
					defaultValue: "30",
					minValue: 10,
					maxValue: 120,
					unit: "ml",
					helpText: "Largo de la pieza cerámica en centímetros",
				},
				{
					name: "espesurPieza",
					description: "Espesor de la pieza",
					dataType: "number",
					scope: "input",
					displayOrder: 5,
					isRequired: true,
					defaultValue: "8",
					minValue: 4,
					maxValue: 20,
					unit: "ml",
					helpText: "Espesor de la pieza cerámica en milímetros",
				},
				{
					name: "anchoJunta",
					description: "Ancho de junta",
					dataType: "number",
					scope: "input",
					displayOrder: 6,
					isRequired: true,
					defaultValue: "3",
					minValue: 1,
					maxValue: 10,
					unit: "ml",
					helpText: "Ancho de la junta en milímetros",
				},
				{
					name: "tamanoLlana",
					description: "Tamaño de llana dentada",
					dataType: "enum",
					scope: "input",
					displayOrder: 7,
					isRequired: true,
					defaultValue: "8mm",
					allowedValues: ["6mm", "8mm", "10mm", "12mm"],
					helpText: "Tamaño de la llana dentada para aplicar adhesivo",
				},
				{
					name: "desperdicioCeramico",
					description: "Desperdicio de cerámicos (%)",
					dataType: "number",
					scope: "input",
					displayOrder: 8,
					isRequired: false,
					defaultValue: "15",
					minValue: 10,
					maxValue: 25,
					unit: "units",
					helpText: "Porcentaje de desperdicio por cortes y roturas",
				},
			],
		},

		// HORMIGÓN - Cálculo de Hormigón Armado
		{
			name: "Cálculo de Hormigón f'c=210 kg/cm²",
			description:
				"Calcula los materiales necesarios para hormigón de resistencia f'c=210 kg/cm², incluyendo cemento, arena, grava y agua.",
			type: "concrete",
			subCategory: "hormigon_210",
			formula: `
        // Volumen total de hormigón
        const volumenHormigon = largo * ancho * alto;
        
        // Dosificación para f'c=210 kg/cm² (1:2:4)
        const dosificacionCemento = 1;
        const dosificacionArena = 2;
        const dosificacionGrava = 4;
        
        // Materiales por m³
        const cementoPorM3 = 320; // kg/m³
        const arenaPorM3 = 0.56; // m³/m³
        const gravaPorM3 = 0.84; // m³/m³
        const aguaPorM3 = 190; // litros/m³
        
        // Cálculos totales
        const cemento = volumenHormigon * cementoPorM3;
        const arena = volumenHormigon * arenaPorM3;
        const grava = volumenHormigon * gravaPorM3;
        const agua = volumenHormigon * aguaPorM3;
        
        // Ajuste por desperdicio
        const cementoFinal = cemento * (1 + desperdicioHormigon / 100);
        const arenaFinal = arena * (1 + desperdicioHormigon / 100);
        const gravaFinal = grava * (1 + desperdicioHormigon / 100);
        const aguaFinal = agua * (1 + desperdicioHormigon / 100);
        
        return {
          volumenHormigon,
          cemento: Math.ceil(cementoFinal),
          arena: Math.ceil(arenaFinal * 100) / 100,
          grava: Math.ceil(gravaFinal * 100) / 100,
          agua: Math.ceil(aguaFinal),
          bolsasCemento: Math.ceil(cementoFinal / 50),
          resistencia: 210
        };
      `,
			materialOutputs: [
				{
					materialName: "Cemento",
					unit: "kg",
					description: "Cemento Portland tipo I",
					category: "Cemento",
					isMain: true,
				},
				{
					materialName: "Arena",
					unit: "m3",
					description: "Arena lavada para hormigón",
					category: "Agregados",
					isMain: true,
				},
				{
					materialName: "Grava",
					unit: "m3",
					description: 'Grava de 3/4" para hormigón',
					category: "Agregados",
					isMain: true,
				},
				{
					materialName: "Agua",
					unit: "units",
					description: "Agua potable (litros)",
					category: "Agua",
					isMain: false,
				},
			],
			wasteFactors: [
				{
					materialType: "hormigon",
					minWaste: 3,
					averageWaste: 5,
					maxWaste: 8,
					conditions: ["transporte", "vertido", "fraguado"],
				},
			],
			parameters: [
				{
					name: "largo",
					description: "Largo del elemento",
					dataType: "number",
					scope: "input",
					displayOrder: 1,
					isRequired: true,
					defaultValue: "4",
					minValue: 0.1,
					maxValue: 50,
					unit: "ml",
					helpText: "Largo del elemento de hormigón en metros",
				},
				{
					name: "ancho",
					description: "Ancho del elemento",
					dataType: "number",
					scope: "input",
					displayOrder: 2,
					isRequired: true,
					defaultValue: "3",
					minValue: 0.1,
					maxValue: 20,
					unit: "ml",
					helpText: "Ancho del elemento de hormigón en metros",
				},
				{
					name: "alto",
					description: "Alto/Espesor del elemento",
					dataType: "number",
					scope: "input",
					displayOrder: 3,
					isRequired: true,
					defaultValue: "0.15",
					minValue: 0.05,
					maxValue: 5,
					unit: "ml",
					helpText: "Alto o espesor del elemento en metros",
				},
				{
					name: "desperdicioHormigon",
					description: "Desperdicio de hormigón (%)",
					dataType: "number",
					scope: "input",
					displayOrder: 4,
					isRequired: false,
					defaultValue: "5",
					minValue: 3,
					maxValue: 10,
					unit: "units",
					helpText: "Porcentaje de desperdicio en el proceso",
				},
			],
		},
	];

	// Guardar templates
	for (const templateData of templates) {
		const existingTemplate = await templateRepository.findOne({
			where: {name: templateData.name},
		});

		if (!existingTemplate) {
			// Crear template
			const template = templateRepository.create({
				id: crypto.randomUUID(),
				name: templateData.name,
				description: templateData.description,
				type: templateData.type,
				subCategory: templateData.subCategory,
				formula: templateData.formula,
				materialOutputs: templateData.materialOutputs,
				wasteFactors: templateData.wasteFactors,
				isActive: true,
				isVerified: true,
				isFeatured: true,
				shareLevel: "public",
				version: 1,
				usageCount: 0,
				averageRating: 0,
				ratingCount: 0,
				tags: [templateData.type, templateData.subCategory],
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const savedTemplate = await templateRepository.save(template);

			// Crear parámetros
			for (const paramData of templateData.parameters) {
				const parameter = parameterRepository.create({
					id: crypto.randomUUID(),
					name: paramData.name,
					description: paramData.description,
					dataType: paramData.dataType,
					scope: paramData.scope,
					displayOrder: paramData.displayOrder,
					isRequired: paramData.isRequired,
					defaultValue: paramData.defaultValue,
					minValue: paramData.minValue,
					maxValue: paramData.maxValue,
					unit: paramData.unit,
					allowedValues: paramData.allowedValues,
					helpText: paramData.helpText,
					materialCalculationTemplateId: savedTemplate.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				await parameterRepository.save(parameter);
			}

			console.log(`✅ Template creado: ${templateData.name}`);
		} else {
			console.log(`⚠️  Template ya existe: ${templateData.name}`);
		}
	}

	console.log("🎉 Seeds de templates de materiales completados");
}
