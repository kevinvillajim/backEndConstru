import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {UserEntity} from "./UserEntity";

export enum NotificationType {
	PRICE_CHANGE = "price_change",
	PROJECT_DELAY = "project_delay",
	MATERIAL_REQUEST = "material_request",
	TASK_ASSIGNMENT = "task_assignment",
	DOCUMENT_UPLOAD = "document_upload",
	PAYMENT_DUE = "payment_due",
	INVENTORY_LOW = "inventory_low",
	CALCULATION_COMPLETE = "calculation_complete",
	SYSTEM_ANNOUNCEMENT = "system_announcement",
	BUDGET_APPROVAL = "budget_approval",
}

export enum NotificationPriority {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

@Entity("notifications")
export class NotificationEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column({
		type: "enum",
		enum: NotificationType,
	})
	type: NotificationType;

	@Column({
		type: "enum",
		enum: NotificationPriority,
		default: NotificationPriority.MEDIUM,
	})
	priority: NotificationPriority;

	@Column()
	title: string;

	@Column({type: "text"})
	content: string;

	@Column({name: "is_read", default: false})
	isRead: boolean;

	@Column({name: "read_at", type: "datetime", nullable: true})
	readAt: Date;

	@Column({name: "action_url", nullable: true})
	actionUrl: string; // URL donde el usuario puede ir para tomar acción

	@Column({name: "action_text", nullable: true})
	actionText: string; // Texto del botón de acción

	@Column({name: "related_entity_type", nullable: true})
	relatedEntityType: string; // Tipo de entidad relacionada (material, project, task, etc.)

	@Column({name: "related_entity_id", nullable: true})
	relatedEntityId: string; // ID de la entidad relacionada

	@Column({name: "expires_at", type: "datetime", nullable: true})
	expiresAt: Date; // Fecha en que la notificación ya no es relevante

	@Column({name: "icon", nullable: true})
	icon: string; // Icono para representar la notificación

	@Column({name: "sms_sent", default: false})
	smsSent: boolean; // Si se envió SMS para esta notificación

	@Column({name: "email_sent", default: false})
	emailSent: boolean; // Si se envió email para esta notificación

	@Column({name: "push_sent", default: false})
	pushSent: boolean; // Si se envió notificación push

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}
