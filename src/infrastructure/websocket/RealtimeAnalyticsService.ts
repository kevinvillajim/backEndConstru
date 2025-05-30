// src/infrastructure/websocket/RealtimeAnalyticsService.ts
import {Server as SocketIOServer, Socket} from "socket.io";
import {Server as HTTPServer} from "http";
import {AuthService} from "../../domain/services/AuthService";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {
	getTemplateAnalyticsController,
	getUserTemplateUsageLogRepository,
	getTemplateRankingRepository,
} from "../config/service-factory";

interface AuthenticatedSocket extends Socket {
	userId?: string;
	userRole?: string;
	subscribedTemplates?: Set<string>;
}

interface AnalyticsUpdate {
	type:
		| "template_usage"
		| "ranking_update"
		| "trending_change"
		| "global_stats";
	templateId?: string;
	templateType?: "personal" | "verified";
	data: any;
	timestamp: Date;
}

export class RealtimeAnalyticsService {
	private io: SocketIOServer;
	private authService: AuthService;
	private userRepository: UserRepository;
	private connectedClients: Map<string, AuthenticatedSocket> = new Map();
	private templateSubscriptions: Map<string, Set<string>> = new Map(); // templateId -> Set<socketId>
	private globalSubscriptions: Set<string> = new Set(); // socketIds subscribed to global stats

	constructor(httpServer: HTTPServer) {
		this.io = new SocketIOServer(httpServer, {
			cors: {
				origin: process.env.FRONTEND_URL || "http://localhost:3000",
				methods: ["GET", "POST"],
				credentials: true,
			},
			transports: ["websocket", "polling"],
		});

		this.authService = new AuthService();
		this.initializeSocketHandlers();
		this.setupPeriodicUpdates();
	}

	private initializeSocketHandlers(): void {
		this.io.on("connection", (socket: AuthenticatedSocket) => {
			console.log(`📡 New WebSocket connection: ${socket.id}`);

			// Manejar autenticación
			socket.on("authenticate", async (data: {token: string}) => {
				try {
					const decoded = this.authService.verifyAccessToken(data.token);
					// Se asume que tienes una forma de obtener userRepository
					const user = await this.getUserRepository().findById(decoded.userId);

					if (user) {
						socket.userId = user.id;
						socket.userRole = user.role;
						socket.subscribedTemplates = new Set();

						this.connectedClients.set(socket.id, socket);

						socket.emit("authenticated", {
							userId: user.id,
							role: user.role,
						});

						console.log(
							`✅ Socket authenticated: ${socket.id} - User: ${user.id}`
						);
					} else {
						socket.emit("auth_error", {message: "Usuario no encontrado"});
					}
				} catch (error) {
					socket.emit("auth_error", {message: "Token inválido"});
				}
			});

			// Suscribirse a analytics de plantilla específica
			socket.on(
				"subscribe_template",
				async (data: {
					templateId: string;
					templateType: "personal" | "verified";
				}) => {
					if (!socket.userId) {
						socket.emit("error", {message: "No autenticado"});
						return;
					}

					const {templateId, templateType} = data;

					// Verificar permisos
					const hasAccess = await this.checkTemplateAccess(
						socket.userId,
						templateId,
						templateType
					);
					if (!hasAccess) {
						socket.emit("error", {message: "Sin permisos para esta plantilla"});
						return;
					}

					// Agregar suscripción
					socket.subscribedTemplates!.add(templateId);

					if (!this.templateSubscriptions.has(templateId)) {
						this.templateSubscriptions.set(templateId, new Set());
					}
					this.templateSubscriptions.get(templateId)!.add(socket.id);

					// Enviar datos iniciales
					try {
						const analyticsController = getTemplateAnalyticsController();
						// Simular request para obtener analytics
						const mockReq = {
							params: {templateId},
							query: {period: "day"},
							user: {id: socket.userId},
						} as any;

						// Nota: En una implementación real, necesitarías refactorizar
						// el controller para permitir llamadas directas
						socket.emit("template_analytics", {
							templateId,
							data: {
								// Datos iniciales básicos
								subscribed: true,
								lastUpdate: new Date(),
							},
						});

						console.log(
							`📊 Socket ${socket.id} subscribed to template ${templateId}`
						);
					} catch (error) {
						console.error("Error getting initial analytics:", error);
					}
				}
			);

			// Desuscribirse de plantilla
			socket.on("unsubscribe_template", (data: {templateId: string}) => {
				const {templateId} = data;

				if (socket.subscribedTemplates) {
					socket.subscribedTemplates.delete(templateId);
				}

				const subscribers = this.templateSubscriptions.get(templateId);
				if (subscribers) {
					subscribers.delete(socket.id);
					if (subscribers.size === 0) {
						this.templateSubscriptions.delete(templateId);
					}
				}

				socket.emit("unsubscribed", {templateId});
			});

			// Suscribirse a estadísticas globales (solo admins)
			socket.on("subscribe_global_stats", () => {
				if (!socket.userId || socket.userRole !== "admin") {
					socket.emit("error", {
						message: "Solo administradores pueden acceder a stats globales",
					});
					return;
				}

				this.globalSubscriptions.add(socket.id);

				// Enviar stats globales iniciales
				this.sendGlobalStats(socket);

				console.log(`🌐 Admin ${socket.id} subscribed to global stats`);
			});

			// Desconexión
			socket.on("disconnect", () => {
				this.handleDisconnection(socket);
			});

			// Ping/Pong para mantener conexión
			socket.on("ping", () => {
				socket.emit("pong");
			});
		});
	}

	private handleDisconnection(socket: AuthenticatedSocket): void {
		console.log(`📡 Socket disconnected: ${socket.id}`);

		// Limpiar suscripciones
		if (socket.subscribedTemplates) {
			socket.subscribedTemplates.forEach((templateId) => {
				const subscribers = this.templateSubscriptions.get(templateId);
				if (subscribers) {
					subscribers.delete(socket.id);
					if (subscribers.size === 0) {
						this.templateSubscriptions.delete(templateId);
					}
				}
			});
		}

		this.globalSubscriptions.delete(socket.id);
		this.connectedClients.delete(socket.id);
	}

	private async checkTemplateAccess(
		userId: string,
		templateId: string,
		templateType: "personal" | "verified"
	): Promise<boolean> {
		try {
			if (templateType === "verified") {
				// Las plantillas verificadas son públicas
				return true;
			} else {
				// Para plantillas personales, verificar propiedad o acceso
				// Necesitarías implementar esta lógica según tu sistema
				return true; // Simplificado por ahora
			}
		} catch (error) {
			console.error("Error checking template access:", error);
			return false;
		}
	}

	private async sendGlobalStats(socket: AuthenticatedSocket): Promise<void> {
		try {
			// Obtener estadísticas globales
			const stats = {
				totalTemplates: await this.getTotalTemplatesCount(),
				activeUsers: this.connectedClients.size,
				recentActivity: await this.getRecentActivity(),
				topTrending: await this.getTopTrending(),
				systemHealth: {
					status: "healthy",
					uptime: process.uptime(),
					memoryUsage: process.memoryUsage(),
				},
			};

			socket.emit("global_stats", {
				data: stats,
				timestamp: new Date(),
			});
		} catch (error) {
			console.error("Error sending global stats:", error);
			socket.emit("error", {message: "Error obteniendo estadísticas globales"});
		}
	}

	// Métodos para broadcast de actualizaciones

	/**
	 * Notificar uso de plantilla en tiempo real
	 */
	public notifyTemplateUsage(
		templateId: string,
		templateType: "personal" | "verified",
		usageData: any
	): void {
		const subscribers = this.templateSubscriptions.get(templateId);
		if (subscribers && subscribers.size > 0) {
			const update: AnalyticsUpdate = {
				type: "template_usage",
				templateId,
				templateType,
				data: usageData,
				timestamp: new Date(),
			};

			subscribers.forEach((socketId) => {
				const socket = this.connectedClients.get(socketId);
				if (socket) {
					socket.emit("template_usage_update", update);
				}
			});

			console.log(
				`📊 Notified ${subscribers.size} clients of template usage: ${templateId}`
			);
		}
	}

	/**
	 * Notificar cambios en rankings
	 */
	public notifyRankingUpdate(period: string, rankingData: any): void {
		const update: AnalyticsUpdate = {
			type: "ranking_update",
			data: {period, ...rankingData},
			timestamp: new Date(),
		};

		// Broadcast a todos los clientes conectados
		this.io.emit("ranking_update", update);

		console.log(`📈 Broadcasted ranking update for period: ${period}`);
	}

	/**
	 * Notificar cambios en trending
	 */
	public notifyTrendingChange(trendingData: any): void {
		const update: AnalyticsUpdate = {
			type: "trending_change",
			data: trendingData,
			timestamp: new Date(),
		};

		this.io.emit("trending_update", update);

		console.log("🔥 Broadcasted trending update");
	}

	/**
	 * Notificar estadísticas globales a admins
	 */
	public notifyGlobalStatsUpdate(statsData: any): void {
		if (this.globalSubscriptions.size > 0) {
			const update: AnalyticsUpdate = {
				type: "global_stats",
				data: statsData,
				timestamp: new Date(),
			};

			this.globalSubscriptions.forEach((socketId) => {
				const socket = this.connectedClients.get(socketId);
				if (socket && socket.userRole === "admin") {
					socket.emit("global_stats_update", update);
				}
			});

			console.log(
				`🌐 Notified ${this.globalSubscriptions.size} admins of global stats update`
			);
		}
	}

	// Métodos helper privados
	private setupPeriodicUpdates(): void {
		// Actualizar estadísticas globales cada 30 segundos para admins conectados
		setInterval(() => {
			if (this.globalSubscriptions.size > 0) {
				this.globalSubscriptions.forEach((socketId) => {
					const socket = this.connectedClients.get(socketId);
					if (socket) {
						this.sendGlobalStats(socket);
					}
				});
			}
		}, 30000);

		// Ping a todos los clientes cada 25 segundos para mantener conexión
		setInterval(() => {
			this.io.emit("server_ping", {timestamp: new Date()});
		}, 25000);
	}

	private async getTotalTemplatesCount(): Promise<number> {
		// Implementar según tu repositorio
		return 0; // Placeholder
	}

	private async getRecentActivity(): Promise<any[]> {
		// Implementar según tu sistema
		return []; // Placeholder
	}

	private async getTopTrending(): Promise<any[]> {
		// Implementar según tu sistema
		return []; // Placeholder
	}

	private getUserRepository(): UserRepository {
		// Acceder al repositorio según tu sistema de DI
		throw new Error("Implementar getUserRepository()");
	}

	// Método para obtener estadísticas del servicio
	public getServiceStats() {
		return {
			connectedClients: this.connectedClients.size,
			templateSubscriptions: this.templateSubscriptions.size,
			globalSubscriptions: this.globalSubscriptions.size,
			uptime: process.uptime(),
		};
	}
}
