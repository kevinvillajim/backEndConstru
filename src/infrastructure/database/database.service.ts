// src/infrastructure/database/database.service.ts
import {DataSource} from "typeorm";
import {AppDataSource} from "./data-source";

export class DatabaseService {
	private static instance: DatabaseService;
	private initialized = false;
	private dataSource: DataSource;

	private constructor() {
		this.dataSource = AppDataSource;
	}

	public static getInstance(): DatabaseService {
		if (!DatabaseService.instance) {
			DatabaseService.instance = new DatabaseService();
		}
		return DatabaseService.instance;
	}

	public async initialize(): Promise<DataSource> {
		if (this.initialized) {
			return this.dataSource;
		}

		try {
			await this.dataSource.initialize();
			this.initialized = true;
			console.log("Database connection established successfully");
			return this.dataSource;
		} catch (error) {
			console.error("Error during database initialization:", error);
			throw error;
		}
	}

	public getDataSource(): DataSource {
		if (!this.initialized) {
			throw new Error("Database not initialized. Call initialize() first");
		}
		return this.dataSource;
	}
}
