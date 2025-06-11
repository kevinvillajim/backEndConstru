// src/infrastructure/webserver/controllers/CalculationBudgetController.ts
import { Request, Response } from "express";
import { CreateCalculationBudgetUseCase } from "../../../application/budget/CreateCalculationBudgetUseCase";
import { UpdateBudgetPricingUseCase } from "../../../application/budget/UpdateBudgetPricingUseCase";
import { GenerateProfessionalBudgetUseCase } from "../../../application/budget/GenerateProfessionalBudgetUseCase";
import { CalculationBudgetRepository } from "../../../domain/repositories/CalculationBudgetRepository";
import { BudgetLineItemRepository } from "../../../domain/repositories/BudgetLineItemRepository";
import { ProfessionalCostRepository } from "../../../domain/repositories/ProfessionalCostRepository";
import { CalculationBudgetService } from "../../../domain/services/CalculationBudgetService";
import { BudgetPricingService } from "../../../domain/services/BudgetPricingService";
import { CalculationBudget, CalculationBudgetStatus } from "../../../domain/models/calculation/CalculationBudget";
import { RequestWithUser } from "../middlewares/authMiddleware";
import { handleError } from "../utils/errorHandler";

export class CalculationBudgetController {

  constructor(
    private createCalculationBudgetUseCase: CreateCalculationBudgetUseCase,
    private updateBudgetPricingUseCase: UpdateBudgetPricingUseCase,
    private generateProfessionalBudgetUseCase: GenerateProfessionalBudgetUseCase,
    private calculationBudgetRepository: CalculationBudgetRepository,
    private budgetLineItemRepository: BudgetLineItemRepository,
    private professionalCostRepository: ProfessionalCostRepository,
    private calculationBudgetService: CalculationBudgetService,
    private budgetPricingService: BudgetPricingService
  ) {}

  /**
   * Crea un nuevo presupuesto de cálculo
   */
  async createCalculationBudget(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const createRequest = req.body;

      // Validar datos básicos
      if (!createRequest.name || !createRequest.projectId || !createRequest.budgetType) {
        res.status(400).json({
          success: false,
          message: "Nombre, ID de proyecto y tipo de presupuesto son obligatorios"
        });
        return;
      }

      const result = await this.createCalculationBudgetUseCase.execute(
        createRequest,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: result,
        message: "Presupuesto de cálculo creado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error creando presupuesto de cálculo"
      });
    }
  }

  /**
   * Obtiene un presupuesto por ID con detalles completos
   */
  async getBudgetById(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;

      const budget = await this.calculationBudgetRepository.findById(budgetId);
      if (!budget) {
        res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado"
        });
        return;
      }

      // Verificar permisos
      if (budget.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para acceder a este presupuesto"
        });
        return;
      }

      // Obtener detalles relacionados
      const lineItems = await this.budgetLineItemRepository.findByBudgetId(budgetId);
      const professionalCosts = await this.professionalCostRepository.findByBudgetId(budgetId);

      // Validar coherencia del presupuesto
      const validation = this.calculationBudgetService.validateBudgetCoherence(budget);

      res.status(200).json({
        success: true,
        data: {
          budget,
          lineItems,
          professionalCosts,
          validation
        },
        message: "Presupuesto obtenido exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error obteniendo presupuesto"
      });
    }
  }

  /**
   * Obtiene todos los presupuestos del usuario
   */
  async getUserBudgets(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { 
        projectId, 
        status, 
        budgetType,
        page = 1, 
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Construir filtros
      const filters: any = { userId: req.user.id };
      if (projectId) filters.projectId = projectId;
      if (status) filters.status = status;
      if (budgetType) filters.budgetType = budgetType;

      const budgets = await this.calculationBudgetRepository.findByUserWithFilters(
        req.user.id,
        filters,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc'
        }
      );

      res.status(200).json({
        success: true,
        data: budgets,
        message: "Presupuestos obtenidos exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error obteniendo presupuestos"
      });
    }
  }

  /**
   * Actualiza un presupuesto existente
   */
  async updateBudget(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;
      const updateData = req.body;

      const existingBudget = await this.calculationBudgetRepository.findById(budgetId);
      if (!existingBudget) {
        res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado"
        });
        return;
      }

      // Verificar permisos
      if (existingBudget.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para modificar este presupuesto"
        });
        return;
      }

      // Preparar datos actualizados
      const updatedBudget: CalculationBudget = {
        ...existingBudget,
        ...updateData,
        updatedAt: new Date()
      };

      // Validar coherencia si se modificaron totales
      const validation = this.calculationBudgetService.validateBudgetCoherence(updatedBudget);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: "Presupuesto actualizado inválido",
          errors: validation.errors,
          warnings: validation.warnings
        });
        return;
      }

      const savedBudget = await this.calculationBudgetRepository.update(budgetId, updatedBudget);

      res.status(200).json({
        success: true,
        data: {
          budget: savedBudget,
          validation
        },
        message: "Presupuesto actualizado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error actualizando presupuesto"
      });
    }
  }

  /**
   * Actualiza precios del presupuesto desde fuentes externas
   */
  async updatePricing(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;
      const updateRequest = req.body;

      const result = await this.updateBudgetPricingUseCase.execute(
        {
          budgetId,
          ...updateRequest
        },
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Precios actualizados exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error actualizando precios"
      });
    }
  }

  /**
   * Compara precios disponibles sin actualizar
   */
  async comparePrices(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;

      const priceComparisons = await this.updateBudgetPricingUseCase.comparePricesOnly(
        budgetId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: priceComparisons,
        message: "Comparación de precios obtenida exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error comparando precios"
      });
    }
  }

  /**
   * Genera documento profesional del presupuesto
   */
  async generateProfessionalDocument(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;
      const generateRequest = req.body;

      // Validar datos requeridos
      if (!generateRequest.clientInfo?.name) {
        res.status(400).json({
          success: false,
          message: "La información del cliente es obligatoria"
        });
        return;
      }

      const result = await this.generateProfessionalBudgetUseCase.execute(
        {
          budgetId,
          ...generateRequest
        },
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Documento profesional generado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error generando documento profesional"
      });
    }
  }

  /**
   * Genera vista previa del documento
   */
  async generatePreview(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;
      const { format = 'PDF' } = req.query;

      const preview = await this.generateProfessionalBudgetUseCase.generatePreview(
        budgetId,
        format as 'PDF' | 'HTML',
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: preview,
        message: "Vista previa generada exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error generando vista previa"
      });
    }
  }

  /**
   * Cambia el estado del presupuesto
   */
  async updateStatus(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          message: "El nuevo estado es obligatorio"
        });
        return;
      }

      const budget = await this.calculationBudgetRepository.findById(budgetId);
      if (!budget) {
        res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado"
        });
        return;
      }

      // Verificar permisos
      if (budget.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para modificar este presupuesto"
        });
        return;
      }

      // Validar transición de estado
      const isValidTransition = this.validateStatusTransition(budget.status, status);
      if (!isValidTransition) {
        res.status(400).json({
          success: false,
          message: `Transición de estado inválida: ${budget.status} → ${status}`
        });
        return;
      }

      // Actualizar estado
      const updatedBudget: CalculationBudget = {
        ...budget,
        status,
        updatedAt: new Date()
      };

      // Agregar información de aprobación si aplica
      if (status === CalculationBudgetStatus.APPROVED) {
        updatedBudget.approvedBy = req.user.id;
        updatedBudget.approvedAt = new Date();
      }

      const savedBudget = await this.calculationBudgetRepository.update(budgetId, updatedBudget);

      res.status(200).json({
        success: true,
        data: savedBudget,
        message: `Estado actualizado a ${status} exitosamente`
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error actualizando estado"
      });
    }
  }

  /**
   * Clona un presupuesto existente
   */
  async cloneBudget(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;
      const { name, projectId } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: "El nombre para el presupuesto clonado es obligatorio"
        });
        return;
      }

      const originalBudget = await this.calculationBudgetRepository.findById(budgetId);
      if (!originalBudget) {
        res.status(404).json({
          success: false,
          message: "Presupuesto original no encontrado"
        });
        return;
      }

      // Verificar permisos
      if (originalBudget.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para clonar este presupuesto"
        });
        return;
      }

      // Crear clon
      const clonedBudget: CalculationBudget = {
        ...originalBudget,
        id: require('uuid').v4(),
        name,
        projectId: projectId || originalBudget.projectId,
        status: CalculationBudgetStatus.DRAFT,
        version: 1,
        parentBudgetId: undefined,
        approvedBy: undefined,
        approvedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const savedClone = await this.calculationBudgetRepository.create(clonedBudget);

      // Clonar líneas de presupuesto
      const originalLineItems = await this.budgetLineItemRepository.findByBudgetId(budgetId);
      for (const lineItem of originalLineItems) {
        const clonedLineItem = {
          ...lineItem,
          id: require('uuid').v4(),
          budgetId: savedClone.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await this.budgetLineItemRepository.create(clonedLineItem);
      }

      // Clonar costos profesionales
      const originalProfessionalCosts = await this.professionalCostRepository.findByBudgetId(budgetId);
      for (const cost of originalProfessionalCosts) {
        const clonedCost = {
          ...cost,
          id: require('uuid').v4(),
          budgetId: savedClone.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await this.professionalCostRepository.create(clonedCost);
      }

      res.status(201).json({
        success: true,
        data: savedClone,
        message: "Presupuesto clonado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error clonando presupuesto"
      });
    }
  }

  /**
   * Obtiene historial de versiones de un presupuesto
   */
  async getBudgetVersions(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;

      const budget = await this.calculationBudgetRepository.findById(budgetId);
      if (!budget) {
        res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado"
        });
        return;
      }

      // Verificar permisos
      if (budget.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para acceder a este presupuesto"
        });
        return;
      }

      // Obtener todas las versiones
      const versions = await this.calculationBudgetRepository.findVersionsByParentId(
        budget.parentBudgetId || budgetId
      );

      res.status(200).json({
        success: true,
        data: versions,
        message: "Versiones obtenidas exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error obteniendo versiones"
      });
    }
  }

  /**
   * Elimina un presupuesto (soft delete)
   */
  async deleteBudget(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId } = req.params;

      const budget = await this.calculationBudgetRepository.findById(budgetId);
      if (!budget) {
        res.status(404).json({
          success: false,
          message: "Presupuesto no encontrado"
        });
        return;
      }

      // Verificar permisos
      if (budget.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para eliminar este presupuesto"
        });
        return;
      }

      // No permitir eliminar presupuestos aprobados o finales
      if (budget.status === CalculationBudgetStatus.APPROVED || 
          budget.status === CalculationBudgetStatus.FINAL) {
        res.status(400).json({
          success: false,
          message: "No se pueden eliminar presupuestos aprobados o finales"
        });
        return;
      }

      // Marcar como archivado en lugar de eliminar físicamente
      const updatedBudget: CalculationBudget = {
        ...budget,
        status: CalculationBudgetStatus.ARCHIVED,
        updatedAt: new Date()
      };

      await this.calculationBudgetRepository.update(budgetId, updatedBudget);

      res.status(200).json({
        success: true,
        message: "Presupuesto eliminado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error eliminando presupuesto"
      });
    }
  }

  // Métodos auxiliares privados

  private validateStatusTransition(currentStatus: CalculationBudgetStatus, newStatus: CalculationBudgetStatus): boolean {
    const validTransitions: { [key in CalculationBudgetStatus]: CalculationBudgetStatus[] } = {
      [CalculationBudgetStatus.DRAFT]: [
        CalculationBudgetStatus.REVIEW,
        CalculationBudgetStatus.ARCHIVED
      ],
      [CalculationBudgetStatus.REVIEW]: [
        CalculationBudgetStatus.DRAFT,
        CalculationBudgetStatus.APPROVED,
        CalculationBudgetStatus.REVISED,
        CalculationBudgetStatus.ARCHIVED
      ],
      [CalculationBudgetStatus.APPROVED]: [
        CalculationBudgetStatus.FINAL,
        CalculationBudgetStatus.REVISED
      ],
      [CalculationBudgetStatus.REVISED]: [
        CalculationBudgetStatus.REVIEW,
        CalculationBudgetStatus.APPROVED,
        CalculationBudgetStatus.ARCHIVED
      ],
      [CalculationBudgetStatus.FINAL]: [
        // Los presupuestos finales no pueden cambiar de estado
      ],
      [CalculationBudgetStatus.ARCHIVED]: [
        CalculationBudgetStatus.DRAFT
      ]
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}