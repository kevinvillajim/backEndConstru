// ===== ScheduleTemplateRepository.ts (Domain Interface) =====
import { ScheduleTemplateEntity, TemplateScope } from '../models/calculation/ScheduleTemplate';

export interface ScheduleTemplateRepository {
  findByFilters(filters: { constructionType: any; geographicalZone: any; scope: string; isVerified: boolean; }): unknown;
  findById(id: string): Promise<ScheduleTemplateEntity | null>;
  findByScope(scope: TemplateScope): Promise<ScheduleTemplateEntity[]>;
  findVerifiedTemplates(): Promise<ScheduleTemplateEntity[]>;
  findByConstructionType(constructionType: string, geographicalZone?: string): Promise<ScheduleTemplateEntity[]>;
  findTrendingTemplates(limit?: number): Promise<ScheduleTemplateEntity[]>;
  findRecommended(constructionType: string, geographicalZone: string, userPreferences?: any): Promise<ScheduleTemplateEntity[]>;
  findByUser(userId: string): Promise<ScheduleTemplateEntity[]>;
  searchTemplates(searchTerm: string): Promise<ScheduleTemplateEntity[]>;
  findHighRated(minRating?: number): Promise<ScheduleTemplateEntity[]>;
  save(template: ScheduleTemplateEntity): Promise<ScheduleTemplateEntity>;
  incrementUsage(templateId: string): Promise<boolean>;
  updateRating(templateId: string, newRating: number, ratingCount: number): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}