// src/domain/repositories/UserFavoriteRepository.ts
export interface UserFavoriteRepository {
	findByUserId(userId: string): Promise<string[]>;
	addFavorite(userId: string, templateId: string): Promise<void>;
	removeFavorite(userId: string, templateId: string): Promise<void>;
	isFavorite(userId: string, templateId: string): Promise<boolean>;
	getFavoriteCount(templateId: string): Promise<number>;
}
