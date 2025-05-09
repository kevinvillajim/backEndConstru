// src/application/budget/CreateBudgetVersionUseCase.ts
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {BudgetItemRepository} from "../../domain/repositories/BudgetItemRepository";
import {
	ProjectBudget,
	BudgetStatus,
} from "../../domain/models/project/ProjectBudget";
import {BudgetItem} from "../../domain/models/project/BudgetItem";
import {v4 as uuidv4} from "uuid";

export class CreateBudgetVersionUseCase {
	constructor(
		private projectBudgetRepository: ProjectBudgetRepository,
		private budgetItemRepository: BudgetItemRepository
	) {}

	async execute(
		originalBudgetId: string,
		userId: string,
		changes?: {name?: string; description?: string}
	): Promise<ProjectBudget> {
		// 1. Obtener presupuesto original
		const originalBudget =
			await this.projectBudgetRepository.findById(originalBudgetId);

		if (!originalBudget) {
			throw new Error(`Presupuesto no encontrado: ${originalBudgetId}`);
		}

		// 2. Obtener items del presupuesto original
		const originalItems =
			await this.budgetItemRepository.findByBudget(originalBudgetId);

		// 3. Crear nuevo presupuesto con versión incrementada
		const newBudget: ProjectBudget = {
			id: uuidv4(),
			name:
				changes?.name ||
				`${originalBudget.name} (v${originalBudget.version + 1})`,
			description: changes?.description || originalBudget.description,
			status: BudgetStatus.DRAFT,
			version: originalBudget.version + 1,
			subtotal: originalBudget.subtotal,
			taxPercentage: originalBudget.taxPercentage,
			tax: originalBudget.tax,
			total: originalBudget.total,
			projectId: originalBudget.projectId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// 4. Guardar nuevo presupuesto
		const savedBudget = await this.projectBudgetRepository.create(newBudget);

		// 5. Crear nuevos items basados en los originales
		if (originalItems.length > 0) {
			const newItems: BudgetItem[] = originalItems.map((item) => ({
				id: uuidv4(),
				description: item.description,
				quantity: item.quantity,
				unitOfMeasure: item.unitOfMeasure,
				unitPrice: item.unitPrice,
				subtotal: item.subtotal,
				category: item.category,
				budgetId: savedBudget.id,
				materialId: item.materialId,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			await this.budgetItemRepository.createMany(newItems);
		}

		return savedBudget;
	}
}
