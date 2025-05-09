// src/application/budget/CompareBudgetVersionsUseCase.ts
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {BudgetItemRepository} from "../../domain/repositories/BudgetItemRepository";
import {ProjectBudget} from "../../domain/models/project/ProjectBudget";
import {BudgetItem} from "../../domain/models/project/BudgetItem";

export interface BudgetComparison {
	originalBudget: ProjectBudget;
	newBudget: ProjectBudget;
	totalVariation: number;
	variationPercentage: number;
	itemComparisons: {
		description: string;
		originalQuantity: number;
		newQuantity: number;
		originalPrice: number;
		newPrice: number;
		originalSubtotal: number;
		newSubtotal: number;
		difference: number;
		variationPercentage: number;
	}[];
	newItems: BudgetItem[];
	removedItems: BudgetItem[];
}

export class CompareBudgetVersionsUseCase {
	constructor(
		private projectBudgetRepository: ProjectBudgetRepository,
		private budgetItemRepository: BudgetItemRepository
	) {}

	async execute(
		originalBudgetId: string,
		newBudgetId: string
	): Promise<BudgetComparison> {
		// 1. Obtener los presupuestos
		const originalBudget =
			await this.projectBudgetRepository.findById(originalBudgetId);
		const newBudget = await this.projectBudgetRepository.findById(newBudgetId);

		if (!originalBudget || !newBudget) {
			throw new Error("Uno o ambos presupuestos no existen");
		}

		// 2. Obtener items de cada presupuesto
		const originalItems =
			await this.budgetItemRepository.findByBudget(originalBudgetId);
		const newItems = await this.budgetItemRepository.findByBudget(newBudgetId);

		// 3. Analizar diferencias item por item
		const itemComparisons = [];
		const newItemsOnly = [];
		const removedItems = [];

		// Mapear items por descripción para facilitar la comparación
		const originalItemsMap = new Map<string, BudgetItem>();
		originalItems.forEach((item) =>
			originalItemsMap.set(item.description, item)
		);

		const newItemsMap = new Map<string, BudgetItem>();
		newItems.forEach((item) => newItemsMap.set(item.description, item));

		// Analizar items en ambos presupuestos
		originalItems.forEach((originalItem) => {
			const newItem = newItemsMap.get(originalItem.description);

			if (newItem) {
				// Item existe en ambos presupuestos - comparar
				const originalSubtotal = originalItem.subtotal;
				const newSubtotal = newItem.subtotal;
				const difference = newSubtotal - originalSubtotal;
				const variationPercentage =
					originalSubtotal !== 0 ? (difference / originalSubtotal) * 100 : 0;

				itemComparisons.push({
					description: originalItem.description,
					originalQuantity: originalItem.quantity,
					newQuantity: newItem.quantity,
					originalPrice: originalItem.unitPrice,
					newPrice: newItem.unitPrice,
					originalSubtotal,
					newSubtotal,
					difference,
					variationPercentage,
				});
			} else {
				// Item removido en la nueva versión
				removedItems.push(originalItem);
			}
		});

		// Identificar nuevos items
		newItems.forEach((newItem) => {
			if (!originalItemsMap.has(newItem.description)) {
				newItemsOnly.push(newItem);
			}
		});

		// 4. Calcular variación total
		const totalVariation = newBudget.total - originalBudget.total;
		const variationPercentage =
			originalBudget.total !== 0
				? (totalVariation / originalBudget.total) * 100
				: 0;

		// 5. Devolver comparación completa
		return {
			originalBudget,
			newBudget,
			totalVariation,
			variationPercentage,
			itemComparisons,
			newItems: newItemsOnly,
			removedItems,
		};
	}
}
