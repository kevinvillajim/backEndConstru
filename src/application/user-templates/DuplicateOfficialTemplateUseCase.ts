// src/application/user-templates/DuplicateOfficialTemplateUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {CalculationTemplateRepository} from "../../domain/repositories/CalculationTemplateRepository";
import {
    DuplicateTemplateDTO,
    UserCalculationTemplate,
} from "../../domain/models/calculation/UserCalculationTemplate";

export class DuplicateOfficialTemplateUseCase {
    constructor(
        private userTemplateRepository: UserCalculationTemplateRepository,
        private officialTemplateRepository: CalculationTemplateRepository
    ) {}

    async execute(
        officialTemplateId: string,
        userId: string,
        customName?: string,
        customDescription?: string
    ): Promise<UserCalculationTemplate> {
        // Verificar que la plantilla oficial existe y es accesible
        const officialTemplate =
            await this.officialTemplateRepository.findById(officialTemplateId);

        if (!officialTemplate) {
            throw new Error(`Plantilla oficial no encontrada: ${officialTemplateId}`);
        }

        if (!officialTemplate.isActive || !officialTemplate.isVerified) {
            throw new Error("La plantilla oficial no está disponible para duplicar");
        }

        // Solo plantillas públicas pueden ser duplicadas
        if (officialTemplate.shareLevel !== "public") {
            throw new Error("Solo las plantillas públicas pueden ser duplicadas");
        }

        const duplicateData: DuplicateTemplateDTO = {
            originalTemplateId: officialTemplateId,
            customName,
            customDescription,
            userId,
        };

        return await this.userTemplateRepository.duplicateFromOfficial(
            duplicateData
        );
    }
}