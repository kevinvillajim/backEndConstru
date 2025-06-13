// src/domain/repositories/WeatherFactorRepository.ts - CORREGIDO
// CORREGIDO: Importar directamente desde la entidad, no desde el modelo de dominio
import { WeatherFactorEntity } from '../../infrastructure/database/entities/WeatherFactorEntity';

export interface WeatherFactorRepository {
  findById(id: string): Promise<WeatherFactorEntity | null>;
  findByScheduleId(scheduleId: string): Promise<WeatherFactorEntity[]>;
  findByGeographicalZone(zone: string, dateRange: { start: Date; end: Date }): Promise<WeatherFactorEntity[]>;
  findByDateRange(startDate: Date, endDate: Date, zone?: string): Promise<WeatherFactorEntity[]>;
  findForecast(zone: string, days: number): Promise<WeatherFactorEntity[]>;
  findHistorical(zone: string, startDate: Date, endDate: Date): Promise<WeatherFactorEntity[]>;
  getWeatherImpactAnalysis(scheduleId: string): Promise<any>;
  save(weatherFactor: WeatherFactorEntity): Promise<WeatherFactorEntity>;
  saveMany(weatherFactors: WeatherFactorEntity[]): Promise<WeatherFactorEntity[]>;
  delete(id: string): Promise<boolean>;
  
  // MÉTODOS AGREGADOS para mayor funcionalidad
  findCurrentConditions(zone: string): Promise<WeatherFactorEntity | null>;
  findByWorkingSuitability(suitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable'): Promise<WeatherFactorEntity[]>;
  findRainyDays(zone: string, dateRange: { start: Date; end: Date }): Promise<WeatherFactorEntity[]>;
  findExtremeDays(zone: string, dateRange: { start: Date; end: Date }): Promise<WeatherFactorEntity[]>;
  
  // Métodos de análisis
  getProductivityAnalysis(scheduleId: string): Promise<{
    averageProductivity: number;
    bestDays: WeatherFactorEntity[];
    worstDays: WeatherFactorEntity[];
    recommendations: string[];
  }>;
  
  getSeasonalTrends(zone: string, year?: number): Promise<{
    month: number;
    averageTemp: number;
    totalRainfall: number;
    suitableWorkingDays: number;
    productivityFactor: number;
  }[]>;
  
  // Métodos de alertas
  getWeatherAlerts(zone: string, daysAhead?: number): Promise<{
    date: Date;
    alertType: 'storm' | 'extreme_temp' | 'high_wind' | 'heavy_rain';
    severity: 'low' | 'medium' | 'high';
    message: string;
    recommendations: string[];
  }[]>;
}