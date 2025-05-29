// src/application/user-templates/GetUserTemplatesUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {
    UserTemplateFilters,
    UserTemplateListResponse,
} from "../../domain/models/calculation/UserCalculationTemplate";

export class GetUserTemplatesUseCase {
    constructor(
        private userTemplateRepository: UserCalculationTemplateRepository
    ) {}

    async execute(
        userId: string,
        filters?: UserTemplateFilters,
        pagination?: {
            page: number;
            limit: number;
            sortBy?: string;
            sortOrder?: "ASC" | "DESC";
        }
    ): Promise<UserTemplateListResponse> {
        const {templates, total} = await this.userTemplateRepository.findByUserId(
            userId,
            filters,
            pagination
        );

        const stats = await this.userTemplateRepository.getStats(userId);

        return {
            templates,
            pagination: {
                total,
                page: pagination?.page || 1,
                limit: pagination?.limit || 10,
                pages: Math.ceil(total / (pagination?.limit || 10)),
            },
            stats,
        };
    }
}