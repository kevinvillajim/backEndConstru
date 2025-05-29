// src/application/user-templates/CreateTemplateFromResultUseCase.ts
import {UserCalculationTemplateRepository} from "../../domain/repositories/UserCalculationTemplateRepository";
import {CalculationResultRepository} from "../../domain/repositories/CalculationResultRepository";
import {
    CreateFromResultDTO,
    UserCalculationTemplate,
} from "../../domain/models/calculation/UserCalculationTemplate";

export class CreateTemplateFromResultUseCase {
    constructor(
        private userTemplateRepository: UserCalculationTemplateRepository,
        private calculationResultRepository: CalculationResultRepository
    ) {}

    async execute(
        calculationResultId: string,
        name: string,
        description: string,
        category: string,
        targetProfessions: string[],
        userId: string
    ): Promise<UserCalculationTemplate> {
        // Verificar que el resultado existe y pertenece al usuario
        const calculationResult =
            await this.calculationResultRepository.findById(calculationResultId);

        if (!calculationResult) {
            throw new Error(
                `Resultado de cálculo no encontrado: ${calculationResultId}`
            );
        }

        if (calculationResult.userId !== userId) {
            throw new Error(
                "No tienes permisos para crear plantilla desde este resultado"
            );
        }

        // Validar que el nombre sea único
        const isNameUnique = await this.userTemplateRepository.isNameUniqueForUser(
            userId,
            name
        );

        if (!isNameUnique) {
            throw new Error(`Ya existe una plantilla con el nombre "${name}"`);
        }

        const createData: CreateFromResultDTO = {
            sourceCalculationResultId: calculationResultId,
            name,
            description,
            category,
            targetProfessions,
            userId,
        };

        return await this.userTemplateRepository.createFromResult(createData);
    }
}