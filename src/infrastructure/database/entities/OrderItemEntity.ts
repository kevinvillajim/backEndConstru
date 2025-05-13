// src/infrastructure/database/entities/OrderItemEntity.ts
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {OrderEntity} from "./OrderEntity";
import {MaterialEntity} from "./MaterialEntity";
import {MaterialRequestEntity} from "./MaterialRequestEntity";

@Entity("order_items")
export class OrderItemEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "order_id"})
	orderId: string;

	@ManyToOne(() => OrderEntity, (order) => order.items)
	@JoinColumn({name: "order_id"})
	order: OrderEntity;

	@Column({name: "material_id"})
	materialId: string;

	@ManyToOne(() => MaterialEntity)
	@JoinColumn({name: "material_id"})
	material: MaterialEntity;

	@Column({type: "decimal", precision: 10, scale: 2})
	quantity: number;

	@Column({name: "unit_price", type: "decimal", precision: 10, scale: 2})
	unitPrice: number;

	@Column({type: "decimal", precision: 10, scale: 2})
	subtotal: number;

	@Column({
		type: "enum",
		enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
	})
	status: string;

	@Column({name: "material_request_id", nullable: true})
	materialRequestId: string;

	@ManyToOne(() => MaterialRequestEntity, {nullable: true})
	@JoinColumn({name: "material_request_id"})
	materialRequest: MaterialRequestEntity;

	@Column({type: "text", nullable: true})
	notes: string;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
