// src/infrastructure/websocket/WebSocketService.ts
import {Server as HttpServer} from "http";
import {Server, Socket} from "socket.io";
import {
	NotificationType,
	NotificationPriority,
} from "../database/entities/NotificationEntity";

/**
 * Interfaz para datos de notificación
 */
export interface NotificationData {
	userId: string;
	type: NotificationType;
	priority: NotificationPriority;
	title: string;
	content: string;
	actionUrl?: string;
	actionText?: string;
	relatedEntityType?: string;
	relatedEntityId?: string;
	icon?: string;
}

/**
 * Clase de servicio para manejar las conexiones WebSocket
 */
export class WebSocketService {
	private static instance: WebSocketService;
	private io: Server;
	private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

	private constructor(server: HttpServer) {
		this.io = new Server(server, {
			cors: {
				origin: process.env.CORS_ORIGIN || "http://localhost:4000",
				methods: ["GET", "POST"],
				credentials: true,
			},
		});

		this.setupSocketHandlers();
		console.log("WebSocket server initialized");
	}

	/**
	 * Obtiene una instancia del servicio WebSocket (Singleton)
	 */
	public static getInstance(server?: HttpServer): WebSocketService {
		if (!WebSocketService.instance && server) {
			WebSocketService.instance = new WebSocketService(server);
		} else if (!WebSocketService.instance && !server) {
			throw new Error(
				"WebSocketService not initialized. Provide server instance."
			);
		}
		return WebSocketService.instance;
	}

	/**
	 * Configura los manejadores de eventos de Socket.io
	 */
	private setupSocketHandlers(): void {
		this.io.on("connection", (socket: Socket) => {
			console.log(`New socket connection: ${socket.id}`);

			// Evento para autenticación: asociar userId con socketId
			socket.on("authenticate", (userId: string) => {
				this.registerUserSocket(userId, socket.id);
				console.log(`User ${userId} authenticated on socket ${socket.id}`);

				// Unir al socket a una sala específica para el usuario
				socket.join(`user:${userId}`);
			});

			// Manejar desconexión
			socket.on("disconnect", () => {
				this.removeSocketConnection(socket.id);
				console.log(`Socket disconnected: ${socket.id}`);
			});
		});
	}

	/**
	 * Registra un socket para un usuario específico
	 */
	private registerUserSocket(userId: string, socketId: string): void {
		if (!this.userSockets.has(userId)) {
			this.userSockets.set(userId, new Set());
		}
		this.userSockets.get(userId)?.add(socketId);
	}

	/**
	 * Elimina un socket cuando se desconecta
	 */
	private removeSocketConnection(socketId: string): void {
		// Buscar y eliminar el socketId de todos los usuarios
		for (const [userId, sockets] of this.userSockets.entries()) {
			if (sockets.has(socketId)) {
				sockets.delete(socketId);
				// Si no quedan sockets para este usuario, eliminar la entrada
				if (sockets.size === 0) {
					this.userSockets.delete(userId);
				}
				break;
			}
		}
	}

	/**
	 * Envía una notificación a un usuario específico
	 */
	public sendNotificationToUser(
		userId: string,
		notification: NotificationData
	): void {
		// Enviar a todos los sockets del usuario (conexiones desde diferentes dispositivos)
		this.io.to(`user:${userId}`).emit("notification", {
			...notification,
			timestamp: new Date(),
		});
	}

	/**
	 * Envía una notificación a múltiples usuarios
	 */
	public sendNotificationToUsers(
		userIds: string[],
		notification: NotificationData
	): void {
		for (const userId of userIds) {
			this.sendNotificationToUser(userId, notification);
		}
	}

	/**
	 * Envía una notificación a todos los usuarios conectados
	 */
	public sendNotificationToAll(
		notification: Omit<NotificationData, "userId">
	): void {
		this.io.emit("notification", {
			...notification,
			timestamp: new Date(),
		});
	}

	/**
	 * Envía una notificación a usuarios con un rol específico
	 */
	public sendNotificationByRole(
		role: string,
		notification: Omit<NotificationData, "userId">
	): void {
		this.io.to(`role:${role}`).emit("notification", {
			...notification,
			timestamp: new Date(),
		});
	}

	/**
	 * Envía una notificación a usuarios relacionados con un proyecto específico
	 */
	public sendNotificationToProject(
		projectId: string,
		notification: Omit<NotificationData, "userId">
	): void {
		this.io.to(`project:${projectId}`).emit("notification", {
			...notification,
			timestamp: new Date(),
		});
	}
}
