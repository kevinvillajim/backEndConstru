// src/application/user-templates/DeleteUserTemplateUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";

export class DeleteUserTemplateUseCase {
    constructor(
        private userTemplateRepository: UserCalculationTemplateRepository
    ) {}

    async execute(templateId: string, userId: string): Promise<void> {
        // Verificar que la plantilla existe y pertenece al usuario
        const template = await this.userTemplateRepository.findByIdAndUserId(
            templateId,
            userId
        );

        if (!template) {
            throw new Error(`Plantilla no encontrada o sin permisos: ${templateId}`);
        }

        const deleted = await this.userTemplateRepository.delete(templateId);

        if (!deleted) {
            throw new Error("Error al eliminar la plantilla");
        }
    }
}