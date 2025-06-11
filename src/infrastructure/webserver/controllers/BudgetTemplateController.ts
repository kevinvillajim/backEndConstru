// src/infrastructure/webserver/controllers/BudgetTemplateController.ts
import { Request, Response } from "express";
import { BudgetTemplateRepository } from "../../../domain/repositories/BudgetTemplateRepository";
import { BudgetTemplateService, TemplateRecommendation } from "../../../domain/services/BudgetTemplateService";
import { ApplyBudgetTemplateUseCase } from "../../../application/budget/ApplyBudgetTemplateUseCase";
import { BudgetTemplate, ProjectType, TemplateScope, CreateBudgetTemplateDTO } from "../../../domain/models/calculation/BudgetTemplate";
import { RequestWithUser } from "../middlewares/authMiddleware";
import { handleError } from "../utils/errorHandler";
import { v4 as uuidv4 } from "uuid";

export class BudgetTemplateController {

  constructor(
    private budgetTemplateRepository: BudgetTemplateRepository,
    private budgetTemplateService: BudgetTemplateService,
    private applyBudgetTemplateUseCase: ApplyBudgetTemplateUseCase
  ) {}

  /**
   * Obtiene todos los templates disponibles para el usuario
   */
  async getTemplates(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { 
        projectType, 
        geographicalZone, 
        scope,
        verified,
        page = 1, 
        limit = 20 
      } = req.query;

      // Construir filtros
      const filters: any = {};
      
      if (projectType) filters.projectType = projectType;
      if (geographicalZone) filters.geographicalZone = geographicalZone;
      if (scope) filters.scope = scope;
      if (verified !== undefined) filters.isVerified = verified === 'true';

      // Obtener templates
      const templates = await this.budgetTemplateRepository.findByUserWithFilters(
        req.user.id,
        filters,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      );

      res.status(200).json({
        success: true,
        data: templates,
        message: "Templates obtenidos exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error obteniendo templates"
      });
    }
  }

  /**
   * Obtiene un template específico por ID
   */
  async getTemplateById(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { templateId } = req.params;

      const template = await this.budgetTemplateRepository.findById(templateId);
      if (!template) {
        res.status(404).json({
          success: false,
          message: "Template no encontrado"
        });
        return;
      }

      // Verificar acceso
      if (template.scope === TemplateScope.PERSONAL && template.createdBy !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para acceder a este template"
        });
        return;
      }

      // Obtener estadísticas de uso
      const usageStats = await this.budgetTemplateService.getTemplateUsageStats(templateId);

      res.status(200).json({
        success: true,
        data: {
          template,
          usageStats
        },
        message: "Template obtenido exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error obteniendo template"
      });
    }
  }

  /**
   * Crea un nuevo template de presupuesto
   */
  async createTemplate(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const templateData: CreateBudgetTemplateDTO = req.body;

      // Validar datos
      if (!templateData.name || !templateData.projectType || !templateData.geographicalZone) {
        res.status(400).json({
          success: false,
          message: "Nombre, tipo de proyecto y zona geográfica son obligatorios"
        });
        return;
      }

      // Crear template
      const newTemplate: BudgetTemplate = {
        id: uuidv4(),
        ...templateData,
        createdBy: req.user.id,
        isActive: true,
        isVerified: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validar template antes de guardar
      const validation = this.budgetTemplateService.validateTemplate(newTemplate);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: "Template inválido",
          errors: validation.errors,
          warnings: validation.warnings
        });
        return;
      }

      const savedTemplate = await this.budgetTemplateRepository.create(newTemplate);

      res.status(201).json({
        success: true,
        data: {
          template: savedTemplate,
          validation: {
            completeness: validation.completeness,
            warnings: validation.warnings,
            suggestions: validation.suggestions
          }
        },
        message: "Template creado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error creando template"
      });
    }
  }

  /**
   * Actualiza un template existente
   */
  async updateTemplate(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { templateId } = req.params;
      const updateData = req.body;

      const existingTemplate = await this.budgetTemplateRepository.findById(templateId);
      if (!existingTemplate) {
        res.status(404).json({
          success: false,
          message: "Template no encontrado"
        });
        return;
      }

      // Verificar permisos
      if (existingTemplate.createdBy !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para modificar este template"
        });
        return;
      }

      // Preparar datos actualizados
      const updatedTemplate: BudgetTemplate = {
        ...existingTemplate,
        ...updateData,
        updatedAt: new Date()
      };

      // Validar template actualizado
      const validation = this.budgetTemplateService.validateTemplate(updatedTemplate);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: "Template actualizado inválido",
          errors: validation.errors,
          warnings: validation.warnings
        });
        return;
      }

      const savedTemplate = await this.budgetTemplateRepository.update(templateId, updatedTemplate);

      res.status(200).json({
        success: true,
        data: {
          template: savedTemplate,
          validation: {
            completeness: validation.completeness,
            warnings: validation.warnings,
            suggestions: validation.suggestions
          }
        },
        message: "Template actualizado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error actualizando template"
      });
    }
  }

  /**
   * Elimina un template
   */
  async deleteTemplate(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { templateId } = req.params;

      const template = await this.budgetTemplateRepository.findById(templateId);
      if (!template) {
        res.status(404).json({
          success: false,
          message: "Template no encontrado"
        });
        return;
      }

      // Verificar permisos
      if (template.createdBy !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para eliminar este template"
        });
        return;
      }

      // En lugar de eliminar físicamente, marcar como inactivo
      const updatedTemplate = {
        ...template,
        isActive: false,
        updatedAt: new Date()
      };

      await this.budgetTemplateRepository.update(templateId, updatedTemplate);

      res.status(200).json({
        success: true,
        message: "Template eliminado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error eliminando template"
      });
    }
  }

  /**
   * Duplica un template oficial para personalización
   */
  async duplicateTemplate(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { templateId } = req.params;
      const { name, description } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: "El nombre para el template duplicado es obligatorio"
        });
        return;
      }

      const originalTemplate = await this.budgetTemplateRepository.findById(templateId);
      if (!originalTemplate) {
        res.status(404).json({
          success: false,
          message: "Template original no encontrado"
        });
        return;
      }

      // Crear copia personalizada
      const duplicatedTemplate: BudgetTemplate = {
        ...originalTemplate,
        id: uuidv4(),
        name,
        description: description || `${originalTemplate.description} (Copia)`,
        scope: TemplateScope.PERSONAL,
        createdBy: req.user.id,
        isVerified: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const savedTemplate = await this.budgetTemplateRepository.create(duplicatedTemplate);

      res.status(201).json({
        success: true,
        data: savedTemplate,
        message: "Template duplicado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error duplicando template"
      });
    }
  }

  /**
   * Obtiene recomendaciones de templates para un presupuesto
   */
  async getRecommendations(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { projectType, geographicalZone, calculationResultId } = req.query;

      if (!projectType || !geographicalZone) {
        res.status(400).json({
          success: false,
          message: "Tipo de proyecto y zona geográfica son obligatorios"
        });
        return;
      }

      // Obtener resultado de cálculo si se proporciona
      let calculationResult = null;
      if (calculationResultId) {
        // Aquí se obtendría el resultado de cálculo desde el repositorio
        // calculationResult = await this.calculationResultRepository.findById(calculationResultId);
      }

      const recommendations: TemplateRecommendation[] = await this.budgetTemplateService.recommendTemplates(
        projectType as ProjectType,
        geographicalZone as string,
        calculationResult,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: recommendations,
        message: "Recomendaciones obtenidas exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error obteniendo recomendaciones"
      });
    }
  }

  /**
   * Aplica un template a un presupuesto existente
   */
  async applyToExistingBudget(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId, templateId } = req.params;
      const applyRequest = req.body;

      // Validar datos de entrada
      if (!applyRequest.applyOptions) {
        res.status(400).json({
          success: false,
          message: "Las opciones de aplicación son obligatorias"
        });
        return;
      }

      const result = await this.applyBudgetTemplateUseCase.execute(
        {
          budgetId,
          templateId,
          ...applyRequest
        },
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Template aplicado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error aplicando template"
      });
    }
  }

  /**
   * Verifica compatibilidad entre un template y un presupuesto
   */
  async checkCompatibility(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { budgetId, templateId } = req.params;

      const compatibility = await this.applyBudgetTemplateUseCase.checkCompatibility(
        budgetId,
        templateId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: compatibility,
        message: "Compatibilidad verificada exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error verificando compatibilidad"
      });
    }
  }

  /**
   * Crea un template automático basado en histórico del usuario
   */
  async createFromHistory(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { projectType, geographicalZone, templateName } = req.body;

      if (!projectType || !geographicalZone || !templateName) {
        res.status(400).json({
          success: false,
          message: "Tipo de proyecto, zona geográfica y nombre son obligatorios"
        });
        return;
      }

      const autoTemplate = await this.budgetTemplateService.generateTemplateFromHistory(
        req.user.id,
        projectType,
        geographicalZone,
        templateName
      );

      const savedTemplate = await this.budgetTemplateRepository.create(autoTemplate);

      res.status(201).json({
        success: true,
        data: savedTemplate,
        message: "Template automático creado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error creando template automático"
      });
    }
  }

  /**
   * Obtiene templates trending o más utilizados
   */
  async getTrendingTemplates(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { limit = 10, projectType, geographicalZone } = req.query;

      const templates = await this.budgetTemplateRepository.findTrending({
        limit: parseInt(limit as string),
        projectType: projectType as ProjectType,
        geographicalZone: geographicalZone as string
      });

      res.status(200).json({
        success: true,
        data: templates,
        message: "Templates trending obtenidos exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error obteniendo templates trending"
      });
    }
  }

  /**
   * Exporta un template a archivo JSON
   */
  async exportTemplate(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const { templateId } = req.params;

      const template = await this.budgetTemplateRepository.findById(templateId);
      if (!template) {
        res.status(404).json({
          success: false,
          message: "Template no encontrado"
        });
        return;
      }

      // Verificar acceso
      if (template.scope === TemplateScope.PERSONAL && template.createdBy !== req.user.id) {
        res.status(403).json({
          success: false,
          message: "No tiene permisos para exportar este template"
        });
        return;
      }

      // Preparar datos para exportación (sin IDs internos)
      const exportData = {
        name: template.name,
        description: template.description,
        projectType: template.projectType,
        geographicalZone: template.geographicalZone,
        wasteFactors: template.wasteFactors,
        laborRates: template.laborRates,
        laborProductivity: template.laborProductivity,
        indirectCosts: template.indirectCosts,
        professionalFees: template.professionalFees,
        necCompliance: template.necCompliance,
        exportedAt: new Date(),
        exportedBy: req.user.email
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="template_${template.name.replace(/\s+/g, '_')}.json"`);
      
      res.status(200).json(exportData);

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error exportando template"
      });
    }
  }

  /**
   * Importa un template desde archivo JSON
   */
  async importTemplate(req: RequestWithUser, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
        return;
      }

      const importData = req.body;
      const { customName } = req.query;

      // Validar estructura del archivo importado
      if (!importData.name || !importData.projectType || !importData.geographicalZone) {
        res.status(400).json({
          success: false,
          message: "Archivo de template inválido: faltan campos obligatorios"
        });
        return;
      }

      // Crear template desde datos importados
      const importedTemplate: BudgetTemplate = {
        id: uuidv4(),
        name: (customName as string) || `${importData.name} (Importado)`,
        description: importData.description || "Template importado",
        projectType: importData.projectType,
        scope: TemplateScope.PERSONAL,
        geographicalZone: importData.geographicalZone,
        wasteFactors: importData.wasteFactors || {},
        laborRates: importData.laborRates || {},
        laborProductivity: importData.laborProductivity || {},
        indirectCosts: importData.indirectCosts || {},
        professionalFees: importData.professionalFees || {},
        necCompliance: importData.necCompliance,
        createdBy: req.user.id,
        isActive: true,
        isVerified: false,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validar template antes de guardar
      const validation = this.budgetTemplateService.validateTemplate(importedTemplate);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: "Template importado inválido",
          errors: validation.errors,
          warnings: validation.warnings
        });
        return;
      }

      const savedTemplate = await this.budgetTemplateRepository.create(importedTemplate);

      res.status(201).json({
        success: true,
        data: {
          template: savedTemplate,
          validation: {
            completeness: validation.completeness,
            warnings: validation.warnings,
            suggestions: validation.suggestions
          }
        },
        message: "Template importado exitosamente"
      });

    } catch (error) {
      const typedError = handleError(error);
      res.status(400).json({
        success: false,
        message: typedError.message || "Error importando template"
      });
    }
  }
}