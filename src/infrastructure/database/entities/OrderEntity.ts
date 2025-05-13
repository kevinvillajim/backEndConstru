// src/infrastructure/database/entities/OrderEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	OneToMany,
	JoinColumn,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {ProjectEntity} from "./ProjectEntity";
import {OrderItemEntity} from "./OrderItemEntity";
import {OrderStatus, PaymentStatus} from "../../../domain/models/order/Order";

@Entity("orders")
export class OrderEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "project_id"})
	projectId: string;

	@ManyToOne(() => ProjectEntity)
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	@Column({name: "user_id"})
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "user_id"})
	user: UserEntity;

	@Column()
	reference: string;

	@Column({
		type: "enum",
		enum: OrderStatus,
		default: OrderStatus.PENDING,
	})
	status: OrderStatus;

	@Column({
		name: "payment_status",
		type: "enum",
		enum: PaymentStatus,
		default: PaymentStatus.PENDING,
	})
	paymentStatus: PaymentStatus;

	@Column({type: "decimal", precision: 10, scale: 2})
	subtotal: number;

	@Column({name: "tax_amount", type: "decimal", precision: 10, scale: 2})
	taxAmount: number;

	@Column({name: "shipping_amount", type: "decimal", precision: 10, scale: 2})
	shippingAmount: number;

	@Column({name: "discount_amount", type: "decimal", precision: 10, scale: 2})
	discountAmount: number;

	@Column({type: "decimal", precision: 10, scale: 2})
	total: number;

	@Column({type: "text", nullable: true})
	notes: string;

	@Column({name: "shipping_address", type: "json"})
	shippingAddress: {
		street: string;
		city: string;
		province: string;
		postalCode: string;
		additionalInfo?: string;
		latitude?: number;
		longitude?: number;
	};

	@Column({name: "estimated_delivery_date", type: "date", nullable: true})
	estimatedDeliveryDate: Date;

	@Column({name: "actual_delivery_date", type: "date", nullable: true})
	actualDeliveryDate: Date;

	@Column({name: "tracking_info", type: "json", nullable: true})
	trackingInfo: {
		carrier: string;
		trackingNumber: string;
		trackingUrl?: string;
	};

	@OneToMany(() => OrderItemEntity, (item) => item.order)
	items: OrderItemEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
