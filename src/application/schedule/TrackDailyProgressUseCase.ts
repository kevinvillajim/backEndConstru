// src/application/schedule/TrackDailyProgressUseCase.ts
import { ScheduleActivityRepository } from '../../domain/repositories/ScheduleActivityRepository';
import { ProgressTrackingRepository } from '../../domain/repositories/ProgressTrackingRepository';
import { NotificationService } from '../../domain/services/NotificationService';
import { ActivityProgressEntity, ProgressReportStatus, QualityLevel, WeatherCondition } from '../../infrastructure/database/entities/ActivityProgressEntity';

export interface DailyProgressRequest {
  scheduleId: string;
  activityId: string;
  reportDate: Date;
  progressPercentage: number;
  workCompleted: {
    quantity: number;
    unit: string;
    description?: string;
  };
  actualWorkersOnSite: number;
  actualHoursWorked: number;
  weatherConditions?: {
    condition: string;
    temperature: number;
    precipitation: number;
    workability: 'excellent' | 'good' | 'fair' | 'poor';
  };
  qualityIssues?: {
    issue: string;
    severity: 'low' | 'medium' | 'high';
    correctionRequired: boolean;
  }[];
  safetyIncidents?: {
    type: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
  }[];
  materialIssues?: {
    material: string;
    issue: 'shortage' | 'quality' | 'delivery_delay';
    impact: string;
  }[];
  photos?: string[]; // URLs de fotos de progreso
  notes?: string;
  reportedBy: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export interface DailyProgressResponse {
  progressTracking: any;
  activityUpdate: any;
  scheduleImpact: {
    scheduleVariance: number;
    costVariance: number;
    projectedCompletion: Date;
    alertsGenerated: string[];
  };
  recommendations: string[];
  nextActions: string[];
}

export class TrackDailyProgressUseCase {
  constructor(
    private activityRepository: ScheduleActivityRepository,
    private progressRepository: ProgressTrackingRepository,
    private notificationService: NotificationService
  ) {}

  async execute(request: DailyProgressRequest): Promise<DailyProgressResponse> {
    // 1. Validar actividad existe
    const activity = await this.activityRepository.findById(request.activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    // 2. Crear registro de progreso
    const progressTracking = await this.createProgressRecord(request, activity);

    // 3. Actualizar actividad
    const updatedActivity = await this.updateActivityProgress(activity, request);

    // 4. Calcular impacto en cronograma
    const scheduleImpact = await this.calculateScheduleImpact(updatedActivity, request);

    // 5. Generar alertas automáticas
    const alerts = await this.generateAlerts(updatedActivity, progressTracking, scheduleImpact);

    // 6. Crear recomendaciones
    const recommendations = this.generateRecommendations(updatedActivity, progressTracking, request);

    // 7. Definir próximas acciones
    const nextActions = this.defineNextActions(updatedActivity, progressTracking, request);

    // 8. Enviar notificaciones si es necesario
    if (alerts.length > 0) {
      await this.sendNotifications(alerts, request);
    }

    return {
      progressTracking,
      activityUpdate: updatedActivity,
      scheduleImpact,
      recommendations,
      nextActions
    };
  }

  private async createProgressRecord(request: DailyProgressRequest, activity: any): Promise<ActivityProgressEntity> {
    // Crear una instancia de ActivityProgressEntity con todas las propiedades requeridas
    const progressRecord = new ActivityProgressEntity();
    
    // Propiedades básicas requeridas
    progressRecord.activityId = request.activityId;
    progressRecord.reportDate = request.reportDate;
    progressRecord.reportedBy = request.reportedBy;
    progressRecord.progressPercentage = request.progressPercentage;
    
    // Trabajo completado con estructura correcta
    progressRecord.workCompleted = {
      quantity: request.workCompleted.quantity,
      unit: request.workCompleted.unit,
      description: request.workCompleted.description,
      qualityLevel: 'SATISFACTORY' as any // Usar enum correcto
    };
    
    // Recursos utilizados
    progressRecord.actualWorkersOnSite = request.actualWorkersOnSite;
    progressRecord.actualHoursWorked = request.actualHoursWorked;
    progressRecord.plannedHoursForDay = 8; // Valor por defecto
    
    // Métricas calculadas
    progressRecord.productivityRate = this.calculateProductivityRate(request, activity);
    progressRecord.efficiencyPercentage = this.calculateEfficiency(request, activity);
    
    // Condiciones ambientales (estructura completa requerida por la entidad)
    if (request.weatherConditions) {
      progressRecord.weatherConditions = {
        workability: request.weatherConditions.workability as any,
        temperature: request.weatherConditions.temperature,
        humidity: 50, // Valor por defecto si no se proporciona
        precipitation: request.weatherConditions.precipitation,
        windSpeed: 0, // Valor por defecto
        visibility: 'good', // Valor por defecto
        description: `${request.weatherConditions.condition} weather conditions`
      };
    }
    
    // Problemas de calidad (mapear correctamente)
    progressRecord.qualityIssues = request.qualityIssues?.map((issue, index) => ({
      id: `quality_${Date.now()}_${index}`,
      description: issue.issue,
      severity: issue.severity,
      status: 'open' as const,
      reportedBy: request.reportedBy,
      correctionAction: issue.correctionRequired ? 'Required' : 'Not required'
    })) || [];
    
    // Incidentes de seguridad (mapear correctamente)
    progressRecord.safetyIncidents = request.safetyIncidents?.map((incident, index) => ({
      id: `safety_${Date.now()}_${index}`,
      type: incident.type,
      description: incident.description,
      severity: incident.severity,
      correctionAction: 'To be determined',
      preventiveMeasures: 'To be defined'
    })) || [];
    
    // Obstáculos (mapear desde materialIssues)
    progressRecord.obstacles = request.materialIssues?.map(issue => ({
      type: issue.issue === 'delivery_delay' ? 'material_delay' as const : 'other' as const,
      description: `${issue.material}: ${issue.impact}`,
      impact: 'medium' as const,
      estimatedDelayHours: 0,
      preventable: true
    })) || [];
    
    // Uso de materiales
    progressRecord.materialUsage = request.materialIssues?.map(issue => ({
      materialId: `material_${issue.material}`,
      materialName: issue.material,
      quantityUsed: 0,
      quantityWasted: 0,
      unit: 'unit',
      wasteReason: issue.issue === 'quality' ? 'Quality issues' : undefined
    })) || [];
    
    // Uso de equipos (array vacío por defecto)
    progressRecord.equipmentUsage = [];
    
    // Costos del día (calculados)
    progressRecord.dailyLaborCost = request.actualWorkersOnSite * request.actualHoursWorked * 25;
    progressRecord.dailyMaterialCost = 0; // Se calculará después
    progressRecord.dailyEquipmentCost = 0;
    progressRecord.dailyTotalCost = progressRecord.dailyLaborCost;
    
    // Ubicación
    progressRecord.location = request.location ? {
      latitude: request.location.latitude,
      longitude: request.location.longitude,
      altitude: 0,
      accuracy: request.location.accuracy,
      area: 'construction_site',
      zone: 'main'
    } : undefined;
    
    // Fotos (mapear correctamente)
    progressRecord.photos = request.photos?.map(url => ({
      url,
      description: 'Progress photo',
      type: 'progress' as const,
      timestamp: new Date()
    })) || [];
    
    // Puntuaciones
    progressRecord.qualityScore = this.calculateQualityScore(request);
    progressRecord.safetyScore = this.calculateSafetyScore(request);
    progressRecord.productivityScore = 8.0; // Valor calculado
    progressRecord.overallScore = 0; // Se calculará automáticamente
    
    // Comentarios
    progressRecord.generalComments = request.notes || '';
    progressRecord.nextDayPlanning = '';
    progressRecord.supervisorNotes = '';
    
    // Estado del reporte
    progressRecord.status = 'submitted' as any;
    progressRecord.isActive = true;
    
    // Las fechas se asignan automáticamente por las decoraciones de TypeORM
    
    return await this.progressRepository.save(progressRecord);
  }
  

  private async updateActivityProgress(activity: any, request: DailyProgressRequest): Promise<any> {
    // Actualizar progreso de la actividad
    activity.progressPercentage = request.progressPercentage;
    activity.workQuantities.completedQuantity = request.workCompleted.quantity;

    // Actualizar fechas reales si es la primera vez que se reporta progreso
    if (!activity.actualStartDate && request.progressPercentage > 0) {
      activity.actualStartDate = request.reportDate;
    }

    // Si la actividad está completada
    if (request.progressPercentage >= 100) {
      activity.actualEndDate = request.reportDate;
      activity.status = 'COMPLETED';
      activity.actualDurationDays = this.calculateActualDuration(activity.actualStartDate, request.reportDate);
    }

    // Calcular costo real acumulado
    activity.actualTotalCost = this.calculateActualCost(activity, request);

    // Actualizar campos de performance
    activity.earnedValue = (activity.plannedTotalCost * request.progressPercentage) / 100;
    activity.updatedAt = new Date();

    return await this.activityRepository.save(activity);
  }

  private calculateEfficiency(request: DailyProgressRequest, activity: any): number {
    const plannedHours = 8; // Horas estándar por día
    const actualHours = request.actualHoursWorked;
    const progressMade = request.progressPercentage;
    
    if (actualHours === 0) return 0;
    
    // Eficiencia = (progreso logrado / horas trabajadas) * factor de normalización
    const baseEfficiency = (progressMade / actualHours) * plannedHours;
    return Math.min(100, Math.max(0, baseEfficiency));
  }

  // MÉTODO AGREGADO - calculateWeatherImpact
  private calculateWeatherImpact(weatherConditions?: DailyProgressRequest['weatherConditions']): number {
    if (!weatherConditions) return 0;
    
    switch (weatherConditions.workability) {
      case 'poor': return -20;
      case 'fair': return -10;
      case 'good': return 0;
      case 'excellent': return 5;
      default: return 0;
    }
  }

  private async calculateScheduleImpact(activity: any, request: DailyProgressRequest): Promise<any> {
    // Calcular varianza de cronograma
    const plannedProgress = this.getPlannedProgressForDate(activity, request.reportDate);
    const scheduleVariance = request.progressPercentage - plannedProgress;

    // Calcular varianza de costo
    const plannedCost = (activity.plannedTotalCost * plannedProgress) / 100;
    const actualCost = activity.actualTotalCost;
    const costVariance = ((activity.earnedValue - actualCost) / activity.earnedValue) * 100;

    // Proyectar fecha de completación
    const projectedCompletion = this.projectCompletionDate(activity, request);

    // Generar alertas
    const alertsGenerated = [];
    if (Math.abs(scheduleVariance) > 10) {
      alertsGenerated.push(`Varianza de cronograma significativa: ${scheduleVariance.toFixed(1)}%`);
    }
    if (Math.abs(costVariance) > 15) {
      alertsGenerated.push(`Varianza de costo significativa: ${costVariance.toFixed(1)}%`);
    }

    return {
      scheduleVariance,
      costVariance,
      projectedCompletion,
      alertsGenerated
    };
  }

  private calculateProductivityRate(request: DailyProgressRequest, activity: any): number {
    // Productividad = trabajo completado / (trabajadores × horas)
    const totalPersonHours = request.actualWorkersOnSite * request.actualHoursWorked;
    return totalPersonHours > 0 ? request.workCompleted.quantity / totalPersonHours : 0;
  }

  private calculateCostToDate(request: DailyProgressRequest, activity: any): number {
    // Costo real = (trabajadores × horas × tarifa) + materiales utilizados
    const laborCost = request.actualWorkersOnSite * request.actualHoursWorked * 
                     (activity.resourceRequirements?.workforce?.[0]?.hourlyRate || 10);
    const materialCost = (activity.plannedTotalCost * 0.6) * (request.progressPercentage / 100); // Estimación
    
    return laborCost + materialCost;
  }

  private calculateScheduleVariance(request: DailyProgressRequest, activity: any): number {
    const plannedProgress = this.getPlannedProgressForDate(activity, request.reportDate);
    return request.progressPercentage - plannedProgress;
  }

  private getPlannedProgressForDate(activity: any, date: Date): number {
    if (!activity.plannedStartDate || !activity.plannedEndDate) return 0;
    
    const totalDuration = activity.plannedEndDate.getTime() - activity.plannedStartDate.getTime();
    const elapsed = date.getTime() - activity.plannedStartDate.getTime();
    
    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;
    
    return (elapsed / totalDuration) * 100;
  }

  private calculateQualityScore(request: DailyProgressRequest): number {
    if (!request.qualityIssues || request.qualityIssues.length === 0) return 100;
    
    let penalty = 0;
    for (const issue of request.qualityIssues) {
      switch (issue.severity) {
        case 'high':
          penalty += 30;
          break;
        case 'medium':
          penalty += 15;
          break;
        case 'low':
          penalty += 5;
          break;
      }
    }
    
    return Math.max(0, 100 - penalty);
  }

  private calculateSafetyScore(request: DailyProgressRequest): number {
    if (!request.safetyIncidents || request.safetyIncidents.length === 0) return 100;
    
    let penalty = 0;
    for (const incident of request.safetyIncidents) {
      switch (incident.severity) {
        case 'critical':
          penalty += 50;
          break;
        case 'major':
          penalty += 25;
          break;
        case 'minor':
          penalty += 10;
          break;
      }
    }
    
    return Math.max(0, 100 - penalty);
  }

  private calculateActualDuration(startDate: Date, endDate: Date): number {
    return (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
  }

  private calculateActualCost(activity: any, request: DailyProgressRequest): number {
    // Acumular costos históricos de reportes de progreso
    return this.calculateCostToDate(request, activity);
  }

  private projectCompletionDate(activity: any, request: DailyProgressRequest): Date {
    if (request.progressPercentage >= 100) {
      return request.reportDate;
    }
    
    if (request.progressPercentage === 0) {
      return activity.plannedEndDate;
    }
    
    // Proyección basada en tasa de progreso actual
    const daysElapsed = this.calculateActualDuration(activity.actualStartDate || activity.plannedStartDate, request.reportDate);
    const progressRate = request.progressPercentage / daysElapsed;
    const remainingDays = (100 - request.progressPercentage) / progressRate;
    
    const projectedDate = new Date(request.reportDate);
    projectedDate.setDate(projectedDate.getDate() + Math.ceil(remainingDays));
    
    return projectedDate;
  }

  private async generateAlerts(activity: any, progressTracking: any, scheduleImpact: any): Promise<string[]> {
    const alerts: string[] = [];
    
    // Alertas de cronograma
    if (scheduleImpact.scheduleVariance < -15) {
      alerts.push(`ALERTA: Actividad "${activity.name}" tiene retraso significativo (${Math.abs(scheduleImpact.scheduleVariance).toFixed(1)}%)`);
    }
    
    // Alertas de calidad
    if (progressTracking.qualityScore < 80) {
      alerts.push(`ALERTA: Problemas de calidad detectados en "${activity.name}" (Score: ${progressTracking.qualityScore})`);
    }
    
    // Alertas de seguridad
    if (progressTracking.safetyScore < 90) {
      alerts.push(`ALERTA: Incidentes de seguridad reportados en "${activity.name}" (Score: ${progressTracking.safetyScore})`);
    }
    
    // Alertas de productividad
    if (progressTracking.productivityRate < 0.5) {
      alerts.push(`ALERTA: Baja productividad detectada en "${activity.name}" (${progressTracking.productivityRate.toFixed(2)} unidades/hora-persona)`);
    }
    
    return alerts;
  }

  private generateRecommendations(activity: any, progressTracking: any, request: DailyProgressRequest): string[] {
    const recommendations: string[] = [];
    
    // Recomendaciones de cronograma
    if (progressTracking.scheduleVariance < -10) {
      recommendations.push('Considere agregar recursos adicionales o extender horario de trabajo para recuperar el cronograma');
      recommendations.push('Revise las dependencias de actividades posteriores que podrían verse afectadas');
    }
    
    // Recomendaciones de calidad
    if (progressTracking.qualityScore < 85) {
      recommendations.push('Implemente controles de calidad adicionales antes de continuar');
      recommendations.push('Considere capacitación adicional para el equipo de trabajo');
    }
    
    // Recomendaciones de clima
    if (request.weatherConditions && request.weatherConditions.workability === 'poor') {
      recommendations.push('Evalúe suspender actividades exteriores hasta mejorar las condiciones climáticas');
      recommendations.push('Implemente medidas de protección adicionales contra el clima');
    }
    
    // Recomendaciones de materiales
    if (request.materialIssues && request.materialIssues.length > 0) {
      recommendations.push('Coordine urgentemente con proveedores para resolver problemas de materiales');
      recommendations.push('Considere activar proveedores alternativos para evitar retrasos');
    }
    
    return recommendations;
  }

  private defineNextActions(activity: any, progressTracking: any, request: DailyProgressRequest): string[] {
    const nextActions: string[] = [];
    
    // Acciones de seguimiento estándar
    nextActions.push('Continuar monitoreo diario del progreso');
    nextActions.push('Actualizar proyecciones de cronograma y presupuesto');
    
    // Acciones específicas por problemas
    if (progressTracking.qualityScore < 85) {
      nextActions.push('Programar inspección de calidad adicional');
    }
    
    if (progressTracking.scheduleVariance < -10) {
      nextActions.push('Revisar asignación de recursos para recuperar cronograma');
    }
    
    if (request.materialIssues && request.materialIssues.length > 0) {
      nextActions.push('Seguimiento urgente con área de suministros');
    }
    
    // Próxima actividad si esta está cerca de completarse
    if (request.progressPercentage > 80) {
      nextActions.push('Preparar recursos para actividades sucesoras');
      nextActions.push('Coordinar inspecciones finales requeridas');
    }
    
    return nextActions;
  }

  private async sendNotifications(alerts: string[], request: DailyProgressRequest): Promise<void> {
    for (const alert of alerts) {
      await this.notificationService.createNotification({
        userId: request.reportedBy,
        type: 'ALERT',
        title: 'Alerta de Progreso de Obra',
        message: alert,
        priority: 'HIGH',
        relatedEntityType: 'SCHEDULE_ACTIVITY',
        relatedEntityId: request.activityId,
        // CORREGIDO: Removido actionRequired, agregado a metadata
        metadata: {
          alertType: 'PROGRESS_ALERT',
          scheduleId: request.scheduleId,
          activityId: request.activityId,
          progressPercentage: request.progressPercentage,
          requiresAction: true // Movido a metadata
        }
      });
    }
  }
}