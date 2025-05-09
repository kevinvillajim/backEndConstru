// src/domain/models/material/Material.ts
export interface Material {
	id: string;
	name: string;
	description?: string;
	specifications?: string;
	price: number;
	wholesalePrice?: number;
	wholesaleMinQuantity?: number;
	stock: number;
	minStock: number;
	unitOfMeasure: string;
	brand?: string;
	model?: string;
	sku?: string;
	barcode?: string;
	imageUrls?: string[];
	isFeatured: boolean;
	isActive: boolean;
	dimensions?: {
		length?: number;
		width?: number;
		height?: number;
		weight?: number;
		unit?: string;
	};
	categoryId: string;
	sellerId: string;
	tags?: string[];
	rating: number;
	ratingCount: number;
	viewCount: number;
	orderCount: number;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}
