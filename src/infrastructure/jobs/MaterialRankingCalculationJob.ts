// src/infrastructure/jobs/MaterialRankingCalculationJob.ts
import { CalculateMaterialTemplateRankingsUseCase } from "../../application/calculation/material/CalculateMaterialTemplateRankingsUseCase";
import cron from "node-cron";

export class MaterialRankingCalculationJob {
	constructor(
		private calculateRankingsUseCase: CalculateMaterialTemplateRankingsUseCase
	) {}

	start(): void {
		// Ejecutar cálculos diarios a las 2:00 AM
		cron.schedule("0 2 * * *", async () => {
			console.log("Iniciando cálculo de rankings de materiales diarios...");
			try {
				await this.calculateRankingsUseCase.execute("daily");
				console.log("Rankings diarios de materiales calculados exitosamente");
			} catch (error) {
				console.error(
					"Error calculando rankings diarios de materiales:",
					error
				);
			}
		});

		// Ejecutar cálculos semanales los domingos a las 3:00 AM
		cron.schedule("0 3 * * 0", async () => {
			console.log("Iniciando cálculo de rankings de materiales semanales...");
			try {
				await this.calculateRankingsUseCase.execute("weekly");
				console.log("Rankings semanales de materiales calculados exitosamente");
			} catch (error) {
				console.error(
					"Error calculando rankings semanales de materiales:",
					error
				);
			}
		});

		// Ejecutar cálculos mensuales el primer día del mes a las 4:00 AM
		cron.schedule("0 4 1 * *", async () => {
			console.log("Iniciando cálculo de rankings de materiales mensuales...");
			try {
				await this.calculateRankingsUseCase.execute("monthly");
				console.log("Rankings mensuales de materiales calculados exitosamente");
			} catch (error) {
				console.error(
					"Error calculando rankings mensuales de materiales:",
					error
				);
			}
		});

		// Ejecutar cálculos anuales el 1 de enero a las 5:00 AM
		cron.schedule("0 5 1 1 *", async () => {
			console.log("Iniciando cálculo de rankings de materiales anuales...");
			try {
				await this.calculateRankingsUseCase.execute("yearly");
				console.log("Rankings anuales de materiales calculados exitosamente");
			} catch (error) {
				console.error(
					"Error calculando rankings anuales de materiales:",
					error
				);
			}
		});
	}

	stop(): void {
		console.log("Stopping material ranking calculation jobs...");
	}
}
