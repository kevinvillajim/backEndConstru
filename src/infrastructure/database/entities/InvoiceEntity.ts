import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	DeleteDateColumn,
	ManyToOne,
	OneToMany,
	JoinColumn,
} from "typeorm";
import {UserEntity} from "./UserEntity";
import {InvoiceItemEntity} from "./InvoiceItemEntity";
import {ProjectEntity} from "./ProjectEntity";

export enum InvoiceStatus {
	DRAFT = "draft",
	ISSUED = "issued",
	SENT = "sent",
	PAID = "paid",
	PARTIAL = "partial",
	OVERDUE = "overdue",
	CANCELLED = "cancelled",
}

export enum InvoiceType {
	SALE = "sale",
	PURCHASE = "purchase",
	CREDIT_NOTE = "credit_note",
	DEBIT_NOTE = "debit_note",
}

export enum PaymentMethod {
	CASH = "cash",
	BANK_TRANSFER = "bank_transfer",
	CREDIT_CARD = "credit_card",
	DEBIT_CARD = "debit_card",
	CHECK = "check",
	PAYPAL = "paypal",
	OTHER = "other",
}

@Entity("invoices")
export class InvoiceEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "invoice_number", unique: true})
	invoiceNumber: string;

	@Column({
		type: "enum",
		enum: InvoiceType,
		default: InvoiceType.SALE,
	})
	type: InvoiceType;

	@Column({name: "issue_date", type: "date"})
	issueDate: Date;

	@Column({name: "due_date", type: "date"})
	dueDate: Date;

	@Column({type: "decimal", precision: 10, scale: 2})
	subtotal: number;

	@Column({type: "decimal", precision: 5, scale: 2, default: 12})
	taxPercentage: number;

	@Column({type: "decimal", precision: 10, scale: 2})
	tax: number;

	@Column({
		name: "discount_percentage",
		type: "decimal",
		precision: 5,
		scale: 2,
		default: 0,
	})
	discountPercentage: number;

	@Column({type: "decimal", precision: 10, scale: 2, default: 0})
	discount: number;

	@Column({type: "decimal", precision: 10, scale: 2})
	total: number;

	@Column({
		name: "amount_paid",
		type: "decimal",
		precision: 10,
		scale: 2,
		default: 0,
	})
	amountPaid: number;

	@Column({name: "amount_due", type: "decimal", precision: 10, scale: 2})
	amountDue: number;

	@Column({
		name: "payment_method",
		type: "enum",
		enum: PaymentMethod,
		nullable: true,
	})
	paymentMethod: PaymentMethod;

	@Column({
		name: "payment_reference",
		nullable: true,
		comment: "Número de transacción, cheque, etc.",
	})
	paymentReference: string;

	@Column({name: "payment_date", type: "date", nullable: true})
	paymentDate: Date;

	@Column({name: "sri_authorization", nullable: true})
	sriAuthorization: string;

	@Column({
		name: "sri_access_key",
		nullable: true,
		comment: "Clave de acceso SRI (para facturación electrónica)",
	})
	sriAccessKey: string;

	@Column({name: "electronic_invoice_url", nullable: true})
	electronicInvoiceUrl: string;

	@Column({type: "text", nullable: true})
	notes: string;

	@Column({
		type: "enum",
		enum: InvoiceStatus,
		default: InvoiceStatus.DRAFT,
	})
	status: InvoiceStatus;

	@Column({name: "client_id"})
	clientId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "client_id"})
	client: UserEntity;

	@Column({name: "seller_id"})
	sellerId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "seller_id"})
	seller: UserEntity;

	@Column({name: "project_id", nullable: true})
	projectId: string;

	@ManyToOne(() => ProjectEntity, {nullable: true})
	@JoinColumn({name: "project_id"})
	project: ProjectEntity;

	@OneToMany(() => InvoiceItemEntity, (item) => item.invoice)
	items: InvoiceItemEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;

	@DeleteDateColumn({name: "deleted_at", nullable: true})
	deletedAt: Date;
}
