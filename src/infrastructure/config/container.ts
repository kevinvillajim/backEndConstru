// src/infrastructure/config/container.ts
import {createContainer, asClass, asFunction, Lifetime} from "awilix";

// Repositorios
import {TypeOrmUserRepository} from "../database/repositories/TypeOrmUserRepository";
import {TypeOrmCalculationTemplateRepository} from "../database/repositories/TypeOrmCalculationTemplateRepository";
import {TypeOrmCalculationParameterRepository} from "../database/repositories/TypeOrmCalculationParameterRepository";
import {TypeOrmCalculationResultRepository} from "../database/repositories/TypeOrmCalculationResultRepository";
import {TypeOrmGeographicalZoneRepository} from "../database/repositories/TypeOrmGeographicalZoneRepository";

// Servicios de dominio
import {CalculationService} from "../../domain/services/CalculationService";
import {TemplateValidationService} from "../../domain/services/TemplateValidationService";
import {RecommendationService} from "../../domain/services/RecommendationService";
import {AuthService} from "../../domain/services/AuthService";

// Casos de uso
import {ExecuteCalculationUseCase} from "../../application/calculation/ExecuteCalculationUseCase";
import {CreateCalculationTemplateUseCase} from "../../application/calculation/CreateCalculationTemplateUseCase";
import {GetTemplateRecommendationsUseCase} from "../../application/calculation/GetTemplateRecommendationsUseCase";
import {SaveCalculationResultUseCase} from "../../application/calculation/SaveCalculationResultUseCase";

// Controladores
import {CalculationController} from "../webserver/controllers/CalculationController";
import {CalculationTemplateController} from "../webserver/controllers/CalculationTemplateController";
import {AuthController} from "../webserver/controllers/AuthController";

console.log("Iniciando registro de dependencias en el contenedor");

// Crear el contenedor
const container = createContainer();

// Registrar dependencias
container.register({
	// Repositorios
	userRepository: asClass(TypeOrmUserRepository, {
		lifetime: Lifetime.SINGLETON,
	}),
	calculationTemplateRepository: asClass(TypeOrmCalculationTemplateRepository, {
		lifetime: Lifetime.SINGLETON,
	}),
	calculationParameterRepository: asClass(
		TypeOrmCalculationParameterRepository,
		{lifetime: Lifetime.SINGLETON}
	),
	calculationResultRepository: asClass(TypeOrmCalculationResultRepository, {
		lifetime: Lifetime.SINGLETON,
	}),
	geographicalZoneRepository: asClass(TypeOrmGeographicalZoneRepository, {
		lifetime: Lifetime.SINGLETON,
	}),

	// Servicios de dominio
	calculationService: asClass(CalculationService, {
		lifetime: Lifetime.SINGLETON,
	}),
	templateValidationService: asClass(TemplateValidationService, {
		lifetime: Lifetime.SINGLETON,
	}),
	recommendationService: asClass(RecommendationService, {
		lifetime: Lifetime.SINGLETON,
	}),
	authService: asClass(AuthService, {
		lifetime: Lifetime.SINGLETON,
	}),

	// Casos de uso
	executeCalculationUseCase: asClass(ExecuteCalculationUseCase),
	createCalculationTemplateUseCase: asClass(CreateCalculationTemplateUseCase),
	getTemplateRecommendationsUseCase: asClass(GetTemplateRecommendationsUseCase),
	saveCalculationResultUseCase: asClass(SaveCalculationResultUseCase),

	// Controladores
	CalculationController: asClass(CalculationController),
	CalculationTemplateController: asClass(CalculationTemplateController),
	AuthController: asClass(AuthController),
});

console.log(
	"Dependencias registradas. Contenido:",
	Object.keys(container.registrations)
);

// Intentar resolver userRepository para verificar que está correctamente registrado
try {
    const userRepo = container.resolve("userRepository");
    console.log("userRepository resuelto correctamente:", !!userRepo);
} catch (error) {
    console.error("Error al resolver userRepository:", error);
}

export {container};
