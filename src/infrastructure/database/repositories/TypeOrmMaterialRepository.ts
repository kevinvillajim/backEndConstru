// src/infrastructure/database/repositories/TypeOrmMaterialRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {
	MaterialRepository,
	HistoricalPriceData,
} from "@domain/repositories/MaterialRepository";
import {
	MaterialPriceHistoryEntity,
	PriceChangeReason,
} from "../entities/MaterialPriceHistoryEntity";
import {Material} from "@domain/models/material/Material";
import {MaterialEntity} from "../entities/MaterialEntity";

export class TypeOrmMaterialRepository implements MaterialRepository {
	private repository: Repository<MaterialEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(MaterialEntity);
	}

	async findById(id: string): Promise<Material | null> {
		const material = await this.repository.findOne({
			where: {id},
			relations: ["category", "seller"],
		});

		return material ? this.toDomainModel(material) : null;
	}

	async findByName(name: string): Promise<Material[]> {
		const materials = await this.repository.find({
			where: {name: name},
		});

		return materials.map((material) => this.toDomainModel(material));
	}

	async findBySku(sku: string): Promise<Material | null> {
		const material = await this.repository.findOne({
			where: {sku},
		});

		return material ? this.toDomainModel(material) : null;
	}

	async findAll(
		filters?: any,
		pagination?: {
			page: number;
			limit: number;
			sortBy?: string;
			sortOrder?: "ASC" | "DESC";
		}
	): Promise<{materials: Material[]; total: number}> {
		let queryBuilder = this.repository.createQueryBuilder("material");

		// Aplicar filtros
		if (filters) {
			if (filters.categoryId) {
				queryBuilder = queryBuilder.andWhere(
					"material.category_id = :categoryId",
					{
						categoryId: filters.categoryId,
					}
				);
			}

			if (filters.sellerId) {
				queryBuilder = queryBuilder.andWhere("material.seller_id = :sellerId", {
					sellerId: filters.sellerId,
				});
			}

			if (filters.isActive !== undefined) {
				queryBuilder = queryBuilder.andWhere("material.is_active = :isActive", {
					isActive: filters.isActive,
				});
			}

			if (filters.isFeatured !== undefined) {
				queryBuilder = queryBuilder.andWhere(
					"material.is_featured = :isFeatured",
					{
						isFeatured: filters.isFeatured,
					}
				);
			}

			if (filters.searchTerm) {
				queryBuilder = queryBuilder.andWhere(
					"(material.name LIKE :term OR material.description LIKE :term OR material.specifications LIKE :term)",
					{term: `%${filters.searchTerm}%`}
				);
			}

			if (filters.minPrice !== undefined) {
				queryBuilder = queryBuilder.andWhere("material.price >= :minPrice", {
					minPrice: filters.minPrice,
				});
			}

			if (filters.maxPrice !== undefined) {
				queryBuilder = queryBuilder.andWhere("material.price <= :maxPrice", {
					maxPrice: filters.maxPrice,
				});
			}
		}

		// Calcular total
		const total = await queryBuilder.getCount();

		// Aplicar paginación y ordenamiento
		if (pagination) {
			const skip = (pagination.page - 1) * pagination.limit;
			queryBuilder = queryBuilder.skip(skip).take(pagination.limit);

			if (pagination.sortBy) {
				const order = pagination.sortOrder || "ASC";
				queryBuilder = queryBuilder.orderBy(
					`material.${pagination.sortBy}`,
					order
				);
			} else {
				// Ordenamiento por defecto
				queryBuilder = queryBuilder.orderBy("material.name", "ASC");
			}
		}

		// Ejecutar consulta
		const materialEntities = await queryBuilder.getMany();

		// Convertir a modelos de dominio
		const materials = materialEntities.map((entity) =>
			this.toDomainModel(entity)
		);

		return {materials, total};
	}

	async create(material: Omit<Material, "id">): Promise<Material> {
		const materialEntity = this.toEntity(material as Material);
		const savedMaterial = await this.repository.save(materialEntity);
		return this.toDomainModel(savedMaterial);
	}

	async update(
		id: string,
		materialData: Partial<Material>
	): Promise<Material | null> {
		const material = await this.repository.findOne({where: {id}});

		if (!material) return null;

		// Actualizar campos
		Object.assign(material, materialData);

		const updatedMaterial = await this.repository.save(material);
		return this.toDomainModel(updatedMaterial);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.softDelete(id);
		return result.affected !== 0;
	}

	async updateStock(id: string, quantity: number): Promise<boolean> {
		const material = await this.repository.findOne({where: {id}});

		if (!material) return false;

		material.stock += quantity;

		if (material.stock < 0) {
			material.stock = 0; // Evitar stock negativo
		}

		await this.repository.save(material);
		return true;
	}

	async updateViewCount(id: string): Promise<boolean> {
		const result = await this.repository.increment({id}, "viewCount", 1);
		return result.affected !== 0;
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: MaterialEntity): Material {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			specifications: entity.specifications,
			price: entity.price,
			wholesalePrice: entity.wholesalePrice,
			wholesaleMinQuantity: entity.wholesaleMinQuantity,
			stock: entity.stock,
			minStock: entity.minStock,
			unitOfMeasure: entity.unitOfMeasure,
			brand: entity.brand,
			model: entity.model,
			sku: entity.sku,
			barcode: entity.barcode,
			imageUrls: entity.imageUrls,
			isFeatured: entity.isFeatured,
			isActive: entity.isActive,
			dimensions: entity.dimensions,
			categoryId: entity.categoryId,
			sellerId: entity.sellerId,
			tags: entity.tags,
			rating: entity.rating,
			ratingCount: entity.ratingCount,
			viewCount: entity.viewCount,
			orderCount: entity.orderCount,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
		};
	}

	private toEntity(model: Material): MaterialEntity {
		const entity = new MaterialEntity();

		// Copiar campos
		Object.assign(entity, model);

		return entity;
	}

	async saveHistoricalPrice(data: HistoricalPriceData): Promise<boolean> {
		try {
			// 1. Crear la entidad de historial de precios
			const historyEntity = new MaterialPriceHistoryEntity();
			historyEntity.materialId = data.materialId;
			historyEntity.price = data.price;
			historyEntity.wholesalePrice = data.wholesalePrice;
			historyEntity.wholesaleMinQuantity = data.wholesaleMinQuantity;
			historyEntity.effectiveDate = data.effectiveDate;
			historyEntity.reason = data.reason as PriceChangeReason;
			historyEntity.notes = data.notes;
			historyEntity.supplierName = data.supplierName;
			historyEntity.supplierId = data.supplierId;
			historyEntity.recordedBy = data.recordedBy;
			historyEntity.priceChangePercentage = data.priceChangePercentage;
			historyEntity.isPromotion = data.isPromotion || false;

			// 2. Buscar el registro histórico anterior activo (sin endDate)
			const historyRepository = AppDataSource.getRepository(
				MaterialPriceHistoryEntity
			);
			const previousActiveRecord = await historyRepository.findOne({
				where: {
					materialId: data.materialId,
					endDate: null,
				},
				order: {
					effectiveDate: "DESC",
				},
			});

			// 3. Si hay un registro activo, establecer su fecha de fin
			if (previousActiveRecord) {
				previousActiveRecord.endDate = data.effectiveDate;
				await historyRepository.save(previousActiveRecord);
			}

			// 4. Guardar el nuevo registro histórico
			await historyRepository.save(historyEntity);

			return true;
		} catch (error) {
			console.error("Error al guardar historial de precios:", error);
			return false;
		}
	}
}