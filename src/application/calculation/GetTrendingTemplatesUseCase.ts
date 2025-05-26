// src/application/calculation/GetTrendingTemplatesUseCase.ts
import {TrendingCalculationRepository} from "../../domain/repositories/TrendingCalculationRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";

export class GetTrendingTemplatesUseCase {
    constructor(
        private trendingCalculationRepository: TrendingCalculationRepository,
        private calculationTemplateRepository: CalculationTemplateRepository
    ) {}

    async execute(period: string = "weekly", limit: number = 10): Promise<any[]> {
        const trendingData =
            await this.trendingCalculationRepository.findTrendingByPeriod(
                period,
                limit
            );

        // Enriquecer con datos de las plantillas
        const templates = await Promise.all(
            trendingData.map(async (trend) => {
                const template = await this.calculationTemplateRepository.findById(
                    trend.templateId
                );
                return {
                    ...template,
                    trendScore: trend.trendScore,
                    rankPosition: trend.rankPosition,
                    periodUsage: trend.usageCount,
                };
            })
        );

        return templates.filter((template) => template.id);
    }
}