import { ActivityType } from '../../../infrastructure/database/entities/ScheduleActivityTemplateEntity';

// ... resto de imports

export class CalculationSchedule {
  // ... propiedades existentes

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

  // ... resto de métodos existentes
}