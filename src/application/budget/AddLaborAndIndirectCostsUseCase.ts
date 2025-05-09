// src/application/budget/AddLaborAndIndirectCostsUseCase.ts
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {BudgetItemRepository} from "../../domain/repositories/BudgetItemRepository";
import {BudgetStatus} from "../../domain/models/project/ProjectBudget";
import {BudgetItem} from "../../domain/models/project/BudgetItem";
import {v4 as uuidv4} from "uuid";

interface LaborCost {
	description: string;
	quantity: number;
	unitOfMeasure: string;
	unitPrice: number;
}

interface IndirectCost {
	description: string;
	percentage?: number;
	fixedAmount?: number;
}

export class AddLaborAndIndirectCostsUseCase {
	constructor(
		private projectBudgetRepository: ProjectBudgetRepository,
		private budgetItemRepository: BudgetItemRepository
	) {}

	async execute(
		budgetId: string,
		laborCosts: LaborCost[],
		indirectCosts: IndirectCost[],
		userId: string
	): Promise<{
		budgetId: string;
		totalMaterials: number;
		totalLabor: number;
		totalIndirect: number;
		total: number;
	}> {
		// 1. Verificar que el presupuesto existe
		const budget = await this.projectBudgetRepository.findById(budgetId);

		if (!budget) {
			throw new Error(`Presupuesto no encontrado: ${budgetId}`);
		}

		if (budget.status !== BudgetStatus.DRAFT) {
			throw new Error(
				"Solo se pueden modificar presupuestos en estado borrador"
			);
		}

		// 2. Calcular subtotal de materiales existentes
		const existingItems =
			await this.budgetItemRepository.findByBudget(budgetId);
		const materialSubtotal = existingItems.reduce(
			(total, item) =>
				item.category === "Materiales" ? total + item.subtotal : total,
			0
		);

		// 3. Crear items para mano de obra
		const laborItems: BudgetItem[] = laborCosts.map((labor) => {
			const subtotal = labor.quantity * labor.unitPrice;

			return {
				id: uuidv4(),
				description: labor.description,
				quantity: labor.quantity,
				unitOfMeasure: labor.unitOfMeasure,
				unitPrice: labor.unitPrice,
				subtotal,
				category: "Mano de Obra",
				budgetId,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
		});

		// 4. Calcular subtotal de mano de obra
		const laborSubtotal = laborItems.reduce(
			(total, item) => total + item.subtotal,
			0
		);

		// 5. Crear items para costos indirectos
		const indirectItems: BudgetItem[] = [];
		let indirectSubtotal = 0;

		for (const indirect of indirectCosts) {
			let subtotal = 0;

			if (indirect.percentage !== undefined) {
				// Calcular como porcentaje del subtotal de materiales + mano de obra
				subtotal =
					(materialSubtotal + laborSubtotal) * (indirect.percentage / 100);
			} else if (indirect.fixedAmount !== undefined) {
				subtotal = indirect.fixedAmount;
			}

			indirectSubtotal += subtotal;

			indirectItems.push({
				id: uuidv4(),
				description: indirect.description,
				quantity: 1,
				unitOfMeasure: "Global",
				unitPrice: subtotal,
				subtotal,
				category: "Costos Indirectos",
				budgetId,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		// 6. Guardar todos los nuevos items
		const allNewItems = [...laborItems, ...indirectItems];
		await this.budgetItemRepository.createMany(allNewItems);

		// 7. Actualizar totales del presupuesto
		const newSubtotal = materialSubtotal + laborSubtotal + indirectSubtotal;
		const newTax = newSubtotal * (budget.taxPercentage / 100);
		const newTotal = newSubtotal + newTax;

		await this.projectBudgetRepository.update(budgetId, {
			subtotal: newSubtotal,
			tax: newTax,
			total: newTotal,
		});

		return {
			budgetId,
			totalMaterials: materialSubtotal,
			totalLabor: laborSubtotal,
			totalIndirect: indirectSubtotal,
			total: newTotal,
		};
	}
}
