// src/application/user-templates/GetUserTemplateByIdUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {UserCalculationTemplate} from "../../domain/models/calculation/UserCalculationTemplate";

export class GetUserTemplateByIdUseCase {
    constructor(
        private userTemplateRepository: UserCalculationTemplateRepository
    ) {}

    async execute(
        templateId: string,
        userId: string
    ): Promise<UserCalculationTemplate> {
        const template = await this.userTemplateRepository.findByIdAndUserId(
            templateId,
            userId
        );

        if (!template) {
            throw new Error(`Plantilla no encontrada o sin acceso: ${templateId}`);
        }

        return template;
    }
}