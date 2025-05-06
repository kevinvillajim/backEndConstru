import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
} from "typeorm";
import {InvoiceEntity} from "./InvoiceEntity";
import {MaterialEntity} from "./MaterialEntity";

@Entity("invoice_items")
export class InvoiceItemEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({type: "int"})
	quantity: number;

	@Column({type: "decimal", precision: 10, scale: 2})
	price: number;

	@Column({type: "decimal", precision: 10, scale: 2})
	subtotal: number;

	@Column({type: "decimal", precision: 10, scale: 2})
	tax: number;

	@Column({type: "decimal", precision: 10, scale: 2})
	total: number;

	@Column({name: "invoice_id"})
	invoiceId: string;

	@ManyToOne(() => InvoiceEntity, (invoice) => invoice.items)
	invoice: InvoiceEntity;

	@Column({name: "material_id", nullable: true})
	materialId: string;

	@ManyToOne(() => MaterialEntity, {nullable: true})
	material: MaterialEntity;

	@Column({name: "description", type: "text"})
	description: string;

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
