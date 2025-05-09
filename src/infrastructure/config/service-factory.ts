// src/infrastructure/config/service-factory.ts
import {DatabaseService} from "../database/database.service";
import {TypeOrmUserRepository} from "../database/repositories/TypeOrmUserRepository";
import {AuthService} from "../../domain/services/AuthService";
import {AuthController} from "../webserver/controllers/AuthController";
import {CalculationService} from "../../domain/services/CalculationService";
import {TypeOrmCalculationTemplateRepository} from "../database/repositories/TypeOrmCalculationTemplateRepository";
import {TypeOrmCalculationParameterRepository} from "../database/repositories/TypeOrmCalculationParameterRepository";
import {TemplateValidationService} from "../../domain/services/TemplateValidationService";
import {CreateCalculationTemplateUseCase} from "../../application/calculation/CreateCalculationTemplateUseCase";
import {CalculationTemplateController} from "../webserver/controllers/CalculationTemplateController";
import {TypeOrmCalculationResultRepository} from "../database/repositories/TypeOrmCalculationResultRepository";
import {ExecuteCalculationUseCase} from "../../application/calculation/ExecuteCalculationUseCase";
import {TypeOrmGeographicalZoneRepository} from "../database/repositories/TypeOrmGeographicalZoneRepository";
import {RecommendationService} from "../../domain/services/RecommendationService";
import {GetTemplateRecommendationsUseCase} from "../../application/calculation/GetTemplateRecommendationsUseCase";
import {SaveCalculationResultUseCase} from "../../application/calculation/SaveCalculationResultUseCase";
import {CalculationController} from "../webserver/controllers/CalculationController";
import {TypeOrmMaterialRepository} from "../database/repositories/TypeOrmMaterialRepository";
import {TypeOrmProjectBudgetRepository} from "../database/repositories/TypeOrmProjectBudgetRepository";
import {TypeOrmBudgetItemRepository} from "../database/repositories/TypeOrmBudgetItemRepository";
import {GenerateBudgetFromCalculationUseCase} from "../../application/calculation/GenerateBudgetFromCalculationUseCase";
import { BudgetController } from "../webserver/controllers/BudgetController";
import {TypeOrmProjectRepository} from "../database/repositories/TypeOrmProjectRepository";
import {TypeOrmPhaseRepository} from "../database/repositories/TypeOrmPhaseRepository";
import {TypeOrmTaskRepository} from "../database/repositories/TypeOrmTaskRepository";
import {GenerateProjectScheduleUseCase} from "../../application/project/GenerateProjectScheduleUseCase";
import {ProjectScheduleController} from "../webserver/controllers/ProjectScheduleController";
import {GetProjectBudgetsUseCase} from "../../application/budget/GetProjectBudgetsUseCase";
import {CreateBudgetVersionUseCase} from "../../application/budget/CreateBudgetVersionUseCase";
import {UpdateTaskProgressUseCase} from "../../application/project/UpdateTaskProgressUseCase";
import {AssignTaskUseCase} from "../../application/project/AssignTaskUseCase";
import { TaskController } from "../webserver/controllers/TaskController";
import { PhaseController } from "../webserver/controllers/PhaseController";
import {TypeOrmNotificationRepository} from "../database/repositories/TypeOrmNotificationRepository";
import {NotificationServiceImpl} from "../services/NotificationServiceImpl";
import { NotificationController } from "../webserver/controllers/NotificationController";
import {CompareBudgetVersionsUseCase} from "../../application/budget/CompareBudgetVersionsUseCase";
import {AddLaborAndIndirectCostsUseCase} from "../../application/budget/AddLaborAndIndirectCostsUseCase";
import {GenerateProgressReportUseCase} from "../../application/project/GenerateProgressReportUseCase";
import {CreateMaterialRequestUseCase} from "../../application/project/CreateMaterialRequestUseCase";
import {ApproveMaterialRequestUseCase} from "../../application/project/ApproveMaterialRequestUseCase";
import {ProgressReportController} from "../webserver/controllers/ProgressReportController";
import {MaterialRequestController} from "../webserver/controllers/MaterialRequestController";
import {TypeOrmMaterialRequestRepository} from "../database/repositories/TypeOrmMaterialRequestRepository";


// Global service instances
let userRepository: TypeOrmUserRepository;
let authService: AuthService;
let authController: AuthController;
let calculationService: CalculationService;
let calculationTemplateRepository: TypeOrmCalculationTemplateRepository;
let calculationParameterRepository: TypeOrmCalculationParameterRepository;
let templateValidationService: TemplateValidationService;
let createCalculationTemplateUseCase: CreateCalculationTemplateUseCase;
let calculationTemplateController: CalculationTemplateController;
let calculationResultRepository: TypeOrmCalculationResultRepository;
let executeCalculationUseCase: ExecuteCalculationUseCase;
let geographicalZoneRepository: TypeOrmGeographicalZoneRepository;
let recommendationService: RecommendationService;
let getTemplateRecommendationsUseCase: GetTemplateRecommendationsUseCase;
let saveCalculationResultUseCase: SaveCalculationResultUseCase;
let calculationController: CalculationController;
let materialRepository: TypeOrmMaterialRepository;
let projectBudgetRepository: TypeOrmProjectBudgetRepository;
let budgetItemRepository: TypeOrmBudgetItemRepository;
let generateBudgetFromCalculationUseCase: GenerateBudgetFromCalculationUseCase;
let budgetController: BudgetController;
let projectRepository: TypeOrmProjectRepository;
let phaseRepository: TypeOrmPhaseRepository;
let taskRepository: TypeOrmTaskRepository;
let generateProjectScheduleUseCase: GenerateProjectScheduleUseCase;
let projectScheduleController: ProjectScheduleController;
let getProjectBudgetsUseCase: GetProjectBudgetsUseCase;
let createBudgetVersionUseCase: CreateBudgetVersionUseCase;
let updateTaskProgressUseCase: UpdateTaskProgressUseCase;
let assignTaskUseCase: AssignTaskUseCase;
let taskController: TaskController;
let phaseController: PhaseController;
let notificationRepository: TypeOrmNotificationRepository;
let notificationService: NotificationServiceImpl;
let notificationController: NotificationController;
let compareBudgetVersionsUseCase: CompareBudgetVersionsUseCase;
let addLaborAndIndirectCostsUseCase: AddLaborAndIndirectCostsUseCase;
let generateProgressReportUseCase: GenerateProgressReportUseCase;
let createMaterialRequestUseCase: CreateMaterialRequestUseCase;
let approveMaterialRequestUseCase: ApproveMaterialRequestUseCase;
let materialRequestRepository: TypeOrmMaterialRequestRepository;
let progressReportController: ProgressReportController;
let materialRequestController: MaterialRequestController;

export function initializeServices() {
	console.log("Initializing services directly...");

	try {
		// Initialize repositories first
		userRepository = new TypeOrmUserRepository();
		calculationTemplateRepository = new TypeOrmCalculationTemplateRepository();
		calculationParameterRepository =
			new TypeOrmCalculationParameterRepository();
		calculationResultRepository = new TypeOrmCalculationResultRepository();
		geographicalZoneRepository = new TypeOrmGeographicalZoneRepository();
		materialRepository = new TypeOrmMaterialRepository();
		projectBudgetRepository = new TypeOrmProjectBudgetRepository();
		budgetItemRepository = new TypeOrmBudgetItemRepository();
		projectRepository = new TypeOrmProjectRepository();
		phaseRepository = new TypeOrmPhaseRepository();
		taskRepository = new TypeOrmTaskRepository();
		notificationRepository = new TypeOrmNotificationRepository();
		materialRequestRepository = new TypeOrmMaterialRequestRepository();

		// Initialize services
		authService = new AuthService();
		calculationService = new CalculationService();
		templateValidationService = new TemplateValidationService();
		recommendationService = new RecommendationService();
		notificationService = new NotificationServiceImpl(
			notificationRepository,
			userRepository,
			projectRepository
		);

		// Initialize use cases
		executeCalculationUseCase = new ExecuteCalculationUseCase(
			calculationTemplateRepository,
			calculationResultRepository,
			calculationService
		);

		createCalculationTemplateUseCase = new CreateCalculationTemplateUseCase(
			calculationTemplateRepository,
			calculationParameterRepository,
			templateValidationService
		);

		getTemplateRecommendationsUseCase = new GetTemplateRecommendationsUseCase(
			calculationTemplateRepository,
			calculationResultRepository,
			userRepository,
			recommendationService
		);

		saveCalculationResultUseCase = new SaveCalculationResultUseCase(
			calculationResultRepository
		);

		generateBudgetFromCalculationUseCase =
			new GenerateBudgetFromCalculationUseCase(
				calculationResultRepository,
				materialRepository,
				projectBudgetRepository,
				budgetItemRepository
			);
		
		generateProjectScheduleUseCase = new GenerateProjectScheduleUseCase(
			projectRepository,
			phaseRepository,
			taskRepository,
			projectBudgetRepository
		);

		getProjectBudgetsUseCase = new GetProjectBudgetsUseCase(
			projectBudgetRepository
		);

		createBudgetVersionUseCase = new CreateBudgetVersionUseCase(
			projectBudgetRepository,
			budgetItemRepository
		);

		updateTaskProgressUseCase = new UpdateTaskProgressUseCase(
			taskRepository,
			phaseRepository,
			projectRepository
		);

		assignTaskUseCase = new AssignTaskUseCase(taskRepository, userRepository);

		compareBudgetVersionsUseCase = new CompareBudgetVersionsUseCase(
			projectBudgetRepository,
			budgetItemRepository
		);

		addLaborAndIndirectCostsUseCase = new AddLaborAndIndirectCostsUseCase(
			projectBudgetRepository,
			budgetItemRepository
		);

		generateProgressReportUseCase = new GenerateProgressReportUseCase(
			projectRepository,
			phaseRepository,
			taskRepository,
			notificationService
		);

		createMaterialRequestUseCase = new CreateMaterialRequestUseCase(
			taskRepository,
			materialRepository,
			materialRequestRepository,
			notificationService
		);

		approveMaterialRequestUseCase = new ApproveMaterialRequestUseCase(
			materialRequestRepository,
			materialRepository,
			userRepository,
			notificationService
		);


		// Initialize controllers
		authController = new AuthController(authService, userRepository);
		calculationTemplateController = new CalculationTemplateController(
			createCalculationTemplateUseCase,
			calculationService,
			calculationTemplateRepository
		);
		calculationController = new CalculationController(
			executeCalculationUseCase,
			getTemplateRecommendationsUseCase,
			saveCalculationResultUseCase
		);

		budgetController = new BudgetController(
			generateBudgetFromCalculationUseCase,
			getProjectBudgetsUseCase,
			createBudgetVersionUseCase,
			projectBudgetRepository,
			compareBudgetVersionsUseCase,
			addLaborAndIndirectCostsUseCase
		);

		projectScheduleController = new ProjectScheduleController(
			generateProjectScheduleUseCase
		);

		 taskController = new TaskController(
				updateTaskProgressUseCase,
				assignTaskUseCase,
				taskRepository
			);

		phaseController = new PhaseController(phaseRepository, taskRepository);

		notificationController = new NotificationController(notificationService);

		progressReportController = new ProgressReportController(
			generateProgressReportUseCase
		);

		materialRequestController = new MaterialRequestController(
			createMaterialRequestUseCase,
			approveMaterialRequestUseCase,
			materialRequestRepository
		);

		console.log("Services initialized successfully");
	} catch (error) {
		console.error("Failed to initialize services:", error);
		throw error;
	}
}

// Factory methods to get services
export function getAuthController() {
	if (!authController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return authController;
}

export function getCalculationController() {
	if (!calculationController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return calculationController;
}

export function getCalculationTemplateController() {
	if (!calculationTemplateController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return calculationTemplateController;
}

export function getBudgetController() {
	if (!budgetController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return budgetController;
}

export function getProjectScheduleController() {
	if (!projectScheduleController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return projectScheduleController;
}

export function getTaskController() {
	if (!taskController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return taskController;
}

export function getPhaseController() {
	if (!phaseController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return phaseController;
}

export function getNotificationController() {
	if (!notificationController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return notificationController;
}

export function getProgressReportController() {
	if (!progressReportController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return progressReportController;
}

export function getMaterialRequestController() {
	if (!materialRequestController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return materialRequestController;
}
