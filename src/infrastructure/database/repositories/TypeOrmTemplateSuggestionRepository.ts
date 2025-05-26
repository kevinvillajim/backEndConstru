// src/infrastructure/database/repositories/TypeOrmTemplateSuggestionRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {TemplateSuggestionRepository} from "../../../domain/repositories/TemplateSuggestionRepository";
import {
    TemplateSuggestionEntity,
    SuggestionStatus,
} from "../entities/TemplateSuggestionEntity";

export class TypeOrmTemplateSuggestionRepository
    implements TemplateSuggestionRepository
{
    private repository: Repository<TemplateSuggestionEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(TemplateSuggestionEntity);
    }

    async findByTemplateId(templateId: string): Promise<any[]> {
        return await this.repository.find({
            where: {templateId},
            relations: ["user", "reviewer"],
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

    async create(suggestion: any): Promise<any> {
        const newSuggestion = this.repository.create(suggestion);
        return await this.repository.save(newSuggestion);
    }

    async update(id: string, data: any): Promise<any> {
        await this.repository.update(id, data);
        return await this.repository.findOne({
            where: {id},
            relations: ["user", "template", "reviewer"],
        });
    }

    async findPendingSuggestions(): Promise<any[]> {
        return await this.repository.find({
            where: {status: SuggestionStatus.PENDING},
            relations: ["user", "template"],
            order: {createdAt: "ASC"},
        });
    }

    async updateStatus(
        id: string,
        status: string,
        reviewedBy?: string
    ): Promise<any> {
        const updateData: any = {status};

        if (reviewedBy) {
            updateData.reviewedBy = reviewedBy;
            updateData.reviewedAt = new Date();
        }

        await this.repository.update(id, updateData);
        return await this.repository.findOne({
            where: {id},
            relations: ["user", "template", "reviewer"],
        });
    }
}