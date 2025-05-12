export interface Category {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	imageUrl?: string;
	isActive: boolean;
	parentId?: string;
	displayOrder: number;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}
