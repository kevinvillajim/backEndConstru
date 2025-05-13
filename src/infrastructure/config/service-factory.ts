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
import {BudgetController} from "../webserver/controllers/BudgetController";
import {TypeOrmProjectRepository} from "../database/repositories/TypeOrmProjectRepository";
import {TypeOrmPhaseRepository} from "../database/repositories/TypeOrmPhaseRepository";
import {TypeOrmTaskRepository} from "../database/repositories/TypeOrmTaskRepository";
import {GenerateProjectScheduleUseCase} from "../../application/project/GenerateProjectScheduleUseCase";
import {ProjectScheduleController} from "../webserver/controllers/ProjectScheduleController";
import {GetProjectBudgetsUseCase} from "../../application/budget/GetProjectBudgetsUseCase";
import {CreateBudgetVersionUseCase} from "../../application/budget/CreateBudgetVersionUseCase";
import {UpdateTaskProgressUseCase} from "../../application/project/UpdateTaskProgressUseCase";
import {AssignTaskUseCase} from "../../application/project/AssignTaskUseCase";
import {TaskController} from "../webserver/controllers/TaskController";
import {PhaseController} from "../webserver/controllers/PhaseController";
import {TypeOrmNotificationRepository} from "../database/repositories/TypeOrmNotificationRepository";
import {NotificationServiceImpl} from "../services/NotificationServiceImpl";
import {NotificationController} from "../webserver/controllers/NotificationController";
import {CompareBudgetVersionsUseCase} from "../../application/budget/CompareBudgetVersionsUseCase";
import {AddLaborAndIndirectCostsUseCase} from "../../application/budget/AddLaborAndIndirectCostsUseCase";
import {GenerateProgressReportUseCase} from "../../application/project/GenerateProgressReportUseCase";
import {CreateMaterialRequestUseCase} from "../../application/project/CreateMaterialRequestUseCase";
import {ApproveMaterialRequestUseCase} from "../../application/project/ApproveMaterialRequestUseCase";
import {ProgressReportController} from "../webserver/controllers/ProgressReportController";
import {MaterialRequestController} from "../webserver/controllers/MaterialRequestController";
import {TypeOrmMaterialRequestRepository} from "../database/repositories/TypeOrmMaterialRequestRepository";
import {MaterialController} from "../webserver/controllers/MaterialController";
import {ExportCalculationTemplateUseCase} from "../../application/calculation/ExportCalculationTemplateUseCase";
import {ImportCalculationTemplateUseCase} from "../../application/calculation/ImportCalculationTemplateUseCase";
import {TemplateImportExportController} from "../webserver/controllers/TemplateImportExportController";
import {SupplierIntegrationController} from "@infrastructure/webserver/controllers/SupplierIntegrationController";
import {ManageMaterialPropertiesUseCase} from "@application/material/ManageMaterialPropertiesUseCase";
import {TypeOrmMaterialPropertyRepository} from "@infrastructure/database/repositories/TypeOrmMaterialPropertyRepository";
import {MaterialPropertyController} from "@infrastructure/webserver/controllers/MaterialPropertyController";
import {TypeOrmCategoryRepository} from "../database/repositories/TypeOrmCategoryRepository";
import {ProjectMetricsService} from "../../domain/services/ProjectMetricsService";
import {GetProjectDashboardDataUseCase} from "../../application/project/GetProjectDashboardDataUseCase";
import {GetProjectMetricsUseCase} from "../../application/project/GetProjectMetricsUseCase";
import {ProjectDashboardController} from "../webserver/controllers/ProjectDashboardController";
import {ProjectMetricsController} from "../webserver/controllers/ProjectMetricsController";
import {PdfGenerationService} from "../../infrastructure/services/PdfGenerationService";
import {TypeOrmAccountingTransactionRepository} from "../database/repositories/TypeOrmAccountingTransactionRepository";
import {SyncBudgetWithAccountingUseCase} from "@application/accounting/SyncBudgetWithAccountingUseCase";
import {AccountingController} from "@infrastructure/webserver/controllers/AccountingController";
import {EnhancedProjectDashboardUseCase} from "../../application/project/EnhancedProjectDashboardUseCase";
import {EnhancedProjectDashboardController} from "../webserver/controllers/EnhancedProjectDashboardController";
import {PredictProjectDelaysUseCase} from "../../application/project/PredictProjectDelaysUseCase";
import {ProjectPredictionController} from "../webserver/controllers/ProjectPredictionController";
import {TypeOrmOrderRepository} from "../database/repositories/TypeOrmOrderRepository";
import {TypeOrmOrderItemRepository} from "../database/repositories/TypeOrmOrderItemRepository";
import {CompareMaterialPricesUseCase} from "../../application/material/CompareMaterialPricesUseCase";
import {CreateOrderFromMaterialRequestsUseCase} from "../../application/order/CreateOrderFromMaterialRequestsUseCase";
import {OrderController} from "../webserver/controllers/OrderController";
import {GetAdvancedRecommendationsUseCase} from "@application/recommendation/GetAdvancedRecommendationsUseCase";
import {AdvancedRecommendationService} from "@domain/services/AdvancedRecommendationService";
import {UserPatternAnalysisService} from "@domain/services/UserPatternAnalysisService";
import {TypeOrmUserInteractionRepository} from "@infrastructure/database/repositories/TypeOrmUserInteractionRepository";
import {EmailService} from "../../domain/services/EmailService";
import {EmailServiceImpl} from "../services/EmailServiceImpl";
import {PushNotificationService} from "../../domain/services/PushNotificationService";
import {PushNotificationServiceImpl} from "../services/PushNotificationServiceImpl";

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
let materialController: MaterialController;
let exportCalculationTemplateUseCase: ExportCalculationTemplateUseCase;
let importCalculationTemplateUseCase: ImportCalculationTemplateUseCase;
let templateImportExportController: TemplateImportExportController;
let projectMetricsService: ProjectMetricsService;
let getProjectDashboardDataUseCase: GetProjectDashboardDataUseCase;
let getProjectMetricsUseCase: GetProjectMetricsUseCase;
let projectDashboardController: ProjectDashboardController;
let projectMetricsController: ProjectMetricsController;
let pdfGenerationService: PdfGenerationService;
let accountingTransactionRepository: TypeOrmAccountingTransactionRepository;
let syncBudgetWithAccountingUseCase: SyncBudgetWithAccountingUseCase;
let accountingController: AccountingController;
let enhancedProjectDashboardUseCase: EnhancedProjectDashboardUseCase;
let enhancedProjectDashboardController: EnhancedProjectDashboardController;
let predictProjectDelaysUseCase: PredictProjectDelaysUseCase;
let projectPredictionController: ProjectPredictionController;
let orderRepository: TypeOrmOrderRepository;
let orderItemRepository: TypeOrmOrderItemRepository;
let compareMaterialPricesUseCase: CompareMaterialPricesUseCase;
let createOrderFromMaterialRequestsUseCase: CreateOrderFromMaterialRequestsUseCase;
let orderController: OrderController;
let userInteractionRepository: TypeOrmUserInteractionRepository;
let userPatternAnalysisService: UserPatternAnalysisService;
let advancedRecommendationService: AdvancedRecommendationService;
let advancedRecommendationsUseCase: GetAdvancedRecommendationsUseCase;
let emailService: EmailServiceImpl;
let pushNotificationService: PushNotificationServiceImpl;

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
		accountingTransactionRepository =
			new TypeOrmAccountingTransactionRepository();
		orderRepository = new TypeOrmOrderRepository();
		orderItemRepository = new TypeOrmOrderItemRepository();
		userInteractionRepository = new TypeOrmUserInteractionRepository();

		// Initialize services
		authService = new AuthService();
		calculationService = new CalculationService();
		templateValidationService = new TemplateValidationService();
		recommendationService = new RecommendationService();
		notificationService = new NotificationServiceImpl(
			notificationRepository,
			userRepository,
			projectRepository,
			emailService,
			pushNotificationService
		);
		projectMetricsService = new ProjectMetricsService();
		pdfGenerationService = new PdfGenerationService();
		userPatternAnalysisService = new UserPatternAnalysisService();
		advancedRecommendationService = new AdvancedRecommendationService();
		emailService = new EmailServiceImpl(
			process.env.EMAIL_API_KEY || "mock-key",
			process.env.EMAIL_FROM_ADDRESS || "noreply@constru-app.com"
		);

		pushNotificationService = new PushNotificationServiceImpl(
			process.env.PUSH_API_KEY || "mock-key",
			process.env.PUSH_APP_ID || "constru-app"
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

		exportCalculationTemplateUseCase = new ExportCalculationTemplateUseCase(
			calculationTemplateRepository,
			calculationParameterRepository,
			userRepository
		);

		importCalculationTemplateUseCase = new ImportCalculationTemplateUseCase(
			calculationTemplateRepository,
			calculationParameterRepository,
			templateValidationService
		);

		getProjectDashboardDataUseCase = new GetProjectDashboardDataUseCase(
			projectRepository,
			phaseRepository,
			taskRepository,
			projectBudgetRepository
		);

		getProjectMetricsUseCase = new GetProjectMetricsUseCase(
			projectRepository,
			phaseRepository,
			taskRepository,
			projectBudgetRepository,
			projectMetricsService
		);

		syncBudgetWithAccountingUseCase = new SyncBudgetWithAccountingUseCase(
			projectBudgetRepository,
			accountingTransactionRepository,
			userRepository,
			notificationService
		);

		enhancedProjectDashboardUseCase = new EnhancedProjectDashboardUseCase(
			projectRepository,
			phaseRepository,
			taskRepository,
			projectBudgetRepository,
			projectMetricsService
		);

		predictProjectDelaysUseCase = new PredictProjectDelaysUseCase(
			projectRepository,
			phaseRepository,
			taskRepository,
			projectMetricsService,
			notificationService
		);

		compareMaterialPricesUseCase = new CompareMaterialPricesUseCase(
			materialRepository,
			userRepository
		);

		createOrderFromMaterialRequestsUseCase =
			new CreateOrderFromMaterialRequestsUseCase(
				orderRepository,
				orderItemRepository,
				materialRequestRepository,
				materialRepository,
				projectRepository,
				notificationService
			);

		advancedRecommendationsUseCase = new GetAdvancedRecommendationsUseCase(
			userRepository,
			calculationTemplateRepository,
			userInteractionRepository,
			userPatternAnalysisService,
			advancedRecommendationService
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
			addLaborAndIndirectCostsUseCase,
			pdfGenerationService
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

		templateImportExportController = new TemplateImportExportController(
			exportCalculationTemplateUseCase,
			importCalculationTemplateUseCase
		);

		materialController = new MaterialController(
			materialRepository,
			compareMaterialPricesUseCase
		);

		projectDashboardController = new ProjectDashboardController(
			getProjectDashboardDataUseCase
		);

		projectMetricsController = new ProjectMetricsController(
			getProjectMetricsUseCase
		);

		accountingController = new AccountingController(
			syncBudgetWithAccountingUseCase,
			accountingTransactionRepository
		);

		enhancedProjectDashboardController = new EnhancedProjectDashboardController(
			enhancedProjectDashboardUseCase
		);

		projectPredictionController = new ProjectPredictionController(
			predictProjectDelaysUseCase
		);

		orderController = new OrderController(
			createOrderFromMaterialRequestsUseCase,
			orderRepository,
			orderItemRepository
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

export function getMaterialController() {
	if (!materialController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return materialController;
}

export function getTemplateImportExportController() {
	if (!templateImportExportController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return templateImportExportController;
}

export function getSupplierIntegrationController(): SupplierIntegrationController {
	return new SupplierIntegrationController(
		materialRepository,
		new TypeOrmCategoryRepository(),
		notificationService
	);
}

export function getMaterialPropertyController(): MaterialPropertyController {
	const materialPropertyRepository = new TypeOrmMaterialPropertyRepository();
	const materialRepository = new TypeOrmMaterialRepository();

	const useCase = new ManageMaterialPropertiesUseCase(
		materialRepository,
		materialPropertyRepository
	);

	return new MaterialPropertyController(useCase);
}

export function getNotificationService() {
	if (!notificationService) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return notificationService;
}

export function getProjectDashboardController() {
	if (!projectDashboardController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return projectDashboardController;
}

export function getProjectMetricsController() {
	if (!projectMetricsController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return projectMetricsController;
}

export function getPdfGenerationService() {
	if (!pdfGenerationService) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return pdfGenerationService;
}

export function getAccountingTransactionRepository() {
	if (!accountingTransactionRepository) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return accountingTransactionRepository;
}

export function getAccountingController() {
	if (!accountingController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return accountingController;
}

export function getEnhancedProjectDashboardController() {
	if (!enhancedProjectDashboardController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return enhancedProjectDashboardController;
}

export function getProjectPredictionController() {
	if (!projectPredictionController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return projectPredictionController;
}

export function getOrderController() {
	if (!orderController) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return orderController;
}

export function getUserPatternAnalysisService() {
	if (!userPatternAnalysisService) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return userPatternAnalysisService;
}

export function getAdvancedRecommendationService() {
	if (!advancedRecommendationService) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return advancedRecommendationService;
}

export function getUserInteractionRepository() {
	if (!userInteractionRepository) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return userInteractionRepository;
}

export function getAdvancedRecommendationsUseCase() {
	if (!advancedRecommendationsUseCase) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return advancedRecommendationsUseCase;
}

export function getEmailService() {
	if (!emailService) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return emailService;
}

export function getPushNotificationService() {
	if (!pushNotificationService) {
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	}
	return pushNotificationService;
}