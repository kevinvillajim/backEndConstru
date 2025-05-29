// src/application/user-templates/CreateUserTemplateUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {
	CreateUserCalculationTemplateDTO,
	UserCalculationTemplate,
	TemplateFormData,
	UserTemplateSourceType,
	UserTemplateStatus,
} from "../../domain/models/calculation/UserCalculationTemplate";

export class CreateUserTemplateUseCase {
	constructor(
		private userTemplateRepository: UserCalculationTemplateRepository
	) {}

	async execute(
		formData: TemplateFormData,
		userId: string
	): Promise<UserCalculationTemplate> {
		// Validar que el nombre sea único para el usuario
		const isNameUnique = await this.userTemplateRepository.isNameUniqueForUser(
			userId,
			formData.name
		);

		if (!isNameUnique) {
			throw new Error(
				`Ya existe una plantilla con el nombre "${formData.name}"`
			);
		}

		// Crear DTO para la plantilla
		const createData: CreateUserCalculationTemplateDTO = {
			...formData,
			sourceType: UserTemplateSourceType.CREATED,
			userId,
			version: "1.0",
		};

		return await this.userTemplateRepository.create(createData);
	}
}