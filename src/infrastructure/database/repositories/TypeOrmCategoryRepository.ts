import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {CategoryRepository} from "../../../domain/repositories/CategoryRepository";
import {Category} from "../../../domain/models/material/Category";
import {CategoryEntity} from "../entities/CategoryEntity";

export class TypeOrmCategoryRepository implements CategoryRepository {
	private repository: Repository<CategoryEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(CategoryEntity);
	}

	async findById(id: string): Promise<Category | null> {
		const category = await this.repository.findOne({
			where: {id},
		});

		return category ? this.toDomainModel(category) : null;
	}

	async findByName(name: string): Promise<Category | null> {
		const category = await this.repository.findOne({
			where: {name},
		});

		return category ? this.toDomainModel(category) : null;
	}

	async findAll(filters?: any): Promise<Category[]> {
		let queryBuilder = this.repository.createQueryBuilder("category");

		if (filters) {
			if (filters.isActive !== undefined) {
				queryBuilder = queryBuilder.andWhere("category.is_active = :isActive", {
					isActive: filters.isActive,
				});
			}

			if (filters.parentId) {
				queryBuilder = queryBuilder.andWhere("category.parent_id = :parentId", {
					parentId: filters.parentId,
				});
			} else if (filters.parentId === null) {
				queryBuilder = queryBuilder.andWhere("category.parent_id IS NULL");
			}
		}

		queryBuilder = queryBuilder.orderBy("category.display_order", "ASC");

		const categories = await queryBuilder.getMany();
		return categories.map((category) => this.toDomainModel(category));
	}

	async create(category: Omit<Category, "id">): Promise<Category> {
		const entity = this.toEntity(category as Category);
		const savedCategory = await this.repository.save(entity);
		return this.toDomainModel(savedCategory);
	}

	async update(id: string, data: Partial<Category>): Promise<Category | null> {
		const category = await this.repository.findOne({
			where: {id},
		});

		if (!category) return null;

		Object.assign(category, data);
		const updatedCategory = await this.repository.save(category);
		return this.toDomainModel(updatedCategory);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.softDelete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	// Métodos auxiliares
	private toDomainModel(entity: CategoryEntity): Category {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			icon: entity.icon,
			imageUrl: entity.imageUrl,
			isActive: entity.isActive,
			parentId: entity.parentId,
			displayOrder: entity.displayOrder,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
		};
	}

	private toEntity(model: Category): CategoryEntity {
		const entity = new CategoryEntity();

		entity.id = model.id;
		entity.name = model.name;
		entity.description = model.description;
		entity.icon = model.icon;
		entity.imageUrl = model.imageUrl;
		entity.isActive = model.isActive;
		entity.parentId = model.parentId;
		entity.displayOrder = model.displayOrder;

		return entity;
	}
}
