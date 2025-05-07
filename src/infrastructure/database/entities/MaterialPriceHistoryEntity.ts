import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import {MaterialEntity} from "./MaterialEntity";
import {UserEntity} from "./UserEntity";

export enum PriceChangeReason {
	SUPPLIER_UPDATE = "supplier_update",
	MARKET_FLUCTUATION = "market_fluctuation",
	PROMOTION = "promotion",
	SEASONAL_CHANGE = "seasonal_change",
	INFLATION_ADJUSTMENT = "inflation_adjustment",
	BULK_DISCOUNT = "bulk_discount",
	OTHER = "other",
}

@Entity("material_price_history")
export class MaterialPriceHistoryEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({name: "material_id"})
	materialId: string;

	@ManyToOne(() => MaterialEntity)
	@JoinColumn({name: "material_id"})
	material: MaterialEntity;

	@Column({type: "decimal", precision: 10, scale: 2})
	price: number;

	@Column({
		name: "wholesale_price",
		type: "decimal",
		precision: 10,
		scale: 2,
		nullable: true,
	})
	wholesalePrice: number;

	@Column({name: "wholesale_min_quantity", type: "int", nullable: true})
	wholesaleMinQuantity: number;

	@Column({name: "effective_date", type: "date"})
	effectiveDate: Date; // Fecha en que este precio comenzó a aplicarse

	@Column({name: "end_date", type: "date", nullable: true})
	endDate: Date; // Fecha en que este precio dejó de aplicarse (null si es el precio actual)

	@Column({
		type: "enum",
		enum: PriceChangeReason,
		nullable: true,
	})
	reason: PriceChangeReason;

	@Column({name: "notes", type: "text", nullable: true})
	notes: string;

	@Column({name: "supplier_name", nullable: true})
	supplierName: string; // Nombre del proveedor que ofreció este precio

	@Column({name: "supplier_id", nullable: true})
	supplierId: string;

	@ManyToOne(() => UserEntity, {nullable: true})
	@JoinColumn({name: "supplier_id"})
	supplier: UserEntity;

	@Column({name: "recorded_by"})
	recordedBy: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "recorded_by"})
	recorder: UserEntity;

	@Column({
		name: "price_change_percentage",
		type: "decimal",
		precision: 5,
		scale: 2,
		nullable: true,
	})
	priceChangePercentage: number; // Porcentaje de cambio respecto al precio anterior

	@Column({name: "is_promotion", default: false})
	isPromotion: boolean; // Si este precio es parte de una promoción temporal

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;
}
