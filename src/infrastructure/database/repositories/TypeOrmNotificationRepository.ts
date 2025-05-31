// src/infrastructure/database/repositories/TypeOrmNotificationRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {
	NotificationRepository,
	Notification,
} from "../../../domain/repositories/NotificationRepository";
import { NotificationEntity } from "../entities/NotificationEntity";
import { MoreThan, IsNull } from "typeorm";
import {NotificationPriority} from "../entities/NotificationEntity";

export class TypeOrmNotificationRepository implements NotificationRepository {
	private repository: Repository<NotificationEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(NotificationEntity);
	}

	/**
	 * Encuentra una notificación por su ID
	 */
	async findById(id: string): Promise<Notification | null> {
		const notification = await this.repository.findOne({
			where: {id},
		});

		return notification ? this.toDomainModel(notification) : null;
	}

	/**
	 * Encuentra todas las notificaciones de un usuario
	 */
	async findByUser(
		userId: string,
		filters?: any,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{notifications: Notification[]; total: number}> {
		let queryBuilder = this.repository
			.createQueryBuilder("notification")
			.where("notification.user_id = :userId", {userId});

		// Aplicar filtros adicionales
		if (filters) {
			if (filters.isRead !== undefined) {
				queryBuilder = queryBuilder.andWhere("notification.is_read = :isRead", {
					isRead: filters.isRead,
				});
			}

			if (filters.type) {
				queryBuilder = queryBuilder.andWhere("notification.type = :type", {
					type: filters.type,
				});
			}

			if (filters.priority) {
				queryBuilder = queryBuilder.andWhere(
					"notification.priority = :priority",
					{
						priority: filters.priority,
					}
				);
			}

			if (filters.relatedEntityType) {
				queryBuilder = queryBuilder.andWhere(
					"notification.related_entity_type = :relatedEntityType",
					{
						relatedEntityType: filters.relatedEntityType,
					}
				);
			}

			if (filters.relatedEntityId) {
				queryBuilder = queryBuilder.andWhere(
					"notification.related_entity_id = :relatedEntityId",
					{
						relatedEntityId: filters.relatedEntityId,
					}
				);
			}

			// No incluir notificaciones expiradas
			queryBuilder = queryBuilder.andWhere(
				"(notification.expires_at IS NULL OR notification.expires_at > :now)",
				{now: new Date()}
			);
		}

		// Contar total para paginación
		const total = await queryBuilder.getCount();

		// Aplicar paginación
		if (pagination) {
			const skip = (pagination.page - 1) * pagination.limit;
			queryBuilder = queryBuilder.skip(skip).take(pagination.limit);

			// Ordenar
			const sortBy = pagination.sortBy || "created_at";
			const sortOrder = pagination.sortOrder || "DESC";
			queryBuilder = queryBuilder.orderBy(`notification.${sortBy}`, sortOrder);
		} else {
			queryBuilder = queryBuilder.orderBy("notification.created_at", "DESC");
		}

		// Ejecutar consulta
		const notifications = await queryBuilder.getMany();

		return {
			notifications: notifications.map((notification) =>
				this.toDomainModel(notification)
			),
			total,
		};
	}

	/**
	 * Crea una nueva notificación
	 */
	async create(
		notificationData: Omit<Notification, "readAt">
	): Promise<Notification> {
		const notification = this.toEntity(notificationData as Notification);
		const saved = await this.repository.save(notification);
		return this.toDomainModel(saved);
	}

	/**
	 * Actualiza una notificación existente
	 */
	async update(id: string, data: Partial<Notification>): Promise<boolean> {
		// Convertir los datos para que coincidan con la entidad de TypeORM
		const entityData: Partial<NotificationEntity> = {...data};

		// Si está presente priority, asegúrate de que sea del tipo correcto
		if (data.priority) {
			entityData.priority = data.priority as unknown as NotificationPriority;
		}

		const result = await this.repository.update(id, entityData);
		return result.affected !== undefined && result.affected > 0;
	}

	/**
	 * Elimina una notificación
	 */
	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	/**
	 * Elimina todas las notificaciones de un usuario
	 */
	async deleteByUser(userId: string): Promise<boolean> {
		const result = await this.repository.delete({userId});
		return result.affected !== undefined && result.affected > 0;
	}

	/**
	 * Marca todas las notificaciones de un usuario como leídas
	 */
	async markAllAsRead(userId: string): Promise<boolean> {
		const now = new Date();
		const result = await this.repository.update(
			{userId, isRead: false},
			{isRead: true, readAt: now}
		);
		return result.affected !== undefined && result.affected > 0;
	}

	/**
	 * Cuenta el número de notificaciones no leídas de un usuario
	 */
	async countUnread(userId: string): Promise<number> {
		return this.repository.count({
			where: {
				userId,
				isRead: false,
				expiresAt: MoreThan(new Date()),
			},
		});
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: NotificationEntity): Notification {
		return {
			id: entity.id,
			userId: entity.userId,
			type: entity.type,
			priority: entity.priority,
			title: entity.title,
			content: entity.content,
			isRead: entity.isRead,
			readAt: entity.readAt,
			actionUrl: entity.actionUrl,
			actionText: entity.actionText,
			relatedEntityType: entity.relatedEntityType,
			relatedEntityId: entity.relatedEntityId,
			icon: entity.icon,
			expiresAt: entity.expiresAt,
			emailSent: entity.emailSent,
			pushSent: entity.pushSent,
			smsSent: entity.smsSent,
			createdAt: entity.createdAt,
		};
	}

	private toEntity(model: Notification): NotificationEntity {
		const entity = new NotificationEntity();
		entity.id = model.id;
		entity.userId = model.userId;
		entity.type = model.type;
		entity.priority = model.priority as unknown as NotificationPriority;
		entity.title = model.title;
		entity.content = model.content;
		entity.isRead = model.isRead;
		entity.readAt = model.readAt;
		entity.actionUrl = model.actionUrl;
		entity.actionText = model.actionText;
		entity.relatedEntityType = model.relatedEntityType;
		entity.relatedEntityId = model.relatedEntityId;
		entity.icon = model.icon;
		entity.expiresAt = model.expiresAt;
		entity.emailSent = model.emailSent;
		entity.pushSent = model.pushSent;
		entity.smsSent = model.smsSent;
		entity.createdAt = model.createdAt;
		return entity;
	}
}
