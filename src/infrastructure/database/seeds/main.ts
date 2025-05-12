// src/infrastructure/database/seeds/index.ts

import {seedCalculationTemplates} from "./calculation-templates";
import {seedSpecializedTemplates} from "./specialized-templates";
import {seedNECTemplates} from "./nec-seeds/index";

// Importa otros seeders que puedas necesitar
// import { seedUsers } from "./users";
// import { seedMaterials } from "./materials";
// ...

/**
 * Función principal para ejecutar todos los seeders
 */
export async function runAllSeeds() {
	console.log("🌱 Iniciando proceso de seeding completo...");

	try {
		// Ejecutar seeders básicos primero
		await seedCalculationTemplates();
		await seedSpecializedTemplates();

		// Ejecutar todos los seeders NEC (este ya incluye los dos anteriores internamente)
		await seedNECTemplates();

		// Agregar otros seeders cuando los tengas
		// await seedUsers();
		// await seedMaterials();
		// ...

		console.log("✅ Proceso de seeding completado exitosamente");
	} catch (error) {
		console.error("❌ Error en el proceso de seeding:", error);
		throw error;
	}
}

// Ejecutar si se llama directamente
if (require.main === module) {
	runAllSeeds()
		.then(() => {
			console.log("✅ Todos los datos han sido sembrados correctamente");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Error durante el seeding:", error);
			process.exit(1);
		});
}
