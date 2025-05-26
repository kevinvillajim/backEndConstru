// src/infrastructure/database/repositories/TypeOrmCalculationComparisonRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {CalculationComparisonRepository} from "../../../domain/repositories/CalculationComparisonRepository";
import {CalculationComparisonEntity} from "../entities/CalculationComparisonEntity";

export class TypeOrmCalculationComparisonRepository
    implements CalculationComparisonRepository
{
    private repository: Repository<CalculationComparisonEntity>;

    constructor() {
        this.repository = AppDataSource.getRepository(CalculationComparisonEntity);
    }

    async findByUserId(userId: string): Promise<any[]> {
        return await this.repository.find({
            where: {userId, isSaved: true},
            order: {createdAt: "DESC"},
        });
    }

    async create(comparison: any): Promise<any> {
        const newComparison = this.repository.create(comparison);
        return await this.repository.save(newComparison);
    }

    async update(id: string, data: any): Promise<any> {
        await this.repository.update(id, data);
        return await this.repository.findOne({where: {id}});
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return result.affected !== 0;
    }

    async findById(id: string): Promise<any | null> {
        return await this.repository.findOne({where: {id}});
    }
}