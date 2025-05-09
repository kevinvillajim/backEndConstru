// src/infrastructure/webserver/controllers/BudgetController.ts
import {Request, Response} from "express";
import {GenerateBudgetFromCalculationUseCase} from "../../../application/calculation/GenerateBudgetFromCalculationUseCase";
import {GetProjectBudgetsUseCase} from "../../../application/budget/GetProjectBudgetsUseCase";
import {CreateBudgetVersionUseCase} from "../../../application/budget/CreateBudgetVersionUseCase";
import {ProjectBudgetRepository} from "../../../domain/repositories/ProjectBudgetRepository";
import {handleError} from "../utils/errorHandler";
import {User} from "../../../domain/models/user/User";
import {BudgetStatus} from "../../../domain/models/project/ProjectBudget";

interface RequestWithUser extends Request {
	user?: User;
}

export class BudgetController {
	constructor(
		private generateBudgetFromCalculationUseCase: GenerateBudgetFromCalculationUseCase,
		private getProjectBudgetsUseCase: GetProjectBudgetsUseCase,
		private createBudgetVersionUseCase: CreateBudgetVersionUseCase,
		private projectBudgetRepository: ProjectBudgetRepository
	) {}

	/**
	 * Genera un presupuesto a partir de un resultado de cálculo
	 */
	async generateFromCalculation(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			const {calculationResultId, projectId, name} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const userId = req.user.id;

			// Validar entrada
			if (!calculationResultId || !projectId || !name) {
				res.status(400).json({
					success: false,
					message:
						"El ID del resultado de cálculo, ID del proyecto y nombre son obligatorios",
				});
				return;
			}

			// Ejecutar caso de uso
			const result = await this.generateBudgetFromCalculationUseCase.execute(
				calculationResultId,
				projectId,
				name,
				userId
			);

			res.status(200).json({
				success: true,
				message: `Presupuesto generado exitosamente con ${result.items} items`,
				data: result,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al generar presupuesto:", typedError);

			res.status(400).json({
				success: false,
				message: typedError.message || "Error al generar el presupuesto",
			});
		}
	}

	/**
	 * Obtiene lista de presupuestos de un proyecto
	 */
	async getProjectBudgets(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {projectId} = req.params;
			const {page, limit, status, sortBy, sortOrder} = req.query;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const filters = {
				page: page ? parseInt(page as string) : undefined,
				limit: limit ? parseInt(limit as string) : undefined,
				status: status as string,
				sortBy: sortBy as string,
				sortOrder: sortOrder as "ASC" | "DESC",
			};

			const result = await this.getProjectBudgetsUseCase.execute(
				projectId as string,
				req.user.id,
				filters
			);

			res.status(200).json({
				success: true,
				data: {
					budgets: result.budgets,
					pagination: {
						total: result.total,
						page: filters.page || 1,
						limit: filters.limit || 10,
						pages: Math.ceil(result.total / (filters.limit || 10)),
					},
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al obtener presupuestos",
			});
		}
	}

	/**
	 * Obtiene detalles de un presupuesto específico
	 */
	async getBudgetDetails(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {budgetId} = req.params;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const budget = await this.projectBudgetRepository.findById(budgetId);

			if (!budget) {
				res.status(404).json({
					success: false,
					message: "Presupuesto no encontrado",
				});
				return;
			}

			res.status(200).json({
				success: true,
				data: budget,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message:
					typedError.message || "Error al obtener detalles del presupuesto",
			});
		}
	}

	/**
	 * Crea una nueva versión de un presupuesto existente
	 */
	async createVersion(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {budgetId} = req.params;
			const {name, description} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const newBudget = await this.createBudgetVersionUseCase.execute(
				budgetId,
				req.user.id,
				{name, description}
			);

			res.status(201).json({
				success: true,
				message: "Nueva versión del presupuesto creada exitosamente",
				data: {
					id: newBudget.id,
					version: newBudget.version,
					name: newBudget.name,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al crear nueva versión",
			});
		}
	}

	/**
	 * Actualiza el estado de un presupuesto
	 */
	async updateStatus(req: RequestWithUser, res: Response): Promise<void> {
		try {
			const {budgetId} = req.params;
			const {status} = req.body;

			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Validar estado
			if (!Object.values(BudgetStatus).includes(status as BudgetStatus)) {
				res.status(400).json({
					success: false,
					message: "Estado no válido",
				});
				return;
			}

			const budget = await this.projectBudgetRepository.findById(budgetId);

			if (!budget) {
				res.status(404).json({
					success: false,
					message: "Presupuesto no encontrado",
				});
				return;
			}

			const updatedBudget = await this.projectBudgetRepository.update(
				budgetId,
				{
					status: status as BudgetStatus,
				}
			);

			res.status(200).json({
				success: true,
				message: "Estado del presupuesto actualizado",
				data: updatedBudget,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(400).json({
				success: false,
				message: typedError.message || "Error al actualizar estado",
			});
		}
	}
}
