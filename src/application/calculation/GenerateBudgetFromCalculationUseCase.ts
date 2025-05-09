// src/application/calculation/GenerateBudgetFromCalculationUseCase.ts
import {CalculationResultRepository} from "../../domain/repositories/CalculationResultRepository";
import {MaterialRepository} from "../../domain/repositories/MaterialRepository";
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {BudgetItemRepository} from "../../domain/repositories/BudgetItemRepository";
import {
	BudgetStatus,
	ProjectBudgetEntity,
} from "../../infrastructure/database/entities/ProjectBudgetEntity";
import {BudgetItemEntity} from "../../infrastructure/database/entities/BudgetItemEntity";
import {v4 as uuidv4} from "uuid";

export class GenerateBudgetFromCalculationUseCase {
	constructor(
		private calculationResultRepository: CalculationResultRepository,
		private materialRepository: MaterialRepository,
		private projectBudgetRepository: ProjectBudgetRepository,
		private budgetItemRepository: BudgetItemRepository
	) {}

	/**
	 * Genera un presupuesto a partir de un resultado de cálculo
	 */
	async execute(
		calculationResultId: string,
		projectId: string,
		budgetName: string,
		userId: string
	): Promise<{budgetId: string; items: number}> {
		// 1. Obtener el resultado del cálculo
		const calculationResult =
			await this.calculationResultRepository.findById(calculationResultId);

		if (!calculationResult) {
			throw new Error(
				`Resultado de cálculo no encontrado: ${calculationResultId}`
			);
		}

		// 2. Verificar que el resultado pertenezca al usuario
		if (calculationResult.userId !== userId) {
			throw new Error("No tienes permiso para usar este resultado de cálculo");
		}

		// 3. Verificar que el resultado tenga información de materiales
		const results = calculationResult.results;
		if (!results.materials || !Array.isArray(results.materials)) {
			throw new Error(
				"El resultado del cálculo no contiene información de materiales"
			);
		}

		// 4. Crear el nuevo presupuesto
		const newBudget = new ProjectBudgetEntity();
		newBudget.id = uuidv4();
		newBudget.name = budgetName;
		newBudget.description = `Presupuesto generado automáticamente a partir del cálculo: ${calculationResult.name || calculationResultId}`;
		newBudget.status = BudgetStatus.DRAFT;
		newBudget.version = 1;
		newBudget.projectId = projectId;
		newBudget.subtotal = 0;
		newBudget.taxPercentage = 15; // IVA estándar en Ecuador
		newBudget.tax = 0;
		newBudget.total = 0;

		// 5. Guardar el presupuesto
		const savedBudget = await this.projectBudgetRepository.create(newBudget);

		// 6. Procesar materiales y crear items de presupuesto
		const budgetItems: BudgetItemEntity[] = [];
		let subtotal = 0;

		for (const material of results.materials) {
			// 6.1 Buscar material en la base de datos para obtener precio actualizado
			let materialEntity = null;
			let unitPrice = 0;

			if (material.materialId) {
				materialEntity = await this.materialRepository.findById(
					material.materialId
				);
				if (materialEntity) {
					unitPrice = materialEntity.price;
				}
			}

			// Si no se encuentra el material o no tiene ID, usar el precio del cálculo
			if (!unitPrice && material.unitPrice) {
				unitPrice = material.unitPrice;
			}

			// Si no hay precio, asignar cero y advertir
			if (!unitPrice) {
				console.warn(
					`Material sin precio: ${material.description || "sin descripción"}`
				);
				unitPrice = 0;
			}

			// 6.2 Calcular subtotal del ítem
			const quantity = material.quantity || 1;
			const itemSubtotal = unitPrice * quantity;
			subtotal += itemSubtotal;

			// 6.3 Crear ítem de presupuesto
			const budgetItem = new BudgetItemEntity();
			budgetItem.id = uuidv4();
			budgetItem.description = material.description || "Material";
			budgetItem.quantity = quantity;
			budgetItem.unitOfMeasure = material.unitOfMeasure || "unidad";
			budgetItem.unitPrice = unitPrice;
			budgetItem.subtotal = itemSubtotal;
			budgetItem.category = material.category || "Materiales";
			budgetItem.budgetId = savedBudget.id;

			if (material.materialId) {
				budgetItem.materialId = material.materialId;
			}

			budgetItems.push(budgetItem);
		}

		// 7. Guardar los ítems del presupuesto
		const savedItems = await this.budgetItemRepository.createMany(budgetItems);

		// 8. Actualizar totales del presupuesto
		const tax = subtotal * (savedBudget.taxPercentage / 100);
		const total = subtotal + tax;

		await this.projectBudgetRepository.update(savedBudget.id, {
			subtotal,
			tax,
			total,
		});

		// 9. Actualizar el resultado del cálculo para indicar que se usó en un presupuesto
		await this.calculationResultRepository.update(calculationResultId, {
			ledToBudget: true,
		});

		return {
			budgetId: savedBudget.id,
			items: savedItems.length,
		};
	}
}
