// src/check-container.ts
import {container} from "./infrastructure/config/container";

console.log("Registered containers:", Object.keys(container.registrations));
console.log(
	"UserRepository registered?",
	!!container.registrations.userRepository
);

// Intenta resolver directamente para ver qué sucede
try {
	const userRepo = container.resolve("userRepository");
	console.log("UserRepository resolución exitosa:", !!userRepo);
} catch (error) {
	console.error("Error al resolver userRepository:", error);
}

// Intenta resolver AuthController
try {
	const authController = container.resolve("AuthController");
	console.log("AuthController dependencias:", {
		authService: !!authController["authService"],
		userRepository: !!authController["userRepository"],
	});
} catch (error) {
	console.error("Error al resolver AuthController:", error);
}
