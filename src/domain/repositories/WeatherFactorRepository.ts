// ===== WeatherFactorRepository.ts (Domain Interface) =====
import { WeatherFactorEntity } from '../models/calculation/WeatherFactor';

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
}