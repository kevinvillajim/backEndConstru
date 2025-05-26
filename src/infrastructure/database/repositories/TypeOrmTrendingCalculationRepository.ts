// src/infrastructure/database/repositories/TypeOrmTrendingCalculationRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {TrendingCalculationRepository} from "../../../domain/repositories/TrendingCalculationRepository";
import {
	TrendingCalculationEntity,
	TrendingPeriod,
} from "../entities/TrendingCalculationEntity";

export class TypeOrmTrendingCalculationRepository
	implements TrendingCalculationRepository
{
	private repository: Repository<TrendingCalculationEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(TrendingCalculationEntity);
	}

	async findTrendingByPeriod(
		period: string,
		limit: number = 10
	): Promise<any[]> {
		return await this.repository.find({
			where: {period: period as TrendingPeriod},
			relations: ["template"],
			order: {rankPosition: "ASC"},
			take: limit,
		});
	}

	async updateTrendingData(data: any[]): Promise<void> {
		// Limpiar datos anteriores del período
		if (data.length > 0) {
			const period = data[0].period;
			await this.repository.delete({period});
		}

		// Insertar nuevos datos
		const entities = data.map((item) => this.repository.create(item)).flat();
		await this.repository.save(entities);
	}

	async calculateTrendingScores(period: string): Promise<void> {
		// Implementación básica para calcular scores de trending
		// Esto puede ser más complejo basado en algoritmos específicos

		const trendingItems = await this.repository.find({
			where: {period: period as TrendingPeriod},
			order: {usageCount: "DESC"},
		});

		// Asignar rankings basados en usage count
		for (let i = 0; i < trendingItems.length; i++) {
			const item = trendingItems[i];
			item.rankPosition = i + 1;
			item.trendScore = parseFloat((100 - i * 2).toFixed(4)); // Score decreciente
		}

		await this.repository.save(trendingItems);
	}

	async createTrendingEntry(data: {
		templateId: string;
		period: TrendingPeriod;
		usageCount: number;
		periodStart: Date;
		periodEnd: Date;
	}): Promise<any> {
		const entry = this.repository.create(data);
		return await this.repository.save(entry);
	}

	async getCurrentPeriodData(period: TrendingPeriod): Promise<any[]> {
		const now = new Date();
		return await this.repository.find({
			where: {
				period,
				periodStart: {$lte: now} as any,
				periodEnd: {$gte: now} as any,
			},
			relations: ["template"],
			order: {rankPosition: "ASC"},
		});
	}
}
