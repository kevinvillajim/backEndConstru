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
import {CategoryEntity} from "./CategoryEntity";
import {MaterialRequestEntity} from "./MaterialRequestEntity";
import {UserEntity} from "./UserEntity";

@Entity("materials")
export class MaterialEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string;

	@Column({type: "text", nullable: true})
	description: string;

	@Column({type: "text", nullable: true})
	specifications: string;

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

	@Column({type: "int", default: 0})
	stock: number;

	@Column({
		name: "min_stock",
		type: "int",
		default: 0,
		comment: "Stock mínimo para alertas",
	})
	minStock: number;

	@Column({name: "unit_of_measure"})
	unitOfMeasure: string;

	@Column({name: "brand", nullable: true})
	brand: string;

	@Column({name: "model", nullable: true})
	model: string;

	@Column({
		name: "sku",
		nullable: true,
		unique: true,
		comment: "Código único de producto",
	})
	sku: string;

	@Column({name: "barcode", nullable: true})
	barcode: string;

	@Column({name: "image_urls", type: "simple-array", nullable: true})
	imageUrls: string[];

	@Column({name: "is_featured", default: false})
	isFeatured: boolean;

	@Column({name: "is_active", default: true})
	isActive: boolean;

	@Column({
		type: "json",
		nullable: true,
		comment: "Dimensiones (largo, ancho, alto, peso)",
	})
	dimensions: {
		length?: number;
		width?: number;
		height?: number;
		weight?: number;
		unit?: string;
	};

	@Column({name: "category_id"})
	categoryId: string;

	@ManyToOne(() => CategoryEntity, (category) => category.materials)
	@JoinColumn({name: "category_id"})
	category: CategoryEntity;

	@Column({name: "seller_id"})
	sellerId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({name: "seller_id"})
	seller: UserEntity;

	@Column({
		type: "simple-array",
		nullable: true,
		comment: "Etiquetas para búsqueda y categorización",
	})
	tags: string[];

	@Column({
		type: "decimal",
		precision: 3,
		scale: 2,
		default: 0,
		comment: "Calificación promedio (0-5)",
	})
	rating: number;

	@Column({name: "rating_count", type: "int", default: 0})
	ratingCount: number;

	@Column({name: "view_count", type: "int", default: 0})
	viewCount: number;

	@Column({name: "order_count", type: "int", default: 0})
	orderCount: number;

	@OneToMany(
		() => MaterialRequestEntity,
		(materialRequest) => materialRequest.material
	)
	materialRequests: MaterialRequestEntity[];

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;

	@DeleteDateColumn({name: "deleted_at", nullable: true})
	deletedAt: Date;
  type: string;
  unitCost: number;
}
