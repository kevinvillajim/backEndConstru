// src/application/user-templates/ChangeTemplateStatusUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {
	UserTemplateStatus,
	UserCalculationTemplate,
} from "../../domain/models/calculation/UserCalculationTemplate";

export class ChangeTemplateStatusUseCase {
	constructor(
		private userTemplateRepository: UserCalculationTemplateRepository
	) {}

	async execute(
		templateId: string,
		newStatus: UserTemplateStatus,
		userId: string
	): Promise<UserCalculationTemplate> {
		// Verificar que la plantilla existe y pertenece al usuario
		const template = await this.userTemplateRepository.findByIdAndUserId(
			templateId,
			userId
		);

		if (!template) {
			throw new Error("Plantilla no encontrada o sin permisos");
		}

		// Validar transiciones de estado
		if (!this.isValidStatusTransition(template.status, newStatus)) {
			throw new Error(
				`Transición de estado inválida: ${template.status} -> ${newStatus}`
			);
		}

		const updatedTemplate = await this.userTemplateRepository.changeStatus(
			templateId,
			newStatus
		);

		if (!updatedTemplate) {
			throw new Error("Error al cambiar el estado de la plantilla");
		}

		return updatedTemplate;
	}

	private isValidStatusTransition(
		currentStatus: UserTemplateStatus,
		newStatus: UserTemplateStatus
	): boolean {
		// Reglas de transición de estado
		const validTransitions: Record<UserTemplateStatus, UserTemplateStatus[]> = {
			[UserTemplateStatus.DRAFT]: [
				UserTemplateStatus.ACTIVE,
				UserTemplateStatus.ARCHIVED,
			],
			[UserTemplateStatus.ACTIVE]: [
				UserTemplateStatus.DRAFT,
				UserTemplateStatus.ARCHIVED,
			],
			[UserTemplateStatus.ARCHIVED]: [UserTemplateStatus.ACTIVE],
		};

		return validTransitions[currentStatus]?.includes(newStatus) || false;
	}
}
