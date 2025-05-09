import "reflect-metadata";
import {container} from "./infrastructure/config/container";
import {AppDataSource} from "./infrastructure/database/data-source";

console.log("Verificando estado del contenedor");
console.log("Registros disponibles:", Object.keys(container.registrations));

console.log("Intentando resolver userRepository...");
try {
	const userRepo = container.resolve("userRepository");
	console.log("userRepository resuelto:", typeof userRepo);

	// Si se resolvió correctamente, intenta acceder a un método
	if (userRepo && typeof userRepo.findByEmail === "function") {
		console.log("findByEmail es una función disponible");
	} else {
		console.log("findByEmail no está disponible correctamente");
	}
} catch (error) {
	console.error("Error al resolver userRepository:", error);
}

// Prueba a inicializar AppDataSource y luego resolver de nuevo
console.log("\nIniciando conexión a base de datos y probando nuevamente...");

AppDataSource.initialize()
	.then(() => {
		console.log("Base de datos inicializada");

		try {
			const userRepo = container.resolve("userRepository");
			console.log("userRepository después de inicializar DB:", !!userRepo);

			// Si el repo tiene findByEmail
			if (userRepo && typeof userRepo.findByEmail === "function") {
				console.log("findByEmail está disponible después de inicializar DB");
			}
		} catch (e) {
			console.error("Error después de inicializar DB:", e);
		}
	})
	.catch((err) => {
		console.error("Error al inicializar DB:", err);
	});
