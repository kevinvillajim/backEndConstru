// src/infrastructure/config/service-factory.ts - VERSIÓN ACTUALIZADA CON USER TEMPLATES

// ============= REPOSITORIOS =============
import {TypeOrmUserRepository} from "../database/repositories/TypeOrmUserRepository";
import {TypeOrmCalculationTemplateRepository} from "../database/repositories/TypeOrmCalculationTemplateRepository";
import {TypeOrmCalculationParameterRepository} from "../database/repositories/TypeOrmCalculationParameterRepository";
import {TypeOrmCalculationResultRepository} from "../database/repositories/TypeOrmCalculationResultRepository";
import {TypeOrmGeographicalZoneRepository} from "../database/repositories/TypeOrmGeographicalZoneRepository";
import {TypeOrmMaterialRepository} from "../database/repositories/TypeOrmMaterialRepository";
import {TypeOrmProjectBudgetRepository} from "../database/repositories/TypeOrmProjectBudgetRepository";
import {TypeOrmBudgetItemRepository} from "../database/repositories/TypeOrmBudgetItemRepository";
import {TypeOrmProjectRepository} from "../database/repositories/TypeOrmProjectRepository";
import {TypeOrmPhaseRepository} from "../database/repositories/TypeOrmPhaseRepository";
import {TypeOrmTaskRepository} from "../database/repositories/TypeOrmTaskRepository";
import {TypeOrmNotificationRepository} from "../database/repositories/TypeOrmNotificationRepository";
import {TypeOrmMaterialRequestRepository} from "../database/repositories/TypeOrmMaterialRequestRepository";
import {TypeOrmAccountingTransactionRepository} from "../database/repositories/TypeOrmAccountingTransactionRepository";
import {TypeOrmOrderRepository} from "../database/repositories/TypeOrmOrderRepository";
import {TypeOrmOrderItemRepository} from "../database/repositories/TypeOrmOrderItemRepository";
import {TypeOrmUserInteractionRepository} from "../database/repositories/TypeOrmUserInteractionRepository";
import {TypeOrmInvoiceRepository} from "../database/repositories/TypeOrmInvoiceRepository";
import {TypeOrmCategoryRepository} from "../database/repositories/TypeOrmCategoryRepository";
import {TypeOrmMaterialPropertyRepository} from "../database/repositories/TypeOrmMaterialPropertyRepository";
import {TypeOrmUserFavoriteRepository} from "../database/repositories/TypeOrmUserFavoriteRepository";
import {TypeOrmTemplateRatingRepository} from "../database/repositories/TypeOrmTemplateRatingRepository";
import {TypeOrmTemplateSuggestionRepository} from "../database/repositories/TypeOrmTemplateSuggestionRepository";
import {TypeOrmCalculationComparisonRepository} from "../database/repositories/TypeOrmCalculationComparisonRepository";
import {TypeOrmTrendingCalculationRepository} from "../database/repositories/TypeOrmTrendingCalculationRepository";
// *** NUEVO: Repositorio para plantillas personales de usuarios ***
import {TypeOrmUserCalculationTemplateRepository} from "../database/repositories/TypeOrmUserCalculationTemplateRepository";

// ============= SERVICIOS DE DOMINIO =============
import {AuthService} from "../../domain/services/AuthService";
import {CalculationService} from "../../domain/services/CalculationService";
import {TemplateValidationService} from "../../domain/services/TemplateValidationService";
import {RecommendationService} from "../../domain/services/RecommendationService";
import {ProjectMetricsService} from "../../domain/services/ProjectMetricsService";
import {UserPatternAnalysisService} from "../../domain/services/UserPatternAnalysisService";
import {AdvancedRecommendationService} from "../../domain/services/AdvancedRecommendationService";
import {TwoFactorAuthService} from "../../domain/services/TwoFactorAuthService";

// ============= SERVICIOS DE INFRAESTRUCTURA =============
import {NotificationServiceImpl} from "../services/NotificationServiceImpl";
import {EmailServiceImpl} from "../services/EmailServiceImpl";
import {PushNotificationServiceImpl} from "../services/PushNotificationServiceImpl";
import {PdfGenerationService} from "../services/PdfGenerationService";

// ============= CASOS DE USO =============
import {CreateCalculationTemplateUseCase} from "../../application/calculation/CreateCalculationTemplateUseCase";
import {ExecuteCalculationUseCase} from "../../application/calculation/ExecuteCalculationUseCase";
import {SaveCalculationResultUseCase} from "../../application/calculation/SaveCalculationResultUseCase";
import {GetTemplateRecommendationsUseCase} from "../../application/calculation/GetTemplateRecommendationsUseCase";
import {ExportCalculationTemplateUseCase} from "../../application/calculation/ExportCalculationTemplateUseCase";
import {ImportCalculationTemplateUseCase} from "../../application/calculation/ImportCalculationTemplateUseCase";
import {GenerateBudgetFromCalculationUseCase} from "../../application/calculation/GenerateBudgetFromCalculationUseCase";
import {FavoriteTemplateUseCase} from "../../application/calculation/FavoriteTemplateUseCase";
import {RateTemplateUseCase} from "../../application/calculation/RateTemplateUseCase";
import {CreateSuggestionUseCase} from "../../application/calculation/CreateSuggestionUseCase";
import {GetSuggestionsUseCase} from "../../application/calculation/GetSuggestionsUseCase";
import {UpdateSuggestionStatusUseCase} from "../../application/calculation/UpdateSuggestionStatusUseCase";
import {CompareCalculationsUseCase} from "../../application/calculation/CompareCalculationsUseCase";
import {GetTrendingTemplatesUseCase} from "../../application/calculation/GetTrendingTemplatesUseCase";
import {GetUserFavoritesUseCase} from "../../application/calculation/GetUserFavoritesUseCase";
import {GetSavedComparisonsUseCase} from "../../application/calculation/GetSavedComparisonsUseCase";

// *** NUEVOS: Use Cases para plantillas personales de usuarios ***
import {CreateUserTemplateUseCase} from "../../application/user-templates/CreateUserTemplateUseCase";
import {GetUserTemplatesUseCase} from "../../application/user-templates/GetUserTemplatesUseCase";
import {GetUserTemplateByIdUseCase} from "../../application/user-templates/GetUserTemplateByIdUseCase";
import {UpdateUserTemplateUseCase} from "../../application/user-templates/UpdateUserTemplateUseCase";
import {DeleteUserTemplateUseCase} from "../../application/user-templates/DeleteUserTemplateUseCase";
import {DuplicateOfficialTemplateUseCase} from "../../application/user-templates/DuplicateOfficialTemplateUseCase";
import {CreateTemplateFromResultUseCase} from "../../application/user-templates/CreateTemplateFromResultUseCase";
import {ShareUserTemplateUseCase} from "../../application/user-templates/ShareUserTemplateUseCase";
import {ChangeTemplateStatusUseCase} from "../../application/user-templates/ChangeTemplateStatusUseCase";
import {GetPublicUserTemplatesUseCase} from "../../application/user-templates/GetPublicUserTemplatesUseCase";
import {GetUserTemplateStatsUseCase} from "../../application/user-templates/GetUserTemplateStatsUseCase";

// ============= OTROS CASOS DE USO =============
import {GenerateProjectScheduleUseCase} from "../../application/project/GenerateProjectScheduleUseCase";
import {GetProjectBudgetsUseCase} from "../../application/budget/GetProjectBudgetsUseCase";
import {CreateBudgetVersionUseCase} from "../../application/budget/CreateBudgetVersionUseCase";
import {UpdateTaskProgressUseCase} from "../../application/project/UpdateTaskProgressUseCase";
import {AssignTaskUseCase} from "../../application/project/AssignTaskUseCase";
import {CompareBudgetVersionsUseCase} from "../../application/budget/CompareBudgetVersionsUseCase";
import {AddLaborAndIndirectCostsUseCase} from "../../application/budget/AddLaborAndIndirectCostsUseCase";
import {GenerateProgressReportUseCase} from "../../application/project/GenerateProgressReportUseCase";
import {CreateMaterialRequestUseCase} from "../../application/project/CreateMaterialRequestUseCase";
import {ApproveMaterialRequestUseCase} from "../../application/project/ApproveMaterialRequestUseCase";
import {GetProjectDashboardDataUseCase} from "../../application/project/GetProjectDashboardDataUseCase";
import {GetProjectMetricsUseCase} from "../../application/project/GetProjectMetricsUseCase";
import {SyncBudgetWithAccountingUseCase} from "../../application/accounting/SyncBudgetWithAccountingUseCase";
import {EnhancedProjectDashboardUseCase} from "../../application/project/EnhancedProjectDashboardUseCase";
import {PredictProjectDelaysUseCase} from "../../application/project/PredictProjectDelaysUseCase";
import {CompareMaterialPricesUseCase} from "../../application/material/CompareMaterialPricesUseCase";
import {CreateOrderFromMaterialRequestsUseCase} from "../../application/order/CreateOrderFromMaterialRequestsUseCase";
import {GetAdvancedRecommendationsUseCase} from "../../application/recommendation/GetAdvancedRecommendationsUseCase";
import {ManageMaterialPropertiesUseCase} from "../../application/material/ManageMaterialPropertiesUseCase";
import {SyncInvoiceWithSriUseCase} from "../../application/invoice/SyncInvoiceWithSriUseCase";
import {SendInvoiceByEmailUseCase} from "../../application/invoice/SendInvoiceByEmailUseCase";
import {UpdateInvoicePaymentUseCase} from "../../application/invoice/UpdateInvoicePaymentUseCase";

// ============= SERVICIOS DE APLICACIÓN =============
import {UserService} from "../../application/user/UserService";

// ============= CONTROLADORES EXISTENTES =============
import {AuthController} from "../webserver/controllers/AuthController";
import {CalculationController} from "../webserver/controllers/CalculationController";
import {CalculationTemplateController} from "../webserver/controllers/CalculationTemplateController";
import {BudgetController} from "../webserver/controllers/BudgetController";
import {ProjectScheduleController} from "../webserver/controllers/ProjectScheduleController";
import {TaskController} from "../webserver/controllers/TaskController";
import {PhaseController} from "../webserver/controllers/PhaseController";
import {NotificationController} from "../webserver/controllers/NotificationController";
import {ProgressReportController} from "../webserver/controllers/ProgressReportController";
import {MaterialRequestController} from "../webserver/controllers/MaterialRequestController";
import {MaterialController} from "../webserver/controllers/MaterialController";
import {TemplateImportExportController} from "../webserver/controllers/TemplateImportExportController";
import {SupplierIntegrationController} from "../webserver/controllers/SupplierIntegrationController";
import {MaterialPropertyController} from "../webserver/controllers/MaterialPropertyController";
import {ProjectDashboardController} from "../webserver/controllers/ProjectDashboardController";
import {ProjectMetricsController} from "../webserver/controllers/ProjectMetricsController";
import {AccountingController} from "../webserver/controllers/AccountingController";
import {EnhancedProjectDashboardController} from "../webserver/controllers/EnhancedProjectDashboardController";
import {ProjectPredictionController} from "../webserver/controllers/ProjectPredictionController";
import {OrderController} from "../webserver/controllers/OrderController";
import {TwoFactorAuthController} from "../webserver/controllers/TwoFactorAuthController";
import {InvoiceController} from "../webserver/controllers/InvoiceController";
import {UserController} from "../webserver/controllers/UserController";
import {TemplateFavoriteController} from "../webserver/controllers/TemplateFavoriteController";
import {TemplateRatingController} from "../webserver/controllers/TemplateRatingController";
import {TemplateSuggestionController} from "../webserver/controllers/TemplateSuggestionController";
import {CalculationComparisonController} from "../webserver/controllers/CalculationComparisonController";
import {TrendingController} from "../webserver/controllers/TrendingController";
// *** NUEVO: Controlador para plantillas personales de usuarios ***
import {UserCalculationTemplateController} from "../webserver/controllers/UserCalculationTemplateController";

// ============= VARIABLES GLOBALES DE REPOSITORIOS =============
let userRepository: TypeOrmUserRepository;
let calculationTemplateRepository: TypeOrmCalculationTemplateRepository;
let calculationParameterRepository: TypeOrmCalculationParameterRepository;
let calculationResultRepository: TypeOrmCalculationResultRepository;
let geographicalZoneRepository: TypeOrmGeographicalZoneRepository;
let materialRepository: TypeOrmMaterialRepository;
let projectBudgetRepository: TypeOrmProjectBudgetRepository;
let budgetItemRepository: TypeOrmBudgetItemRepository;
let projectRepository: TypeOrmProjectRepository;
let phaseRepository: TypeOrmPhaseRepository;
let taskRepository: TypeOrmTaskRepository;
let notificationRepository: TypeOrmNotificationRepository;
let materialRequestRepository: TypeOrmMaterialRequestRepository;
let accountingTransactionRepository: TypeOrmAccountingTransactionRepository;
let orderRepository: TypeOrmOrderRepository;
let orderItemRepository: TypeOrmOrderItemRepository;
let userInteractionRepository: TypeOrmUserInteractionRepository;
let invoiceRepository: TypeOrmInvoiceRepository;
let categoryRepository: TypeOrmCategoryRepository;
let materialPropertyRepository: TypeOrmMaterialPropertyRepository;
let userFavoriteRepository: TypeOrmUserFavoriteRepository;
let templateRatingRepository: TypeOrmTemplateRatingRepository;
let templateSuggestionRepository: TypeOrmTemplateSuggestionRepository;
let calculationComparisonRepository: TypeOrmCalculationComparisonRepository;
let trendingCalculationRepository: TypeOrmTrendingCalculationRepository;
// *** NUEVO: Variable global para repositorio de plantillas personales ***
let userCalculationTemplateRepository: TypeOrmUserCalculationTemplateRepository;

// ============= VARIABLES GLOBALES DE SERVICIOS =============
let authService: AuthService;
let calculationService: CalculationService;
let templateValidationService: TemplateValidationService;
let recommendationService: RecommendationService;
let projectMetricsService: ProjectMetricsService;
let userPatternAnalysisService: UserPatternAnalysisService;
let advancedRecommendationService: AdvancedRecommendationService;
let twoFactorAuthService: TwoFactorAuthService;
let userService: UserService;
let notificationService: NotificationServiceImpl;
let emailService: EmailServiceImpl;
let pushNotificationService: PushNotificationServiceImpl;
let pdfGenerationService: PdfGenerationService;

// ============= VARIABLES GLOBALES DE CASOS DE USO =============
let executeCalculationUseCase: ExecuteCalculationUseCase;
let createCalculationTemplateUseCase: CreateCalculationTemplateUseCase;
let getTemplateRecommendationsUseCase: GetTemplateRecommendationsUseCase;
let saveCalculationResultUseCase: SaveCalculationResultUseCase;
let exportCalculationTemplateUseCase: ExportCalculationTemplateUseCase;
let importCalculationTemplateUseCase: ImportCalculationTemplateUseCase;
let generateBudgetFromCalculationUseCase: GenerateBudgetFromCalculationUseCase;
let favoriteTemplateUseCase: FavoriteTemplateUseCase;
let rateTemplateUseCase: RateTemplateUseCase;
let createSuggestionUseCase: CreateSuggestionUseCase;
let getSuggestionsUseCase: GetSuggestionsUseCase;
let updateSuggestionStatusUseCase: UpdateSuggestionStatusUseCase;
let compareCalculationsUseCase: CompareCalculationsUseCase;
let getTrendingTemplatesUseCase: GetTrendingTemplatesUseCase;
let getUserFavoritesUseCase: GetUserFavoritesUseCase;
let getSavedComparisonsUseCase: GetSavedComparisonsUseCase;

// *** NUEVOS: Variables globales para casos de uso de plantillas personales ***
let createUserTemplateUseCase: CreateUserTemplateUseCase;
let getUserTemplatesUseCase: GetUserTemplatesUseCase;
let getUserTemplateByIdUseCase: GetUserTemplateByIdUseCase;
let updateUserTemplateUseCase: UpdateUserTemplateUseCase;
let deleteUserTemplateUseCase: DeleteUserTemplateUseCase;
let duplicateOfficialTemplateUseCase: DuplicateOfficialTemplateUseCase;
let createTemplateFromResultUseCase: CreateTemplateFromResultUseCase;
let shareUserTemplateUseCase: ShareUserTemplateUseCase;
let changeTemplateStatusUseCase: ChangeTemplateStatusUseCase;
let getPublicUserTemplatesUseCase: GetPublicUserTemplatesUseCase;
let getUserTemplateStatsUseCase: GetUserTemplateStatsUseCase;

// ============= OTROS CASOS DE USO =============
let generateProjectScheduleUseCase: GenerateProjectScheduleUseCase;
let getProjectBudgetsUseCase: GetProjectBudgetsUseCase;
let createBudgetVersionUseCase: CreateBudgetVersionUseCase;
let updateTaskProgressUseCase: UpdateTaskProgressUseCase;
let assignTaskUseCase: AssignTaskUseCase;
let compareBudgetVersionsUseCase: CompareBudgetVersionsUseCase;
let addLaborAndIndirectCostsUseCase: AddLaborAndIndirectCostsUseCase;
let generateProgressReportUseCase: GenerateProgressReportUseCase;
let createMaterialRequestUseCase: CreateMaterialRequestUseCase;
let approveMaterialRequestUseCase: ApproveMaterialRequestUseCase;
let getProjectDashboardDataUseCase: GetProjectDashboardDataUseCase;
let getProjectMetricsUseCase: GetProjectMetricsUseCase;
let syncBudgetWithAccountingUseCase: SyncBudgetWithAccountingUseCase;
let enhancedProjectDashboardUseCase: EnhancedProjectDashboardUseCase;
let predictProjectDelaysUseCase: PredictProjectDelaysUseCase;
let compareMaterialPricesUseCase: CompareMaterialPricesUseCase;
let createOrderFromMaterialRequestsUseCase: CreateOrderFromMaterialRequestsUseCase;
let advancedRecommendationsUseCase: GetAdvancedRecommendationsUseCase;
let manageMaterialPropertiesUseCase: ManageMaterialPropertiesUseCase;
let syncInvoiceWithSriUseCase: SyncInvoiceWithSriUseCase;
let sendInvoiceByEmailUseCase: SendInvoiceByEmailUseCase;
let updateInvoicePaymentUseCase: UpdateInvoicePaymentUseCase;

// ============= VARIABLES GLOBALES DE CONTROLADORES =============
let authController: AuthController;
let calculationController: CalculationController;
let calculationTemplateController: CalculationTemplateController;
let budgetController: BudgetController;
let projectScheduleController: ProjectScheduleController;
let taskController: TaskController;
let phaseController: PhaseController;
let notificationController: NotificationController;
let progressReportController: ProgressReportController;
let materialRequestController: MaterialRequestController;
let materialController: MaterialController;
let templateImportExportController: TemplateImportExportController;
let supplierIntegrationController: SupplierIntegrationController;
let materialPropertyController: MaterialPropertyController;
let projectDashboardController: ProjectDashboardController;
let projectMetricsController: ProjectMetricsController;
let accountingController: AccountingController;
let enhancedProjectDashboardController: EnhancedProjectDashboardController;
let projectPredictionController: ProjectPredictionController;
let orderController: OrderController;
let twoFactorAuthController: TwoFactorAuthController;
let invoiceController: InvoiceController;
let userController: UserController;
let templateFavoriteController: TemplateFavoriteController;
let templateRatingController: TemplateRatingController;
let templateSuggestionController: TemplateSuggestionController;
let calculationComparisonController: CalculationComparisonController;
let trendingController: TrendingController;
// *** NUEVO: Variable global para controlador de plantillas personales ***
let userCalculationTemplateController: UserCalculationTemplateController;

export function initializeServices() {
	console.log("Initializing services directly...");

	try {
		// ============= INICIALIZAR REPOSITORIOS =============
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
		invoiceRepository = new TypeOrmInvoiceRepository();
		categoryRepository = new TypeOrmCategoryRepository();
		materialPropertyRepository = new TypeOrmMaterialPropertyRepository();
		userFavoriteRepository = new TypeOrmUserFavoriteRepository();
		templateRatingRepository = new TypeOrmTemplateRatingRepository();
		templateSuggestionRepository = new TypeOrmTemplateSuggestionRepository();
		calculationComparisonRepository =
			new TypeOrmCalculationComparisonRepository();
		trendingCalculationRepository = new TypeOrmTrendingCalculationRepository();
		// *** NUEVO: Inicializar repositorio de plantillas personales ***
		userCalculationTemplateRepository =
			new TypeOrmUserCalculationTemplateRepository();

		// ============= INICIALIZAR SERVICIOS =============
		authService = new AuthService();
		calculationService = new CalculationService();
		templateValidationService = new TemplateValidationService();
		recommendationService = new RecommendationService();
		projectMetricsService = new ProjectMetricsService();
		pdfGenerationService = new PdfGenerationService();
		userPatternAnalysisService = new UserPatternAnalysisService();
		advancedRecommendationService = new AdvancedRecommendationService();
		twoFactorAuthService = new TwoFactorAuthService();
		userService = new UserService(userRepository);

		// Servicios de infraestructura
		emailService = new EmailServiceImpl(
			process.env.EMAIL_API_KEY || "mock-key",
			process.env.EMAIL_FROM_ADDRESS || "noreply@constru-app.com"
		);

		pushNotificationService = new PushNotificationServiceImpl(
			process.env.PUSH_API_KEY || "mock-key",
			process.env.PUSH_APP_ID || "constru-app"
		);

		notificationService = new NotificationServiceImpl(
			notificationRepository,
			userRepository,
			projectRepository,
			emailService,
			pushNotificationService
		);

		// ============= INICIALIZAR CASOS DE USO PRINCIPALES =============
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

		generateBudgetFromCalculationUseCase =
			new GenerateBudgetFromCalculationUseCase(
				calculationResultRepository,
				materialRepository,
				projectBudgetRepository,
				budgetItemRepository
			);

		favoriteTemplateUseCase = new FavoriteTemplateUseCase(
			userFavoriteRepository,
			calculationTemplateRepository
		);

		rateTemplateUseCase = new RateTemplateUseCase(
			templateRatingRepository,
			calculationTemplateRepository
		);

		createSuggestionUseCase = new CreateSuggestionUseCase(
			templateSuggestionRepository,
			calculationTemplateRepository
		);

		getSuggestionsUseCase = new GetSuggestionsUseCase(
			templateSuggestionRepository
		);

		updateSuggestionStatusUseCase = new UpdateSuggestionStatusUseCase(
			templateSuggestionRepository
		);

		compareCalculationsUseCase = new CompareCalculationsUseCase(
			calculationResultRepository,
			calculationComparisonRepository
		);

		getTrendingTemplatesUseCase = new GetTrendingTemplatesUseCase(
			trendingCalculationRepository,
			calculationTemplateRepository
		);

		getUserFavoritesUseCase = new GetUserFavoritesUseCase(
			userFavoriteRepository,
			calculationTemplateRepository
		);

		getSavedComparisonsUseCase = new GetSavedComparisonsUseCase(
			calculationComparisonRepository
		);

		// *** NUEVOS: Inicializar casos de uso de plantillas personales ***
		createUserTemplateUseCase = new CreateUserTemplateUseCase(
			userCalculationTemplateRepository
		);

		getUserTemplatesUseCase = new GetUserTemplatesUseCase(
			userCalculationTemplateRepository
		);

		getUserTemplateByIdUseCase = new GetUserTemplateByIdUseCase(
			userCalculationTemplateRepository
		);

		updateUserTemplateUseCase = new UpdateUserTemplateUseCase(
			userCalculationTemplateRepository
		);

		deleteUserTemplateUseCase = new DeleteUserTemplateUseCase(
			userCalculationTemplateRepository
		);

		duplicateOfficialTemplateUseCase = new DuplicateOfficialTemplateUseCase(
			userCalculationTemplateRepository,
			calculationTemplateRepository
		);

		createTemplateFromResultUseCase = new CreateTemplateFromResultUseCase(
			userCalculationTemplateRepository,
			calculationResultRepository
		);

		shareUserTemplateUseCase = new ShareUserTemplateUseCase(
			userCalculationTemplateRepository,
			userRepository
		);

		changeTemplateStatusUseCase = new ChangeTemplateStatusUseCase(
			userCalculationTemplateRepository
		);

		getPublicUserTemplatesUseCase = new GetPublicUserTemplatesUseCase(
			userCalculationTemplateRepository
		);

		getUserTemplateStatsUseCase = new GetUserTemplateStatsUseCase(
			userCalculationTemplateRepository
		);

		// ============= INICIALIZAR OTROS CASOS DE USO =============
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
		manageMaterialPropertiesUseCase = new ManageMaterialPropertiesUseCase(
			materialRepository,
			materialPropertyRepository
		);
		syncInvoiceWithSriUseCase = new SyncInvoiceWithSriUseCase(
			invoiceRepository,
			userRepository,
			notificationService
		);
		sendInvoiceByEmailUseCase = new SendInvoiceByEmailUseCase(
			invoiceRepository,
			userRepository,
			emailService,
			pdfGenerationService,
			notificationService
		);
		updateInvoicePaymentUseCase = new UpdateInvoicePaymentUseCase(
			invoiceRepository,
			userRepository,
			accountingTransactionRepository,
			notificationService
		);

		// ============= INICIALIZAR CONTROLADORES PRINCIPALES =============
		authController = new AuthController(authService, userRepository);
		calculationController = new CalculationController(
			executeCalculationUseCase,
			getTemplateRecommendationsUseCase,
			saveCalculationResultUseCase
		);
		calculationTemplateController = new CalculationTemplateController(
			createCalculationTemplateUseCase,
			calculationService,
			calculationTemplateRepository
		);

		templateFavoriteController = new TemplateFavoriteController(
			favoriteTemplateUseCase,
			getUserFavoritesUseCase
		);
		templateRatingController = new TemplateRatingController(
			rateTemplateUseCase
		);
		templateSuggestionController = new TemplateSuggestionController(
			createSuggestionUseCase,
			getSuggestionsUseCase,
			updateSuggestionStatusUseCase
		);
		calculationComparisonController = new CalculationComparisonController(
			compareCalculationsUseCase,
			getSavedComparisonsUseCase,
			calculationComparisonRepository
		);
		trendingController = new TrendingController(getTrendingTemplatesUseCase);

		// *** NUEVO: Inicializar controlador de plantillas personales ***
		userCalculationTemplateController = new UserCalculationTemplateController(
			createUserTemplateUseCase,
			getUserTemplatesUseCase,
			getUserTemplateByIdUseCase,
			updateUserTemplateUseCase,
			deleteUserTemplateUseCase,
			duplicateOfficialTemplateUseCase,
			createTemplateFromResultUseCase,
			shareUserTemplateUseCase,
			changeTemplateStatusUseCase,
			getPublicUserTemplatesUseCase,
			getUserTemplateStatsUseCase
		);

		// ============= INICIALIZAR OTROS CONTROLADORES =============
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
		twoFactorAuthController = new TwoFactorAuthController(
			twoFactorAuthService,
			userRepository,
			authService
		);
		invoiceController = new InvoiceController(
			invoiceRepository,
			syncInvoiceWithSriUseCase,
			sendInvoiceByEmailUseCase,
			updateInvoicePaymentUseCase,
			pdfGenerationService
		);
		userController = new UserController(
			userService,
			userPatternAnalysisService,
			userInteractionRepository
		);
		materialPropertyController = new MaterialPropertyController(
			manageMaterialPropertiesUseCase
		);
		supplierIntegrationController = new SupplierIntegrationController(
			materialRepository,
			categoryRepository,
			notificationService
		);

		console.log("Services initialized successfully");
	} catch (error) {
		console.error("Failed to initialize services:", error);
		throw error;
	}
}

// ============= GETTERS PARA CONTROLADORES PRINCIPALES =============
export function getAuthController() {
	if (!authController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return authController;
}

export function getCalculationController() {
	if (!calculationController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return calculationController;
}

export function getCalculationTemplateController() {
	if (!calculationTemplateController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return calculationTemplateController;
}

export function getTemplateFavoriteController() {
	if (!templateFavoriteController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return templateFavoriteController;
}

export function getTemplateRatingController() {
	if (!templateRatingController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return templateRatingController;
}

export function getTemplateSuggestionController() {
	if (!templateSuggestionController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return templateSuggestionController;
}

export function getCalculationComparisonController() {
	if (!calculationComparisonController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return calculationComparisonController;
}

export function getTrendingController() {
	if (!trendingController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return trendingController;
}

// *** NUEVO: Getter para controlador de plantillas personales ***
export function getUserTemplateController() {
	if (!userCalculationTemplateController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return userCalculationTemplateController;
}

// ============= GETTERS PARA OTROS CONTROLADORES =============
export function getBudgetController() {
	if (!budgetController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return budgetController;
}

export function getProjectScheduleController() {
	if (!projectScheduleController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return projectScheduleController;
}

export function getTaskController() {
	if (!taskController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return taskController;
}

export function getPhaseController() {
	if (!phaseController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return phaseController;
}

export function getNotificationController() {
	if (!notificationController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return notificationController;
}

export function getProgressReportController() {
	if (!progressReportController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return progressReportController;
}

export function getMaterialRequestController() {
	if (!materialRequestController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return materialRequestController;
}

export function getMaterialController() {
	if (!materialController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return materialController;
}

export function getTemplateImportExportController() {
	if (!templateImportExportController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return templateImportExportController;
}

export function getSupplierIntegrationController() {
	if (!supplierIntegrationController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return supplierIntegrationController;
}

export function getMaterialPropertyController() {
	if (!materialPropertyController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return materialPropertyController;
}

export function getProjectDashboardController() {
	if (!projectDashboardController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return projectDashboardController;
}

export function getProjectMetricsController() {
	if (!projectMetricsController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return projectMetricsController;
}

export function getAccountingController() {
	if (!accountingController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return accountingController;
}

export function getEnhancedProjectDashboardController() {
	if (!enhancedProjectDashboardController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return enhancedProjectDashboardController;
}

export function getProjectPredictionController() {
	if (!projectPredictionController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return projectPredictionController;
}

export function getOrderController() {
	if (!orderController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return orderController;
}

export function getTwoFactorAuthController() {
	if (!twoFactorAuthController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return twoFactorAuthController;
}

export function getInvoiceController() {
	if (!invoiceController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return invoiceController;
}

export function getUserController() {
	if (!userController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return userController;
}

// ============= GETTERS PARA SERVICIOS =============
export function getNotificationService() {
	if (!notificationService)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return notificationService;
}

export function getPdfGenerationService() {
	if (!pdfGenerationService)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return pdfGenerationService;
}

export function getUserPatternAnalysisService() {
	if (!userPatternAnalysisService)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return userPatternAnalysisService;
}

export function getAdvancedRecommendationService() {
	if (!advancedRecommendationService)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return advancedRecommendationService;
}

export function getEmailService() {
	if (!emailService)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return emailService;
}

export function getPushNotificationService() {
	if (!pushNotificationService)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return pushNotificationService;
}

export function getTwoFactorAuthService() {
	if (!twoFactorAuthService)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return twoFactorAuthService;
}

// ============= GETTERS PARA REPOSITORIOS =============
export function getAccountingTransactionRepository() {
	if (!accountingTransactionRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return accountingTransactionRepository;
}

export function getUserInteractionRepository() {
	if (!userInteractionRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return userInteractionRepository;
}

export function getAdvancedRecommendationsUseCase() {
	if (!advancedRecommendationsUseCase)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return advancedRecommendationsUseCase;
}
