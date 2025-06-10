// src/infrastructure/database/seeds/index.ts
// VERSIÓN CORREGIDA - EJECUTA LAS FUNCIONES EN LUGAR DE SOLO IMPORTARLAS

import "reflect-metadata";
import {AppDataSource} from "../data-source";
import {seedMaterialCalculationTemplates} from "./material-calculation-templates-seeds";
// import { seedNecTemplates } from "./nec-seeds/index"; // Descomenta cuando tengas esta función

async function runAllSeeds() {
	try {
		console.log("🚀 Iniciando seeds...");

		// Conectar a la base de datos
		await AppDataSource.initialize();
		console.log("✅ Conectado a la base de datos");

		// 1. Ejecutar seeds de material calculation templates
		console.log("📦 Ejecutando seeds de Material Calculation Templates...");
		await seedMaterialCalculationTemplates(); // ← EJECUTAR LA FUNCIÓN

		// 2. Ejecutar seeds de NEC (descomenta cuando esté listo)
		// console.log("📦 Ejecutando seeds de NEC...");
		// await seedNecTemplates(); // ← EJECUTAR LA FUNCIÓN

		console.log("✅ Todos los seeds se ejecutaron correctamente.");
	} catch (error) {
		console.error("❌ Error ejecutando seeds:", error);
		process.exit(1);
	} finally {
		await AppDataSource.destroy();
		console.log("🔌 Conexión cerrada");
	}
}

// Ejecutar si se llama directamente
if (require.main === module) {
	runAllSeeds();
}

export {runAllSeeds};
