// src/infrastructure/webserver/controllers/BudgetController.ts
import {Request, Response} from "express";
import {GenerateBudgetFromCalculationUseCase} from "../../../application/calculation/GenerateBudgetFromCalculationUseCase";
import {handleError} from "../utils/errorHandler";
import {User} from "../../../domain/models/user/User";

interface RequestWithUser extends Request {
	user?: User;
}

export class BudgetController {
	constructor(
		private generateBudgetFromCalculationUseCase: GenerateBudgetFromCalculationUseCase
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

			// Verificar que el usuario está autenticado
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

	
}
