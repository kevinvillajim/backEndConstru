// src/infrastructure/jobs/EnhancedRankingCalculationJob.ts
import cron from "node-cron";
import {
	getCalculateTemplateRankingsUseCase,
	getNotificationService,
	getRealtimeAnalyticsService,
} from "../config/service-factory";
import {getTrackingConfig} from "../config/trackingConfig";

interface JobExecutionResult {
	jobId: string;
	period: string;
	success: boolean;
	executionTime: number;
	templatesProcessed: number;
	errors: string[];
	timestamp: Date;
}

interface JobStatus {
	isRunning: boolean;
	lastExecution: Date | null;
	lastResult: JobExecutionResult | null;
	nextExecution: Date | null;
	executionCount: number;
	failureCount: number;
}

export class EnhancedRankingCalculationJob {
	private jobs: Map<string, cron.ScheduledTask> = new Map();
	private jobStatuses: Map<string, JobStatus> = new Map();
	private config = getTrackingConfig();
	private isShuttingDown = false;

	constructor() {
		this.initializeJobs();
		this.setupGracefulShutdown();
	}

	private initializeJobs(): void {
		if (!this.config.jobs.enabled) {
			console.log("⏸️  Ranking calculation jobs are disabled");
			return;
		}

		console.log("🚀 Initializing ranking calculation jobs...");

		// Job diario
		this.scheduleJob("daily", this.config.jobs.schedules.daily, () => {
			return this.executeRankingCalculation("daily");
		});

		// Job semanal
		this.scheduleJob("weekly", this.config.jobs.schedules.weekly, () => {
			return this.executeRankingCalculation("weekly");
		});

		// Job mensual
		this.scheduleJob("monthly", this.config.jobs.schedules.monthly, () => {
			return this.executeRankingCalculation("monthly");
		});

		// Job anual
		this.scheduleJob("yearly", this.config.jobs.schedules.yearly, () => {
			return this.executeRankingCalculation("yearly");
		});

		// Job de limpieza (datos antiguos)
		this.scheduleJob(
			"cleanup",
			this.config.dataRetention.cleanupSchedule,
			() => {
				return this.executeCleanupJob();
			}
		);

		console.log(`✅ Initialized ${this.jobs.size} ranking calculation jobs`);
	}

	private scheduleJob(
		jobName: string,
		schedule: string,
		jobFunction: () => Promise<JobExecutionResult>
	): void {
		try {
			const task = cron.schedule(
				schedule,
				async () => {
					if (this.isShuttingDown) {
						console.log(
							`⏹️  Skipping job ${jobName} - system is shutting down`
						);
						return;
					}

					const status = this.jobStatuses.get(jobName);
					if (status?.isRunning) {
						console.log(
							`⚠️  Job ${jobName} is already running, skipping this execution`
						);
						return;
					}

					try {
						console.log(`🔄 Starting job: ${jobName}`);
						this.updateJobStatus(jobName, {isRunning: true});

						const result = await jobFunction();

						this.updateJobStatus(jobName, {
							isRunning: false,
							lastExecution: new Date(),
							lastResult: result,
							executionCount: (status?.executionCount || 0) + 1,
						});

						console.log(`✅ Job ${jobName} completed successfully:`, {
							templatesProcessed: result.templatesProcessed,
							executionTime: result.executionTime,
							timestamp: result.timestamp,
						});

						// Notificar actualización via WebSocket si está disponible
						this.notifyJobCompletion(result);
					} catch (error) {
						console.error(`❌ Job ${jobName} failed:`, error);

						this.updateJobStatus(jobName, {
							isRunning: false,
							lastExecution: new Date(),
							failureCount: (status?.failureCount || 0) + 1,
						});

						// Notificar error a administradores
						await this.notifyJobFailure(jobName, error);
					}
				},
				{
					scheduled: false,
					timezone: this.config.jobs.timezone,
				}
			);

			this.jobs.set(jobName, task);
			this.initializeJobStatus(jobName, schedule);

			// Iniciar el job
			task.start();

			console.log(`📅 Scheduled job: ${jobName} with cron: ${schedule}`);
		} catch (error) {
			console.error(`❌ Failed to schedule job ${jobName}:`, error);
		}
	}

	private async executeRankingCalculation(
		period: "daily" | "weekly" | "monthly" | "yearly"
	): Promise<JobExecutionResult> {
		const startTime = Date.now();
		const jobId = `ranking_${period}_${Date.now()}`;
		const errors: string[] = [];

		try {
			console.log(`📊 Calculating ${period} rankings...`);

			const calculateRankingsUseCase = getCalculateTemplateRankingsUseCase();
			const result = await calculateRankingsUseCase.execute(period);

			const executionTime = Date.now() - startTime;

			const jobResult: JobExecutionResult = {
				jobId,
				period,
				success: true,
				executionTime,
				templatesProcessed: result.totalRankingsCalculated,
				errors,
				timestamp: new Date(),
			};

			// Log detallado del resultado
			console.log(`📈 ${period} rankings calculated:`, {
				totalRankingsCalculated: result.totalRankingsCalculated,
				personalTemplates: result.personalTemplates,
				verifiedTemplates: result.verifiedTemplates,
				topTemplate: result.topTemplate,
				executionTime: `${executionTime}ms`,
			});

			return jobResult;
		} catch (error) {
			const executionTime = Date.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			errors.push(errorMessage);

			console.error(`❌ Error calculating ${period} rankings:`, error);

			return {
				jobId,
				period,
				success: false,
				executionTime,
				templatesProcessed: 0,
				errors,
				timestamp: new Date(),
			};
		}
	}

	private async executeCleanupJob(): Promise<JobExecutionResult> {
		const startTime = Date.now();
		const jobId = `cleanup_${Date.now()}`;
		const errors: string[] = [];
		let itemsProcessed = 0;

		try {
			console.log("🧹 Starting data cleanup job...");

			// Limpiar usage logs antiguos
			const usageLogRepo = getUserTemplateUsageLogRepository();
			const deletedLogs = await usageLogRepo.deleteOldLogs(
				this.config.dataRetention.usageLogsRetentionDays
			);
			itemsProcessed += deletedLogs;

			// Limpiar rankings antiguos
			const rankingRepo = getTemplateRankingRepository();
			const deletedRankings = await rankingRepo.deleteOldRankings(
				this.config.dataRetention.rankingsRetentionDays
			);
			itemsProcessed += deletedRankings;

			// Limpiar promotion requests antiguos si es necesario
			// const promotionRepo = getPromotionRequestRepository();
			// const deletedPromotions = await promotionRepo.deleteOldRequests(
			//   this.config.dataRetention.promotionRequestsRetentionDays
			// );
			// itemsProcessed += deletedPromotions;

			const executionTime = Date.now() - startTime;

			console.log(
				`🧹 Cleanup completed: ${itemsProcessed} items removed in ${executionTime}ms`
			);

			return {
				jobId,
				period: "cleanup",
				success: true,
				executionTime,
				templatesProcessed: itemsProcessed,
				errors,
				timestamp: new Date(),
			};
		} catch (error) {
			const executionTime = Date.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			errors.push(errorMessage);

			console.error("❌ Cleanup job failed:", error);

			return {
				jobId,
				period: "cleanup",
				success: false,
				executionTime,
				templatesProcessed: itemsProcessed,
				errors,
				timestamp: new Date(),
			};
		}
	}

	private initializeJobStatus(jobName: string, schedule: string): void {
		this.jobStatuses.set(jobName, {
			isRunning: false,
			lastExecution: null,
			lastResult: null,
			nextExecution: this.getNextExecutionTime(schedule),
			executionCount: 0,
			failureCount: 0,
		});
	}

	private updateJobStatus(jobName: string, updates: Partial<JobStatus>): void {
		const currentStatus = this.jobStatuses.get(jobName);
		if (currentStatus) {
			this.jobStatuses.set(jobName, {
				...currentStatus,
				...updates,
			});
		}
	}

	private getNextExecutionTime(schedule: string): Date {
		// Implementar lógica para calcular próxima ejecución basada en cron
		// Por simplicidad, devolver fecha futura
		const next = new Date();
		next.setHours(next.getHours() + 1);
		return next;
	}

	private async notifyJobCompletion(result: JobExecutionResult): Promise<void> {
		try {
			// Notificar via WebSocket si hay admins conectados
			const realtimeService = getRealtimeAnalyticsService();
			if (realtimeService) {
				realtimeService.notifyRankingUpdate(result.period, {
					success: result.success,
					templatesProcessed: result.templatesProcessed,
					executionTime: result.executionTime,
					timestamp: result.timestamp,
				});
			}
		} catch (error) {
			console.error("Error notifying job completion:", error);
		}
	}

	private async notifyJobFailure(jobName: string, error: any): Promise<void> {
		try {
			const notificationService = getNotificationService();

			// Notificar a administradores sobre el fallo del job
			await notificationService.notifyAdmins({
				title: `🚨 Job Failed: ${jobName}`,
				content: `El job de cálculo de rankings "${jobName}" ha fallado. Error: ${error.message || error}`,
				type: "alert",
				category: "system_error",
				data: {
					jobName,
					error: error.message || String(error),
					timestamp: new Date().toISOString(),
				},
			});
		} catch (notificationError) {
			console.error(
				"Error sending job failure notification:",
				notificationError
			);
		}
	}

	// Métodos públicos para gestión

	/**
	 * Ejecutar job manualmente
	 */
	public async executeJobManually(
		period: "daily" | "weekly" | "monthly" | "yearly" | "cleanup"
	): Promise<JobExecutionResult> {
		if (period === "cleanup") {
			return this.executeCleanupJob();
		} else {
			return this.executeRankingCalculation(period);
		}
	}

	/**
	 * Obtener estado de todos los jobs
	 */
	public getJobStatuses(): Map<string, JobStatus> {
		return new Map(this.jobStatuses);
	}

	/**
	 * Obtener estado de job específico
	 */
	public getJobStatus(jobName: string): JobStatus | undefined {
		return this.jobStatuses.get(jobName);
	}

	/**
	 * Pausar job específico
	 */
	public pauseJob(jobName: string): boolean {
		const task = this.jobs.get(jobName);
		if (task) {
			task.stop();
			console.log(`⏸️  Paused job: ${jobName}`);
			return true;
		}
		return false;
	}

	/**
	 * Reanudar job específico
	 */
	public resumeJob(jobName: string): boolean {
		const task = this.jobs.get(jobName);
		if (task) {
			task.start();
			console.log(`▶️  Resumed job: ${jobName}`);
			return true;
		}
		return false;
	}

	/**
	 * Detener todos los jobs
	 */
	public stopAllJobs(): void {
		console.log("🛑 Stopping all ranking calculation jobs...");

		this.jobs.forEach((task, jobName) => {
			task.stop();
			console.log(`⏹️  Stopped job: ${jobName}`);
		});
	}

	/**
	 * Configurar cierre graceful
	 */
	private setupGracefulShutdown(): void {
		const shutdown = () => {
			this.isShuttingDown = true;
			console.log("🛑 Gracefully shutting down ranking jobs...");
			this.stopAllJobs();
			process.exit(0);
		};

		process.on("SIGTERM", shutdown);
		process.on("SIGINT", shutdown);
	}

	/**
	 * Obtener métricas del sistema de jobs
	 */
	public getMetrics() {
		const statuses = Array.from(this.jobStatuses.values());

		return {
			totalJobs: this.jobs.size,
			runningJobs: statuses.filter((s) => s.isRunning).length,
			totalExecutions: statuses.reduce((sum, s) => sum + s.executionCount, 0),
			totalFailures: statuses.reduce((sum, s) => sum + s.failureCount, 0),
			successRate: this.calculateSuccessRate(statuses),
			lastExecutions: statuses
				.filter((s) => s.lastExecution)
				.map((s) => ({
					lastExecution: s.lastExecution,
					success: s.lastResult?.success || false,
				}))
				.sort(
					(a, b) =>
						(b.lastExecution?.getTime() || 0) -
						(a.lastExecution?.getTime() || 0)
				)
				.slice(0, 5),
		};
	}

	private calculateSuccessRate(statuses: JobStatus[]): number {
		const totalExecutions = statuses.reduce(
			(sum, s) => sum + s.executionCount,
			0
		);
		const totalFailures = statuses.reduce((sum, s) => sum + s.failureCount, 0);

		if (totalExecutions === 0) return 100;

		return ((totalExecutions - totalFailures) / totalExecutions) * 100;
	}
}

// Funciones helper para obtener repositorios (implementar según tu sistema)
function getUserTemplateUsageLogRepository() {
	// Implementar según tu service factory
	throw new Error("Implement getUserTemplateUsageLogRepository");
}

function getTemplateRankingRepository() {
	// Implementar según tu service factory
	throw new Error("Implement getTemplateRankingRepository");
}

function getRealtimeAnalyticsService() {
	// Implementar según tu service factory
	return null; // Opcional
}

// Singleton para exportar
let jobInstance: EnhancedRankingCalculationJob | null = null;

export function initializeRankingJobs(): EnhancedRankingCalculationJob {
	if (!jobInstance) {
		jobInstance = new EnhancedRankingCalculationJob();
	}
	return jobInstance;
}

export function getRankingJobsInstance(): EnhancedRankingCalculationJob | null {
	return jobInstance;
}
