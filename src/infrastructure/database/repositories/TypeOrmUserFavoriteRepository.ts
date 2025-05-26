// src/infrastructure/database/repositories/TypeOrmUserFavoriteRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {UserFavoriteRepository} from "../../../domain/repositories/UserFavoriteRepository";
import {UserFavoriteEntity} from "../entities/UserFavoriteEntity";

export class TypeOrmUserFavoriteRepository implements UserFavoriteRepository {
	private repository: Repository<UserFavoriteEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(UserFavoriteEntity);
	}

	async findByUserId(userId: string): Promise<string[]> {
		const favorites = await this.repository.find({
			where: {userId},
			select: ["templateId"],
		});
		return favorites.map((f) => f.templateId);
	}

	async addFavorite(userId: string, templateId: string): Promise<void> {
		const favorite = this.repository.create({userId, templateId});
		await this.repository.save(favorite);
	}

	async removeFavorite(userId: string, templateId: string): Promise<void> {
		await this.repository.delete({userId, templateId});
	}

	async isFavorite(userId: string, templateId: string): Promise<boolean> {
		const count = await this.repository.count({where: {userId, templateId}});
		return count > 0;
	}

	async getFavoriteCount(templateId: string): Promise<number> {
		return await this.repository.count({where: {templateId}});
	}
}