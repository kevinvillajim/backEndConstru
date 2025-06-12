import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    CreateDateColumn, 
    UpdateDateColumn, 
    JoinColumn,
    Index 
  } from 'typeorm';
  import { CalculationScheduleEntity } from './CalculationScheduleEntity';
  import { ScheduleActivityEntity } from './ScheduleActivityEntity';
  import { UserEntity } from './UserEntity';

  // ===== WeatherFactorEntity.ts =====
@Entity('weather_factors')
@Index(['scheduleId', 'date'])
@Index(['geographicalZone', 'date'])
export class WeatherFactorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: ['QUITO', 'GUAYAQUIL', 'CUENCA', 'COSTA', 'SIERRA', 'ORIENTE', 'INSULAR']
  })
  geographicalZone: string;

  // Condiciones climáticas
  @Column({ type: 'varchar', length: 100 })
  weatherCondition: string; // soleado, nublado, lluvioso, etc.

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  temperature: number; // Celsius

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  humidity: number; // Porcentaje

  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  rainfall: number; // mm

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  windSpeed: number; // km/h

  @Column({ type: 'varchar', length: 50, nullable: true })
  windDirection: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  atmosphericPressure: number; // hPa

  @Column({ type: 'integer', nullable: true })
  uvIndex: number;

  // Impacto en la construcción
  @Column({
    type: 'enum',
    enum: ['excellent', 'good', 'fair', 'poor', 'unsuitable'],
    default: 'good'
  })
  workingSuitability: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  productivityFactor: number; // Factor multiplicador de productividad

  @Column({ type: 'json', nullable: true })
  activityImpacts: {
    activityType: string;
    impactLevel: 'none' | 'minimal' | 'moderate' | 'severe' | 'prohibitive';
    adjustmentFactor: number;
    notes: string;
  }[];

  // Restricciones específicas
  @Column({ type: 'json', nullable: true })
  workRestrictions: {
    concreteWork: boolean;
    paintingWork: boolean;
    roofingWork: boolean;
    excavationWork: boolean;
    electricalWork: boolean;
    heightWork: boolean;
    reasoning: string;
  };

  // Predicciones
  @Column({ type: 'json', nullable: true })
  forecast: {
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

  // Datos históricos estacionales
  @Column({ type: 'json', nullable: true })
  seasonalData: {
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  dataSource: string; // INAMHI, API externa, etc.

  @Column({ type: 'boolean', default: true })
  isActual: boolean; // true = real, false = forecast

  @Column({ type: 'json', nullable: true })
  customFields: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => CalculationScheduleEntity, schedule => schedule.weatherFactors, { nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule: CalculationScheduleEntity;

  @Column({ type: 'uuid', nullable: true })
  scheduleId: string;

  // Métodos calculados
  public get isRainyDay(): boolean {
    return this.rainfall > 1.0; // Más de 1mm se considera día lluvioso
  }

  public get isExtremeMeperature(): boolean {
    return this.temperature < 5 || this.temperature > 35;
  }

  public get isHighWind(): boolean {
    return this.windSpeed ? this.windSpeed > 25 : false; // Más de 25 km/h
  }

  public get overallImpactScore(): number {
    // Calcula un score general del impacto climático (0-100)
    let score = 100;
    
    if (this.workingSuitability === 'unsuitable') return 0;
    if (this.workingSuitability === 'poor') score = 30;
    else if (this.workingSuitability === 'fair') score = 60;
    else if (this.workingSuitability === 'good') score = 85;
    
    // Ajustar por factores específicos
    if (this.isRainyDay) score *= 0.7;
    if (this.isExtremeMeperature) score *= 0.8;
    if (this.isHighWind) score *= 0.9;
    
    return Math.max(0, Math.min(100, score));
  }

  public getAdjustedProductivity(baseProductivity: number): number {
    return baseProductivity * this.productivityFactor;
  }

  public canExecuteActivity(activityType: string): boolean {
    if (!this.activityImpacts) return true;
    
    const impact = this.activityImpacts.find(ai => ai.activityType === activityType);
    return impact ? impact.impactLevel !== 'prohibitive' : true;
  }

  public getActivityAdjustment(activityType: string): number {
    if (!this.activityImpacts) return 1.0;
    
    const impact = this.activityImpacts.find(ai => ai.activityType === activityType);
    return impact ? impact.adjustmentFactor : 1.0;
  }

  public static getSeasonalPattern(month: number, zone: string): any {
    // Patrones estacionales típicos de Ecuador por zona
    const patterns = {
      'QUITO': {
        dryMonths: [6, 7, 8, 9], // Junio a Septiembre
        rainyMonths: [10, 11, 12, 1, 2, 3, 4, 5], // Octubre a Mayo
        averageTemp: 15
      },
      'GUAYAQUIL': {
        dryMonths: [5, 6, 7, 8, 9, 10, 11], // Mayo a Noviembre
        rainyMonths: [12, 1, 2, 3, 4], // Diciembre a Abril
        averageTemp: 26
      },
      'CUENCA': {
        dryMonths: [6, 7, 8, 9], // Junio a Septiembre
        rainyMonths: [10, 11, 12, 1, 2, 3, 4, 5], // Octubre a Mayo
        averageTemp: 16
      }
    };
    
    return patterns[zone] || patterns['QUITO'];
  }
}