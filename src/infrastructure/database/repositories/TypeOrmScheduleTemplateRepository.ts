// ===== TypeOrmScheduleTemplateRepository.ts =====
import { Repository, Like, In, MoreThan } from 'typeorm';
import { ScheduleTemplateEntity, TemplateScope } from '../entities/ScheduleTemplateEntity';
import { ScheduleTemplateRepository } from '../../../domain/repositories/ScheduleTemplateRepository';
import { AppDataSource } from '../data-source';

export class TypeOrmScheduleTemplateRepository implements ScheduleTemplateRepository {
  private repository: Repository<ScheduleTemplateEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ScheduleTemplateEntity);
  }

  async findById(id: string): Promise<ScheduleTemplateEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['createdBy', 'activityTemplates']
    });
  }

  async findByScope(scope: TemplateScope): Promise<ScheduleTemplateEntity[]> {
    return await this.repository.find({
      where: { scope, isActive: true },
      relations: ['createdBy'],
      order: { usageCount: 'DESC', averageRating: 'DESC' }
    });
  }

  async findVerifiedTemplates(): Promise<ScheduleTemplateEntity[]> {
    return await this.repository.find({
      where: { isVerified: true, isActive: true },
      relations: ['createdBy'],
      order: { averageRating: 'DESC', usageCount: 'DESC' }
    });
  }

  async findByConstructionType(
    constructionType: string, 
    geographicalZone?: string
  ): Promise<ScheduleTemplateEntity[]> {
    const where: any = { constructionType, isActive: true };
    if (geographicalZone) {
      where.geographicalZone = geographicalZone;
    }

    return await this.repository.find({
      where,
      relations: ['createdBy'],
      order: { usageCount: 'DESC', averageRating: 'DESC' }
    });
  }

  async findTrendingTemplates(limit: number = 10): Promise<ScheduleTemplateEntity[]> {
    return await this.repository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .where('template.isActive = true')
      .orderBy('template.usageCount', 'DESC')
      .addOrderBy('template.averageRating', 'DESC')
      .limit(limit)
      .getMany();
  }

  async findRecommended(
    constructionType: string,
    geographicalZone: string,
    userPreferences?: any
  ): Promise<ScheduleTemplateEntity[]> {
    let query = this.repository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .where('template.isActive = true')
      .andWhere('template.constructionType = :constructionType', { constructionType })
      .andWhere('template.geographicalZone = :geographicalZone', { geographicalZone });

    // Aplicar filtros adicionales basados en preferencias del usuario
    if (userPreferences?.minRating) {
      query = query.andWhere('template.averageRating >= :minRating', { 
        minRating: userPreferences.minRating 
      });
    }

    if (userPreferences?.onlyVerified) {
      query = query.andWhere('template.isVerified = true');
    }

    return await query
      .orderBy('template.averageRating', 'DESC')
      .addOrderBy('template.usageCount', 'DESC')
      .limit(5)
      .getMany();
  }

  async findByUser(userId: string): Promise<ScheduleTemplateEntity[]> {
    return await this.repository.find({
      where: { createdById: userId, isActive: true },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' }
    });
  }

  async searchTemplates(searchTerm: string): Promise<ScheduleTemplateEntity[]> {
    return await this.repository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .where('template.isActive = true')
      .andWhere(
        '(template.name ILIKE :searchTerm OR template.description ILIKE :searchTerm OR template.tags::text ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('template.averageRating', 'DESC')
      .getMany();
  }

  async findHighRated(minRating: number = 4.0): Promise<ScheduleTemplateEntity[]> {
    return await this.repository.find({
      where: {
        averageRating: MoreThan(minRating),
        isActive: true
      },
      relations: ['createdBy'],
      order: { averageRating: 'DESC', usageCount: 'DESC' }
    });
  }

  async save(template: ScheduleTemplateEntity): Promise<ScheduleTemplateEntity> {
    return await this.repository.save(template);
  }

  async incrementUsage(templateId: string): Promise<boolean> {
    const result = await this.repository.increment(
      { id: templateId },
      'usageCount',
      1
    );
    return result.affected > 0;
  }

  async updateRating(templateId: string, newRating: number, ratingCount: number): Promise<boolean> {
    const result = await this.repository.update(templateId, {
      averageRating: newRating,
      ratingCount: ratingCount
    });
    return result.affected > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }
}