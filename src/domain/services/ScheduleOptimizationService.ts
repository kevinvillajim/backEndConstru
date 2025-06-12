// src/domain/services/ScheduleOptimizationService.ts
import { ScheduleActivityEntity } from '../../infrastructure/database/entities/ScheduleActivityEntity';
import { ResourceAssignmentEntity } from '../../infrastructure/database/entities/ResourceAssignmentEntity';
import { WorkforceEntity } from '../../infrastructure/database/entities/WorkforceEntity';
import { EquipmentEntity } from '../../infrastructure/database/entities/EquipmentEntity';
import { ActivityPriority } from '../../domain/models/calculation/ScheduleActivity';

export interface OptimizationObjective {
  minimizeTime: number; // 0-100 weight
  minimizeCost: number; // 0-100 weight
  maximizeQuality: number; // 0-100 weight
  balanceResources: number; // 0-100 weight
}

export interface OptimizationConstraints {
  maxProjectDuration: number; // days
  maxBudget: number;
  availableWorkforce: WorkforceEntity[];
  availableEquipment: EquipmentEntity[];
  fixedMilestones: {
    activityId: string;
    date: Date;
    flexibility: number; // days
  }[];
  workingCalendar: {
    workingDays: number[]; // 0-6, sunday=0
    holidays: Date[];
    seasonalAdjustments: {
      startDate: Date;
      endDate: Date;
      productivityFactor: number;
    }[];
  };
  qualityRequirements: {
    activityId: string;
    minDuration: number;
    inspectionTime: number;
  }[];
}

export interface OptimizationResult {
  originalDuration: number;
  optimizedDuration: number;
  durationSaving: number;
  originalCost: number;
  optimizedCost: number;
  costSaving: number;
  qualityScore: number; // 0-100
  resourceUtilization: number; // 0-100
  feasibilityScore: number; // 0-100
  optimizationActions: OptimizationAction[];
  risks: OptimizationRisk[];
  performance: {
    iterationsRun: number;
    convergenceTime: number;
    improvementAchieved: number;
  };
}

export interface OptimizationAction {
  type: 'parallel_execution' | 'resource_reallocation' | 'duration_adjustment' | 'sequence_change' | 'fast_tracking' | 'crashing';
  description: string;
  affectedActivities: string[];
  impact: {
    durationChange: number;
    costChange: number;
    qualityImpact: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  implementation: {
    effort: 'low' | 'medium' | 'high';
    prerequisites: string[];
    timeline: number; // days to implement
    cost: number;
  };
  priority: number; // 1-10
}

export interface OptimizationRisk {
  id: string;
  description: string;
  probability: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  category: 'schedule' | 'cost' | 'quality' | 'resource' | 'external';
  mitigation: string;
  contingencyPlan: string;
}

export interface CriticalPathAnalysis {
  criticalActivities: string[];
  totalFloat: { [activityId: string]: number };
  freeFloat: { [activityId: string]: number };
  criticalityIndex: { [activityId: string]: number };
  nearCriticalPaths: {
    activities: string[];
    totalFloat: number;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
}

export interface ResourceLevelingResult {
  leveledSchedule: ScheduleActivityEntity[];
  resourceProfile: {
    date: Date;
    resources: {
      [resourceType: string]: {
        required: number;
        available: number;
        utilization: number;
        overallocation: number;
      };
    };
  }[];
  improvements: {
    peakReduction: number;
    utilizationImprovement: number;
    durationImpact: number;
    costImpact: number;
  };
  recommendations: string[];
}

export class ScheduleOptimizationService {
  
  /**
   * Critical Path Method (CPM) Analysis
   */
  public calculateCriticalPath(activities: ScheduleActivityEntity[]): CriticalPathAnalysis {
    // Forward Pass
    const earlyTimes = this.calculateEarlyTimes(activities);
    
    // Backward Pass
    const lateTimes = this.calculateLateTimes(activities, earlyTimes);
    
    // Calculate Float
    const floats = this.calculateFloats(activities, earlyTimes, lateTimes);
    
    // Identify critical activities (zero total float)
    const criticalActivities = activities
      .filter(activity => floats.totalFloat[activity.id] === 0)
      .map(activity => activity.id);
    
    // Calculate criticality index
    const criticalityIndex = this.calculateCriticalityIndex(activities, floats);
    
    // Identify near-critical paths
    const nearCriticalPaths = this.identifyNearCriticalPaths(activities, floats);
    
    return {
      criticalActivities,
      totalFloat: floats.totalFloat,
      freeFloat: floats.freeFloat,
      criticalityIndex,
      nearCriticalPaths
    };
  }

  /**
   * Multi-objective optimization using genetic algorithm approach
   */
  public optimizeSchedule(
    activities: ScheduleActivityEntity[],
    objective: OptimizationObjective,
    constraints: OptimizationConstraints
  ): OptimizationResult {
    const startTime = Date.now();
    
    // Initial metrics
    const originalMetrics = this.calculateScheduleMetrics(activities);
    
    // Generate optimization alternatives
    const alternatives = this.generateOptimizationAlternatives(activities, constraints);
    
    // Evaluate each alternative
    const evaluatedAlternatives = alternatives.map((alternative, index) => {
      const score = this.evaluateSchedule(alternative, objective, constraints);
      const metrics = this.calculateScheduleMetrics(alternative);
      
      return {
        id: `alt_${index}`,
        schedule: alternative,
        score,
        metrics,
        feasibility: this.calculateFeasibilityScore(alternative, constraints)
      };
    });
    
    // Select best feasible alternative
    const feasibleAlternatives = evaluatedAlternatives.filter(alt => alt.feasibility > 70);
    const bestAlternative = feasibleAlternatives.length > 0 
      ? feasibleAlternatives.reduce((best, current) => current.score > best.score ? current : best)
      : evaluatedAlternatives.reduce((best, current) => current.feasibility > best.feasibility ? current : best);
    
    // Generate optimization actions
    const actions = this.generateOptimizationActions(activities, bestAlternative.schedule);
    
    // Analyze risks
    const risks = this.analyzeOptimizationRisks(bestAlternative.schedule, actions);
    
    // Performance tracking
    const endTime = Date.now();
    const performance = {
      iterationsRun: alternatives.length,
      convergenceTime: endTime - startTime,
      improvementAchieved: ((bestAlternative.score - this.evaluateSchedule(activities, objective, constraints)) / 100) * 100
    };
    
    return {
      originalDuration: originalMetrics.duration,
      optimizedDuration: bestAlternative.metrics.duration,
      durationSaving: originalMetrics.duration - bestAlternative.metrics.duration,
      originalCost: originalMetrics.cost,
      optimizedCost: bestAlternative.metrics.cost,
      costSaving: originalMetrics.cost - bestAlternative.metrics.cost,
      qualityScore: bestAlternative.metrics.quality,
      resourceUtilization: bestAlternative.metrics.resourceUtilization,
      feasibilityScore: bestAlternative.feasibility,
      optimizationActions: actions,
      risks: risks,
      performance
    };
  }

  /**
   * Resource Leveling and Smoothing
   */
  public levelResources(
    activities: ScheduleActivityEntity[],
    availableResources: { [resourceType: string]: number }
  ): ResourceLevelingResult {
    // Clone activities for manipulation
    let leveledActivities = [...activities];
    
    // Generate initial resource profile
    const initialProfile = this.generateResourceProfile(leveledActivities);
    const initialPeaks = this.identifyResourcePeaks(initialProfile, availableResources);
    
    // Apply resource smoothing (move activities within float)
    leveledActivities = this.applyResourceSmoothing(leveledActivities, availableResources);
    
    // Apply resource-limited scheduling
    leveledActivities = this.applyResourceLimitedScheduling(leveledActivities, availableResources);
    
    // Generate final resource profile
    const finalProfile = this.generateResourceProfile(leveledActivities);
    const finalPeaks = this.identifyResourcePeaks(finalProfile, availableResources);
    
    // Calculate improvements
    const improvements = {
      peakReduction: this.calculatePeakReduction(initialPeaks, finalPeaks),
      utilizationImprovement: this.calculateUtilizationImprovement(initialProfile, finalProfile),
      durationImpact: this.calculateDurationImpact(activities, leveledActivities),
      costImpact: this.calculateCostImpact(activities, leveledActivities)
    };
    
    const recommendations = this.generateResourceLevelingRecommendations(finalPeaks, improvements);
    
    return {
      leveledSchedule: leveledActivities,
      resourceProfile: finalProfile,
      improvements,
      recommendations
    };
  }

  /**
   * Fast Tracking Analysis
   */
  public analyzeFastTrackingOpportunities(activities: ScheduleActivityEntity[]): OptimizationAction[] {
    const actions: OptimizationAction[] = [];
    
    // Find activities that can be overlapped
    const overlappingCandidates = this.findOverlappingCandidates(activities);
    
    overlappingCandidates.forEach(candidate => {
      const riskAssessment = this.assessFastTrackingRisk(candidate);
      const durationSaving = this.calculateFastTrackingDurationSaving(candidate);
      const costImpact = this.calculateFastTrackingCostImpact(candidate);
      
      actions.push({
        type: 'fast_tracking',
        description: `Execute ${candidate.successor.name} in parallel with ${candidate.predecessor.name}`,
        affectedActivities: [candidate.predecessor.id, candidate.successor.id],
        impact: {
          durationChange: -durationSaving,
          costChange: costImpact,
          qualityImpact: riskAssessment.qualityImpact,
          riskLevel: riskAssessment.riskLevel
        },
        implementation: {
          effort: riskAssessment.complexity,
          prerequisites: [
            'Enhanced coordination protocols',
            'Quality control procedures',
            'Risk mitigation plan'
          ],
          timeline: 2,
          cost: costImpact
        },
        priority: this.calculateActionPriority(durationSaving, costImpact, riskAssessment.riskLevel)
      });
    });
    
    return actions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Schedule Crashing Analysis
   */
  public analyzeScheduleCrashing(
    activities: ScheduleActivityEntity[],
    targetReduction: number
  ): OptimizationAction[] {
    const actions: OptimizationAction[] = [];
    const criticalPath = this.calculateCriticalPath(activities);
    
    // Analyze crashing opportunities for critical activities
    criticalPath.criticalActivities.forEach(activityId => {
      const activity = activities.find(a => a.id === activityId);
      if (!activity) return;
      
      const crashingOptions = this.analyzeCrashingOptions(activity);
      
      crashingOptions.forEach(option => {
        actions.push({
          type: 'crashing',
          description: `Add resources to crash ${activity.name}`,
          affectedActivities: [activity.id],
          impact: {
            durationChange: -option.durationReduction,
            costChange: option.additionalCost,
            qualityImpact: option.qualityImpact,
            riskLevel: option.riskLevel
          },
          implementation: {
            effort: option.implementationEffort,
            prerequisites: option.prerequisites,
            timeline: 1,
            cost: option.additionalCost
          },
          priority: this.calculateCrashingPriority(option, targetReduction)
        });
      });
    });
    
    return actions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * What-If Scenario Analysis
   */
  public analyzeWhatIfScenarios(
    activities: ScheduleActivityEntity[],
    scenarios: {
      name: string;
      description: string;
      changes: {
        activityId: string;
        durationChange?: number;
        costChange?: number;
        resourceChange?: any;
        dateChange?: Date;
      }[];
    }[]
  ): any[] {
    return scenarios.map(scenario => {
      // Apply scenario changes
      const modifiedActivities = this.applyScenarioChanges(activities, scenario.changes);
      
      // Recalculate schedule
      const updatedActivities = this.recalculateSchedule(modifiedActivities);
      
      // Calculate impact
      const originalMetrics = this.calculateScheduleMetrics(activities);
      const scenarioMetrics = this.calculateScheduleMetrics(updatedActivities);
      
      const impact = {
        durationImpact: scenarioMetrics.duration - originalMetrics.duration,
        costImpact: scenarioMetrics.cost - originalMetrics.cost,
        qualityImpact: scenarioMetrics.quality - originalMetrics.quality,
        resourceImpact: scenarioMetrics.resourceUtilization - originalMetrics.resourceUtilization
      };
      
      // Generate recommendations
      const recommendations = this.generateScenarioRecommendations(impact, scenario);
      
      return {
        scenario: scenario.name,
        description: scenario.description,
        impact,
        metrics: scenarioMetrics,
        recommendations,
        feasibility: this.assessScenarioFeasibility(updatedActivities),
        riskLevel: this.assessScenarioRisk(impact)
      };
    });
  }

  // Private helper methods
  
  private calculateEarlyTimes(activities: ScheduleActivityEntity[]): { [activityId: string]: { start: Date; finish: Date } } {
    const earlyTimes: { [activityId: string]: { start: Date; finish: Date } } = {};
    
    // Create a map for easy lookup
    const activityMap = new Map(activities.map(a => [a.id, a]));
    
    // Topological sort for forward pass
    const sortedActivities = this.topologicalSort(activities);
    
    sortedActivities.forEach(activity => {
      let earlyStart = activity.plannedStartDate;
      
      // Check predecessors
      if (activity.predecessors && activity.predecessors.length > 0) {
        const predecessorFinishes = activity.predecessors.map(pred => {
          const predActivity = activityMap.get(pred.activityId);
          if (predActivity && earlyTimes[pred.activityId]) {
            const predFinish = earlyTimes[pred.activityId].finish;
            return new Date(predFinish.getTime() + (pred.lagDays * 24 * 60 * 60 * 1000));
          }
          return activity.plannedStartDate;
        });
        
        earlyStart = new Date(Math.max(...predecessorFinishes.map(d => d.getTime())));
      }
      
      const earlyFinish = new Date(earlyStart.getTime() + (activity.plannedDurationDays * 24 * 60 * 60 * 1000));
      
      earlyTimes[activity.id] = { start: earlyStart, finish: earlyFinish };
    });
    
    return earlyTimes;
  }

  private calculateLateTimes(
    activities: ScheduleActivityEntity[],
    earlyTimes: { [activityId: string]: { start: Date; finish: Date } }
  ): { [activityId: string]: { start: Date; finish: Date } } {
    const lateTimes: { [activityId: string]: { start: Date; finish: Date } } = {};
    
    // Find project completion date
    const projectFinish = new Date(Math.max(...Object.values(earlyTimes).map(et => et.finish.getTime())));
    
    // Create activity map and reverse dependency map
    const activityMap = new Map(activities.map(a => [a.id, a]));
    const successorMap = new Map<string, { activityId: string; dependencyType: string; lagDays: number }[]>();
    
    activities.forEach(activity => {
      if (activity.predecessors) {
        activity.predecessors.forEach(pred => {
          if (!successorMap.has(pred.activityId)) {
            successorMap.set(pred.activityId, []);
          }
          successorMap.get(pred.activityId)!.push({
            activityId: activity.id,
            dependencyType: pred.dependencyType,
            lagDays: pred.lagDays
          });
        });
      }
    });
    
    // Backward pass
    const reverseSortedActivities = [...activities].reverse();
    
    reverseSortedActivities.forEach(activity => {
      let lateFinish = projectFinish;
      
      // Check successors
      const successors = successorMap.get(activity.id);
      if (successors && successors.length > 0) {
        const successorStarts = successors.map(succ => {
          if (lateTimes[succ.activityId]) {
            const succStart = lateTimes[succ.activityId].start;
            return new Date(succStart.getTime() - (succ.lagDays * 24 * 60 * 60 * 1000));
          }
          return projectFinish;
        });
        
        lateFinish = new Date(Math.min(...successorStarts.map(d => d.getTime())));
      }
      
      const lateStart = new Date(lateFinish.getTime() - (activity.plannedDurationDays * 24 * 60 * 60 * 1000));
      
      lateTimes[activity.id] = { start: lateStart, finish: lateFinish };
    });
    
    return lateTimes;
  }

  private calculateFloats(
    activities: ScheduleActivityEntity[],
    earlyTimes: { [activityId: string]: { start: Date; finish: Date } },
    lateTimes: { [activityId: string]: { start: Date; finish: Date } }
  ): { totalFloat: { [activityId: string]: number }; freeFloat: { [activityId: string]: number } } {
    const totalFloat: { [activityId: string]: number } = {};
    const freeFloat: { [activityId: string]: number } = {};
    
    activities.forEach(activity => {
      // Total Float = Late Start - Early Start
      totalFloat[activity.id] = Math.max(0, 
        (lateTimes[activity.id].start.getTime() - earlyTimes[activity.id].start.getTime()) / (24 * 60 * 60 * 1000)
      );
      
      // Free Float calculation (simplified)
      freeFloat[activity.id] = Math.min(totalFloat[activity.id], 
        this.calculateFreeFloatForActivity(activity, activities, earlyTimes)
      );
    });
    
    return { totalFloat, freeFloat };
  }

  private calculateFreeFloatForActivity(
    activity: ScheduleActivityEntity,
    activities: ScheduleActivityEntity[],
    earlyTimes: { [activityId: string]: { start: Date; finish: Date } }
  ): number {
    // Find immediate successors
    const successors = activities.filter(a => 
      a.predecessors?.some(p => p.activityId === activity.id)
    );
    
    if (successors.length === 0) return 0;
    
    const activityEarlyFinish = earlyTimes[activity.id].finish;
    const earliestSuccessorStart = new Date(Math.min(...successors.map(s => earlyTimes[s.id].start.getTime())));
    
    return Math.max(0, (earliestSuccessorStart.getTime() - activityEarlyFinish.getTime()) / (24 * 60 * 60 * 1000));
  }

  private topologicalSort(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    const sorted: ScheduleActivityEntity[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const activityMap = new Map(activities.map(a => [a.id, a]));
    
    const visit = (activityId: string) => {
      if (visiting.has(activityId)) {
        throw new Error(`Circular dependency detected involving activity ${activityId}`);
      }
      
      if (visited.has(activityId)) return;
      
      visiting.add(activityId);
      
      const activity = activityMap.get(activityId);
      if (activity?.predecessors) {
        activity.predecessors.forEach(pred => {
          visit(pred.activityId);
        });
      }
      
      visiting.delete(activityId);
      visited.add(activityId);
      
      if (activity) {
        sorted.push(activity);
      }
    };
    
    activities.forEach(activity => {
      if (!visited.has(activity.id)) {
        visit(activity.id);
      }
    });
    
    return sorted;
  }

  private calculateCriticalityIndex(
    activities: ScheduleActivityEntity[],
    floats: { totalFloat: { [activityId: string]: number }; freeFloat: { [activityId: string]: number } }
  ): { [activityId: string]: number } {
    const criticalityIndex: { [activityId: string]: number } = {};
    
    // Find maximum total float
    const maxFloat = Math.max(...Object.values(floats.totalFloat));
    
    activities.forEach(activity => {
      // Criticality index: inverse of total float normalized to 0-1
      if (maxFloat === 0) {
        criticalityIndex[activity.id] = 1; // All activities are critical
      } else {
        criticalityIndex[activity.id] = 1 - (floats.totalFloat[activity.id] / maxFloat);
      }
    });
    
    return criticalityIndex;
  }

  private identifyNearCriticalPaths(
    activities: ScheduleActivityEntity[],
    floats: { totalFloat: { [activityId: string]: number }; freeFloat: { [activityId: string]: number } }
  ): { activities: string[]; totalFloat: number; riskLevel: 'low' | 'medium' | 'high' }[] {
    const nearCriticalPaths: { activities: string[]; totalFloat: number; riskLevel: 'low' | 'medium' | 'high' }[] = [];
    
    // Group activities by similar total float values
    const floatGroups = new Map<number, string[]>();
    
    Object.entries(floats.totalFloat).forEach(([activityId, totalFloat]) => {
      const roundedFloat = Math.round(totalFloat);
      if (!floatGroups.has(roundedFloat)) {
        floatGroups.set(roundedFloat, []);
      }
      floatGroups.get(roundedFloat)!.push(activityId);
    });
    
    // Consider paths with total float <= 5 days as near-critical
    floatGroups.forEach((activityIds, totalFloat) => {
      if (totalFloat > 0 && totalFloat <= 5 && activityIds.length > 1) {
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        
        if (totalFloat <= 1) riskLevel = 'high';
        else if (totalFloat <= 3) riskLevel = 'medium';
        
        nearCriticalPaths.push({
          activities: activityIds,
          totalFloat,
          riskLevel
        });
      }
    });
    
    return nearCriticalPaths.sort((a, b) => a.totalFloat - b.totalFloat);
  }

  private generateOptimizationAlternatives(
    activities: ScheduleActivityEntity[],
    constraints: OptimizationConstraints
  ): ScheduleActivityEntity[][] {
    const alternatives: ScheduleActivityEntity[][] = [];
    
    // Base alternative (original schedule)
    alternatives.push([...activities]);
    
    // Fast-tracking alternative
    alternatives.push(this.generateFastTrackingAlternative(activities));
    
    // Resource-optimized alternative
    alternatives.push(this.generateResourceOptimizedAlternative(activities, constraints));
    
    // Quality-focused alternative
    alternatives.push(this.generateQualityFocusedAlternative(activities, constraints));
    
    // Crash alternative
    alternatives.push(this.generateCrashAlternative(activities));
    
    // Balanced alternative
    alternatives.push(this.generateBalancedAlternative(activities, constraints));
    
    return alternatives;
  }

  private generateFastTrackingAlternative(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    const alternative = [...activities];
    const overlappingCandidates = this.findOverlappingCandidates(alternative);
    
    // Apply fast-tracking to viable candidates
    overlappingCandidates.forEach(candidate => {
      const riskAssessment = this.assessFastTrackingRisk(candidate);
      if (riskAssessment.riskLevel !== 'high') {
        // Overlap activities by 50% of predecessor's duration
        const overlapDays = Math.floor(candidate.predecessor.plannedDurationDays * 0.5);
        const newStartDate = new Date(
          candidate.predecessor.plannedStartDate.getTime() + 
          (overlapDays * 24 * 60 * 60 * 1000)
        );
        
        const successorActivity = alternative.find(a => a.id === candidate.successor.id);
        if (successorActivity) {
          successorActivity.plannedStartDate = newStartDate;
          successorActivity.plannedEndDate = new Date(
            newStartDate.getTime() + 
            (successorActivity.plannedDurationDays * 24 * 60 * 60 * 1000)
          );
        }
      }
    });
    
    return alternative;
  }

  private generateResourceOptimizedAlternative(
    activities: ScheduleActivityEntity[],
    constraints: OptimizationConstraints
  ): ScheduleActivityEntity[] {
    const alternative = [...activities];
    
    // Apply resource leveling
    const levelingResult = this.levelResources(alternative, this.getResourceLimits(constraints));
    
    return levelingResult.leveledSchedule;
  }

  private generateQualityFocusedAlternative(
    activities: ScheduleActivityEntity[],
    constraints: OptimizationConstraints
  ): ScheduleActivityEntity[] {
    const alternative = [...activities];
    
    // Add quality buffers and inspection time
    alternative.forEach(activity => {
      const qualityReq = constraints.qualityRequirements.find(q => q.activityId === activity.id);
      if (qualityReq) {
        // Ensure minimum duration for quality
        activity.plannedDurationDays = Math.max(activity.plannedDurationDays, qualityReq.minDuration);
        // Add inspection time
        activity.plannedDurationDays += qualityReq.inspectionTime;
        // Update end date
        activity.plannedEndDate = new Date(
          activity.plannedStartDate.getTime() + 
          (activity.plannedDurationDays * 24 * 60 * 60 * 1000)
        );
      }
    });
    
    return alternative;
  }

  private generateCrashAlternative(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    const alternative = [...activities];
    const criticalPath = this.calculateCriticalPath(alternative);
    
    // Apply crashing to critical activities
    criticalPath.criticalActivities.forEach(activityId => {
      const activity = alternative.find(a => a.id === activityId);
      if (activity) {
        // Reduce duration by 20% (simulate adding resources)
        const originalDuration = activity.plannedDurationDays;
        activity.plannedDurationDays = Math.max(1, Math.floor(originalDuration * 0.8));
        activity.plannedEndDate = new Date(
          activity.plannedStartDate.getTime() + 
          (activity.plannedDurationDays * 24 * 60 * 60 * 1000)
        );
        // Increase cost proportionally
        activity.plannedTotalCost *= 1.3;
      }
    });
    
    return alternative;
  }

  private generateBalancedAlternative(
    activities: ScheduleActivityEntity[],
    constraints: OptimizationConstraints
  ): ScheduleActivityEntity[] {
    const alternative = [...activities];
    
    // Apply moderate fast-tracking
    const overlappingCandidates = this.findOverlappingCandidates(alternative);
    overlappingCandidates
      .filter(candidate => this.assessFastTrackingRisk(candidate).riskLevel === 'low')
      .slice(0, 2) // Only apply to 2 lowest-risk candidates
      .forEach(candidate => {
        const overlapDays = Math.floor(candidate.predecessor.plannedDurationDays * 0.25);
        const successorActivity = alternative.find(a => a.id === candidate.successor.id);
        if (successorActivity) {
          const newStartDate = new Date(
            candidate.predecessor.plannedStartDate.getTime() + 
            (overlapDays * 24 * 60 * 60 * 1000)
          );
          successorActivity.plannedStartDate = newStartDate;
          successorActivity.plannedEndDate = new Date(
            newStartDate.getTime() + 
            (successorActivity.plannedDurationDays * 24 * 60 * 60 * 1000)
          );
        }
      });
    
    // Apply light resource optimization
    const resourceProfile = this.generateResourceProfile(alternative);
    const minorPeaks = this.identifyResourcePeaks(resourceProfile, this.getResourceLimits(constraints))
      .filter(peak => peak.overallocation <= 2);
      
    this.redistributeActivitiesAroundPeaks(alternative, minorPeaks);
    
    return alternative;
  }

  private evaluateSchedule(
    activities: ScheduleActivityEntity[],
    objective: OptimizationObjective,
    constraints: OptimizationConstraints
  ): number {
    const metrics = this.calculateScheduleMetrics(activities);
    
    // Normalize metrics (0-100 scale)
    const normalizedDuration = Math.max(0, 100 - (metrics.duration / constraints.maxProjectDuration * 100));
    const normalizedCost = Math.max(0, 100 - (metrics.cost / constraints.maxBudget * 100));
    const normalizedQuality = metrics.quality;
    const normalizedResources = metrics.resourceUtilization;
    
    // Calculate weighted score
    const totalWeight = objective.minimizeTime + objective.minimizeCost + 
                       objective.maximizeQuality + objective.balanceResources;
    
    if (totalWeight === 0) return 0;
    
    const score = (
      normalizedDuration * (objective.minimizeTime / totalWeight) +
      normalizedCost * (objective.minimizeCost / totalWeight) +
      normalizedQuality * (objective.maximizeQuality / totalWeight) +
      normalizedResources * (objective.balanceResources / totalWeight)
    ) * 100;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateScheduleMetrics(activities: ScheduleActivityEntity[]): {
    duration: number;
    cost: number;
    quality: number;
    resourceUtilization: number;
  } {
    // Calculate project duration
    const projectStart = Math.min(...activities.map(a => a.plannedStartDate.getTime()));
    const projectEnd = Math.max(...activities.map(a => a.plannedEndDate.getTime()));
    const duration = (projectEnd - projectStart) / (24 * 60 * 60 * 1000);
    
    // Calculate total cost
    const cost = activities.reduce((sum, activity) => sum + activity.plannedTotalCost, 0);
    
    // Calculate quality score (simplified)
    const quality = this.calculateQualityScore(activities);
    
    // Calculate resource utilization
    const resourceUtilization = this.calculateResourceUtilizationScore(activities);
    
    return { duration, cost, quality, resourceUtilization };
  }

  private calculateQualityScore(activities: ScheduleActivityEntity[]): number {
    // Quality score based on whether activities have sufficient time
    let totalScore = 0;
    let count = 0;
    
    activities.forEach(activity => {
      // Assume minimum viable duration is 70% of planned
      const minViableDuration = activity.plannedDurationDays * 0.7;
      const score = Math.min(100, (activity.plannedDurationDays / minViableDuration) * 80);
      totalScore += score;
      count++;
    });
    
    return count > 0 ? totalScore / count : 80;
  }

  private calculateResourceUtilizationScore(activities: ScheduleActivityEntity[]): number {
    const resourceProfile = this.generateResourceProfile(activities);
    
    // Calculate variance in resource utilization
    const utilizationValues = resourceProfile.map(day => {
      const dayUtilization = Object.values(day.resources).reduce((sum: number, resource: any) => {
        return sum + (resource.utilization || 0);
      }, 0);
      return dayUtilization / Math.max(1, Object.keys(day.resources).length);
    });
    
    if (utilizationValues.length === 0) return 50;
    
    const average = utilizationValues.reduce((sum, val) => sum + val, 0) / utilizationValues.length;
    const variance = utilizationValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / utilizationValues.length;
    
    // Lower variance = better score, optimal utilization around 80%
    const utilizationScore = Math.max(0, 100 - Math.abs(average - 80));
    const varianceScore = Math.max(0, 100 - variance);
    
    return (utilizationScore + varianceScore) / 2;
  }

  private calculateFeasibilityScore(
    activities: ScheduleActivityEntity[],
    constraints: OptimizationConstraints
  ): number {
    let score = 100;
    
    // Check duration constraint
    const projectDuration = this.calculateScheduleMetrics(activities).duration;
    if (projectDuration > constraints.maxProjectDuration) {
      score -= Math.min(30, (projectDuration - constraints.maxProjectDuration) / constraints.maxProjectDuration * 100);
    }
    
    // Check budget constraint
    const projectCost = this.calculateScheduleMetrics(activities).cost;
    if (projectCost > constraints.maxBudget) {
      score -= Math.min(30, (projectCost - constraints.maxBudget) / constraints.maxBudget * 100);
    }
    
    // Check resource constraints
    const resourceProfile = this.generateResourceProfile(activities);
    const resourceLimits = this.getResourceLimits(constraints);
    const overallocations = this.identifyResourcePeaks(resourceProfile, resourceLimits);
    score -= Math.min(25, overallocations.length * 5);
    
    // Check fixed milestone constraints
    constraints.fixedMilestones.forEach(milestone => {
      const activity = activities.find(a => a.id === milestone.activityId);
      if (activity) {
        const dateDifference = Math.abs(activity.plannedEndDate.getTime() - milestone.date.getTime()) / (24 * 60 * 60 * 1000);
        if (dateDifference > milestone.flexibility) {
          score -= Math.min(10, dateDifference - milestone.flexibility);
        }
      }
    });
    
    return Math.max(0, score);
  }

  private generateOptimizationActions(
    originalActivities: ScheduleActivityEntity[],
    optimizedActivities: ScheduleActivityEntity[]
  ): OptimizationAction[] {
    const actions: OptimizationAction[] = [];
    
    // Compare schedules to identify changes
    originalActivities.forEach((original, index) => {
      const optimized = optimizedActivities[index];
      if (!optimized) return;
      
      // Duration changes
      if (original.plannedDurationDays !== optimized.plannedDurationDays) {
        const durationChange = optimized.plannedDurationDays - original.plannedDurationDays;
        actions.push({
          type: 'duration_adjustment',
          description: `Adjust ${original.name} duration from ${original.plannedDurationDays} to ${optimized.plannedDurationDays} days`,
          affectedActivities: [original.id],
          impact: {
            durationChange,
            costChange: optimized.plannedTotalCost - original.plannedTotalCost,
            qualityImpact: durationChange < 0 ? 'Monitor quality closely' : 'Quality maintained',
            riskLevel: Math.abs(durationChange) > 2 ? 'medium' : 'low'
          },
          implementation: {
            effort: Math.abs(durationChange) > 5 ? 'high' : 'medium',
            prerequisites: ['Resource reallocation', 'Stakeholder approval'],
            timeline: 1,
            cost: Math.abs(optimized.plannedTotalCost - original.plannedTotalCost)
          },
          priority: this.calculateActionPriority(Math.abs(durationChange), Math.abs(optimized.plannedTotalCost - original.plannedTotalCost), 'medium')
        });
      }
      
      // Start date changes (indicating sequencing changes)
      if (original.plannedStartDate.getTime() !== optimized.plannedStartDate.getTime()) {
        const daysDifference = (optimized.plannedStartDate.getTime() - original.plannedStartDate.getTime()) / (24 * 60 * 60 * 1000);
        actions.push({
          type: 'sequence_change',
          description: `Reschedule ${original.name} by ${Math.abs(daysDifference)} days`,
          affectedActivities: [original.id],
          impact: {
            durationChange: daysDifference,
            costChange: 0,
            qualityImpact: 'Schedule coordination required',
            riskLevel: Math.abs(daysDifference) > 5 ? 'medium' : 'low'
          },
          implementation: {
            effort: 'low',
            prerequisites: ['Resource coordination', 'Dependency verification'],
            timeline: 1,
            cost: 0
          },
          priority: this.calculateActionPriority(Math.abs(daysDifference), 0, 'low')
        });
      }
    });
    
    return actions.sort((a, b) => b.priority - a.priority);
  }

  private analyzeOptimizationRisks(
    activities: ScheduleActivityEntity[],
    actions: OptimizationAction[]
  ): OptimizationRisk[] {
    const risks: OptimizationRisk[] = [];
    
    // Schedule compression risks
    const compressionActions = actions.filter(a => a.impact.durationChange < 0);
    if (compressionActions.length > 0) {
      risks.push({
        id: 'schedule_compression',
        description: 'Aggressive schedule compression may impact quality and increase costs',
        probability: Math.min(90, compressionActions.length * 20),
        impact: compressionActions.length > 3 ? 'high' : 'medium',
        category: 'schedule',
        mitigation: 'Implement enhanced quality control measures and regular progress monitoring',
        contingencyPlan: 'Prepare additional resources and quality inspection protocols'
      });
    }
    
    // Resource overallocation risks
    const resourceProfile = this.generateResourceProfile(activities);
    const overallocations = this.identifyResourcePeaks(resourceProfile, {});
    if (overallocations.length > 0) {
      risks.push({
        id: 'resource_overallocation',
        description: 'Resource overallocation may cause delays and increased costs',
        probability: Math.min(80, overallocations.length * 15),
        impact: overallocations.length > 5 ? 'high' : 'medium',
        category: 'resource',
        mitigation: 'Secure additional resources or reschedule conflicting activities',
        contingencyPlan: 'Identify subcontracting opportunities and backup resources'
      });
    }
    
    // Fast-tracking risks
    const fastTrackActions = actions.filter(a => a.type === 'fast_tracking');
    if (fastTrackActions.length > 0) {
      risks.push({
        id: 'fast_tracking_coordination',
        description: 'Parallel execution increases coordination complexity and rework risk',
        probability: 60,
        impact: 'medium',
        category: 'quality',
        mitigation: 'Enhance communication protocols and implement daily coordination meetings',
        contingencyPlan: 'Prepare for potential rework and maintain buffer time'
      });
    }
    
    // External dependency risks
    const externalActivities = activities.filter(a => 
      a.environmentalFactors?.weatherSensitive || 
      a.name.toLowerCase().includes('permit') ||
      a.name.toLowerCase().includes('approval')
    );
    if (externalActivities.length > 0) {
      risks.push({
        id: 'external_dependencies',
        description: 'External factors (weather, permits, approvals) may impact optimized schedule',
        probability: 45,
        impact: 'medium',
        category: 'external',
        mitigation: 'Build flexibility into external-dependent activities and maintain alternative plans',
        contingencyPlan: 'Prepare alternative activity sequences and resource allocation'
      });
    }
    
    return risks.sort((a, b) => b.probability - a.probability);
  }

  private findOverlappingCandidates(activities: ScheduleActivityEntity[]): {
    predecessor: ScheduleActivityEntity;
    successor: ScheduleActivityEntity;
  }[] {
    const candidates: { predecessor: ScheduleActivityEntity; successor: ScheduleActivityEntity }[] = [];
    
    activities.forEach(activity => {
      if (activity.predecessors) {
        activity.predecessors.forEach(pred => {
          const predecessor = activities.find(a => a.id === pred.activityId);
          if (predecessor && pred.dependencyType === 'FS') {
            // Only consider Finish-to-Start dependencies for fast-tracking
            candidates.push({ predecessor, successor: activity });
          }
        });
      }
    });
    
    return candidates;
  }

  private assessFastTrackingRisk(candidate: {
    predecessor: ScheduleActivityEntity;
    successor: ScheduleActivityEntity;
  }): {
    riskLevel: 'low' | 'medium' | 'high';
    qualityImpact: string;
    complexity: 'low' | 'medium' | 'high';
  } {
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let complexity: 'low' | 'medium' | 'high' = 'low';
    let qualityImpact = 'Minimal quality impact expected';
    
    // Assess based on activity types and characteristics
    const predName = candidate.predecessor.name.toLowerCase();
    const succName = candidate.successor.name.toLowerCase();
    
    // High-risk combinations
    if ((predName.includes('concrete') && succName.includes('formwork')) ||
        (predName.includes('foundation') && succName.includes('structure')) ||
        (predName.includes('design') && succName.includes('construction'))) {
      riskLevel = 'high';
      complexity = 'high';
      qualityImpact = 'Significant rework risk - quality controls essential';
    }
    // Medium-risk combinations
    else if ((predName.includes('excavation') && succName.includes('foundation')) ||
             (predName.includes('structure') && succName.includes('finish'))) {
      riskLevel = 'medium';
      complexity = 'medium';
      qualityImpact = 'Coordination required - monitor quality checkpoints';
    }
    
    // Consider activity priority
    if (candidate.predecessor.priority === ActivityPriority.CRITICAL || candidate.successor.priority === ActivityPriority.CRITICAL) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }
    
    return { riskLevel, qualityImpact, complexity };
  }

  private calculateFastTrackingDurationSaving(candidate: {
    predecessor: ScheduleActivityEntity;
    successor: ScheduleActivityEntity;
  }): number {
    // Estimate duration saving based on possible overlap
    const overlapPotential = Math.min(
      candidate.predecessor.plannedDurationDays * 0.6, // Max 60% overlap
      candidate.successor.plannedDurationDays * 0.8    // Max 80% of successor can be overlapped
    );
    
    return Math.floor(overlapPotential);
  }

  private calculateFastTrackingCostImpact(candidate: {
    predecessor: ScheduleActivityEntity;
    successor: ScheduleActivityEntity;
  }): number {
    // Fast-tracking may increase costs due to coordination overhead
    const coordinationCost = (candidate.predecessor.plannedTotalCost + candidate.successor.plannedTotalCost) * 0.05;
    
    return coordinationCost;
  }

  private analyzeCrashingOptions(activity: ScheduleActivityEntity): {
    durationReduction: number;
    additionalCost: number;
    qualityImpact: string;
    riskLevel: 'low' | 'medium' | 'high';
    implementationEffort: 'low' | 'medium' | 'high';
    prerequisites: string[];
  }[] {
    const options = [];
    
    // Option 1: Add 25% more resources
    options.push({
      durationReduction: Math.floor(activity.plannedDurationDays * 0.15),
      additionalCost: activity.plannedTotalCost * 0.25,
      qualityImpact: 'Quality maintained with proper management',
      riskLevel: 'low' as const,
      implementationEffort: 'medium' as const,
      prerequisites: ['Additional workforce availability', 'Equipment capacity']
    });
    
    // Option 2: Add 50% more resources
    options.push({
      durationReduction: Math.floor(activity.plannedDurationDays * 0.25),
      additionalCost: activity.plannedTotalCost * 0.45,
      qualityImpact: 'Increased coordination required',
      riskLevel: 'medium' as const,
      implementationEffort: 'high' as const,
      prerequisites: ['Significant additional resources', 'Enhanced management', 'Quality control measures']
    });
    
    // Option 3: Overtime work
    options.push({
      durationReduction: Math.floor(activity.plannedDurationDays * 0.1),
      additionalCost: activity.plannedTotalCost * 0.15,
      qualityImpact: 'Monitor for fatigue-related quality issues',
      riskLevel: 'medium' as const,
      implementationEffort: 'low' as const,
      prerequisites: ['Worker agreement', 'Overtime regulations compliance']
    });
    
    return options;
  }

  private calculateActionPriority(
    durationImpact: number,
    costImpact: number,
    riskLevel: 'low' | 'medium' | 'high'
  ): number {
    let priority = 0;
    
    // Duration impact weight
    priority += Math.min(40, durationImpact * 5);
    
    // Cost impact weight (inverse)
    priority += Math.max(0, 30 - (costImpact / 1000));
    
    // Risk penalty
    const riskPenalty = { low: 0, medium: 10, high: 20 };
    priority -= riskPenalty[riskLevel];
    
    return Math.max(1, Math.min(10, Math.round(priority / 10)));
  }

  private calculateCrashingPriority(
    option: {
      durationReduction: number;
      additionalCost: number;
      riskLevel: 'low' | 'medium' | 'high';
    },
    targetReduction: number
  ): number {
    let priority = 0;
    
    // How well does this option meet the target?
    const targetMatch = Math.min(100, (option.durationReduction / targetReduction) * 100);
    priority += targetMatch * 0.4;
    
    // Cost efficiency (duration saved per cost unit)
    const efficiency = option.durationReduction / Math.max(1, option.additionalCost / 1000);
    priority += Math.min(30, efficiency * 10);
    
    // Risk penalty
    const riskPenalty = { low: 0, medium: 15, high: 30 };
    priority -= riskPenalty[option.riskLevel];
    
    return Math.max(1, Math.min(10, Math.round(priority / 10)));
  }

  // Additional helper methods for resource management
  
  private generateResourceProfile(activities: ScheduleActivityEntity[]): {
    date: Date;
    resources: {
      [resourceType: string]: {
        required: number;
        available: number;
        utilization: number;
        overallocation: number;
      };
    };
  }[] {
    const profile: {
      date: Date;
      resources: {
        [resourceType: string]: {
          required: number;
          available: number;
          utilization: number;
          overallocation: number;
        };
      };
    }[] = [];
    
    // Find project date range
    const startDates = activities.map(a => a.plannedStartDate.getTime());
    const endDates = activities.map(a => a.plannedEndDate.getTime());
    const projectStart = new Date(Math.min(...startDates));
    const projectEnd = new Date(Math.max(...endDates));
    
    // Generate daily profile
    for (let date = new Date(projectStart); date <= projectEnd; date.setDate(date.getDate() + 1)) {
      const dayProfile = {
        date: new Date(date),
        resources: {} as { [resourceType: string]: { required: number; available: number; utilization: number; overallocation: number } }
      };
      
      // Calculate resource demand for this day
      activities.forEach(activity => {
        if (date >= activity.plannedStartDate && date <= activity.plannedEndDate) {
          const resourceType = activity.primaryTrade;
          
          if (!dayProfile.resources[resourceType]) {
            dayProfile.resources[resourceType] = {
              required: 0,
              available: 10, // Default available capacity
              utilization: 0,
              overallocation: 0
            };
          }
          
          dayProfile.resources[resourceType].required += 1;
        }
      });
      
      // Calculate utilization and overallocation
      Object.values(dayProfile.resources).forEach(resource => {
        resource.utilization = Math.min(100, (resource.required / resource.available) * 100);
        resource.overallocation = Math.max(0, resource.required - resource.available);
      });
      
      profile.push(dayProfile);
    }
    
    return profile;
  }

  private identifyResourcePeaks(
    resourceProfile: {
      date: Date;
      resources: {
        [resourceType: string]: {
          required: number;
          available: number;
          utilization: number;
          overallocation: number;
        };
      };
    }[],
    resourceLimits: { [resourceType: string]: number }
  ): {
    resourceType: string;
    date: Date;
    overallocation: number;
    severity: 'low' | 'medium' | 'high';
  }[] {
    const peaks: {
      resourceType: string;
      date: Date;
      overallocation: number;
      severity: 'low' | 'medium' | 'high';
    }[] = [];
    
    resourceProfile.forEach(day => {
      Object.entries(day.resources).forEach(([resourceType, resource]) => {
        if (resource.overallocation > 0) {
          let severity: 'low' | 'medium' | 'high' = 'low';
          
          if (resource.overallocation > 3) severity = 'high';
          else if (resource.overallocation > 1) severity = 'medium';
          
          peaks.push({
            resourceType,
            date: day.date,
            overallocation: resource.overallocation,
            severity
          });
        }
      });
    });
    
    return peaks;
  }

  private getResourceLimits(constraints: OptimizationConstraints): { [resourceType: string]: number } {
    const limits: { [resourceType: string]: number } = {};
    
    // Extract resource limits from workforce and equipment
    constraints.availableWorkforce.forEach(worker => {
      const trade = worker.primaryTrade;
      limits[trade] = (limits[trade] || 0) + 1;
    });
    
    constraints.availableEquipment.forEach(equipment => {
      const type = equipment.type;
      limits[type] = (limits[type] || 0) + 1;
    });
    
    return limits;
  }

  private applyResourceSmoothing(
    activities: ScheduleActivityEntity[],
    resourceLimits: { [resourceType: string]: number }
  ): ScheduleActivityEntity[] {
    const smoothedActivities = [...activities];
    const resourceProfile = this.generateResourceProfile(smoothedActivities);
    const peaks = this.identifyResourcePeaks(resourceProfile, resourceLimits);
    
    // Move activities with float to reduce peaks
    peaks.forEach(peak => {
      const affectedActivities = smoothedActivities.filter(activity => 
        activity.primaryTrade === peak.resourceType &&
        activity.plannedStartDate <= peak.date &&
        activity.plannedEndDate >= peak.date &&
        activity.totalFloat > 0
      );
      
      // Move some activities within their float
      affectedActivities
        .sort((a, b) => b.totalFloat - a.totalFloat) // Start with highest float
        .slice(0, Math.ceil(peak.overallocation))
        .forEach(activity => {
          const moveDays = Math.min(activity.totalFloat, 2);
          if (moveDays > 0) {
            activity.plannedStartDate = new Date(
              activity.plannedStartDate.getTime() + (moveDays * 24 * 60 * 60 * 1000)
            );
            activity.plannedEndDate = new Date(
              activity.plannedEndDate.getTime() + (moveDays * 24 * 60 * 60 * 1000)
            );
            activity.totalFloat -= moveDays;
          }
        });
    });
    
    return smoothedActivities;
  }

  private applyResourceLimitedScheduling(
    activities: ScheduleActivityEntity[],
    resourceLimits: { [resourceType: string]: number }
  ): ScheduleActivityEntity[] {
    const scheduledActivities = [...activities];
    const resourceCalendar = new Map<string, number>();
    
    // Sort activities by priority and early start date
    scheduledActivities.sort((a, b) => {
      if (a.isCriticalPath && !b.isCriticalPath) return -1;
      if (!a.isCriticalPath && b.isCriticalPath) return 1;
      return a.plannedStartDate.getTime() - b.plannedStartDate.getTime();
    });
    
    scheduledActivities.forEach(activity => {
      const resourceType = activity.primaryTrade;
      const resourceLimit = resourceLimits[resourceType] || 5; // Default limit
      
      // Find first available date for this resource
      let startDate = activity.plannedStartDate;
      
      while (!this.isResourceAvailable(resourceCalendar, resourceType, startDate, activity.plannedDurationDays, resourceLimit)) {
        startDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000));
      }
      
      // Reserve resource and update activity dates
      this.reserveResource(resourceCalendar, resourceType, startDate, activity.plannedDurationDays);
      
      activity.plannedStartDate = startDate;
      activity.plannedEndDate = new Date(
        startDate.getTime() + (activity.plannedDurationDays * 24 * 60 * 60 * 1000)
      );
    });
    
    return scheduledActivities;
  }

  private isResourceAvailable(
    resourceCalendar: Map<string, number>,
    resourceType: string,
    startDate: Date,
    duration: number,
    limit: number
  ): boolean {
    for (let i = 0; i < duration; i++) {
      const checkDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateKey = `${resourceType}_${checkDate.toISOString().split('T')[0]}`;
      const used = resourceCalendar.get(dateKey) || 0;
      
      if (used >= limit) {
        return false;
      }
    }
    
    return true;
  }

  private reserveResource(
    resourceCalendar: Map<string, number>,
    resourceType: string,
    startDate: Date,
    duration: number
  ): void {
    for (let i = 0; i < duration; i++) {
      const reserveDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateKey = `${resourceType}_${reserveDate.toISOString().split('T')[0]}`;
      const current = resourceCalendar.get(dateKey) || 0;
      resourceCalendar.set(dateKey, current + 1);
    }
  }

  private calculatePeakReduction(
    initialPeaks: { overallocation: number }[],
    finalPeaks: { overallocation: number }[]
  ): number {
    const initialTotal = initialPeaks.reduce((sum, peak) => sum + peak.overallocation, 0);
    const finalTotal = finalPeaks.reduce((sum, peak) => sum + peak.overallocation, 0);
    
    return initialTotal > 0 ? ((initialTotal - finalTotal) / initialTotal) * 100 : 0;
  }

  private calculateUtilizationImprovement(
    initialProfile: any[],
    finalProfile: any[]
  ): number {
    // Calculate coefficient of variation improvement
    const calculateCV = (profile: any[]) => {
      const utilizationValues = profile.map(day => {
        const totalUtil = Object.values(day.resources).reduce((sum: number, resource: any) => 
          sum + (resource.utilization || 0), 0);
        return totalUtil / Math.max(1, Object.keys(day.resources).length);
      });
      
      if (utilizationValues.length === 0) return 1;
      
      const mean = utilizationValues.reduce((sum, val) => sum + val, 0) / utilizationValues.length;
      const variance = utilizationValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / utilizationValues.length;
      
      return mean > 0 ? Math.sqrt(variance) / mean : 1;
    };
    
    const initialCV = calculateCV(initialProfile);
    const finalCV = calculateCV(finalProfile);
    
    return initialCV > 0 ? ((initialCV - finalCV) / initialCV) * 100 : 0;
  }

  private calculateDurationImpact(
    originalActivities: ScheduleActivityEntity[],
    leveledActivities: ScheduleActivityEntity[]
  ): number {
    const originalDuration = this.calculateScheduleMetrics(originalActivities).duration;
    const leveledDuration = this.calculateScheduleMetrics(leveledActivities).duration;
    
    return leveledDuration - originalDuration;
  }

  private calculateCostImpact(
    originalActivities: ScheduleActivityEntity[],
    leveledActivities: ScheduleActivityEntity[]
  ): number {
    const originalCost = this.calculateScheduleMetrics(originalActivities).cost;
    const leveledCost = this.calculateScheduleMetrics(leveledActivities).cost;
    
    return leveledCost - originalCost;
  }

  private generateResourceLevelingRecommendations(
    peaks: { resourceType: string; overallocation: number; severity: 'low' | 'medium' | 'high' }[],
    improvements: { peakReduction: number; utilizationImprovement: number; durationImpact: number; costImpact: number }
  ): string[] {
    const recommendations: string[] = [];
    
    if (peaks.length === 0) {
      recommendations.push('✅ Resource allocation is well balanced');
    } else {
      const criticalPeaks = peaks.filter(p => p.severity === 'high');
      if (criticalPeaks.length > 0) {
        recommendations.push(`⚠️ Consider hiring additional resources for: ${criticalPeaks.map(p => p.resourceType).join(', ')}`);
        recommendations.push('🔄 Evaluate subcontracting opportunities for peak demand periods');
      }
      
      const moderatePeaks = peaks.filter(p => p.severity === 'medium');
      if (moderatePeaks.length > 0) {
        recommendations.push('📅 Review activity sequences to reduce resource conflicts');
        recommendations.push('⏰ Consider overtime work during peak periods');
      }
    }
    
    if (improvements.durationImpact > 5) {
      recommendations.push(`⏳ Resource leveling added ${Math.round(improvements.durationImpact)} days to project duration`);
    }
    
    if (improvements.peakReduction > 20) {
      recommendations.push(`📊 Resource peak reduction: ${Math.round(improvements.peakReduction)}%`);
    }
    
    if (improvements.utilizationImprovement > 15) {
      recommendations.push(`📈 Resource utilization smoothing improved by ${Math.round(improvements.utilizationImprovement)}%`);
    }
    
    return recommendations;
  }

  private redistributeActivitiesAroundPeaks(
    activities: ScheduleActivityEntity[],
    peaks: { resourceType: string; date: Date; overallocation: number }[]
  ): void {
    peaks.forEach(peak => {
      const affectedActivities = activities.filter(activity => 
        activity.primaryTrade === peak.resourceType &&
        activity.plannedStartDate <= peak.date &&
        activity.plannedEndDate >= peak.date &&
        activity.totalFloat > 0
      );
      
      // Redistribute some activities
      const toMove = Math.min(affectedActivities.length, Math.ceil(peak.overallocation));
      
      affectedActivities
        .sort((a, b) => b.totalFloat - a.totalFloat)
        .slice(0, toMove)
        .forEach((activity, index) => {
          const direction = index % 2 === 0 ? -1 : 1; // Alternate moving before/after
          const moveDays = Math.min(activity.totalFloat, 1) * direction;
          
          if (moveDays !== 0) {
            activity.plannedStartDate = new Date(
              activity.plannedStartDate.getTime() + (moveDays * 24 * 60 * 60 * 1000)
            );
            activity.plannedEndDate = new Date(
              activity.plannedEndDate.getTime() + (moveDays * 24 * 60 * 60 * 1000)
            );
            activity.totalFloat -= Math.abs(moveDays);
          }
        });
    });
  }

  private applyScenarioChanges(
    activities: ScheduleActivityEntity[],
    changes: {
      activityId: string;
      durationChange?: number;
      costChange?: number;
      resourceChange?: any;
      dateChange?: Date;
    }[]
  ): ScheduleActivityEntity[] {
    const modifiedActivities = [...activities];
    
    changes.forEach(change => {
      const activity = modifiedActivities.find(a => a.id === change.activityId);
      if (!activity) return;
      
      if (change.durationChange) {
        activity.plannedDurationDays = Math.max(1, activity.plannedDurationDays + change.durationChange);
        activity.plannedEndDate = new Date(
          activity.plannedStartDate.getTime() + 
          (activity.plannedDurationDays * 24 * 60 * 60 * 1000)
        );
      }
      
      if (change.costChange) {
        activity.plannedTotalCost = Math.max(0, activity.plannedTotalCost + change.costChange);
      }
      
      if (change.dateChange) {
        activity.plannedStartDate = change.dateChange;
        activity.plannedEndDate = new Date(
          change.dateChange.getTime() + 
          (activity.plannedDurationDays * 24 * 60 * 60 * 1000)
        );
      }
    });
    
    return modifiedActivities;
  }

  private recalculateSchedule(activities: ScheduleActivityEntity[]): ScheduleActivityEntity[] {
    // Simple forward pass recalculation
    const recalculated = [...activities];
    const activityMap = new Map(recalculated.map(a => [a.id, a]));
    
    // Sort by dependencies
    const sorted = this.topologicalSort(recalculated);
    
    sorted.forEach(activity => {
      if (activity.predecessors && activity.predecessors.length > 0) {
        const latestPredFinish = activity.predecessors.reduce((latest, pred) => {
          const predActivity = activityMap.get(pred.activityId);
          if (predActivity) {
            const predFinish = new Date(
              predActivity.plannedEndDate.getTime() + 
              (pred.lagDays * 24 * 60 * 60 * 1000)
            );
            return predFinish > latest ? predFinish : latest;
          }
          return latest;
        }, new Date(0));
        
        if (latestPredFinish.getTime() > activity.plannedStartDate.getTime()) {
          activity.plannedStartDate = latestPredFinish;
          activity.plannedEndDate = new Date(
            latestPredFinish.getTime() + 
            (activity.plannedDurationDays * 24 * 60 * 60 * 1000)
          );
        }
      }
    });
    
    return recalculated;
  }

  private generateScenarioRecommendations(
    impact: {
      durationImpact: number;
      costImpact: number;
      qualityImpact: number;
      resourceImpact: number;
    },
    scenario: { name: string; description: string }
  ): string[] {
    const recommendations: string[] = [];
    
    if (impact.durationImpact > 5) {
      recommendations.push('⏳ Consider fast-tracking activities to mitigate schedule impact');
      recommendations.push('📋 Review critical path and optimize resource allocation');
    } else if (impact.durationImpact < -5) {
      recommendations.push('🎯 Utilize time savings for quality improvements or risk mitigation');
    }
    
    if (impact.costImpact > 10000) {
      recommendations.push('💰 Review budget allocation and seek cost optimization opportunities');
      recommendations.push('🔍 Analyze cost drivers and implement cost control measures');
    } else if (impact.costImpact < -10000) {
      recommendations.push('💡 Consider investing savings in project enhancements or contingency');
    }
    
    if (Math.abs(impact.resourceImpact) > 15) {
      recommendations.push('👥 Resource allocation requires significant adjustment');
      recommendations.push('📅 Consider phased implementation to manage resource changes');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Scenario has manageable impact on project parameters');
    }
    
    return recommendations;
  }

  private assessScenarioFeasibility(activities: ScheduleActivityEntity[]): number {
    let feasibility = 100;
    
    // Check for negative durations
    const negativeDurations = activities.filter(a => a.plannedDurationDays <= 0);
    feasibility -= negativeDurations.length * 20;
    
    // Check for logical date sequences
    const illogicalSequences = activities.filter(a => 
      a.plannedStartDate >= a.plannedEndDate
    );
    feasibility -= illogicalSequences.length * 15;
    
    // Check for resource overallocations
    const resourceProfile = this.generateResourceProfile(activities);
    const overallocations = this.identifyResourcePeaks(resourceProfile, {});
    feasibility -= Math.min(30, overallocations.length * 5);
    
    return Math.max(0, feasibility);
  }

  private assessScenarioRisk(impact: {
    durationImpact: number;
    costImpact: number;
    qualityImpact: number;
    resourceImpact: number;
  }): 'low' | 'medium' | 'high' {
    let riskScore = 0;
    
    riskScore += Math.abs(impact.durationImpact) > 10 ? 2 : Math.abs(impact.durationImpact) > 5 ? 1 : 0;
    riskScore += Math.abs(impact.costImpact) > 20000 ? 2 : Math.abs(impact.costImpact) > 10000 ? 1 : 0;
    riskScore += Math.abs(impact.resourceImpact) > 25 ? 2 : Math.abs(impact.resourceImpact) > 15 ? 1 : 0;
    
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }
}