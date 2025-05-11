import {DataSource} from "typeorm";
import dotenv from "dotenv";

dotenv.config();



const  dataSourceConfig = {
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
};

// Creamos una instancia de DataSource
const dataSource = new DataSource(dataSourceConfig as any);

// Clase singleton para gestionar la conexión
class DataSourceManager {
  private static instance: DataSource;

  static getInstance(): DataSource {
    if (!this.instance) {
      this.instance = dataSource;
      
      // Inicializamos si no está inicializado
      if (!this.instance.isInitialized) {
        console.log("Inicializando conexión a base de datos...");
        this.instance.initialize()
          .then(() => console.log("Conexión a base de datos inicializada con éxito"))
          .catch(error => console.error("Error al inicializar conexión:", error));
      }
    }
    return this.instance;
  }
}

// Exportamos el DataSource original para mantener compatibilidad
export const AppDataSource = Object.assign(dataSource, {
  getInstance: () => DataSourceManager.getInstance()
});

console.log(
	"AppDataSource configurado. Estado:",
	AppDataSource.isInitialized ? "Inicializado" : "No inicializado"
);