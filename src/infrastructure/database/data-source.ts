import {DataSource} from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
	type: "mysql",
	host: process.env.DB_HOST || "localhost",
	port: parseInt(process.env.DB_PORT || "3306"),
	username: process.env.DB_USERNAME || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_DATABASE || "constru",
	synchronize: false,
	logging: process.env.NODE_ENV === "development",
	entities: ["src/infrastructure/database/entities/**/*.ts"],
	migrations: ["src/infrastructure/database/migrations/**/*.ts"],
	subscribers: ["src/infrastructure/database/subscribers/**/*.ts"],
});
