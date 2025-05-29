// src/application/user-templates/ShareUserTemplateUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {ShareTemplateDTO} from "../../domain/models/calculation/UserCalculationTemplate";

export class ShareUserTemplateUseCase {
    constructor(
        private userTemplateRepository: UserCalculationTemplateRepository,
        private userRepository: UserRepository
    ) {}

    async execute(shareData: ShareTemplateDTO, userId: string): Promise<void> {
        // Verificar que la plantilla existe y pertenece al usuario
        const template = await this.userTemplateRepository.findByIdAndUserId(
            shareData.templateId,
            userId
        );

        if (!template) {
            throw new Error("Plantilla no encontrada o sin permisos");
        }

        // Verificar que todos los usuarios existen
        const users = await Promise.all(
            shareData.userIds.map((id) => this.userRepository.findById(id))
        );

        const invalidUsers = shareData.userIds.filter((id, index) => !users[index]);
        if (invalidUsers.length > 0) {
            throw new Error(`Usuarios no encontrados: ${invalidUsers.join(", ")}`);
        }

        // Compartir la plantilla
        const shared = await this.userTemplateRepository.shareTemplate(
            shareData.templateId,
            shareData.userIds
        );

        if (!shared) {
            throw new Error("Error al compartir la plantilla");
        }

        // TODO: Enviar notificaciones a los usuarios
    }
}