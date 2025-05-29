// src/application/user-templates/UpdateUserTemplateUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {
    UpdateUserCalculationTemplateDTO,
    UserCalculationTemplate,
    TemplateFormData,
} from "../../domain/models/calculation/UserCalculationTemplate";

export class UpdateUserTemplateUseCase {
    constructor(
        private userTemplateRepository: UserCalculationTemplateRepository
    ) {}

    async execute(
        templateId: string,
        formData: TemplateFormData,
        userId: string
    ): Promise<UserCalculationTemplate> {
        // Verificar que la plantilla existe y pertenece al usuario
        const existingTemplate =
            await this.userTemplateRepository.findByIdAndUserId(templateId, userId);

        if (!existingTemplate) {
            throw new Error(`Plantilla no encontrada o sin permisos: ${templateId}`);
        }

        // Validar que el nuevo nombre sea único (si cambió)
        if (formData.name !== existingTemplate.name) {
            const isNameUnique =
                await this.userTemplateRepository.isNameUniqueForUser(
                    userId,
                    formData.name,
                    templateId
                );

            if (!isNameUnique) {
                throw new Error(
                    `Ya existe una plantilla con el nombre "${formData.name}"`
                );
            }
        }

        // Actualizar la plantilla
        const updateData: UpdateUserCalculationTemplateDTO = {
            ...formData,
        };

        const updatedTemplate = await this.userTemplateRepository.update(
            templateId,
            updateData
        );

        if (!updatedTemplate) {
            throw new Error("Error al actualizar la plantilla");
        }

        return updatedTemplate;
    }
}