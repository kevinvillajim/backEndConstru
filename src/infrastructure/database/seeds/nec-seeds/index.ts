// src/infrastructure/database/seeds/nec-seeds/index.ts
import {seedCalculationTemplates} from "../calculation-templates";
import {seedSpecializedTemplates} from "../specialized-templates";

// Agregar las nuevas importaciones con nomenclatura descriptiva
import {seedCargasNoSismicasTemplates} from "./nec-cargas-no-sismicas-seeds";
import {seedDisenoSismicoTemplates} from "./nec-diseno-sismico-seeds";
import {seedHormigonArmadoTemplates} from "./nec-hormigon-armado-seeds";
import {seedEstructurasAceroTemplates} from "./nec-estructuras-acero-seeds";
import {seedGeotecniaCimentacionesTemplates} from "./nec-geotecnia-cimentaciones-seeds";
import {seedEstructurasMaderaTemplates} from "./nec-estructuras-madera-seeds";
import {seedEstructurasGuaduaTemplates} from "./nec-estructuras-guadua-seeds";
import {seedViviendasDosPisosTemplates} from "./nec-viviendas-dos-pisos-seeds";
import {seedEficienciaEnergeticaTemplates} from "./nec-eficiencia-energetica-seeds";
import {seedClimatizacionTemplates} from "./nec-climatizacion-seeds";
import {seedEnergiasRenovablesTemplates} from "./nec-energias-renovables-seeds";
import {seedVidriosTemplates} from "./nec-vidrios-seeds";
import {seedContraIncendiosTemplates} from "./nec-contra-incendios-seeds";
import {seedMamposteriaTemplates} from "./nec-mamposteria-seeds";
import {seedInstalacionesElectricasTemplates} from "./nec-instalaciones-electricas-seeds";
import {seedTelecomunicacionesTemplates} from "./nec-telecomunicaciones-seeds";
import {seedAccesibilidadUniversalTemplates} from "./nec-accesibilidad-universal-seeds";

/**
 * Función principal para inicializar todas las plantillas de cálculo basadas en la normativa NEC
 */
export async function seedNECTemplates() {
	console.log("🏗️ Iniciando siembra de plantillas NEC...");

	try {
		// Plantillas base generales
		await seedCalculationTemplates();
		await seedSpecializedTemplates();

		// Plantillas específicas NEC organizadas por grupo normativo
		console.log("⚙️ Inicializando plantillas estructurales...");
		await seedDisenoSismicoTemplates();
		await seedCargasNoSismicasTemplates();
		await seedHormigonArmadoTemplates();
		await seedEstructurasAceroTemplates();
		await seedMamposteriaTemplates(); // Nueva
		await seedGeotecniaCimentacionesTemplates();
		await seedEstructurasMaderaTemplates();
		await seedEstructurasGuaduaTemplates();
		await seedViviendasDosPisosTemplates();

		console.log("🌱 Inicializando plantillas de habitabilidad y salud...");
		await seedEficienciaEnergeticaTemplates();
		await seedEnergiasRenovablesTemplates();
		await seedClimatizacionTemplates();
		await seedVidriosTemplates();
		await seedContraIncendiosTemplates(); // Nueva
		await seedAccesibilidadUniversalTemplates(); // Nueva

		console.log("⚡ Inicializando plantillas de instalaciones...");
		await seedInstalacionesElectricasTemplates(); // Nueva
		await seedTelecomunicacionesTemplates(); // Nueva

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
