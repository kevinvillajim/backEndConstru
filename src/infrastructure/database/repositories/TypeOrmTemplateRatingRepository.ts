// src/infrastructure/database/repositories/TypeOrmTemplateRatingRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {TemplateRatingRepository} from "../../../domain/repositories/TemplateRatingRepository";
import {TemplateRatingEntity} from "../entities/TemplateRatingEntity";

export class TypeOrmTemplateRatingRepository
    implements TemplateRatingRepository
{
    private repository: Repository<TemplateRatingEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(TemplateRatingEntity);
    }

    async findByTemplateId(templateId: string): Promise<any[]> {
        return await this.repository.find({
            where: {templateId},
            relations: ["user"],
            order: {createdAt: "DESC"},
        });
    }

    async findByUserId(userId: string): Promise<any[]> {
        return await this.repository.find({
            where: {userId},
            relations: ["template"],
            order: {createdAt: "DESC"},
        });
    }

    async createOrUpdate(rating: {
        templateId: string;
        userId: string;
        rating: number;
        comment?: string;
    }): Promise<any> {
        const existing = await this.repository.findOne({
            where: {templateId: rating.templateId, userId: rating.userId},
        });

        if (existing) {
            Object.assign(existing, rating);
            return await this.repository.save(existing);
        } else {
            const newRating = this.repository.create(rating);
            return await this.repository.save(newRating);
        }
    }

    async getAverageRating(
        templateId: string
    ): Promise<{average: number; count: number}> {
        const result = await this.repository
            .createQueryBuilder("rating")
            .select("AVG(rating.rating)", "average")
            .addSelect("COUNT(rating.id)", "count")
            .where("rating.templateId = :templateId", {templateId})
            .getRawOne();

        return {
            average: parseFloat(result.average) || 0,
            count: parseInt(result.count) || 0,
        };
    }

    async getUserRating(userId: string, templateId: string): Promise<any | null> {
        return await this.repository.findOne({
            where: {userId, templateId},
        });
    }
}