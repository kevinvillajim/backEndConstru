// src/infrastructure/jobs/RankingCalculationJob.ts
import cron, {ScheduledTask} from "node-cron"; // Import ScheduledTask
import {getCalculateTemplateRankingsUseCase} from "../config/service-factory";
import {RankingCalculationResult} from "../../domain/models/RankingCalculationResult";
import {
	getTrackingConfig,
	validateTrackingConfig,
} from "../config/trackingConfig";
import {
	getUserTemplateUsageLogRepository,
	getTemplateRankingRepository,
} from "../config/service-factory";

export class RankingCalculationJob {
	private static instance: RankingCalculationJob;
	private isRunning = false;
	private scheduledTasks: ScheduledTask[] = []; // Array to store tasks

	private constructor() {}

	static getInstance(): RankingCalculationJob {
		if (!RankingCalculationJob.instance) {
			RankingCalculationJob.instance = new RankingCalculationJob();
		}
		return RankingCalculationJob.instance;
	}

	/**
	 * Inicia los jobs programados
	 */
	start(): void {
		const config = getTrackingConfig();

		// Validar configuración
		const configErrors = validateTrackingConfig(config);
		if (configErrors.length > 0) {
			console.error("❌ Errores en configuración de tracking:", configErrors);
			return;
		}

		if (!config.jobs.enabled) {
			console.log("ℹ️  Jobs de rankings deshabilitados por configuración");
			return;
		}

		console.log("🚀 Iniciando jobs de cálculo de rankings...");
		console.log(`   Zona horaria: ${config.jobs.timezone}`);
		console.log(
			`   Criterios mínimos: ${config.rankings.minimumCriteria.totalUsage} usos, ${config.rankings.minimumCriteria.uniqueUsers} usuarios`
		);

		// Clear any existing tasks if start is called multiple times (optional, based on desired behavior)
		this.stop();
		this.scheduledTasks = [];

		// Job diario
		const dailyJob = cron.schedule(
			config.jobs.schedules.daily,
			async () => {
				await this.calculateDailyRankings();
			},
			{
				timezone: config.jobs.timezone,
			}
		);
		this.scheduledTasks.push(dailyJob); // Store the task

		// Job semanal
		const weeklyJob = cron.schedule(
			config.jobs.schedules.weekly,
			async () => {
				await this.calculateWeeklyRankings();
			},
			{
				timezone: config.jobs.timezone,
			}
		);
		this.scheduledTasks.push(weeklyJob); // Store the task

		// Job mensual
		const monthlyJob = cron.schedule(
			config.jobs.schedules.monthly,
			async () => {
				await this.calculateMonthlyRankings();
			},
			{
				timezone: config.jobs.timezone,
			}
		);
		this.scheduledTasks.push(monthlyJob); // Store the task

		// Job anual
		const yearlyJob = cron.schedule(
			config.jobs.schedules.yearly,
			async () => {
				await this.calculateYearlyRankings();
			},
			{
				timezone: config.jobs.timezone,
			}
		);
		this.scheduledTasks.push(yearlyJob); // Store the task

		// Job de limpieza de datos
		const cleanupJob = cron.schedule(
			config.dataRetention.cleanupSchedule,
			async () => {
				await this.cleanupOldData();
			},
			{
				timezone: config.jobs.timezone,
			}
		);
		this.scheduledTasks.push(cleanupJob); // Store the task

		console.log("✅ Jobs de rankings programados correctamente");
	}

	/**
	 * Calcula rankings diarios
	 */
	private async calculateDailyRankings(): Promise<void> {
		if (this.isRunning) {
			console.log("⏳ Job de rankings ya en ejecución, saltando...");
			return;
		}

		this.isRunning = true;
		console.log("📊 Iniciando cálculo de rankings diarios...");

		try {
			const calculateRankingsUseCase = getCalculateTemplateRankingsUseCase();
			const result = await calculateRankingsUseCase.execute("daily");

			console.log(
				`✅ Rankings diarios calculados: ${result.totalRankingsCalculated} rankings`
			);
			console.log(`   - Plantillas personales: ${result.personalTemplates}`);
			console.log(`   - Plantillas verificadas: ${result.verifiedTemplates}`);

			if (result.topTemplate) {
				console.log(
					`   - Top template: ${result.topTemplate.templateId} (${result.topTemplate.templateType}) con score ${result.topTemplate.score}`
				);
			}
		} catch (error) {
			console.error("❌ Error calculando rankings diarios:", error);
		} finally {
			this.isRunning = false;
		}
	}

	/**
	 * Calcula rankings semanales
	 */
	private async calculateWeeklyRankings(): Promise<void> {
		if (this.isRunning) return; // Consider adding the console log here too for consistency

		this.isRunning = true;
		console.log("📊 Iniciando cálculo de rankings semanales...");

		try {
			const calculateRankingsUseCase = getCalculateTemplateRankingsUseCase();
			const result = await calculateRankingsUseCase.execute("weekly");

			console.log(
				`✅ Rankings semanales calculados: ${result.totalRankingsCalculated} rankings`
			);
			// You might want to log more details like in calculateDailyRankings
			console.log(`   - Plantillas personales: ${result.personalTemplates}`);
			console.log(`   - Plantillas verificadas: ${result.verifiedTemplates}`);
			if (result.topTemplate) {
				console.log(
					`   - Top template: ${result.topTemplate.templateId} (${result.topTemplate.templateType}) con score ${result.topTemplate.score}`
				);
			}
		} catch (error) {
			console.error("❌ Error calculando rankings semanales:", error);
		} finally {
			this.isRunning = false;
		}
	}

	/**
	 * Calcula rankings mensuales
	 */
	private async calculateMonthlyRankings(): Promise<void> {
		if (this.isRunning) return; // Consider adding the console log here too

		this.isRunning = true;
		console.log("📊 Iniciando cálculo de rankings mensuales...");

		try {
			const calculateRankingsUseCase = getCalculateTemplateRankingsUseCase();
			const result = await calculateRankingsUseCase.execute("monthly");

			console.log(
				`✅ Rankings mensuales calculados: ${result.totalRankingsCalculated} rankings`
			);
			// You might want to log more details like in calculateDailyRankings
			console.log(`   - Plantillas personales: ${result.personalTemplates}`);
			console.log(`   - Plantillas verificadas: ${result.verifiedTemplates}`);
			if (result.topTemplate) {
				console.log(
					`   - Top template: ${result.topTemplate.templateId} (${result.topTemplate.templateType}) con score ${result.topTemplate.score}`
				);
			}
		} catch (error) {
			console.error("❌ Error calculando rankings mensuales:", error);
		} finally {
			this.isRunning = false;
		}
	}

	/**
	 * Calcula rankings anuales
	 */
	private async calculateYearlyRankings(): Promise<void> {
		if (this.isRunning) return; // Consider adding the console log here too

		this.isRunning = true;
		console.log("📊 Iniciando cálculo de rankings anuales...");

		try {
			const calculateRankingsUseCase = getCalculateTemplateRankingsUseCase();
			const result = await calculateRankingsUseCase.execute("yearly");

			console.log(
				`✅ Rankings anuales calculados: ${result.totalRankingsCalculated} rankings`
			);
			// You might want to log more details like in calculateDailyRankings
			console.log(`   - Plantillas personales: ${result.personalTemplates}`);
			console.log(`   - Plantillas verificadas: ${result.verifiedTemplates}`);
			if (result.topTemplate) {
				console.log(
					`   - Top template: ${result.topTemplate.templateId} (${result.topTemplate.templateType}) con score ${result.topTemplate.score}`
				);
			}
		} catch (error) {
			console.error("❌ Error calculando rankings anuales:", error);
		} finally {
			this.isRunning = false;
		}
	}

	/**
	 * Ejecuta cálculo manual (para testing o administración)
	 */
	async calculateManual(
		period: "daily" | "weekly" | "monthly" | "yearly"
	): Promise<RankingCalculationResult> {
		console.log(`📊 Cálculo manual de rankings ${period}...`);

		try {
			const calculateRankingsUseCase = getCalculateTemplateRankingsUseCase();
			const result = await calculateRankingsUseCase.execute(period);

			console.log(
				`✅ Rankings ${period} calculados manualmente: ${result.totalRankingsCalculated} rankings`
			);
			return result;
		} catch (error) {
			console.error(`❌ Error en cálculo manual de rankings ${period}:`, error);
			throw error;
		}
	}

	/**
	 * Recalcula múltiples períodos (para mantenimiento)
	 */
	async recalculateMultiplePeriods(daysBack: number = 30): Promise<void> {
		console.log(
			`🔄 Recalculando rankings para los últimos ${daysBack} días...`
		);

		try {
			const calculateRankingsUseCase = getCalculateTemplateRankingsUseCase();
			const results = await calculateRankingsUseCase.recalculateMultiplePeriods(
				["daily", "weekly", "monthly"],
				daysBack
			);

			console.log(
				`✅ Recálculo completado: ${results.length} períodos procesados`
			);
		} catch (error) {
			console.error("❌ Error en recálculo múltiple:", error);
			throw error;
		}
	}

	/**
	 * Limpia datos antiguos según configuración de retención
	 */
	private async cleanupOldData(): Promise<void> {
		console.log("🧹 Iniciando limpieza de datos antiguos...");

		try {
			const config = getTrackingConfig();
			const usageLogRepository = getUserTemplateUsageLogRepository();
			const rankingRepository = getTemplateRankingRepository();

			// Limpiar logs de uso antiguos
			const deletedLogs = await usageLogRepository.deleteOldLogs(
				config.dataRetention.usageLogsRetentionDays
			);

			// Limpiar rankings antiguos
			const deletedRankings = await rankingRepository.deleteOldRankings(
				config.dataRetention.rankingsRetentionDays
			);

			console.log(
				`✅ Limpieza completada: ${deletedLogs} logs, ${deletedRankings} rankings eliminados`
			);
		} catch (error) {
			console.error("❌ Error en limpieza de datos:", error);
		}
	}

	/**
	 * Para todos los jobs
	 */
	stop(): void {
		console.log("🛑 Deteniendo jobs de rankings...");
		this.scheduledTasks.forEach((task) => task.stop()); // Stop each task
		this.scheduledTasks = []; // Clear the array
		console.log("🛑 Todos los jobs de rankings detenidos.");
	}
}
