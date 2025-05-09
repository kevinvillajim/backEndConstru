// src/infrastructure/config/container.ts
import {createContainer, asClass, asValue} from "awilix";
import {DatabaseService} from "../database/database.service";

// Repositories
import {TypeOrmUserRepository} from "../database/repositories/TypeOrmUserRepository";
import {TypeOrmCalculationTemplateRepository} from "../database/repositories/TypeOrmCalculationTemplateRepository";
import {TypeOrmCalculationParameterRepository} from "../database/repositories/TypeOrmCalculationParameterRepository";
import {TypeOrmCalculationResultRepository} from "../database/repositories/TypeOrmCalculationResultRepository";
import {TypeOrmGeographicalZoneRepository} from "../database/repositories/TypeOrmGeographicalZoneRepository";
import {TypeOrmRefreshTokenRepository} from "../database/repositories/TypeOrmRefreshTokenRepository";

// Domain services
import {CalculationService} from "../../domain/services/CalculationService";
import {TemplateValidationService} from "../../domain/services/TemplateValidationService";
import {RecommendationService} from "../../domain/services/RecommendationService";
import {AuthService} from "../../domain/services/AuthService";

// Use cases
import {ExecuteCalculationUseCase} from "../../application/calculation/ExecuteCalculationUseCase";
import {CreateCalculationTemplateUseCase} from "../../application/calculation/CreateCalculationTemplateUseCase";
import {GetTemplateRecommendationsUseCase} from "../../application/calculation/GetTemplateRecommendationsUseCase";
import {SaveCalculationResultUseCase} from "../../application/calculation/SaveCalculationResultUseCase";

// Controllers
import {CalculationController} from "../webserver/controllers/CalculationController";
import {CalculationTemplateController} from "../webserver/controllers/CalculationTemplateController";
import {AuthController} from "../webserver/controllers/AuthController";

// Create container
const container = createContainer();

// Global function to initialize the container with services
export function setupContainer() {
	console.log("Setting up dependency container...");

	try {
		// Register database service
		const dbService = DatabaseService.getInstance();

		// Register all dependencies
		container.register({
			// Database service
			databaseService: asValue(dbService),

			// Repositories
			userRepository: asClass(TypeOrmUserRepository).singleton(),
			calculationTemplateRepository: asClass(
				TypeOrmCalculationTemplateRepository
			).singleton(),
			calculationParameterRepository: asClass(
				TypeOrmCalculationParameterRepository
			).singleton(),
			calculationResultRepository: asClass(
				TypeOrmCalculationResultRepository
			).singleton(),
			geographicalZoneRepository: asClass(
				TypeOrmGeographicalZoneRepository
			).singleton(),
			refreshTokenRepository: asClass(
				TypeOrmRefreshTokenRepository
			).singleton(),

			// Domain services
			calculationService: asClass(CalculationService).singleton(),
			templateValidationService: asClass(TemplateValidationService).singleton(),
			recommendationService: asClass(RecommendationService).singleton(),
			authService: asClass(AuthService).singleton(),

			// Use cases
			executeCalculationUseCase: asClass(ExecuteCalculationUseCase),
			createCalculationTemplateUseCase: asClass(
				CreateCalculationTemplateUseCase
			),
			getTemplateRecommendationsUseCase: asClass(
				GetTemplateRecommendationsUseCase
			),
			saveCalculationResultUseCase: asClass(SaveCalculationResultUseCase),

			// Controllers
			AuthController: asClass(AuthController),
			CalculationController: asClass(CalculationController),
			CalculationTemplateController: asClass(CalculationTemplateController),
		});

		console.log(
			"Container setup complete with services: ",
			Object.keys(container.registrations)
		);
	} catch (error) {
		console.error("Error setting up container:", error);
		throw error;
	}
}

export {container};
