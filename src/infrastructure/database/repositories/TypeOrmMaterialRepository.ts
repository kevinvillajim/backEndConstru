// src/infrastructure/database/repositories/TypeOrmMaterialRepository.ts
import { Repository, Like, Between, MoreThan, LessThan, IsNull, Not } from 'typeorm';
import { MaterialRepository, MaterialFilters } from '../../../domain/repositories/MaterialRepository';
import { AppDataSource } from '../data-source';
import { MaterialEntity } from '../entities/MaterialEntity';

export class TypeOrmMaterialRepository implements MaterialRepository {
  private repository: Repository<MaterialEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(MaterialEntity);
  }

  async findById(id: string): Promise<MaterialEntity | null> {
    return await this.repository.findOne({
      where: { id }
    });
  }

  async findAll(): Promise<MaterialEntity[]> {
    return await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findByFilters(filters: MaterialFilters): Promise<MaterialEntity[]> {
    const queryBuilder = this.repository.createQueryBuilder('material');
    
    queryBuilder.where('material.isActive = :isActive', { isActive: filters.isActive ?? true });

    if (filters.type) {
      queryBuilder.andWhere('material.type = :type', { type: filters.type });
    }

    if (filters.supplierCode) {
      queryBuilder.andWhere('material.supplierCode = :supplierCode', { supplierCode: filters.supplierCode });
    }

    if (filters.isInStock) {
      queryBuilder.andWhere('material.availableQuantity > 0');
    }

    if (filters.isLowStock) {
      queryBuilder.andWhere(
        'material.availableQuantity <= COALESCE(JSON_UNQUOTE(JSON_EXTRACT(material.supplierInfo, "$.minimumOrder")), 10)'
      );
    }

    if (filters.needsPriceUpdate) {
      queryBuilder.andWhere(
        '(material.lastPriceUpdate IS NULL OR material.lastPriceUpdate < DATE_SUB(NOW(), INTERVAL 30 DAY))'
      );
    }

    if (filters.needsInventoryUpdate) {
      queryBuilder.andWhere(
        '(material.lastInventoryUpdate IS NULL OR material.lastInventoryUpdate < DATE_SUB(NOW(), INTERVAL 7 DAY))'
      );
    }

    if (filters.minQuantity !== undefined) {
      queryBuilder.andWhere('material.availableQuantity >= :minQuantity', { minQuantity: filters.minQuantity });
    }

    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('(material.currentPrice <= :maxPrice OR material.unitCost <= :maxPrice)', { maxPrice: filters.maxPrice });
    }

    return await queryBuilder
      .orderBy('material.name', 'ASC')
      .getMany();
  }

  async findByType(type: string): Promise<MaterialEntity[]> {
    return await this.repository.find({
      where: { type, isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findByName(name: string): Promise<MaterialEntity[]> {
    return await this.repository.find({
      where: { name: Like(`%${name}%`), isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findByExternalId(externalId: string): Promise<MaterialEntity | null> {
    return await this.repository.findOne({
      where: { externalId, isActive: true }
    });
  }

  async findBySupplierCode(supplierCode: string): Promise<MaterialEntity[]> {
    return await this.repository.find({
      where: { supplierCode, isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findBySupplierId(supplierId: string): Promise<MaterialEntity[]> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.isActive = true')
      .andWhere('JSON_UNQUOTE(JSON_EXTRACT(material.supplierInfo, "$.supplierId")) = :supplierId', { supplierId })
      .orderBy('material.name', 'ASC')
      .getMany();
  }

  async findInStock(): Promise<MaterialEntity[]> {
    return await this.repository.find({
      where: { 
        availableQuantity: MoreThan(0),
        isActive: true 
      },
      order: { name: 'ASC' }
    });
  }

  async findLowStock(): Promise<MaterialEntity[]> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.isActive = true')
      .andWhere('material.availableQuantity <= COALESCE(JSON_UNQUOTE(JSON_EXTRACT(material.supplierInfo, "$.minimumOrder")), 10)')
      .andWhere('material.availableQuantity > 0')
      .orderBy('material.availableQuantity', 'ASC')
      .getMany();
  }

  async findOutOfStock(): Promise<MaterialEntity[]> {
    return await this.repository.find({
      where: { 
        availableQuantity: 0,
        isActive: true 
      },
      order: { name: 'ASC' }
    });
  }

  async findNeedingInventoryUpdate(): Promise<MaterialEntity[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await this.repository
      .createQueryBuilder('material')
      .where('material.isActive = true')
      .andWhere('(material.lastInventoryUpdate IS NULL OR material.lastInventoryUpdate < :sevenDaysAgo)', { sevenDaysAgo })
      .orderBy('material.lastInventoryUpdate', 'ASC')
      .getMany();
  }

  async findNeedingPriceUpdate(): Promise<MaterialEntity[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.repository
      .createQueryBuilder('material')
      .where('material.isActive = true')
      .andWhere('(material.lastPriceUpdate IS NULL OR material.lastPriceUpdate < :thirtyDaysAgo)', { thirtyDaysAgo })
      .orderBy('material.lastPriceUpdate', 'ASC')
      .getMany();
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<MaterialEntity[]> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.isActive = true')
      .andWhere('(material.currentPrice BETWEEN :minPrice AND :maxPrice OR material.unitCost BETWEEN :minPrice AND :maxPrice)', { minPrice, maxPrice })
      .orderBy('COALESCE(material.currentPrice, material.unitCost)', 'ASC')
      .getMany();
  }

  async save(material: MaterialEntity): Promise<MaterialEntity> {
    return await this.repository.save(material);
  }

  async saveMany(materials: MaterialEntity[]): Promise<MaterialEntity[]> {
    return await this.repository.save(materials);
  }

  async update(id: string, updates: Partial<MaterialEntity>): Promise<MaterialEntity | null> {
    await this.repository.update(id, updates);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  async updateInventory(id: string, quantity: number, source: string = 'manual'): Promise<boolean> {
    const result = await this.repository.update(id, {
      availableQuantity: quantity,
      stock: quantity, // CORREGIDO: Mantener sincronización con stock
      lastInventoryUpdate: new Date()
    });
    return result.affected > 0;
  }

  async updatePrice(id: string, price: number, source: string = 'manual'): Promise<boolean> {
    const result = await this.repository.update(id, {
      currentPrice: price,
      price: price, // CORREGIDO: Mantener sincronización con price
      lastPriceUpdate: new Date()
    });
    return result.affected > 0;
  }

  async bulkUpdateInventory(updates: { id: string; quantity: number }[]): Promise<number> {
    let updatedCount = 0;
    
    for (const update of updates) {
      const success = await this.updateInventory(update.id, update.quantity, 'bulk');
      if (success) updatedCount++;
    }
    
    return updatedCount;
  }

  async bulkUpdatePrices(updates: { id: string; price: number }[]): Promise<number> {
    let updatedCount = 0;
    
    for (const update of updates) {
      const success = await this.updatePrice(update.id, update.price, 'bulk');
      if (success) updatedCount++;
    }
    
    return updatedCount;
  }

  async getInventoryReport(): Promise<any> {
    const result = await this.repository
      .createQueryBuilder('material')
      .select([
        'COUNT(*) as totalMaterials',
        'SUM(CASE WHEN material.availableQuantity > 0 THEN 1 ELSE 0 END) as inStock',
        'SUM(CASE WHEN material.availableQuantity = 0 THEN 1 ELSE 0 END) as outOfStock',
        'SUM(CASE WHEN material.availableQuantity <= COALESCE(JSON_UNQUOTE(JSON_EXTRACT(material.supplierInfo, "$.minimumOrder")), 10) AND material.availableQuantity > 0 THEN 1 ELSE 0 END) as lowStock',
        'AVG(material.availableQuantity) as avgQuantity',
        'SUM(material.availableQuantity * COALESCE(material.currentPrice, material.unitCost, 0)) as totalInventoryValue'
      ])
      .where('material.isActive = true')
      .getRawOne();

    return {
      totalMaterials: parseInt(result.totalMaterials) || 0,
      inStock: parseInt(result.inStock) || 0,
      outOfStock: parseInt(result.outOfStock) || 0,
      lowStock: parseInt(result.lowStock) || 0,
      averageQuantity: parseFloat(result.avgQuantity) || 0,
      totalInventoryValue: parseFloat(result.totalInventoryValue) || 0,
      reportDate: new Date()
    };
  }

  async getPriceHistory(materialId: string, days: number = 30): Promise<any[]> {
    // En una implementación real, esto requeriría una tabla de historial de precios
    // Por ahora retornamos información básica
    const material = await this.findById(materialId);
    if (!material) return [];

    return [
      {
        date: material.lastPriceUpdate || material.updatedAt,
        price: material.currentPrice || material.unitCost || 0,
        source: 'current'
      }
    ];
  }

  async getUsageStatistics(materialId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    // En una implementación real, esto requeriría consultar las tablas de uso/consumo
    return {
      materialId,
      totalUsed: 0,
      averageMonthlyUsage: 0,
      lastUsed: null,
      projectsUsed: 0
    };
  }

  async getLowStockAlerts(): Promise<MaterialEntity[]> {
    return await this.findLowStock();
  }

  async search(searchTerm: string): Promise<MaterialEntity[]> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.isActive = true')
      .andWhere('(material.name LIKE :searchTerm OR material.type LIKE :searchTerm OR material.supplierCode LIKE :searchTerm)', 
        { searchTerm: `%${searchTerm}%` })
      .orderBy('material.name', 'ASC')
      .getMany();
  }

  async findSimilar(materialId: string): Promise<MaterialEntity[]> {
    const material = await this.findById(materialId);
    if (!material) return [];

    return await this.repository.find({
      where: { 
        type: material.type,
        isActive: true,
        id: Not(materialId)
      },
      order: { name: 'ASC' },
      take: 10
    });
  }

  async findAlternatives(materialId: string): Promise<MaterialEntity[]> {
    // En una implementación real, esto podría usar algoritmos más sofisticados
    return await this.findSimilar(materialId);
  }
}