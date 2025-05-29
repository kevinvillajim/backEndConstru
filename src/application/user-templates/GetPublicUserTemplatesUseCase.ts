// src/application/user-templates/GetPublicUserTemplatesUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {
    UserTemplateFilters,
    UserCalculationTemplate,
} from "../../domain/models/calculation/UserCalculationTemplate";

export class GetPublicUserTemplatesUseCase {
    constructor(
        private userTemplateRepository: UserCalculationTemplateRepository
    ) {}

    async execute(
        excludeUserId?: string,
        filters?: Omit<UserTemplateFilters, "status">,
        pagination?: {
            page: number;
            limit: number;
            sortBy?: string;
            sortOrder?: "ASC" | "DESC";
        }
    ): Promise<{templates: UserCalculationTemplate[]; total: number}> {
        return await this.userTemplateRepository.findPublicTemplates(
            excludeUserId,
            filters,
            pagination
        );
    }
}
