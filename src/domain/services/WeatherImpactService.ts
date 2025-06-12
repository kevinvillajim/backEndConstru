// src/domain/services/WeatherImpactService.ts
import { ScheduleActivityEntity } from '../../infrastructure/database/entities/ScheduleActivityEntity';
import { WeatherFactorEntity } from '../../infrastructure/database/entities/WeatherFactorEntity';
import { CalculationScheduleEntity } from '../../infrastructure/database/entities/CalculationScheduleEntity';

export interface WeatherForecast {
  date: Date;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy';
  temperature: { min: number; max: number };
  humidity: number;
  rainfall: number; // mm
  windSpeed: number; // km/h
  uvIndex: number;
  workingSuitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
  productivityFactor: number; // 0.0 - 1.2
}

export interface WeatherImpactAnalysis {
  scheduleId: string;
  analysisDate: Date;
  forecastPeriod: { start: Date; end: Date };
  impactSummary: {
    totalDaysAnalyzed: number;
    unsuitableWorkingDays: number;
    productivityReduction: number; // percentage
    estimatedDelay: number; // days
    affectedActivities: string[];
  };
  dailyImpacts: {
    date: Date;
    weather: WeatherForecast;
    affectedActivities: {
      activityId: string;
      activityName: string;
      impactLevel: 'none' | 'minimal' | 'moderate' | 'severe' | 'critical';
      productivityReduction: number;
      recommendedAction: string;
    }[];
    overallImpact: 'low' | 'medium' | 'high';
  }[];
  recommendations: WeatherRecommendation[];
}

export interface WeatherRecommendation {
  type: 'reschedule' | 'protection' | 'indoor_focus' | 'equipment_protection' | 'weather_window';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  affectedActivities: string[];
  suggestedDate?: Date;
  estimatedCost: number;
  estimatedBenefit: number;
  implementationTime: number; // hours
}

export interface SeasonalPattern {
  zone: string;
  month: number;
  historicalAverages: {
    temperature: number;
    rainfall: number;
    humidity: number;
    windSpeed: number;
    suitableWorkingDays: number;
  };
  riskFactors: {
    factor: string;
    probability: number; // 0-1
    impact: 'low' | 'medium' | 'high';
    description: string;
  }[];
  bestWorkingPeriods: {
    startHour: number;
    endHour: number;
    conditions: string;
  }[];
}

export interface WeatherAlert {
  id: string;
  alertType: 'severe_weather' | 'productivity_risk' | 'safety_concern' | 'equipment_risk';
  severity: 'info' | 'warning' | 'alert' | 'emergency';
  title: string;
  description: string;
  validFrom: Date;
  validUntil: Date;
  affectedZones: string[];
  affectedActivities: string[];
  recommendedActions: string[];
  isActive: boolean;
}

export class WeatherImpactService {

  private readonly weatherSensitiveActivities = [
    'CONCRETE', 'PAINTING', 'ROOFING', 'EXCAVATION', 'FINISHING', 'MASONRY'
  ];

  private readonly ecuadorianZones = {
    QUITO: { altitude: 2850, climate: 'subtropical_highland' },
    GUAYAQUIL: { altitude: 4, climate: 'tropical_savanna' },
    CUENCA: { altitude: 2560, climate: 'subtropical_highland' },
    COSTA: { altitude: 50, climate: 'tropical' },
    SIERRA: { altitude: 2000, climate: 'highland' },
    ORIENTE: { altitude: 300, climate: 'tropical_rainforest' }
  };

  /**
   * Analiza el impacto del clima en el cronograma del proyecto
   */
  public async analyzeWeatherImpact(
    schedule: CalculationScheduleEntity,
    activities: ScheduleActivityEntity[],
    forecastDays: number = 14
  ): Promise<WeatherImpactAnalysis> {
    const analysisDate = new Date();
    const forecastPeriod = {
      start: analysisDate,
      end: new Date(analysisDate.getTime() + (forecastDays * 24 * 60 * 60 * 1000))
    };

    // Obtener pronóstico del clima
    const forecast = await this.getWeatherForecast(schedule.geographicalZone, forecastDays);
    
    // Analizar impacto por día
    const dailyImpacts = this.analyzeDailyImpacts(activities, forecast);
    
    // Calcular resumen de impacto
    const impactSummary = this.calculateImpactSummary(dailyImpacts, activities);
    
    // Generar recomendaciones
    const recommendations = this.generateWeatherRecommendations(dailyImpacts, activities);

    return {
      scheduleId: schedule.id,
      analysisDate,
      forecastPeriod,
      impactSummary,
      dailyImpacts,
      recommendations
    };
  }

  /**
   * Obtiene patrones estacionales históricos para una zona
   */
  public getSeasonalPatterns(zone: string): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = [];
    
    for (let month = 1; month <= 12; month++) {
      const pattern = this.calculateSeasonalPattern(zone, month);
      patterns.push(pattern);
    }
    
    return patterns;
  }

  /**
   * Ajusta automáticamente el cronograma basado en pronóstico del clima
   */
  public async adjustScheduleForWeather(
    schedule: CalculationScheduleEntity,
    activities: ScheduleActivityEntity[]
  ): Promise<{
    adjustedActivities: ScheduleActivityEntity[];
    adjustments: {
      activityId: string;
      originalDate: Date;
      newDate: Date;
      reason: string;
      impactDays: number;
    }[];
    totalDelayDays: number;
  }> {
    const weatherAnalysis = await this.analyzeWeatherImpact(schedule, activities);
    const adjustments: any[] = [];
    const adjustedActivities = [...activities];
    
    // Procesar recomendaciones de reprogramación
    const rescheduleRecommendations = weatherAnalysis.recommendations.filter(r => r.type === 'reschedule');
    
    for (const recommendation of rescheduleRecommendations) {
      const affectedActivities = adjustedActivities.filter(a => 
        recommendation.affectedActivities.includes(a.id)
      );
      
      for (const activity of affectedActivities) {
        if (recommendation.suggestedDate) {
          const adjustment = {
            activityId: activity.id,
            originalDate: activity.plannedStartDate,
            newDate: recommendation.suggestedDate,
            reason: recommendation.description,
            impactDays: this.calculateDateDifference(activity.plannedStartDate, recommendation.suggestedDate)
          };
          
          adjustments.push(adjustment);
          
          // Actualizar fechas de la actividad
          activity.plannedStartDate = recommendation.suggestedDate;
          activity.plannedEndDate = new Date(
            recommendation.suggestedDate.getTime() + 
            (activity.plannedDurationDays * 24 * 60 * 60 * 1000)
          );
        }
      }
    }
    
    const totalDelayDays = Math.max(...adjustments.map(a => a.impactDays), 0);
    
    return { adjustedActivities, adjustments, totalDelayDays };
  }

  /**
   * Genera alertas meteorológicas automáticas
   */
  public async generateWeatherAlerts(
    zone: string,
    activities: ScheduleActivityEntity[]
  ): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const forecast = await this.getWeatherForecast(zone, 7);
    
    // Alertas por clima severo
    const severeWeatherDays = forecast.filter(day => 
      day.condition === 'stormy' || day.rainfall > 15 || day.windSpeed > 40
    );
    
    if (severeWeatherDays.length > 0) {
      alerts.push(this.createSevereWeatherAlert(severeWeatherDays, activities));
    }
    
    // Alertas por riesgo de productividad
    const lowProductivityDays = forecast.filter(day => day.productivityFactor < 0.7);
    
    if (lowProductivityDays.length >= 3) {
      alerts.push(this.createProductivityRiskAlert(lowProductivityDays, activities));
    }
    
    // Alertas por seguridad
    const unsafeDays = forecast.filter(day => day.workingSuitability === 'unsuitable');
    
    if (unsafeDays.length > 0) {
      alerts.push(this.createSafetyAlert(unsafeDays, activities));
    }
    
    return alerts;
  }

  /**
   * Optimiza ventanas de trabajo basadas en condiciones climáticas
   */
  public optimizeWorkingWindows(
    activities: ScheduleActivityEntity[],
    forecast: WeatherForecast[]
  ): {
    optimizedWindows: {
      activityId: string;
      originalWindow: { start: Date; end: Date };
      optimizedWindow: { start: Date; end: Date };
      weatherReason: string;
      productivityGain: number;
    }[];
    overallProductivityImprovement: number;
  } {
    const optimizedWindows: any[] = [];
    
    const weatherSensitiveActivities = activities.filter(activity =>
      this.weatherSensitiveActivities.includes(activity.primaryTrade)
    );
    
    for (const activity of weatherSensitiveActivities) {
      const bestWindow = this.findBestWeatherWindow(activity, forecast);
      
      if (bestWindow.productivityGain > 0.1) { // Mejora mínima del 10%
        optimizedWindows.push({
          activityId: activity.id,
          originalWindow: {
            start: activity.plannedStartDate,
            end: activity.plannedEndDate
          },
          optimizedWindow: bestWindow.window,
          weatherReason: bestWindow.reason,
          productivityGain: bestWindow.productivityGain
        });
      }
    }
    
    const overallProductivityImprovement = optimizedWindows.length > 0
      ? optimizedWindows.reduce((sum, w) => sum + w.productivityGain, 0) / optimizedWindows.length
      : 0;
    
    return { optimizedWindows, overallProductivityImprovement };
  }

  /**
   * Integra datos meteorológicos en tiempo real
   */
  public async updateRealtimeWeatherData(
    scheduleId: string,
    zone: string
  ): Promise<{
    currentConditions: WeatherForecast;
    todayRecommendations: string[];
    urgentAlerts: WeatherAlert[];
  }> {
    // Obtener condiciones actuales
    const currentConditions = await this.getCurrentWeather(zone);
    
    // Generar recomendaciones para hoy
    const todayRecommendations = this.generateTodayRecommendations(currentConditions);
    
    // Verificar alertas urgentes
    const urgentAlerts = await this.checkUrgentAlerts(zone, currentConditions);
    
    return { currentConditions, todayRecommendations, urgentAlerts };
  }

  // Métodos privados de implementación

  private async getWeatherForecast(zone: string, days: number): Promise<WeatherForecast[]> {
    // Simulación de API meteorológica para Ecuador
    const forecast: WeatherForecast[] = [];
    const baseDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dailyForecast = this.generateSimulatedForecast(zone, date);
      forecast.push(dailyForecast);
    }
    
    return forecast;
  }

  private generateSimulatedForecast(zone: string, date: Date): WeatherForecast {
    const zoneInfo = this.ecuadorianZones[zone as keyof typeof this.ecuadorianZones] || this.ecuadorianZones.QUITO;
    const month = date.getMonth() + 1;
    
    // Patrones estacionales de Ecuador
    const isRainySeason = this.isRainySeason(zone, month);
    const baseTemp = this.getBaseTemperature(zone, month);
    
    const condition = this.determineCondition(isRainySeason, zone);
    const temperature = {
      min: baseTemp - 5 + Math.random() * 3,
      max: baseTemp + 5 + Math.random() * 3
    };
    const humidity = isRainySeason ? 70 + Math.random() * 25 : 40 + Math.random() * 30;
    const rainfall = isRainySeason ? Math.random() * 20 : Math.random() * 5;
    const windSpeed = 5 + Math.random() * 15;
    const uvIndex = zoneInfo.altitude > 2000 ? 8 + Math.random() * 4 : 6 + Math.random() * 3;
    
    const workingSuitability = this.calculateWorkingSuitability(
      condition, rainfall, windSpeed, temperature
    );
    const productivityFactor = this.calculateProductivityFactor(
      workingSuitability, temperature, humidity
    );
    
    return {
      date,
      condition,
      temperature,
      humidity,
      rainfall,
      windSpeed,
      uvIndex,
      workingSuitability,
      productivityFactor
    };
  }

  private analyzeDailyImpacts(
    activities: ScheduleActivityEntity[],
    forecast: WeatherForecast[]
  ): any[] {
    return forecast.map(dayForecast => {
      const affectedActivities = activities
        .filter(activity => this.isActivityAffectedByWeather(activity, dayForecast.date))
        .map(activity => ({
          activityId: activity.id,
          activityName: activity.name,
          impactLevel: this.calculateActivityImpactLevel(activity, dayForecast),
          productivityReduction: this.calculateProductivityReduction(activity, dayForecast),
          recommendedAction: this.getRecommendedAction(activity, dayForecast)
        }));
      
      const overallImpact = this.calculateOverallDayImpact(affectedActivities);
      
      return {
        date: dayForecast.date,
        weather: dayForecast,
        affectedActivities,
        overallImpact
      };
    });
  }

  private calculateImpactSummary(dailyImpacts: any[], activities: ScheduleActivityEntity[]): any {
    const totalDaysAnalyzed = dailyImpacts.length;
    const unsuitableWorkingDays = dailyImpacts.filter(day => 
      day.weather.workingSuitability === 'unsuitable'
    ).length;
    
    const avgProductivityReduction = dailyImpacts.reduce((sum, day) => {
      const dayReduction = day.affectedActivities.reduce((daySum: number, activity: any) => 
        daySum + activity.productivityReduction, 0
      );
      return sum + (dayReduction / Math.max(day.affectedActivities.length, 1));
    }, 0) / totalDaysAnalyzed;
    
    const estimatedDelay = Math.ceil(unsuitableWorkingDays + (avgProductivityReduction * 0.1 * totalDaysAnalyzed));
    
    const affectedActivityIds = new Set<string>();
    dailyImpacts.forEach(day => {
      day.affectedActivities.forEach((activity: any) => {
        affectedActivityIds.add(activity.activityId);
      });
    });
    
    return {
      totalDaysAnalyzed,
      unsuitableWorkingDays,
      productivityReduction: avgProductivityReduction,
      estimatedDelay,
      affectedActivities: Array.from(affectedActivityIds)
    };
  }

  private generateWeatherRecommendations(
    dailyImpacts: any[],
    activities: ScheduleActivityEntity[]
  ): WeatherRecommendation[] {
    const recommendations: WeatherRecommendation[] = [];
    
    // Recomendaciones de reprogramación
    const highImpactDays = dailyImpacts.filter(day => day.overallImpact === 'high');
    if (highImpactDays.length > 0) {
      recommendations.push(this.createRescheduleRecommendation(highImpactDays, activities));
    }
    
    // Recomendaciones de protección
    const rainDays = dailyImpacts.filter(day => day.weather.rainfall > 10);
    if (rainDays.length > 0) {
      recommendations.push(this.createProtectionRecommendation(rainDays, activities));
    }
    
    // Recomendaciones de enfoque en interiores
    const unsuitableDays = dailyImpacts.filter(day => 
      day.weather.workingSuitability === 'unsuitable' || day.weather.workingSuitability === 'poor'
    );
    if (unsuitableDays.length > 0) {
      recommendations.push(this.createIndoorFocusRecommendation(unsuitableDays, activities));
    }
    
    return recommendations.sort((a, b) => this.getRecommendationPriority(b) - this.getRecommendationPriority(a));
  }

  private calculateSeasonalPattern(zone: string, month: number): SeasonalPattern {
    const zoneInfo = this.ecuadorianZones[zone as keyof typeof this.ecuadorianZones] || this.ecuadorianZones.QUITO;
    const isRainy = this.isRainySeason(zone, month);
    
    const historicalAverages = {
      temperature: this.getBaseTemperature(zone, month),
      rainfall: isRainy ? 150 : 30,
      humidity: isRainy ? 75 : 55,
      windSpeed: 8,
      suitableWorkingDays: isRainy ? 18 : 26
    };
    
    const riskFactors = this.calculateSeasonalRiskFactors(zone, month, isRainy);
    const bestWorkingPeriods = this.getBestWorkingPeriods(zone, month);
    
    return {
      zone,
      month,
      historicalAverages,
      riskFactors,
      bestWorkingPeriods
    };
  }

  private findBestWeatherWindow(
    activity: ScheduleActivityEntity,
    forecast: WeatherForecast[]
  ): { window: { start: Date; end: Date }; reason: string; productivityGain: number } {
    const activityDuration = activity.plannedDurationDays;
    let bestWindow = { start: activity.plannedStartDate, end: activity.plannedEndDate };
    let bestScore = 0;
    let bestReason = '';
    
    // Evaluar diferentes ventanas de tiempo
    for (let startOffset = 0; startOffset <= forecast.length - activityDuration; startOffset++) {
      const windowForecast = forecast.slice(startOffset, startOffset + activityDuration);
      const windowScore = this.calculateWindowScore(windowForecast);
      
      if (windowScore > bestScore) {
        bestScore = windowScore;
        bestWindow = {
          start: windowForecast[0].date,
          end: windowForecast[windowForecast.length - 1].date
        };
        bestReason = this.generateWindowReason(windowForecast);
      }
    }
    
    const originalScore = this.calculateOriginalWindowScore(activity, forecast);
    const productivityGain = Math.max(0, bestScore - originalScore);
    
    return { window: bestWindow, reason: bestReason, productivityGain };
  }

  private async getCurrentWeather(zone: string): Promise<WeatherForecast> {
    // Simulación de datos en tiempo real
    return this.generateSimulatedForecast(zone, new Date());
  }

  private generateTodayRecommendations(weather: WeatherForecast): string[] {
    const recommendations: string[] = [];
    
    if (weather.workingSuitability === 'poor' || weather.workingSuitability === 'unsuitable') {
      recommendations.push('Considerar posponer trabajos exteriores para mañana');
    }
    
    if (weather.rainfall > 5) {
      recommendations.push('Proteger materiales y equipos sensibles a la humedad');
    }
    
    if (weather.windSpeed > 25) {
      recommendations.push('Evitar trabajos en altura por vientos fuertes');
    }
    
    if (weather.uvIndex > 9) {
      recommendations.push('Implementar medidas de protección solar para trabajadores');
    }
    
    return recommendations;
  }

  private async checkUrgentAlerts(zone: string, current: WeatherForecast): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    
    if (current.workingSuitability === 'unsuitable') {
      alerts.push({
        id: `urgent_weather_${Date.now()}`,
        alertType: 'safety_concern',
        severity: 'alert',
        title: 'Condiciones Climáticas Peligrosas',
        description: 'Las condiciones actuales no son seguras para trabajos de construcción',
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 horas
        affectedZones: [zone],
        affectedActivities: [],
        recommendedActions: ['Suspender actividades exteriores', 'Proteger equipos', 'Revisar condiciones en 2 horas'],
        isActive: true
      });
    }
    
    return alerts;
  }

  // Métodos helper

  private isRainySeason(zone: string, month: number): boolean {
    // Patrones de lluvia en Ecuador por zona
    const rainySeasons: { [key: string]: number[] } = {
      QUITO: [10, 11, 12, 1, 2, 3, 4, 5], // Oct-May
      GUAYAQUIL: [12, 1, 2, 3, 4], // Dec-Apr
      CUENCA: [10, 11, 12, 1, 2, 3, 4, 5], // Oct-May
      COSTA: [12, 1, 2, 3, 4], // Dec-Apr
      SIERRA: [10, 11, 12, 1, 2, 3, 4, 5], // Oct-May
      ORIENTE: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // Todo el año
    };
    
    return rainySeasons[zone]?.includes(month) || false;
  }

  private getBaseTemperature(zone: string, month: number): number {
    const temperatures: { [key: string]: number[] } = {
      QUITO: [15, 15, 15, 15, 15, 15, 15, 16, 16, 15, 15, 15],
      GUAYAQUIL: [26, 27, 27, 26, 25, 24, 24, 24, 25, 25, 26, 26],
      CUENCA: [16, 16, 16, 16, 16, 15, 15, 16, 16, 16, 16, 16]
    };
    
    return temperatures[zone]?.[month - 1] || 20;
  }

  private determineCondition(isRainySeason: boolean, zone: string): WeatherForecast['condition'] {
    if (isRainySeason) {
      const rand = Math.random();
      if (rand < 0.4) return 'rainy';
      if (rand < 0.7) return 'cloudy';
      return 'sunny';
    } else {
      const rand = Math.random();
      if (rand < 0.6) return 'sunny';
      if (rand < 0.8) return 'cloudy';
      return 'rainy';
    }
  }

  private calculateWorkingSuitability(
    condition: WeatherForecast['condition'],
    rainfall: number,
    windSpeed: number,
    temperature: { min: number; max: number }
  ): WeatherForecast['workingSuitability'] {
    if (condition === 'stormy' || rainfall > 15 || windSpeed > 40) return 'unsuitable';
    if (rainfall > 8 || windSpeed > 25 || temperature.max > 35 || temperature.min < 5) return 'poor';
    if (rainfall > 3 || windSpeed > 15 || temperature.max > 30) return 'fair';
    if (condition === 'sunny' && rainfall < 1) return 'excellent';
    return 'good';
  }

  private calculateProductivityFactor(
    suitability: WeatherForecast['workingSuitability'],
    temperature: { min: number; max: number },
    humidity: number
  ): number {
    let factor = 1.0;
    
    switch (suitability) {
      case 'unsuitable': factor = 0.0; break;
      case 'poor': factor = 0.4; break;
      case 'fair': factor = 0.7; break;
      case 'good': factor = 0.9; break;
      case 'excellent': factor = 1.1; break;
    }
    
    // Ajustes por temperatura y humedad
    if (temperature.max > 30) factor *= 0.9;
    if (temperature.max > 35) factor *= 0.8;
    if (humidity > 80) factor *= 0.95;
    
    return Math.max(0, Math.min(1.2, factor));
  }

  private isActivityAffectedByWeather(activity: ScheduleActivityEntity, date: Date): boolean {
    return date >= activity.plannedStartDate && 
           date <= activity.plannedEndDate &&
           this.weatherSensitiveActivities.includes(activity.primaryTrade);
  }

  private calculateActivityImpactLevel(
    activity: ScheduleActivityEntity,
    weather: WeatherForecast
  ): 'none' | 'minimal' | 'moderate' | 'severe' | 'critical' {
    if (!this.weatherSensitiveActivities.includes(activity.primaryTrade)) return 'none';
    
    const productivityReduction = 1 - weather.productivityFactor;
    
    if (productivityReduction >= 0.8) return 'critical';
    if (productivityReduction >= 0.5) return 'severe';
    if (productivityReduction >= 0.3) return 'moderate';
    if (productivityReduction >= 0.1) return 'minimal';
    return 'none';
  }

  private calculateProductivityReduction(activity: ScheduleActivityEntity, weather: WeatherForecast): number {
    if (!this.weatherSensitiveActivities.includes(activity.primaryTrade)) return 0;
    return Math.max(0, 1 - weather.productivityFactor);
  }

  private getRecommendedAction(activity: ScheduleActivityEntity, weather: WeatherForecast): string {
    const impactLevel = this.calculateActivityImpactLevel(activity, weather);
    
    switch (impactLevel) {
      case 'critical':
      case 'severe':
        return 'Suspender actividad y reprogramar';
      case 'moderate':
        return 'Reducir actividad o aplicar medidas de protección';
      case 'minimal':
        return 'Monitorear condiciones y tomar precauciones';
      default:
        return 'Continuar normalmente';
    }
  }

  private calculateOverallDayImpact(affectedActivities: any[]): 'low' | 'medium' | 'high' {
    if (affectedActivities.length === 0) return 'low';
    
    const severityScore = affectedActivities.reduce((sum, activity) => {
      const scores = { none: 0, minimal: 1, moderate: 2, severe: 3, critical: 4 };
      return sum + scores[activity.impactLevel as keyof typeof scores];
    }, 0);
    
    const avgSeverity = severityScore / affectedActivities.length;
    
    if (avgSeverity >= 3) return 'high';
    if (avgSeverity >= 1.5) return 'medium';
    return 'low';
  }

  // Métodos adicionales simplificados
  private createRescheduleRecommendation(highImpactDays: any[], activities: ScheduleActivityEntity[]): WeatherRecommendation {
    return {
      type: 'reschedule',
      priority: 'high',
      description: 'Reprogramar actividades para evitar días de alto impacto climático',
      affectedActivities: activities.map(a => a.id),
      estimatedCost: 5000,
      estimatedBenefit: 15000,
      implementationTime: 4
    };
  }

  private createProtectionRecommendation(rainDays: any[], activities: ScheduleActivityEntity[]): WeatherRecommendation {
    return {
      type: 'protection',
      priority: 'medium',
      description: 'Implementar medidas de protección contra la lluvia',
      affectedActivities: activities.map(a => a.id),
      estimatedCost: 2000,
      estimatedBenefit: 8000,
      implementationTime: 2
    };
  }

  private createIndoorFocusRecommendation(unsuitableDays: any[], activities: ScheduleActivityEntity[]): WeatherRecommendation {
    return {
      type: 'indoor_focus',
      priority: 'medium',
      description: 'Enfocar en actividades interiores durante condiciones adversas',
      affectedActivities: activities.filter(a => a.location?.indoorWork !== false).map(a => a.id),
      estimatedCost: 0,
      estimatedBenefit: 5000,
      implementationTime: 1
    };
  }

  private createSevereWeatherAlert(severeWeatherDays: WeatherForecast[], activities: ScheduleActivityEntity[]): WeatherAlert {
    return {
      id: `severe_weather_${Date.now()}`,
      alertType: 'severe_weather',
      severity: 'alert',
      title: 'Alerta de Clima Severo',
      description: `Condiciones climáticas severas esperadas por ${severeWeatherDays.length} días`,
      validFrom: severeWeatherDays[0].date,
      validUntil: severeWeatherDays[severeWeatherDays.length - 1].date,
      affectedZones: ['project_zone'],
      affectedActivities: activities.map(a => a.id),
      recommendedActions: ['Revisar cronograma', 'Preparar protecciones', 'Considerar reprogramación'],
      isActive: true
    };
  }

  private createProductivityRiskAlert(lowProductivityDays: WeatherForecast[], activities: ScheduleActivityEntity[]): WeatherAlert {
    return {
      id: `productivity_risk_${Date.now()}`,
      alertType: 'productivity_risk',
      severity: 'warning',
      title: 'Riesgo de Baja Productividad',
      description: `${lowProductivityDays.length} días consecutivos con baja productividad esperada`,
      validFrom: lowProductivityDays[0].date,
      validUntil: lowProductivityDays[lowProductivityDays.length - 1].date,
      affectedZones: ['project_zone'],
      affectedActivities: activities.map(a => a.id),
      recommendedActions: ['Optimizar recursos', 'Considerar ajustes de cronograma'],
      isActive: true
    };
  }

  private createSafetyAlert(unsafeDays: WeatherForecast[], activities: ScheduleActivityEntity[]): WeatherAlert {
    return {
      id: `safety_alert_${Date.now()}`,
      alertType: 'safety_concern',
      severity: 'emergency',
      title: 'Alerta de Seguridad por Clima',
      description: 'Condiciones climáticas peligrosas para actividades de construcción',
      validFrom: unsafeDays[0].date,
      validUntil: unsafeDays[unsafeDays.length - 1].date,
      affectedZones: ['project_zone'],
      affectedActivities: activities.map(a => a.id),
      recommendedActions: ['Suspender actividades exteriores', 'Revisar protocolos de seguridad'],
      isActive: true
    };
  }

  private getRecommendationPriority(recommendation: WeatherRecommendation): number {
    const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorities[recommendation.priority];
  }

  private calculateDateDifference(date1: Date, date2: Date): number {
    return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
  }

  private calculateSeasonalRiskFactors(zone: string, month: number, isRainy: boolean): any[] {
    const risks = [];
    
    if (isRainy) {
      risks.push({
        factor: 'Lluvias intensas',
        probability: 0.7,
        impact: 'high',
        description: 'Riesgo de suspensión de actividades exteriores'
      });
    }
    
    if (zone === 'COSTA' && [12, 1, 2, 3].includes(month)) {
      risks.push({
        factor: 'Temporada de huracanes',
        probability: 0.3,
        impact: 'high',
        description: 'Posibles vientos fuertes y lluvias torrenciales'
      });
    }
    
    return risks;
  }

  private getBestWorkingPeriods(zone: string, month: number): any[] {
    // Horarios típicos de mejor clima en Ecuador
    return [
      { startHour: 7, endHour: 11, conditions: 'Mañana fresca, ideal para trabajo físico' },
      { startHour: 14, endHour: 17, conditions: 'Tarde con menor intensidad solar' }
    ];
  }

  private calculateWindowScore(forecast: WeatherForecast[]): number {
    return forecast.reduce((sum, day) => sum + day.productivityFactor, 0) / forecast.length;
  }

  private calculateOriginalWindowScore(activity: ScheduleActivityEntity, forecast: WeatherForecast[]): number {
    const relevantForecast = forecast.filter(day => 
      day.date >= activity.plannedStartDate && day.date <= activity.plannedEndDate
    );
    
    return relevantForecast.length > 0 
      ? this.calculateWindowScore(relevantForecast)
      : 0.8; // Score por defecto
  }

  private generateWindowReason(forecast: WeatherForecast[]): string {
    const avgProductivity = this.calculateWindowScore(forecast);
    const rainyDays = forecast.filter(day => day.rainfall > 5).length;
    
    if (avgProductivity > 1.0) {
      return 'Condiciones climáticas óptimas con alta productividad esperada';
    } else if (rainyDays === 0) {
      return 'Período seco favorable para actividades exteriores';
    } else {
      return 'Ventana con menor impacto climático';
    }
  }
}