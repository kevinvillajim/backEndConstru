// src/domain/services/NotificationService.ts - Interface actualizada

export interface CreateNotificationRequest {
	userId: string;
	type: string;
	title: string;
	message: string;
	priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
	relatedEntityType?: string;
	relatedEntityId?: string;
	metadata?: Record<string, any>;
	// NOTA: actionRequired no está incluido en la interface base
	// Si se necesita, debe ser parte de metadata
  }
  
  export interface NotificationService {
	createNotification(request: CreateNotificationRequest): Promise<any>;
	
	// Otros métodos del servicio...
	markAsRead(notificationId: string, userId: string): Promise<boolean>;
	markAllAsRead(userId: string): Promise<boolean>;
	getNotifications(userId: string, filters?: any): Promise<any[]>;
	deleteNotification(notificationId: string, userId: string): Promise<boolean>;
	
	// Métodos específicos para tipos de notificación
	createWeatherAlert(request: CreateNotificationRequest & { 
	  metadata: {
		alertType: 'rain' | 'wind' | 'temperature' | 'storm';
		severity: 'low' | 'medium' | 'high';
		affectedDates: Date[];
		recommendedActions: string[];
	  }
	}): Promise<any>;
	
	createScheduleAlert(request: CreateNotificationRequest & {
	  metadata: {
		scheduleId: string;
		changeType: 'delay' | 'cost_overrun' | 'resource_conflict';
		impact: 'low' | 'medium' | 'high';
	  }
	}): Promise<any>;
	
	createSystemAlert(request: CreateNotificationRequest & {
	  metadata: {
		component: string;
		errorCode?: string;
		resolution?: string;
	  }
	}): Promise<any>;
  }
  
  // Ejemplo de implementación base
  export class BaseNotificationService implements NotificationService {
	async createNotification(request: CreateNotificationRequest): Promise<any> {
	  // Implementación base
	  const notification = {
		id: this.generateId(),
		...request,
		createdAt: new Date(),
		isRead: false,
		isArchived: false
	  };
	  
	  // Guardar en base de datos
	  // await this.notificationRepository.save(notification);
	  
	  return notification;
	}
	
	async createWeatherAlert(request: CreateNotificationRequest & { 
	  metadata: {
		alertType: 'rain' | 'wind' | 'temperature' | 'storm';
		severity: 'low' | 'medium' | 'high';
		affectedDates: Date[];
		recommendedActions: string[];
	  }
	}): Promise<any> {
	  // Enriquecer la notificación con información específica del clima
	  const enrichedRequest = {
		...request,
		type: 'WEATHER_ALERT',
		metadata: {
		  ...request.metadata,
		  category: 'weather',
		  requiresAction: request.metadata.severity === 'high'
		}
	  };
	  
	  return this.createNotification(enrichedRequest);
	}
	
	async createScheduleAlert(request: CreateNotificationRequest & {
	  metadata: {
		scheduleId: string;
		changeType: 'delay' | 'cost_overrun' | 'resource_conflict';
		impact: 'low' | 'medium' | 'high';
	  }
	}): Promise<any> {
	  const enrichedRequest = {
		...request,
		type: 'SCHEDULE_ALERT',
		metadata: {
		  ...request.metadata,
		  category: 'schedule',
		  requiresAction: request.metadata.impact === 'high'
		}
	  };
	  
	  return this.createNotification(enrichedRequest);
	}
	
	async createSystemAlert(request: CreateNotificationRequest & {
	  metadata: {
		component: string;
		errorCode?: string;
		resolution?: string;
	  }
	}): Promise<any> {
	  const enrichedRequest = {
		...request,
		type: 'SYSTEM_ALERT',
		metadata: {
		  ...request.metadata,
		  category: 'system',
		  requiresAction: request.priority === 'HIGH' || request.priority === 'URGENT'
		}
	  };
	  
	  return this.createNotification(enrichedRequest);
	}
	
	async markAsRead(notificationId: string, userId: string): Promise<boolean> {
	  // Implementación de marcado como leído
	  return true;
	}
	
	async markAllAsRead(userId: string): Promise<boolean> {
	  // Implementación de marcar todos como leídos
	  return true;
	}
	
	async getNotifications(userId: string, filters?: any): Promise<any[]> {
	  // Implementación de obtener notificaciones
	  return [];
	}
	
	async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
	  // Implementación de eliminar notificación
	  return true;
	}
	
	private generateId(): string {
	  return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
  }