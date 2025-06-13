// src/infrastructure/database/repositories/TypeOrmWeatherFactorRepository.ts
import { Repository, Between, MoreThan } from 'typeorm';
import { WeatherFactorEntity } from '../entities/WeatherFactorEntity';
import { WeatherFactorRepository } from '../../../domain/repositories/WeatherFactorRepository';
import { AppDataSource } from '../data-source';

export class TypeOrmWeatherFactorRepository implements WeatherFactorRepository {
  private repository: Repository<WeatherFactorEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(WeatherFactorEntity);
  }
  findCurrentConditions(zone: string): Promise<WeatherFactorEntity | null> {
    throw new Error('Method not implemented.');
  }
  findByWorkingSuitability(suitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable'): Promise<WeatherFactorEntity[]> {
    throw new Error('Method not implemented.');
  }
  findRainyDays(zone: string, dateRange: { start: Date; end: Date; }): Promise<WeatherFactorEntity[]> {
    throw new Error('Method not implemented.');
  }
  findExtremeDays(zone: string, dateRange: { start: Date; end: Date; }): Promise<WeatherFactorEntity[]> {
    throw new Error('Method not implemented.');
  }
  getProductivityAnalysis(scheduleId: string): Promise<{ averageProductivity: number; bestDays: WeatherFactorEntity[]; worstDays: WeatherFactorEntity[]; recommendations: string[]; }> {
    throw new Error('Method not implemented.');
  }
  getSeasonalTrends(zone: string, year?: number): Promise<{ month: number; averageTemp: number; totalRainfall: number; suitableWorkingDays: number; productivityFactor: number; }[]> {
    throw new Error('Method not implemented.');
  }
  getWeatherAlerts(zone: string, daysAhead?: number): Promise<{ date: Date; alertType: 'storm' | 'extreme_temp' | 'high_wind' | 'heavy_rain'; severity: 'low' | 'medium' | 'high'; message: string; recommendations: string[]; }[]> {
    throw new Error('Method not implemented.');
  }

  async findById(id: string): Promise<WeatherFactorEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['schedule']
    });
  }

  async findByScheduleId(scheduleId: string): Promise<WeatherFactorEntity[]> {
    return await this.repository.find({
      where: { scheduleId },
      order: { date: 'ASC' }
    });
  }

  async findByGeographicalZone(zone: string, dateRange: { start: Date; end: Date }): Promise<WeatherFactorEntity[]> {
    return await this.repository.find({
      where: {
        geographicalZone: zone,
        date: Between(dateRange.start, dateRange.end)
      },
      order: { date: 'ASC' }
    });
  }

  async findByDateRange(startDate: Date, endDate: Date, zone?: string): Promise<WeatherFactorEntity[]> {
    const where: any = {
      date: Between(startDate, endDate)
    };

    if (zone) {
      where.geographicalZone = zone;
    }

    return await this.repository.find({
      where,
      order: { date: 'ASC' }
    });
  }

  async findForecast(zone: string, days: number): Promise<WeatherFactorEntity[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return await this.repository.find({
      where: {
        geographicalZone: zone,
        date: Between(startDate, endDate),
        isActual: false
      },
      order: { date: 'ASC' }
    });
  }

  async findHistorical(zone: string, startDate: Date, endDate: Date): Promise<WeatherFactorEntity[]> {
    return await this.repository.find({
      where: {
        geographicalZone: zone,
        date: Between(startDate, endDate),
        isActual: true
      },
      order: { date: 'ASC' }
    });
  }

  async getWeatherImpactAnalysis(scheduleId: string): Promise<any> {
    const weatherFactors = await this.repository.find({
      where: { scheduleId },
      order: { date: 'ASC' }
    });

    const totalDays = weatherFactors.length;
    const rainyDays = weatherFactors.filter(w => w.isRainyDay).length;
    const unsuitableWorkingDays = weatherFactors.filter(w => w.workingSuitability === 'unsuitable').length;
    
    const averageProductivityFactor = totalDays > 0 ? 
      weatherFactors.reduce((sum, w) => sum + w.productivityFactor, 0) / totalDays : 1;

    // Analyze affected activities (simplified)
    const affectedActivities = weatherFactors
      .filter(w => w.activityImpacts && w.activityImpacts.length > 0)
      .flatMap(w => w.activityImpacts || [])
      .reduce((acc, impact) => {
        const existing = acc.find(a => a.activityType === impact.activityType);
        if (existing) {
          existing.totalImpact += (1 - impact.adjustmentFactor);
          existing.occurrences += 1;
        } else {
          acc.push({
            activityType: impact.activityType,
            totalImpact: (1 - impact.adjustmentFactor),
            occurrences: 1
          });
        }
        return acc;
      }, [] as any[]);

    return {
      scheduleId,
      totalDays,
      rainyDays,
      unsuitableWorkingDays,
      averageProductivityFactor,
      affectedActivities: affectedActivities.map(activity => ({
        activityType: activity.activityType,
        averageImpact: activity.totalImpact / activity.occurrences,
        occurrences: activity.occurrences
      })),
      recommendations: this.generateWeatherRecommendations(
        rainyDays / totalDays,
        unsuitableWorkingDays / totalDays,
        averageProductivityFactor
      )
    };
  }

  private generateWeatherRecommendations(rainyRatio: number, unsuitableRatio: number, avgProductivity: number): any[] {
    const recommendations = [];

    if (rainyRatio > 0.3) {
      recommendations.push({
        type: 'schedule_adjustment',
        description: 'Consider rescheduling outdoor activities during drier periods',
        priority: 'high'
      });
    }

    if (unsuitableRatio > 0.2) {
      recommendations.push({
        type: 'protection_measures',
        description: 'Implement weather protection measures for critical activities',
        priority: 'medium'
      });
    }

    if (avgProductivity < 0.8) {
      recommendations.push({
        type: 'productivity_adjustment',
        description: 'Adjust project timeline to account for weather-related productivity loss',
        priority: 'high'
      });
    }

    return recommendations;
  }

  async save(weatherFactor: WeatherFactorEntity): Promise<WeatherFactorEntity> {
    return await this.repository.save(weatherFactor);
  }

  async saveMany(weatherFactors: WeatherFactorEntity[]): Promise<WeatherFactorEntity[]> {
    return await this.repository.save(weatherFactors);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }
}