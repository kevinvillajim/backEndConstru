// src/domain/models/calculation/WeatherFactor.ts - CORREGIDO
export interface WeatherFactor {
  id: string;
  scheduleId?: string;
  date: Date;
  geographicalZone: string;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed?: number;
  windDirection?: string;
  atmosphericPressure?: number;
  uvIndex?: number;
  workingSuitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
  productivityFactor: number;
  activityImpacts?: {
    activityType: string;
    impactLevel: 'none' | 'minimal' | 'moderate' | 'severe' | 'prohibitive';
    adjustmentFactor: number;
    notes: string;
  }[];
  workRestrictions?: {
    concreteWork: boolean;
    paintingWork: boolean;
    roofingWork: boolean;
    excavationWork: boolean;
    electricalWork: boolean;
    heightWork: boolean;
    reasoning: string;
  };
  forecast?: {
    tomorrow: {
      condition: string;
      temperature: { min: number; max: number };
      rainfall: number;
      workingSuitability: string;
    };
    nextWeek: {
      averageCondition: string;
      rainyDays: number;
      suitableWorkingDays: number;
      recommendations: string[];
    };
  };
  seasonalData?: {
    month: number;
    historicalAverage: {
      temperature: number;
      rainfall: number;
      suitableWorkingDays: number;
    };
    extremeEvents: {
      type: string;
      probability: number;
      impact: string;
    }[];
  };
  dataSource?: string;
  isActual: boolean;
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWeatherFactorDTO {
  scheduleId?: string;
  date: Date;
  geographicalZone: string;
  weatherCondition: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed?: number;
  windDirection?: string;
  atmosphericPressure?: number;
  uvIndex?: number;
  workingSuitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
  productivityFactor?: number;
  activityImpacts?: WeatherFactor['activityImpacts'];
  workRestrictions?: WeatherFactor['workRestrictions'];
  forecast?: WeatherFactor['forecast'];
  seasonalData?: WeatherFactor['seasonalData'];
  dataSource?: string;
  isActual?: boolean;
  customFields?: Record<string, any>;
}

export interface UpdateWeatherFactorDTO extends Partial<CreateWeatherFactorDTO> {
  id: string;
}

export interface WeatherImpactAnalysis {
  scheduleId: string;
  totalRainyDays: number;
  unsuitableWorkingDays: number;
  averageProductivityFactor: number;
  affectedActivities: {
    activityId: string;
    activityName: string;
    delayDays: number;
    productivityImpact: number;
  }[];
  recommendations: {
    type: 'schedule_adjustment' | 'protection_measures' | 'activity_relocation';
    description: string;
    estimatedCost: number;
    timeline: string;
  }[];
  seasonalPredictions: {
    period: string;
    expectedImpact: 'low' | 'medium' | 'high';
    recommendations: string[];
  }[];
}

export interface WeatherForecast {
  geographicalZone: string;
  forecastDays: number;
  forecasts: {
    date: Date;
    condition: string;
    temperature: { min: number; max: number };
    rainfall: number;
    humidity: number;
    windSpeed: number;
    workingSuitability: 'excellent' | 'good' | 'fair' | 'poor' | 'unsuitable';
    productivityFactor: number;
    recommendedActivities: string[];
    restrictedActivities: string[];
  }[];
  weeklyTrend: {
    suitableWorkingDays: number;
    averageProductivity: number;
    majorConcerns: string[];
  };
}

// CORREGIDO: Comentar la re-exportación para evitar conflictos de importación circular
// La entidad debe ser importada directamente desde su ubicación
// export { WeatherFactorEntity } from '../../../infrastructure/database/entities/WeatherFactorEntity';

// AGREGADO: Comentario explicativo para las importaciones
/*
Para usar WeatherFactorEntity, importar directamente desde:
import { WeatherFactorEntity } from '../../../infrastructure/database/entities/WeatherFactorEntity';

Esto evita conflictos de importación circular entre el dominio y la infraestructura.
*/