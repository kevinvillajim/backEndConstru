// src/infrastructure/config/trackingConfig.ts
export interface TrackingConfig {
	// Configuración de Jobs
	jobs: {
		enabled: boolean;
		timezone: string;
		schedules: {
			daily: string;
			weekly: string;
			monthly: string;
			yearly: string;
		};
	};

	// Configuración de Rankings
	rankings: {
		enabled: boolean;
		maxRankingsPerPeriod: number;
		rankingWeights: {
			usage: number;
			users: number;
			success: number;
			rating: number;
			favorites: number;
			performance: number;
		};
		minimumCriteria: {
			totalUsage: number;
			uniqueUsers: number;
			successRate: number;
		};
	};

	// Configuración de Promociones
	promotions: {
		enabled: boolean;
		autoPromotionEnabled: boolean;
		criteriaForPromotion: {
			minUsage: number;
			minUsers: number;
			minSuccessRate: number;
			minRating: number;
			minTrendScore: number;
		};
		notificationSettings: {
			notifyAuthorOnPromotion: boolean;
			notifyAdminsOnRequest: boolean;
		};
	};

	// Configuración de Limpieza de Datos
	dataRetention: {
		usageLogsRetentionDays: number;
		rankingsRetentionDays: number;
		promotionRequestsRetentionDays: number;
		cleanupSchedule: string;
	};

	// Configuración de Analytics
	analytics: {
		enableRealTimeTracking: boolean;
		batchSize: number;
		aggregationPeriods: string[];
		enableTrendingCalculation: boolean;
	};
}

// Configuración por defecto
export const defaultTrackingConfig: TrackingConfig = {
	jobs: {
		enabled: process.env.NODE_ENV === "production",
		timezone: "America/Guayaquil",
		schedules: {
			daily: "15 0 * * *", // 00:15 cada día
			weekly: "0 1 * * 1", // 01:00 cada lunes
			monthly: "0 2 1 * *", // 02:00 el día 1 de cada mes
			yearly: "0 3 1 1 *", // 03:00 el 1 de enero
		},
	},

	rankings: {
		enabled: true,
		maxRankingsPerPeriod: 100,
		rankingWeights: {
			usage: 0.25, // 25% - Uso total
			users: 0.2, // 20% - Diversidad de usuarios
			success: 0.2, // 20% - Tasa de éxito
			rating: 0.15, // 15% - Calificación promedio
			favorites: 0.1, // 10% - Favoritos
			performance: 0.1, // 10% - Performance
		},
		minimumCriteria: {
			totalUsage: 10,
			uniqueUsers: 3,
			successRate: 70,
		},
	},

	promotions: {
		enabled: true,
		autoPromotionEnabled: false, // Por seguridad, manual por defecto
		criteriaForPromotion: {
			minUsage: 50,
			minUsers: 10,
			minSuccessRate: 80,
			minRating: 4.0,
			minTrendScore: 60,
		},
		notificationSettings: {
			notifyAuthorOnPromotion: true,
			notifyAdminsOnRequest: true,
		},
	},

	dataRetention: {
		usageLogsRetentionDays: 365, // 1 año
		rankingsRetentionDays: 730, // 2 años
		promotionRequestsRetentionDays: 1095, // 3 años
		cleanupSchedule: "0 4 * * 0", // 04:00 cada domingo
	},

	analytics: {
		enableRealTimeTracking: true,
		batchSize: 100,
		aggregationPeriods: ["daily", "weekly", "monthly"],
		enableTrendingCalculation: true,
	},
};

// Función para obtener configuración combinando defaults con variables de entorno
export function getTrackingConfig(): TrackingConfig {
	const config = {...defaultTrackingConfig};

	// Override con variables de entorno si existen
	if (process.env.TRACKING_JOBS_ENABLED !== undefined) {
		config.jobs.enabled = process.env.TRACKING_JOBS_ENABLED === "true";
	}

	if (process.env.TRACKING_TIMEZONE) {
		config.jobs.timezone = process.env.TRACKING_TIMEZONE;
	}

	if (process.env.TRACKING_MIN_USAGE) {
		config.promotions.criteriaForPromotion.minUsage = parseInt(
			process.env.TRACKING_MIN_USAGE
		);
	}

	if (process.env.TRACKING_MIN_USERS) {
		config.promotions.criteriaForPromotion.minUsers = parseInt(
			process.env.TRACKING_MIN_USERS
		);
	}

	if (process.env.TRACKING_MIN_SUCCESS_RATE) {
		config.promotions.criteriaForPromotion.minSuccessRate = parseFloat(
			process.env.TRACKING_MIN_SUCCESS_RATE
		);
	}

	if (process.env.TRACKING_DATA_RETENTION_DAYS) {
		config.dataRetention.usageLogsRetentionDays = parseInt(
			process.env.TRACKING_DATA_RETENTION_DAYS
		);
	}

	return config;
}

// Validar configuración
export function validateTrackingConfig(config: TrackingConfig): string[] {
	const errors: string[] = [];

	// Validar pesos de ranking (deben sumar 1.0)
	const totalWeight = Object.values(config.rankings.rankingWeights).reduce(
		(sum, weight) => sum + weight,
		0
	);
	if (Math.abs(totalWeight - 1.0) > 0.01) {
		errors.push(`Los pesos de ranking deben sumar 1.0, actual: ${totalWeight}`);
	}

	// Validar criterios mínimos
	if (config.rankings.minimumCriteria.totalUsage < 1) {
		errors.push("El uso mínimo debe ser al menos 1");
	}

	if (config.rankings.minimumCriteria.uniqueUsers < 1) {
		errors.push("Los usuarios únicos mínimos deben ser al menos 1");
	}

	if (
		config.rankings.minimumCriteria.successRate < 0 ||
		config.rankings.minimumCriteria.successRate > 100
	) {
		errors.push("La tasa de éxito debe estar entre 0 y 100");
	}

	// Validar retención de datos
	if (config.dataRetention.usageLogsRetentionDays < 30) {
		errors.push("La retención de logs debe ser al menos 30 días");
	}

	return errors;
}
