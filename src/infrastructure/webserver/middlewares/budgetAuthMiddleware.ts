// src/infrastructure/webserver/middlewares/budgetAuthMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { CalculationBudgetRepository } from "../../../domain/repositories/CalculationBudgetRepository";
import { BudgetTemplateRepository } from "../../../domain/repositories/BudgetTemplateRepository";
import { ProjectRepository } from "../../../domain/repositories/ProjectRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { RequestWithUser } from "./authMiddleware";
import { CalculationBudgetStatus } from "../../../domain/models/calculation/CalculationBudget";
import { TemplateScope } from "../../../domain/models/calculation/BudgetTemplate";

export interface BudgetPermissions {
  canRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  canShare: boolean;
  canClone: boolean;
  restrictions: string[];
}

export class BudgetAuthMiddleware {

  constructor(
    private calculationBudgetRepository: CalculationBudgetRepository,
    private budgetTemplateRepository: BudgetTemplateRepository,
    private projectRepository: ProjectRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Middleware para verificar permisos de presupuesto
   */
  checkBudgetPermissions(requiredPermissions: Array<keyof BudgetPermissions>) {
    return async (req: RequestWithUser, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado"
          });
        }

        const { budgetId } = req.params;
        if (!budgetId) {
          return res.status(400).json({
            success: false,
            message: "ID de presupuesto no proporcionado"
          });
        }

        const budget = await this.calculationBudgetRepository.findById(budgetId);
        if (!budget) {
          return res.status(404).json({
            success: false,
            message: "Presupuesto no encontrado"
          });
        }

        const permissions = await this.getBudgetPermissions(budget, req.user.id);

        // Verificar permisos requeridos
        for (const permission of requiredPermissions) {
          if (!permissions[permission]) {
            return res.status(403).json({
              success: false,
              message: `No tiene permisos para ${this.getPermissionDescription(permission)} este presupuesto`,
              restrictions: permissions.restrictions
            });
          }
        }

        // Agregar información al request para uso posterior
        req.budget = budget;
        req.budgetPermissions = permissions;

        next();

      } catch (error) {
        console.error('Error verificando permisos de presupuesto:', error);
        return res.status(500).json({
          success: false,
          message: "Error interno verificando permisos"
        });
      }
    };
  }

  /**
   * Middleware para verificar permisos de template
   */
  checkTemplatePermissions(requiredActions: string[]) {
    return async (req: RequestWithUser, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado"
          });
        }

        const { templateId } = req.params;
        if (!templateId) {
          return res.status(400).json({
            success: false,
            message: "ID de template no proporcionado"
          });
        }

        const template = await this.budgetTemplateRepository.findById(templateId);
        if (!template) {
          return res.status(404).json({
            success: false,
            message: "Template no encontrado"
          });
        }

        const hasPermission = await this.checkTemplateAccess(template, req.user.id, requiredActions);
        if (!hasPermission.allowed) {
          return res.status(403).json({
            success: false,
            message: hasPermission.reason
          });
        }

        // Agregar información al request
        req.budgetTemplate = template;

        next();

      } catch (error) {
        console.error('Error verificando permisos de template:', error);
        return res.status(500).json({
          success: false,
          message: "Error interno verificando permisos"
        });
      }
    };
  }

  /**
   * Middleware para verificar permisos de proyecto
   */
  checkProjectAccess() {
    return async (req: RequestWithUser, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado"
          });
        }

        const { projectId } = req.body;
        if (!projectId) {
          return next(); // Si no hay projectId en el body, continuar
        }

        const project = await this.projectRepository.findById(projectId);
        if (!project) {
          return res.status(404).json({
            success: false,
            message: "Proyecto no encontrado"
          });
        }

        // Verificar si el usuario tiene acceso al proyecto
        const hasAccess = await this.checkUserProjectAccess(project, req.user.id);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "No tiene permisos para crear presupuestos en este proyecto"
          });
        }

        req.project = project;
        next();

      } catch (error) {
        console.error('Error verificando acceso al proyecto:', error);
        return res.status(500).json({
          success: false,
          message: "Error interno verificando acceso al proyecto"
        });
      }
    };
  }

  /**
   * Middleware para verificar límites de plan del usuario
   */
  checkPlanLimits(action: 'CREATE_BUDGET' | 'CREATE_TEMPLATE' | 'EXPORT_DOCUMENT') {
    return async (req: RequestWithUser, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Usuario no autenticado"
          });
        }

        const user = await this.userRepository.findById(req.user.id);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
          });
        }

        const limits = await this.getUserPlanLimits(user);
        const usage = await this.getUserCurrentUsage(user.id);

        let canProceed = true;
        let limitMessage = "";

        switch (action) {
          case 'CREATE_BUDGET':
            if (usage.budgetsThisMonth >= limits.monthlyBudgets) {
              canProceed = false;
              limitMessage = `Ha alcanzado el límite de ${limits.monthlyBudgets} presupuestos por mes. Actualice su plan para continuar.`;
            }
            break;

          case 'CREATE_TEMPLATE':
            if (usage.personalTemplates >= limits.personalTemplates) {
              canProceed = false;
              limitMessage = `Ha alcanzado el límite de ${limits.personalTemplates} templates personales. Actualice su plan para continuar.`;
            }
            break;

          case 'EXPORT_DOCUMENT':
            if (usage.exportsThisMonth >= limits.monthlyExports) {
              canProceed = false;
              limitMessage = `Ha alcanzado el límite de ${limits.monthlyExports} exportaciones por mes. Actualice su plan para continuar.`;
            }
            break;
        }

        if (!canProceed) {
          return res.status(402).json({
            success: false,
            message: limitMessage,
            planLimits: limits,
            currentUsage: usage
          });
        }

        req.userLimits = limits;
        req.userUsage = usage;
        next();

      } catch (error) {
        console.error('Error verificando límites del plan:', error);
        return res.status(500).json({
          success: false,
          message: "Error interno verificando límites del plan"
        });
      }
    };
  }

  /**
   * Middleware para auditar acciones de presupuesto
   */
  auditBudgetAction(action: string) {
    return async (req: RequestWithUser, res: Response, next: NextFunction) => {
      try {
        // Guardar información original para comparación posterior
        req.auditInfo = {
          action,
          timestamp: new Date(),
          userId: req.user?.id,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          budgetId: req.params.budgetId || req.body.budgetId,
          originalData: req.body
        };

        next();

      } catch (error) {
        console.error('Error preparando auditoría:', error);
        next(); // No bloquear la operación por errores de auditoría
      }
    };
  }

  /**
   * Middleware para logging de acciones después de la respuesta
   */
  logBudgetAction() {
    return (req: RequestWithUser, res: Response, next: NextFunction) => {
      const originalSend = res.send;

      res.send = function(data: any): Response<any, Record<string, any>> {
        // Log después de enviar la respuesta
        if (req.auditInfo) {
          setTimeout(() => {
            try {
              const auditLog = {
                ...req.auditInfo,
                statusCode: res.statusCode,
                success: res.statusCode < 400,
                responseTime: Date.now() - req.auditInfo.timestamp.getTime(),
                budgetData: req.budget ? {
                  id: req.budget.id,
                  name: req.budget.name,
                  status: req.budget.status,
                  total: req.budget.total
                } : null
              };

              // Aquí se podría guardar en base de datos, enviar a servicio de logging, etc.
              console.log('Budget Action Audit:', JSON.stringify(auditLog, null, 2));

            } catch (error) {
              console.error('Error logging budget action:', error);
            }
          }, 0);
        }

        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Métodos auxiliares privados

  private async getBudgetPermissions(budget: any, userId: string): Promise<BudgetPermissions> {
    const isOwner = budget.userId === userId;
    const restrictions: string[] = [];

    // Permisos base según propiedad
    let permissions: BudgetPermissions = {
      canRead: isOwner,
      canEdit: isOwner,
      canDelete: isOwner,
      canApprove: isOwner,
      canExport: isOwner,
      canShare: isOwner,
      canClone: isOwner,
      restrictions
    };

    // Restricciones según estado del presupuesto
    if (budget.status === CalculationBudgetStatus.FINAL) {
      permissions.canEdit = false;
      permissions.canDelete = false;
      restrictions.push("Los presupuestos finales no pueden modificarse o eliminarse");
    }

    if (budget.status === CalculationBudgetStatus.APPROVED) {
      permissions.canEdit = false;
      restrictions.push("Los presupuestos aprobados requieren crear una nueva versión para modificar");
    }

    if (budget.status === CalculationBudgetStatus.ARCHIVED) {
      permissions.canEdit = false;
      permissions.canDelete = false;
      restrictions.push("Los presupuestos archivados son de solo lectura");
    }

    // Verificar si es miembro del proyecto
    if (!isOwner) {
      const projectAccess = await this.checkUserProjectAccess(
        { id: budget.projectId } as any, 
        userId
      );
      
      if (projectAccess) {
        permissions.canRead = true;
        permissions.canClone = true;
        // Los miembros del proyecto pueden leer y clonar, pero no editar directamente
      }
    }

    return permissions;
  }

  private async checkTemplateAccess(
    template: any, 
    userId: string, 
    requiredActions: string[]
  ): Promise<{ allowed: boolean; reason?: string }> {

    // Templates del sistema están disponibles para todos
    if (template.scope === TemplateScope.SYSTEM) {
      // Solo lectura para templates del sistema
      if (requiredActions.some(action => ['EDIT', 'DELETE'].includes(action))) {
        return { 
          allowed: false, 
          reason: "Los templates del sistema no pueden modificarse" 
        };
      }
      return { allowed: true };
    }

    // Templates de empresa - verificar membresía
    if (template.scope === TemplateScope.COMPANY) {
      const userCompany = await this.getUserCompany(userId);
      const templateCompany = await this.getTemplateCompany(template.id);
      
      if (userCompany !== templateCompany) {
        return { 
          allowed: false, 
          reason: "No tiene acceso a templates de esta empresa" 
        };
      }
      
      // Solo el creador o administradores de empresa pueden editar
      if (requiredActions.some(action => ['EDIT', 'DELETE'].includes(action))) {
        const isCreator = template.createdBy === userId;
        const isCompanyAdmin = await this.isCompanyAdmin(userId, userCompany);
        
        if (!isCreator && !isCompanyAdmin) {
          return { 
            allowed: false, 
            reason: "Solo el creador o administradores pueden modificar este template" 
          };
        }
      }
      
      return { allowed: true };
    }

    // Templates personales - solo el creador
    if (template.scope === TemplateScope.PERSONAL) {
      if (template.createdBy !== userId) {
        return { 
          allowed: false, 
          reason: "No tiene acceso a este template personal" 
        };
      }
      return { allowed: true };
    }

    // Templates compartidos - verificar permisos específicos
    if (template.scope === TemplateScope.SHARED) {
      const hasSharedAccess = await this.checkSharedTemplateAccess(template.id, userId);
      if (!hasSharedAccess) {
        return { 
          allowed: false, 
          reason: "No tiene acceso a este template compartido" 
        };
      }
      return { allowed: true };
    }

    return { allowed: false, reason: "Acceso denegado" };
  }

  private async checkUserProjectAccess(project: any, userId: string): Promise<boolean> {
    // Verificar si es el propietario del proyecto
    if (project.userId === userId) {
      return true;
    }

    // Verificar si es miembro del equipo del proyecto
    // Esto dependería de cómo esté implementada la relación usuario-proyecto
    // Por ahora, simplificamos asumiendo que solo el propietario tiene acceso
    return false;
  }

  private async getUserPlanLimits(user: any) {
    // Obtener límites según el plan del usuario
    const planLimits = {
      'FREE': {
        monthlyBudgets: 3,
        personalTemplates: 2,
        monthlyExports: 5
      },
      'PREMIUM': {
        monthlyBudgets: 50,
        personalTemplates: 20,
        monthlyExports: 100
      },
      'ENTERPRISE': {
        monthlyBudgets: 1000,
        personalTemplates: 100,
        monthlyExports: 1000
      }
    };

    const userPlan = user.subscriptionPlan || 'FREE';
    return planLimits[userPlan as keyof typeof planLimits] || planLimits.FREE;
  }

  private async getUserCurrentUsage(userId: string) {
    // Obtener uso actual del usuario en el mes actual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    // Estas consultas deberían implementarse en los repositorios correspondientes
    const budgetsThisMonth = await this.calculationBudgetRepository.countByUserAndMonth(userId, currentMonth);
    const personalTemplates = await this.budgetTemplateRepository.countPersonalByUser(userId);
    const exportsThisMonth = 0; // Implementar cuando se tenga tracking de exportaciones

    return {
      budgetsThisMonth,
      personalTemplates,
      exportsThisMonth
    };
  }

  private getPermissionDescription(permission: keyof BudgetPermissions): string {
    const descriptions = {
      canRead: 'ver',
      canEdit: 'editar',
      canDelete: 'eliminar',
      canApprove: 'aprobar',
      canExport: 'exportar',
      canShare: 'compartir',
      canClone: 'clonar'
    };

    return descriptions[permission] || permission;
  }

  private async getUserCompany(userId: string): Promise<string | null> {
    // Implementar lógica para obtener la empresa del usuario
    return null;
  }

  private async getTemplateCompany(templateId: string): Promise<string | null> {
    // Implementar lógica para obtener la empresa del template
    return null;
  }

  private async isCompanyAdmin(userId: string, companyId: string): Promise<boolean> {
    // Implementar lógica para verificar si es administrador de empresa
    return false;
  }

  private async checkSharedTemplateAccess(templateId: string, userId: string): Promise<boolean> {
    // Implementar lógica para verificar acceso a templates compartidos
    return false;
  }
}

// Extender el tipo Request para incluir información adicional
declare global {
  namespace Express {
    interface Request {
      budget?: any;
      budgetTemplate?: any;
      budgetPermissions?: BudgetPermissions;
      project?: any;
      userLimits?: any;
      userUsage?: any;
      auditInfo?: {
        action: string;
        timestamp: Date;
        userId?: string;
        ip?: string;
        userAgent?: string;
        budgetId?: string;
        originalData?: any;
      };
    }
  }
}