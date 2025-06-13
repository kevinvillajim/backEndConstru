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

	// PROPIEDADES AGREGADAS para compatibilidad con el sistema
	@Column({type: "decimal", precision: 10, scale: 2, nullable: true})
	currentPrice: number;

	@Column({type: "decimal", precision: 10, scale: 2, nullable: true})
	unitCost: number;

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

	// PROPIEDADES AGREGADAS - Alias para availableQuantity
	@Column({name: "available_quantity", type: "int", default: 0})
	availableQuantity: number;

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

	// PROPIEDADES AGREGADAS para integraciones externas
	@Column({name: "external_id", nullable: true})
	externalId: string;

	@Column({name: "supplier_code", nullable: true})
	supplierCode: string;

	@Column({name: "last_price_update", type: "datetime", nullable: true})
	lastPriceUpdate: Date;

	@Column({name: "last_inventory_update", type: "datetime", nullable: true})
	lastInventoryUpdate: Date;

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

	// PROPIEDADES AGREGADAS - Información adicional del material
	@Column({type: "varchar", length: 100, nullable: true})
	type: string;

	@Column({
		type: "json",
		nullable: true,
		comment: "Información del proveedor",
	})
	supplierInfo: {
		supplierId?: string;
		supplierName?: string;
		minimumOrder?: number;
		deliveryTime?: number;
		qualityRating?: number;
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

	// MÉTODOS DE UTILIDAD
	
	// Getter para sincronizar availableQuantity con stock
	get availableStock(): number {
		return this.availableQuantity || this.stock || 0;
	}

	// Setter para mantener sincronización
	set availableStock(value: number) {
		this.availableQuantity = value;
		this.stock = value;
	}

	// Getter para precio actual
	get currentPriceValue(): number {
		return this.currentPrice || this.price || this.unitCost || 0;
	}

	// Método para verificar disponibilidad
	isAvailable(requiredQuantity: number = 1): boolean {
		return this.availableStock >= requiredQuantity && this.isActive;
	}

	// Método para verificar si necesita restock
	needsRestock(): boolean {
		return this.availableStock <= this.minStock;
	}

	// Método para obtener información del proveedor
	getSupplierInfo(): any {
		return this.supplierInfo || {
			supplierId: null,
			supplierName: null,
			minimumOrder: 1,
			deliveryTime: 7,
			qualityRating: 0
		};
	}

	// Método para actualizar inventario
	updateInventory(newQuantity: number, source: string = 'manual'): void {
		this.availableQuantity = newQuantity;
		this.stock = newQuantity;
		this.lastInventoryUpdate = new Date();
	}

	// Método para actualizar precio
	updatePrice(newPrice: number, source: string = 'manual'): void {
		this.currentPrice = newPrice;
		if (!this.price || newPrice !== this.price) {
			this.price = newPrice;
		}
		this.lastPriceUpdate = new Date();
	}

	// Método para reducir stock
	reduceStock(quantity: number): boolean {
		if (this.availableStock >= quantity) {
			this.availableQuantity -= quantity;
			this.stock -= quantity;
			this.lastInventoryUpdate = new Date();
			return true;
		}
		return false;
	}

	// Método para aumentar stock
	increaseStock(quantity: number): void {
		this.availableQuantity += quantity;
		this.stock += quantity;
		this.lastInventoryUpdate = new Date();
	}

	// Método para calcular valor total del inventario
	getTotalInventoryValue(): number {
		return this.availableStock * this.currentPriceValue;
	}

	// Método para verificar si el precio necesita actualización
	needsPriceUpdate(daysThreshold: number = 30): boolean {
		if (!this.lastPriceUpdate) return true;
		
		const daysSinceUpdate = Math.floor(
			(new Date().getTime() - this.lastPriceUpdate.getTime()) / (1000 * 60 * 60 * 24)
		);
		
		return daysSinceUpdate >= daysThreshold;
	}

	// Método para verificar si el inventario necesita actualización
	needsInventoryUpdate(daysThreshold: number = 7): boolean {
		if (!this.lastInventoryUpdate) return true;
		
		const daysSinceUpdate = Math.floor(
			(new Date().getTime() - this.lastInventoryUpdate.getTime()) / (1000 * 60 * 60 * 24)
		);
		
		return daysSinceUpdate >= daysThreshold;
	}
}