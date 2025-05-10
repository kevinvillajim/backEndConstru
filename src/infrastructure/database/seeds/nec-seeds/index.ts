// src/infrastructure/database/seeds/nec-seeds/index.ts
import {seedCalculationTemplates} from "../calculation-templates";
import {seedSpecializedTemplates} from "../specialized-templates";
import {seedSeismicTemplates} from "./seismic-templates";
import {seedStructuralTemplates} from "./structural-templates";
import {seedFoundationTemplates} from "./foundation-templates";
import {seedEnergyEfficiencyTemplates} from "./energy-efficiency-templates";
import {seedRenewableEnergyTemplates} from "./renewable-energy-templates";
import {seedClimatizationTemplates} from "./climatization-templates";
import {seedGlassTemplates} from "./glass-templates";
import {seedGuaduaTemplates} from "./guadua-templates";
import {seedCargasCalculations} from "./nec-cargas-seeds";
import {seedSismicaCalculations} from "./nec-sismica-seeds";

/**
 * Función principal para inicializar todas las plantillas de cálculo basadas en la normativa NEC
 */
export async function seedNECTemplates() {
	console.log("🏗️ Iniciando siembra de plantillas NEC...");

	try {
		// Plantillas base generales
		await seedCalculationTemplates();
		await seedSpecializedTemplates();

		// Plantillas específicas NEC - Estructural
		console.log("⚙️ Inicializando plantillas estructurales...");
		await seedSeismicTemplates();
		await seedStructuralTemplates();
		await seedFoundationTemplates();
		await seedGuaduaTemplates();

		// Plantillas específicas NEC - Cargas y Sísmica (formato original)
		console.log(
			"⚡ Inicializando plantillas de cargas y sísmica adicionales..."
		);
		await seedCargasCalculations();
		await seedSismicaCalculations();

		// Plantillas específicas NEC - Habitabilidad y Salud
		console.log(
			"🌱 Inicializando plantillas de eficiencia y sostenibilidad..."
		);
		await seedEnergyEfficiencyTemplates();
		await seedRenewableEnergyTemplates();
		await seedClimatizationTemplates();
		await seedGlassTemplates();

		console.log(
			"✅ Todas las plantillas NEC han sido inicializadas correctamente"
		);
	} catch (error) {
		console.error("❌ Error al inicializar plantillas NEC:", error);
		throw error;
	}
}

// Ejecutar el seed si se llama directamente
if (require.main === module) {
	seedNECTemplates()
		.then(() => {
			console.log(
				"✅ Seeding de todas las plantillas NEC completado exitosamente"
			);
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Error en proceso de seeding:", error);
			process.exit(1);
		});
}
