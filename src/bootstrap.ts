// src/bootstrap.ts
import "reflect-metadata";
import {join} from "path";
import moduleAlias from "module-alias";
import {RankingCalculationJob} from "./infrastructure/jobs/RankingCalculationJob";

// Registrar los alias de ruta
moduleAlias.addAliases({
	"@domain": join(__dirname, "domain"),
	"@application": join(__dirname, "application"),
	"@infrastructure": join(__dirname, "infrastructure"),
	"@interfaces": join(__dirname, "interfaces"),
});

async function startBackgroundJobs(): Promise<void> {
	console.log("🚀 Iniciando jobs en segundo plano...");

	try {
		// Inicializar job de cálculo de rankings
		const rankingJob = RankingCalculationJob.getInstance();
		rankingJob.start();

		console.log("✅ Jobs iniciados correctamente");
	} catch (error) {
		console.error("❌ Error iniciando jobs:", error);
		// No lanzar error para no afectar el arranque de la aplicación
	}
}

// 3. AGREGAR ESTA LLAMADA dentro de la función bootstrap() DESPUÉS de initializeServices():
// Inicializar jobs en segundo plano
(async () => {
	await startBackgroundJobs();
})();

// 4. AGREGAR ESTE MANEJADOR DE SEÑALES al final de bootstrap():
// Manejar cierre graceful de la aplicación
process.on("SIGTERM", () => {
	console.log("🛑 Recibida señal SIGTERM, cerrando aplicación...");
	const rankingJob = RankingCalculationJob.getInstance();
	rankingJob.stop();
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("🛑 Recibida señal SIGINT, cerrando aplicación...");
	const rankingJob = RankingCalculationJob.getInstance();
	rankingJob.stop();
	process.exit(0);
});