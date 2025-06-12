// src/domain/models/calculation/CalculationSchedule.ts
import { ActivityType } from '../../../infrastructure/database/entities/ScheduleActivityTemplateEntity';

// Exportar todos los tipos necesarios
export enum ScheduleStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  DELAYED = 'delayed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ConstructionType {
  RESIDENTIAL_SINGLE = 'residential_single',
  RESIDENTIAL_MULTI = 'residential_multi',
  COMMERCIAL_SMALL = 'commercial_small',
  COMMERCIAL_LARGE = 'commercial_large',
  INDUSTRIAL = 'industrial',
  INFRASTRUCTURE = 'infrastructure',
  RENOVATION = 'renovation',
  SPECIALIZED = 'specialized'
}

export enum GeographicalZone {
  QUITO = 'quito',
  GUAYAQUIL = 'guayaquil',
  CUENCA = 'cuenca',
  COSTA = 'costa',
  SIERRA = 'sierra',
  ORIENTE = 'oriente',
  INSULAR = 'insular'
}

export class CalculationSchedule {
  id: string;
  name: string;
  description?: string;
  status: ScheduleStatus;
  constructionType: ConstructionType;
  geographicalZone: GeographicalZone;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  progressPercentage: number;
  totalPlannedDuration: number;
  totalActualDuration: number;
  climateFactors?: any;
  laborFactors?: any;
  resourceConstraints?: any;
  alertSettings?: any;
  totalScheduleCost: number;
  actualSpentCost: number;
  costVariancePercentage: number;
  baseTemplateId?: string;
  isOptimized: boolean;
  optimizationParameters?: any;
  criticalPath?: string[];
  customFields?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Propiedades relacionales
  projectId: string;
  calculationBudgetId?: string;

  /**
   * Fix para el error en línea 162: El tipo 'string' no se puede asignar al tipo 'ActivityType'
   * 
   * Antes:
   * activity.type = 'preparation';
   * 
   * Después:
   */
  private assignActivityType(activity: any, typeString: string): void {
    // Validar y convertir string a ActivityType enum
    const validActivityTypes = Object.values(ActivityType);
    
    if (validActivityTypes.includes(typeString as ActivityType)) {
      activity.type = typeString as ActivityType;
    } else {
      // Valor por defecto si el string no es válido
      activity.type = ActivityType.OTHER;
      console.warn(`Tipo de actividad inválido: ${typeString}. Usando 'OTHER' por defecto.`);
    }
  }

  /**
   * Método helper para convertir strings a ActivityType de forma segura
   */
  private parseActivityType(typeString: string): ActivityType {
    // Convertir a uppercase y reemplazar espacios con guiones bajos para matching
    const normalizedType = typeString.toUpperCase().replace(/\s+/g, '_');
    
    // Mapeo de strings comunes a ActivityType
    const typeMapping: { [key: string]: ActivityType } = {
      'PREPARACION': ActivityType.PREPARATION,
      'PREPARATION': ActivityType.PREPARATION,
      'EXCAVACION': ActivityType.EXCAVATION,
      'EXCAVATION': ActivityType.EXCAVATION,
      'FUNDACION': ActivityType.FOUNDATION,
      'FOUNDATION': ActivityType.FOUNDATION,
      'ESTRUCTURA': ActivityType.STRUCTURE,
      'STRUCTURE': ActivityType.STRUCTURE,
      'ALBANILERIA': ActivityType.MASONRY,
      'MASONRY': ActivityType.MASONRY,
      'TECHADO': ActivityType.ROOFING,
      'ROOFING': ActivityType.ROOFING,
      'ELECTRICO': ActivityType.ELECTRICAL,
      'ELECTRICAL': ActivityType.ELECTRICAL,
      'PLOMERIA': ActivityType.PLUMBING,
      'PLUMBING': ActivityType.PLUMBING,
      'ACABADOS': ActivityType.FINISHING,
      'FINISHING': ActivityType.FINISHING,
      'INSPECCION': ActivityType.INSPECTION,
      'INSPECTION': ActivityType.INSPECTION,
      'LIMPIEZA': ActivityType.CLEANUP,
      'CLEANUP': ActivityType.CLEANUP,
      'OTRO': ActivityType.OTHER,
      'OTHER': ActivityType.OTHER
    };

    return typeMapping[normalizedType] || ActivityType.OTHER;
  }

  /**
   * Ejemplo de uso correcto - reemplazar la línea 162 problemática
   */
  private processActivityData(activityData: any): void {
    // En lugar de asignar directamente el string:
    // activity.type = 'preparation'; // ❌ Error
    
    // Usar el método helper:
    const activityType = this.parseActivityType(activityData.typeString || 'other');
    activityData.type = activityType; // ✅ Correcto
    
    // O usar la función de asignación:
    this.assignActivityType(activityData, activityData.typeString || 'other');
  }

  /**
   * Método para validar ActivityType
   */
  private isValidActivityType(type: any): type is ActivityType {
    return Object.values(ActivityType).includes(type);
  }

  /**
   * Crear actividad con tipo validado
   */
  private createActivityWithType(name: string, typeString: string): any {
    return {
      name,
      type: this.parseActivityType(typeString),
      // ... otras propiedades
    };
  }

  // Métodos calculados
  public get scheduleVariance(): number {
    if (!this.totalPlannedDuration || this.totalPlannedDuration === 0) return 0;
    return ((this.totalActualDuration - this.totalPlannedDuration) / this.totalPlannedDuration) * 100;
  }

  public get isDelayed(): boolean {
    return this.scheduleVariance > 0;
  }

  public get estimatedCompletionDate(): Date | null {
    if (!this.actualStartDate || this.progressPercentage === 0) return null;
    
    const daysElapsed = this.actualStartDate ? 
      Math.floor((new Date().getTime() - this.actualStartDate.getTime()) / (1000 * 3600 * 24)) : 0;
    
    const estimatedTotalDays = (daysElapsed / this.progressPercentage) * 100;
    const remainingDays = estimatedTotalDays - daysElapsed;
    
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + remainingDays);
    
    return estimatedCompletion;
  }

  public get healthScore(): number {
    // Calcula un score de salud del cronograma basado en múltiples factores
    let score = 100;
    
    // Penalizar por retrasos
    if (this.scheduleVariance > 10) score -= 30;
    else if (this.scheduleVariance > 5) score -= 15;
    
    // Penalizar por varianza de costos
    if (Math.abs(this.costVariancePercentage) > 15) score -= 25;
    else if (Math.abs(this.costVariancePercentage) > 10) score -= 15;
    
    // Bonificar por progreso consistente
    if (this.progressPercentage > 0 && this.scheduleVariance < 5) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }
}

// Re-export de la entidad para compatibilidad
export { CalculationScheduleEntity } from '../../../infrastructure/database/entities/CalculationScheduleEntity';