// src/infrastructure/jobs/WeatherUpdateJob.ts
import { WeatherFactorRepository } from '../../domain/repositories/WeatherFactorRepository';
import { CalculationScheduleRepository } from '../../domain/repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../../domain/repositories/ScheduleActivityRepository';
import { NotificationService } from '../../domain/services/NotificationService';
// CORREGIDO: Importación correcta del WeatherFactorEntity
import { WeatherFactorEntity } from '../database/entities/WeatherFactorEntity';

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  precipitation: {
    probability: number;
    amount: number; // mm
  };
  wind: {
    speed: number; // km/h
    direction: string;
  };
  humidity: number; // %
  workability: 'excellent' | 'good' | 'fair' | 'poor';
  conditions: string[];
}

export interface WeatherAlert {
  scheduleId: string;
  activityId?: string;
  alertType: 'rain' | 'wind' | 'temperature' | 'storm';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendedActions: string[];
  affectedDates: Date[];
}

export class WeatherUpdateJob {
  private readonly WEATHER_API_URL = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';
  private readonly WEATHER_API_KEY = process.env.WEATHER_API_KEY;

  constructor(
    private weatherRepository: WeatherFactorRepository,
    private scheduleRepository: CalculationScheduleRepository,
    private activityRepository: ScheduleActivityRepository,
    private notificationService: NotificationService
  ) {}

  // ... [otros métodos permanecen igual] ...

  // MÉTODO CORREGIDO - processWeatherData
  private async processWeatherData(weatherUpdates: Map<string, WeatherForecast[]>): Promise<void> {
    for (const [scheduleId, forecasts] of weatherUpdates) {
      // CORREGIDO: Obtener información del schedule para tener geographicalZone
      const schedule = await this.scheduleRepository.findById(scheduleId);
      if (!schedule) continue;

      for (const forecast of forecasts) {
        const weatherFactor: Partial<WeatherFactorEntity> = {
          scheduleId,
          date: forecast.date,
          geographicalZone: schedule.geographicalZone || 'QUITO', // CORREGIDO: Usar schedule en lugar de variable indefinida
          weatherCondition: forecast.conditions.join(', '),
          rainfall: forecast.precipitation.amount,
          temperature: forecast.temperature.avg,
          windSpeed: forecast.wind.speed,
          humidity: forecast.humidity,
          workingSuitability: forecast.workability,
          productivityFactor: this.calculateProductivityFactor(forecast),
          activityImpacts: await this.calculateActivityImpacts(scheduleId, forecast),
          isActual: false, // Es pronóstico, no datos reales
          dataSource: 'OpenWeatherMap'
        };

        // CORREGIDO: Crear la entidad completa
        const weatherEntity = new WeatherFactorEntity();
        Object.assign(weatherEntity, weatherFactor);
        
        await this.weatherRepository.save(weatherEntity);
      }
    }
  }

  // MÉTODO CORREGIDO - calculateActivityImpacts 
  private async calculateActivityImpacts(scheduleId: string, forecast: WeatherForecast): Promise<any[]> {
    const activities = await this.activityRepository.findByScheduleId(scheduleId);
    const impacts = [];

    for (const activity of activities) {
      // Solo actividades exteriores son afectadas significativamente
      if (this.isOutdoorActivity(activity)) {
        const adjustmentFactor = this.calculateAdjustmentFactor(activity, forecast);
        
        if (adjustmentFactor < 1.0) {
          impacts.push({
            activityType: activity.primaryTrade || activity.activityType,
            impactLevel: this.getImpactLevel(adjustmentFactor),
            adjustmentFactor,
            notes: this.getImpactReason(forecast)
          });
        }
      }
    }

    return impacts;
  }

  // MÉTODO AGREGADO - getImpactLevel
  private getImpactLevel(adjustmentFactor: number): 'none' | 'minimal' | 'moderate' | 'severe' | 'prohibitive' {
    if (adjustmentFactor >= 0.9) return 'minimal';
    if (adjustmentFactor >= 0.7) return 'moderate';
    if (adjustmentFactor >= 0.4) return 'severe';
    return 'prohibitive';
  }

  // MÉTODO CORREGIDO - sendWeatherNotifications
  private async sendWeatherNotifications(alerts: WeatherAlert[]): Promise<void> {
    for (const alert of alerts) {
      await this.notificationService.createNotification({
        userId: 'system', // Debería ser reemplazado con project managers
        type: 'WEATHER_ALERT',
        title: 'Alerta Meteorológica',
        message: alert.message,
        priority: alert.severity === 'high' ? 'HIGH' : 'MEDIUM',
        relatedEntityType: 'CALCULATION_SCHEDULE',
        relatedEntityId: alert.scheduleId,
        // CORREGIDO: Removido actionRequired ya que no existe en el tipo
        metadata: {
          alertType: alert.alertType,
          affectedDates: alert.affectedDates,
          recommendedActions: alert.recommendedActions,
          severity: alert.severity
        }
      });
    }
  }

  // Resto de métodos permanecen igual...
  private async getSchedulesWithLocations(): Promise<any[]> {
    const schedules = await this.scheduleRepository.findByFilters(
      {
        status: ['ACTIVE', 'ON_HOLD'],
        isActive: true
      },
      {
        page: 1,
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    );

    return schedules.filter(schedule => 
      schedule.customFields?.location || 
      schedule.geographicalZone
    );
  }

  private async fetchWeatherData(schedules: any[]): Promise<Map<string, WeatherForecast[]>> {
    const weatherData = new Map<string, WeatherForecast[]>();
    const locationGroups = this.groupSchedulesByLocation(schedules);

    for (const [location, locationSchedules] of locationGroups) {
      try {
        const forecasts = await this.getWeatherForecast(location);
        
        for (const schedule of locationSchedules) {
          weatherData.set(schedule.id, forecasts);
        }

        console.log(`Weather data fetched for ${location}: ${forecasts.length} days`);
        await this.delay(1000);

      } catch (error) {
        console.error(`Error fetching weather for location ${location}:`, error);
      }
    }

    return weatherData;
  }

  private groupSchedulesByLocation(schedules: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    for (const schedule of schedules) {
      const location = this.getLocationKey(schedule);
      
      if (!groups.has(location)) {
        groups.set(location, []);
      }
      groups.get(location)!.push(schedule);
    }

    return groups;
  }

  private getLocationKey(schedule: any): string {
    if (schedule.customFields?.location?.latitude && schedule.customFields?.location?.longitude) {
      return `${schedule.customFields.location.latitude},${schedule.customFields.location.longitude}`;
    }

    const zoneCoordinates = this.getZoneCoordinates(schedule.geographicalZone);
    return `${zoneCoordinates.lat},${zoneCoordinates.lon}`;
  }

  private getZoneCoordinates(zone: string): { lat: number; lon: number } {
    const coordinates = {
      'QUITO': { lat: -0.1807, lon: -78.4678 },
      'GUAYAQUIL': { lat: -2.1969, lon: -79.8862 },
      'CUENCA': { lat: -2.9001, lon: -79.0059 },
      'COSTA': { lat: -1.5, lon: -80.0 },
      'SIERRA': { lat: -1.0, lon: -78.5 },
      'ORIENTE': { lat: -1.5, lon: -77.5 },
      'INSULAR': { lat: -0.75, lon: -90.0 }
    };

    return coordinates[zone] || coordinates['QUITO'];
  }

  private async getWeatherForecast(location: string): Promise<WeatherForecast[]> {
    if (!this.WEATHER_API_KEY) {
      throw new Error('Weather API key not configured');
    }

    const [lat, lon] = location.split(',');
    const url = `${this.WEATHER_API_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.WEATHER_API_KEY}&units=metric&cnt=40`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseWeatherData(data);
  }

  private parseWeatherData(apiData: any): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];
    const dailyGroups = new Map<string, any[]>();
    
    for (const item of apiData.list) {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toDateString();
      
      if (!dailyGroups.has(dateKey)) {
        dailyGroups.set(dateKey, []);
      }
      dailyGroups.get(dateKey)!.push(item);
    }

    for (const [dateKey, dayItems] of dailyGroups) {
      const forecast = this.processDayForecast(new Date(dateKey), dayItems);
      forecasts.push(forecast);
    }

    return forecasts;
  }

  private processDayForecast(date: Date, dayItems: any[]): WeatherForecast {
    const temperatures = dayItems.map(item => item.main.temp);
    const minTemp = Math.min(...temperatures);
    const maxTemp = Math.max(...temperatures);
    const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;

    const precipitationAmounts = dayItems.map(item => item.rain?.['3h'] || 0);
    const totalPrecipitation = precipitationAmounts.reduce((sum, amount) => sum + amount, 0);
    const precipitationProbability = dayItems.some(item => item.rain) ? 
      dayItems.filter(item => item.rain).length / dayItems.length : 0;

    const windSpeeds = dayItems.map(item => item.wind.speed * 3.6);
    const avgWindSpeed = windSpeeds.reduce((sum, speed) => sum + speed, 0) / windSpeeds.length;
    const windDirection = this.getWindDirection(dayItems[0].wind.deg);

    const humidities = dayItems.map(item => item.main.humidity);
    const avgHumidity = humidities.reduce((sum, humidity) => sum + humidity, 0) / humidities.length;

    const conditions = [...new Set(dayItems.flatMap(item => 
      item.weather.map(w => w.description)
    ))];

    const workability = this.calculateWorkability({
      temperature: avgTemp,
      precipitation: totalPrecipitation,
      windSpeed: avgWindSpeed,
      humidity: avgHumidity
    });

    return {
      date,
      temperature: {
        min: Math.round(minTemp * 10) / 10,
        max: Math.round(maxTemp * 10) / 10,
        avg: Math.round(avgTemp * 10) / 10
      },
      precipitation: {
        probability: Math.round(precipitationProbability * 100) / 100,
        amount: Math.round(totalPrecipitation * 10) / 10
      },
      wind: {
        speed: Math.round(avgWindSpeed * 10) / 10,
        direction: windDirection
      },
      humidity: Math.round(avgHumidity),
      workability,
      conditions
    };
  }

  private getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  private calculateWorkability(conditions: any): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 100;

    if (conditions.temperature < 5 || conditions.temperature > 35) {
      score -= 30;
    } else if (conditions.temperature < 10 || conditions.temperature > 30) {
      score -= 15;
    }

    if (conditions.precipitation > 10) {
      score -= 50;
    } else if (conditions.precipitation > 5) {
      score -= 25;
    } else if (conditions.precipitation > 1) {
      score -= 10;
    }

    if (conditions.windSpeed > 50) {
      score -= 40;
    } else if (conditions.windSpeed > 30) {
      score -= 20;
    } else if (conditions.windSpeed > 20) {
      score -= 10;
    }

    if (conditions.humidity > 90) {
      score -= 10;
    }

    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private calculateProductivityFactor(forecast: WeatherForecast): number {
    switch (forecast.workability) {
      case 'excellent': return 1.0;
      case 'good': return 0.9;
      case 'fair': return 0.7;
      case 'poor': return 0.4;
      default: return 0.8;
    }
  }

  private isOutdoorActivity(activity: any): boolean {
    const outdoorTypes = ['EXCAVATION', 'FOUNDATION', 'STRUCTURE', 'ROOFING', 'EXTERIOR'];
    return outdoorTypes.includes(activity.activityType) || outdoorTypes.includes(activity.primaryTrade);
  }

  private calculateAdjustmentFactor(activity: any, forecast: WeatherForecast): number {
    let factor = this.calculateProductivityFactor(forecast);
    const activityType = activity.activityType || activity.primaryTrade;

    switch (activityType) {
      case 'EXCAVATION':
        if (forecast.precipitation.amount > 5) factor *= 0.5;
        break;
      case 'FOUNDATION':
        if (forecast.precipitation.amount > 2) factor *= 0.6;
        break;
      case 'STRUCTURE':
        if (forecast.wind.speed > 30) factor *= 0.7;
        break;
      case 'ROOFING':
        if (forecast.wind.speed > 20 || forecast.precipitation.amount > 1) factor *= 0.3;
        break;
    }

    return Math.max(0.1, factor);
  }

  private getImpactReason(forecast: WeatherForecast): string {
    const reasons = [];
    
    if (forecast.precipitation.amount > 5) reasons.push('lluvia intensa');
    else if (forecast.precipitation.amount > 1) reasons.push('precipitación');
    
    if (forecast.wind.speed > 30) reasons.push('vientos fuertes');
    else if (forecast.wind.speed > 20) reasons.push('vientos moderados');
    
    if (forecast.temperature.avg < 5) reasons.push('temperatura muy baja');
    else if (forecast.temperature.avg > 35) reasons.push('temperatura muy alta');
    
    return reasons.join(', ') || 'condiciones adversas';
  }

  private async generateWeatherAlerts(schedules: any[], weatherUpdates: Map<string, WeatherForecast[]>): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];

    for (const schedule of schedules) {
      const forecasts = weatherUpdates.get(schedule.id);
      if (!forecasts) continue;

      const adverseForecasts = forecasts.filter(forecast => 
        forecast.workability === 'poor' || 
        forecast.precipitation.amount > 10 ||
        forecast.wind.speed > 40
      );

      for (const forecast of adverseForecasts) {
        const alert = this.createWeatherAlert(schedule, forecast);
        if (alert) alerts.push(alert);
      }
    }

    return alerts;
  }

  private createWeatherAlert(schedule: any, forecast: WeatherForecast): WeatherAlert | null {
    let alertType: 'rain' | 'wind' | 'temperature' | 'storm';
    let severity: 'low' | 'medium' | 'high';
    let message: string;
    let recommendedActions: string[];

    if (forecast.precipitation.amount > 20) {
      alertType = 'storm';
      severity = 'high';
      message = `Tormenta intensa prevista (${forecast.precipitation.amount}mm)`;
      recommendedActions = [
        'Suspender todas las actividades exteriores',
        'Asegurar materiales y equipos',
        'Revisar sistemas de drenaje'
      ];
    } else if (forecast.precipitation.amount > 10) {
      alertType = 'rain';
      severity = 'medium';
      message = `Lluvia fuerte prevista (${forecast.precipitation.amount}mm)`;
      recommendedActions = [
        'Limitar actividades exteriores',
        'Proteger materiales sensibles',
        'Preparar equipos de bombeo'
      ];
    } else if (forecast.wind.speed > 40) {
      alertType = 'wind';
      severity = 'high';
      message = `Vientos fuertes previstos (${forecast.wind.speed} km/h)`;
      recommendedActions = [
        'Suspender trabajos en altura',
        'Asegurar grúas y equipos',
        'Proteger estructuras temporales'
      ];
    } else if (forecast.temperature.avg < 2 || forecast.temperature.avg > 38) {
      alertType = 'temperature';
      severity = 'medium';
      message = `Temperatura extrema prevista (${forecast.temperature.avg}°C)`;
      recommendedActions = [
        'Ajustar horarios de trabajo',
        'Proporcionar EPP apropiado',
        'Hidratación/calefacción adicional'
      ];
    } else {
      return null;
    }

    return {
      scheduleId: schedule.id,
      alertType,
      severity,
      message,
      recommendedActions,
      affectedDates: [forecast.date]
    };
  }

  private async adjustSchedulesForWeather(alerts: WeatherAlert[]): Promise<void> {
    for (const alert of alerts) {
      if (alert.severity === 'high') {
        await this.adjustScheduleForAlert(alert);
      }
    }
  }

  private async adjustScheduleForAlert(alert: WeatherAlert): Promise<void> {
    const activities = await this.activityRepository.findByScheduleId(alert.scheduleId);
    
    const affectedActivities = activities.filter(activity => {
      if (!this.isOutdoorActivity(activity)) return false;
      
      return alert.affectedDates.some(alertDate => {
        const activityDate = activity.plannedStartDate;
        return this.isSameDay(activityDate, alertDate) || 
               (activityDate <= alertDate && activity.plannedEndDate >= alertDate);
      });
    });

    for (const activity of affectedActivities) {
      const adjustment = this.getScheduleAdjustment(alert);
      
      if (adjustment.postpone) {
        const newStartDate = new Date(activity.plannedStartDate);
        newStartDate.setDate(newStartDate.getDate() + adjustment.days);
        
        const newEndDate = new Date(activity.plannedEndDate);
        newEndDate.setDate(newEndDate.getDate() + adjustment.days);

        activity.plannedStartDate = newStartDate;
        activity.plannedEndDate = newEndDate;
        activity.customFields = {
          ...activity.customFields,
          weatherAdjustment: {
            reason: alert.message,
            adjustmentDays: adjustment.days,
            adjustmentDate: new Date()
          }
        };

        await this.activityRepository.save(activity);
      }
    }
  }

  private getScheduleAdjustment(alert: WeatherAlert): { postpone: boolean; days: number } {
    switch (alert.alertType) {
      case 'storm': return { postpone: true, days: 2 };
      case 'rain': return { postpone: alert.severity === 'high', days: 1 };
      case 'wind': return { postpone: alert.severity === 'high', days: 1 };
      case 'temperature': return { postpone: false, days: 0 };
      default: return { postpone: false, days: 0 };
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método principal execute
  async execute(): Promise<void> {
    console.log('Starting Weather Update Job...');
    
    try {
      const activeSchedules = await this.getSchedulesWithLocations();
      console.log(`Found ${activeSchedules.length} schedules to update weather data`);

      const weatherUpdates = await this.fetchWeatherData(activeSchedules);
      await this.processWeatherData(weatherUpdates);

      const weatherAlerts = await this.generateWeatherAlerts(activeSchedules, weatherUpdates);
      await this.adjustSchedulesForWeather(weatherAlerts);
      await this.sendWeatherNotifications(weatherAlerts);

      console.log('Weather Update Job completed successfully');

    } catch (error) {
      console.error('Error in Weather Update Job:', error);
      await this.notificationService.createNotification({
        userId: 'system',
        type: 'ERROR',
        title: 'Error en Actualización Meteorológica',
        message: `Error al actualizar datos meteorológicos: ${(error as Error).message}`,
        priority: 'HIGH',
        relatedEntityType: 'SYSTEM_JOB',
        relatedEntityId: 'weather_update_job'
      });
    }
  }
}