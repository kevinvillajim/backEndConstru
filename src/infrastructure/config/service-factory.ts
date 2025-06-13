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
import {TypeOrmUserCalculationTemplateRepository} from "../database/repositories/TypeOrmUserCalculationTemplateRepository";
import {TypeOrmUserTemplateUsageLogRepository} from "../database/repositories/TypeOrmUserTemplateUsageLogRepository";
import {TypeOrmTemplateRankingRepository} from "../database/repositories/TypeOrmTemplateRankingRepository";
import {TypeOrmPromotionRequestRepository} from "../database/repositories/TypeOrmPromotionRequestRepository";
import { TypeOrmAuthorCreditRepository } from "../database/repositories/TypeOrmAuthorCreditRepository";
import { TypeOrmCalculationBudgetRepository } from "../database/repositories/TypeOrmCalculationBudgetRepository";
import { TypeOrmBudgetTemplateRepository } from "../database/repositories/TypeOrmBudgetTemplateRepository";
import { TypeOrmBudgetLineItemRepository } from "../database/repositories/TypeOrmBudgetLineItemRepository";
import { TypeOrmProfessionalCostRepository } from "../database/repositories/TypeOrmProfessionalCostRepository";
import { TypeOrmCalculationScheduleRepository } from "../../infrastructure/database/repositories/TypeOrmCalculationScheduleRepository";
import { TypeOrmProgressTrackingRepository } from "../../infrastructure/database/repositories/TypeOrmProgressTrackingRepository";
import { TypeOrmResourceAssignmentRepository } from "../../infrastructure/database/repositories/TypeOrmResourceAssignmentRepository";
import { TypeOrmScheduleActivityRepository } from "../../infrastructure/database/repositories/TypeOrmScheduleActivityRepository";
import { TypeOrmScheduleTemplateRepository } from "../../infrastructure/database/repositories/TypeOrmScheduleTemplateRepository";
import { TypeOrmWeatherFactorRepository } from '../database/repositories/TypeOrmWeatherFactorRepository';
import { TypeOrmWorkforceRepository } from '../database/repositories/TypeOrmWorkforceRepository';
import { TypeOrmEquipmentRepository } from '../database/repositories/TypeOrmEquipmentRepository';



// ============= SERVICIOS DE DOMINIO =============
import {AuthService} from "../../domain/services/AuthService";
import {CalculationService} from "../../domain/services/CalculationService";
import {TemplateValidationService} from "../../domain/services/TemplateValidationService";
import {RecommendationService} from "../../domain/services/RecommendationService";
import {ProjectMetricsService} from "../../domain/services/ProjectMetricsService";
import {UserPatternAnalysisService} from "../../domain/services/UserPatternAnalysisService";
import {AdvancedRecommendationService} from "../../domain/services/AdvancedRecommendationService";
import {TwoFactorAuthService} from "../../domain/services/TwoFactorAuthService";
import {RealtimeAnalyticsService} from "../websocket/RealtimeAnalyticsService";
import { CalculationBudgetService } from "../../domain/services/CalculationBudgetService";
import { BudgetPricingService } from "../../domain/services/BudgetPricingService";
import { BudgetTemplateService } from "../../domain/services/BudgetTemplateService";
import { BudgetScheduleIntegrationService } from '../../domain/services/BudgetScheduleIntegrationService';
import { CalculationScheduleService } from '../../domain/services/CalculationScheduleService';
import { ExternalIntegrationService } from '../../domain/services/ExternalIntegrationService';
import { ResourceOptimizationService } from "../../domain/services/ResourceOptimizationService";
import { WeatherImpactService } from "../../domain/services/WeatherImpactService";


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
import {TrackTemplateUsageUseCase} from "../../application/calculation/TrackTemplateUsageUseCase";
import {CalculateTemplateRankingsUseCase} from "../../application/calculation/CalculateTemplateRankingsUseCase";
import {CreatePromotionRequestUseCase} from "../../application/calculation/CreatePromotionRequestUseCase";
import {ReviewPromotionRequestUseCase} from "../../application/calculation/ReviewPromotionRequestUseCase";
import {PromoteTemplateToVerifiedUseCase} from "../../application/calculation/PromoteTemplateToVerifiedUseCase";
import {GetTemplateAnalyticsUseCase} from "../../application/calculation/GetTemplateAnalyticsUseCase";
import { CreateCalculationBudgetUseCase } from "../../application/budget/CreateCalculationBudgetUseCase";
import { UpdateBudgetPricingUseCase } from "../../application/budget/UpdateBudgetPricingUseCase";
import { GenerateProfessionalBudgetUseCase } from "../../application/budget/GenerateProfessionalBudgetUseCase";
import { ApplyBudgetTemplateUseCase } from "../../application/budget/ApplyBudgetTemplateUseCase";
import { GenerateScheduleFromBudgetUseCase } from '../../application/schedule/GenerateScheduleFromBudgetUseCase';
import { OptimizeProjectScheduleUseCase } from '../../application/schedule/OptimizeProjectScheduleUseCase';
import { TrackDailyProgressUseCase } from '../../application/schedule/TrackDailyProgressUseCase';
import { GenerateScheduleReportsUseCase } from '../../application/schedule/GenerateScheduleReportsUseCase';
import { PredictProjectDelaysScheduleUseCase } from '../../application/schedule/PredictProjectDelaysScheduleUseCase';

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
import {UserCalculationTemplateController} from "../webserver/controllers/UserCalculationTemplateController";
import {AdminPromotionController} from "../webserver/controllers/AdminPromotionController";
import {TemplateAnalyticsController} from "../webserver/controllers/TemplateAnalyticsController";
import { GlobalStatsController } from "../webserver/controllers/GlobalStatsController";
import { GetGlobalTemplateStatsUseCase } from "../../application/calculation/GetGlobalTemplateStatsUseCase";
import { TemplateTrackingController } from "../webserver/controllers/TemplateTrackingController";
import { CalculationBudgetController } from "../webserver/controllers/CalculationBudgetController";
import { BudgetTemplateController } from "../webserver/controllers/BudgetTemplateController";
import { CalculationScheduleController } from '../webserver/controllers/CalculationScheduleController';
import { ScheduleAnalyticsController } from '../webserver/controllers/ScheduleAnalyticsController';
import { ResourceManagementController } from '../webserver/controllers/ResourceManagementController';


// ============= JOBS =============
import {
	EnhancedRankingCalculationJob,
	initializeRankingJobs,
} from "../jobs/EnhancedRankingCalculationJob";
import { ScheduleUpdateJob } from '../jobs/ScheduleUpdateJob';
import { PerformanceAnalysisJob } from '../jobs/PerformanceAnalysisJob';
import { WeatherUpdateJob } from '../jobs/WeatherUpdateJob';

import {MaterialCalculationResultRepository} from "../../domain/repositories/MaterialCalculationResultRepository";
import {MaterialCalculationTemplateRepository} from "../../domain/repositories/MaterialCalculationTemplateRepository";
import {UserMaterialCalculationTemplateRepository} from "../../domain/repositories/UserMaterialCalculationTemplateRepository";
import {CreateMaterialCalculationUseCase} from "../../application/calculation/material/CreateMaterialCalculationUseCase";
import {CreateUserMaterialTemplateUseCase} from "../../application/calculation/material/CreateUserMaterialTemplateUseCase";
import {MaterialCalculationService} from "../../domain/services/MaterialCalculationService";
import { CalculateMaterialTemplateRankingsUseCase } from "../../application/calculation/material/CalculateMaterialTemplateRankingsUseCase";
import { GetMaterialTrendingTemplatesUseCase } from "../../application/calculation/material/GetMaterialTrendingTemplatesUseCase";
import { TrackMaterialTemplateUsageUseCase } from "../../application/calculation/material/TrackMaterialTemplateUsageUseCase";
import { TypeOrmMaterialCalculationTemplateRepository } from "../../infrastructure/database/repositories/TypeOrmMaterialCalculationTemplateRepository";
import { MaterialCalculationController } from "../../infrastructure/webserver/controllers/MaterialCalculationController";
import { MaterialCalculationTemplateController } from "../../infrastructure/webserver/controllers/MaterialCalculationTemplateController";
import { MaterialTrendingController } from "../../infrastructure/webserver/controllers/MaterialTrendingController";
import {MaterialTemplateValidationServiceImpl} from "../services/MaterialTemplateValidationServiceImpl";
import {TypeOrmMaterialTemplateUsageLogRepository} from "../database/repositories/TypeOrmMaterialTemplateUsageLogRepository";
import {TypeOrmMaterialTemplateRankingRepository} from "../database/repositories/TypeOrmMaterialTemplateRankingRepository";
import {GetMaterialTemplatesByTypeUseCase} from "../../application/calculation/material/GetMaterialTemplatesByTypeUseCase";
import {SearchMaterialTemplatesUseCase} from "../../application/calculation/material/SearchMaterialTemplatesUseCase";
import {GetMaterialAnalyticsUseCase} from "../../application/calculation/material/GetMaterialAnalyticsUseCase";
import {TypeOrmMaterialCalculationResultRepository} from "../database/repositories/TypeOrmMaterialCalculationResultRepository";
import {TypeOrmUserMaterialCalculationTemplateRepository} from "../database/repositories/TypeOrmUserMaterialCalculationTemplateRepository";
import {UserMaterialTemplateController} from "../webserver/controllers/UserMaterialTemplateController";
import { BudgetTemplateRepository } from "../../domain/repositories/BudgetTemplateRepository";
import { BudgetLineItemRepository } from "../../domain/repositories/BudgetLineItemRepository";
import { ProfessionalCostRepository } from "../../domain/repositories/ProfessionalCostRepository";
import { CalculationBudgetRepository } from "../../domain/repositories/CalculationBudgetRepository";
import { ProjectRepository } from "../../domain/repositories/ProjectRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";



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
let userCalculationTemplateRepository: TypeOrmUserCalculationTemplateRepository;
let userTemplateUsageLogRepository: TypeOrmUserTemplateUsageLogRepository;
let templateRankingRepository: TypeOrmTemplateRankingRepository;
let promotionRequestRepository: TypeOrmPromotionRequestRepository;
let authorCreditRepository: TypeOrmAuthorCreditRepository;
let calculationBudgetRepository: TypeOrmCalculationBudgetRepository;
let budgetTemplateRepository: TypeOrmBudgetTemplateRepository;
let budgetLineItemRepository: TypeOrmBudgetLineItemRepository;
let professionalCostRepository: TypeOrmProfessionalCostRepository;
let calculationScheduleRepository: TypeOrmCalculationScheduleRepository;
let scheduleTemplateRepository: TypeOrmScheduleTemplateRepository;
let scheduleActivityRepository: TypeOrmScheduleActivityRepository;
let resourceAssignmentRepository: TypeOrmResourceAssignmentRepository;
let progressTrackingRepository: TypeOrmProgressTrackingRepository;
let weatherFactorRepository: TypeOrmWeatherFactorRepository;
let workforceRepository: TypeOrmWorkforceRepository;
let equipmentRepository: TypeOrmEquipmentRepository;

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
let realtimeAnalyticsService: RealtimeAnalyticsService;
let calculationBudgetService: CalculationBudgetService;
let budgetPricingService: BudgetPricingService;
let budgetTemplateService: BudgetTemplateService;
let budgetScheduleIntegrationService: BudgetScheduleIntegrationService;
let calculationScheduleService: CalculationScheduleService;
let externalIntegrationService: ExternalIntegrationService;
let resourceOptimizationService: ResourceOptimizationService;
let weatherImpactService: WeatherImpactService;


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
let createCalculationBudgetUseCase: CreateCalculationBudgetUseCase;
let updateBudgetPricingUseCase: UpdateBudgetPricingUseCase;
let generateProfessionalBudgetUseCase: GenerateProfessionalBudgetUseCase;
let applyBudgetTemplateUseCase: ApplyBudgetTemplateUseCase;
let generateScheduleFromBudgetUseCase: GenerateScheduleFromBudgetUseCase;
let optimizeProjectScheduleUseCase: OptimizeProjectScheduleUseCase;
let trackDailyProgressUseCase: TrackDailyProgressUseCase;
let generateScheduleReportsUseCase: GenerateScheduleReportsUseCase;
let predictProjectDelaysScheduleUseCase: PredictProjectDelaysScheduleUseCase;

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
let trackTemplateUsageUseCase: TrackTemplateUsageUseCase;
let calculateTemplateRankingsUseCase: CalculateTemplateRankingsUseCase;
let createPromotionRequestUseCase: CreatePromotionRequestUseCase;
let reviewPromotionRequestUseCase: ReviewPromotionRequestUseCase;
let promoteTemplateToVerifiedUseCase: PromoteTemplateToVerifiedUseCase;
let getTemplateAnalyticsUseCase: GetTemplateAnalyticsUseCase;
let getGlobalTemplateStatsUseCase: GetGlobalTemplateStatsUseCase;
let calculationScheduleController: CalculationScheduleController;
let scheduleAnalyticsController: ScheduleAnalyticsController;
let resourceManagementController: ResourceManagementController;


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
let adminPromotionController: AdminPromotionController;
let templateAnalyticsController: TemplateAnalyticsController;
let globalStatsController: GlobalStatsController;
let templateTrackingController: TemplateTrackingController;

let materialCalculationTemplateRepository: MaterialCalculationTemplateRepository;
let userMaterialCalculationTemplateRepository: UserMaterialCalculationTemplateRepository;
let materialCalculationResultRepository: MaterialCalculationResultRepository;
let materialCalculationService: MaterialCalculationService;
let createMaterialCalculationUseCase: CreateMaterialCalculationUseCase;
let createUserMaterialTemplateUseCase: CreateUserMaterialTemplateUseCase;
let executeMaterialCalculationUseCase: CreateMaterialCalculationUseCase;
// Controllers de materiales
let materialCalculationTemplateController: MaterialCalculationTemplateController;
let materialCalculationController: MaterialCalculationController;
let userMaterialTemplateController: UserMaterialTemplateController;
let materialTrendingController: MaterialTrendingController;
let calculationBudgetController: CalculationBudgetController | null = null;
let budgetTemplateController: BudgetTemplateController | null = null;

// Use cases adicionales
let materialTemplateValidationService: MaterialTemplateValidationServiceImpl;
let materialTemplateUsageLogRepository: TypeOrmMaterialTemplateUsageLogRepository;
let materialTemplateRankingRepository: TypeOrmMaterialTemplateRankingRepository;
let getMaterialTemplatesByTypeUseCase: GetMaterialTemplatesByTypeUseCase;
let searchMaterialTemplatesUseCase: SearchMaterialTemplatesUseCase;
let getMaterialAnalyticsUseCase: GetMaterialAnalyticsUseCase;
let getMaterialTrendingTemplatesUseCase: GetMaterialTrendingTemplatesUseCase;
let trackMaterialTemplateUsageUseCase: TrackMaterialTemplateUsageUseCase;
let calculateMaterialTemplateRankingsUseCase: CalculateMaterialTemplateRankingsUseCase;



// ============= VARIABLES GLOBALES DE JOBS =============
let enhancedRankingJob: EnhancedRankingCalculationJob;
let scheduleUpdateJob: ScheduleUpdateJob;
let performanceAnalysisJob: PerformanceAnalysisJob;
let weatherUpdateJob: WeatherUpdateJob;

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
		userCalculationTemplateRepository =
			new TypeOrmUserCalculationTemplateRepository();
		userTemplateUsageLogRepository =
			new TypeOrmUserTemplateUsageLogRepository();
		templateRankingRepository = new TypeOrmTemplateRankingRepository();
		promotionRequestRepository = new TypeOrmPromotionRequestRepository();
		authorCreditRepository = new TypeOrmAuthorCreditRepository();
		materialTemplateUsageLogRepository =
			new TypeOrmMaterialTemplateUsageLogRepository();
		materialTemplateRankingRepository =
		new TypeOrmMaterialTemplateRankingRepository();
		calculationBudgetRepository = new TypeOrmCalculationBudgetRepository();
		budgetTemplateRepository = new TypeOrmBudgetTemplateRepository();
		budgetLineItemRepository = new TypeOrmBudgetLineItemRepository();
		professionalCostRepository = new TypeOrmProfessionalCostRepository();
		calculationScheduleRepository = new TypeOrmCalculationScheduleRepository();
		scheduleTemplateRepository = new TypeOrmScheduleTemplateRepository();
		scheduleActivityRepository = new TypeOrmScheduleActivityRepository();
		resourceAssignmentRepository = new TypeOrmResourceAssignmentRepository();
		progressTrackingRepository = new TypeOrmProgressTrackingRepository();
		weatherFactorRepository = new TypeOrmWeatherFactorRepository();
		workforceRepository = new TypeOrmWorkforceRepository();
		equipmentRepository = new TypeOrmEquipmentRepository();

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
		materialTemplateValidationService = new MaterialTemplateValidationServiceImpl();
		calculationBudgetService = new CalculationBudgetService();
		budgetPricingService = new BudgetPricingService();
		budgetTemplateService = new BudgetTemplateService();
		resourceOptimizationService = new ResourceOptimizationService();
		weatherImpactService = new WeatherImpactService();
		budgetScheduleIntegrationService = new BudgetScheduleIntegrationService(
			calculationBudgetRepository,
			calculationScheduleRepository,
			scheduleActivityRepository,
			budgetLineItemRepository,
			notificationService
		);
		
		calculationScheduleService = new CalculationScheduleService(
			calculationTemplateRepository,
			calculationResultRepository,
			scheduleTemplateRepository,
			scheduleActivityRepository
		);
		
		externalIntegrationService = new ExternalIntegrationService(
			calculationScheduleRepository,
			scheduleActivityRepository,
			materialRepository,
			notificationService
		);
		

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
			templateRankingRepository,
			userCalculationTemplateRepository,
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

		getGlobalTemplateStatsUseCase = new GetGlobalTemplateStatsUseCase(
			userCalculationTemplateRepository,
			calculationTemplateRepository,
			userTemplateUsageLogRepository,
			templateRankingRepository,
			promotionRequestRepository,
			authorCreditRepository
		);
		generateScheduleFromBudgetUseCase = new GenerateScheduleFromBudgetUseCase(
			calculationBudgetRepository,
			calculationScheduleRepository,
			scheduleTemplateRepository,
			scheduleActivityRepository
		);
		
		optimizeProjectScheduleUseCase = new OptimizeProjectScheduleUseCase(
			calculationScheduleRepository,
			scheduleActivityRepository
		);
		
		trackDailyProgressUseCase = new TrackDailyProgressUseCase(
			scheduleActivityRepository,
			progressTrackingRepository,
			notificationService
		);
		
		generateScheduleReportsUseCase = new GenerateScheduleReportsUseCase(
			calculationScheduleRepository,
			scheduleActivityRepository,
			progressTrackingRepository
		);
		
		predictProjectDelaysScheduleUseCase = new PredictProjectDelaysScheduleUseCase(
			calculationScheduleRepository,
			scheduleActivityRepository,
			progressTrackingRepository,
			weatherFactorRepository
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
		trackTemplateUsageUseCase = new TrackTemplateUsageUseCase(
			userTemplateUsageLogRepository,
			calculationResultRepository,
			userCalculationTemplateRepository,
			calculationTemplateRepository
		);

		calculateTemplateRankingsUseCase = new CalculateTemplateRankingsUseCase(
			templateRankingRepository,
			userTemplateUsageLogRepository,
			userCalculationTemplateRepository,
			calculationTemplateRepository,
			userFavoriteRepository,
			templateRatingRepository
		);

		createPromotionRequestUseCase = new CreatePromotionRequestUseCase(
			promotionRequestRepository,
			userCalculationTemplateRepository,
			templateRankingRepository,
			userTemplateUsageLogRepository,
			userRepository
		);

		reviewPromotionRequestUseCase = new ReviewPromotionRequestUseCase(
			promotionRequestRepository,
			userRepository,
			notificationService
		);

		promoteTemplateToVerifiedUseCase = new PromoteTemplateToVerifiedUseCase(
			promotionRequestRepository,
			userCalculationTemplateRepository,
			calculationTemplateRepository,
			calculationParameterRepository,
			authorCreditRepository,
			notificationService
		);

		getTemplateAnalyticsUseCase = new GetTemplateAnalyticsUseCase(
			userTemplateUsageLogRepository,
			templateRankingRepository
		);

		getMaterialTemplatesByTypeUseCase = new GetMaterialTemplatesByTypeUseCase(
			getMaterialCalculationTemplateRepository()
		);

		searchMaterialTemplatesUseCase = new SearchMaterialTemplatesUseCase(
			getMaterialCalculationTemplateRepository()
		);

		getMaterialAnalyticsUseCase = new GetMaterialAnalyticsUseCase(
			getMaterialCalculationTemplateRepository(),
			getMaterialTemplateUsageLogRepository()
		);

		createCalculationBudgetUseCase = new CreateCalculationBudgetUseCase(
			calculationBudgetRepository,
			budgetTemplateRepository,
			calculationResultRepository,
			budgetLineItemRepository,
			professionalCostRepository,
			materialRepository,
			calculationBudgetService,
			budgetTemplateService
		  );
		
		  updateBudgetPricingUseCase = new UpdateBudgetPricingUseCase(
			calculationBudgetRepository,
			budgetLineItemRepository,
			materialRepository,
			notificationRepository,
			budgetPricingService
		  );
		
		  generateProfessionalBudgetUseCase = new GenerateProfessionalBudgetUseCase(
			calculationBudgetRepository,
			budgetLineItemRepository,
			professionalCostRepository,
			userRepository,
			pdfGenerationService,
			emailService
		  );
		
		  applyBudgetTemplateUseCase = new ApplyBudgetTemplateUseCase(
			calculationBudgetRepository,
			budgetTemplateRepository,
			budgetLineItemRepository,
			professionalCostRepository,
			calculationBudgetService,
			budgetTemplateService
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
		adminPromotionController = new AdminPromotionController(
			createPromotionRequestUseCase,
			reviewPromotionRequestUseCase,
			promoteTemplateToVerifiedUseCase,
			promotionRequestRepository
		);
		templateAnalyticsController = new TemplateAnalyticsController(
			getTemplateAnalyticsUseCase,
			getTrendingTemplatesUseCase
		);
		globalStatsController = new GlobalStatsController(
			getGlobalTemplateStatsUseCase,
		); 

		templateTrackingController = new TemplateTrackingController(
			trackTemplateUsageUseCase
		);

		calculationBudgetController = new CalculationBudgetController(
			createCalculationBudgetUseCase,
			updateBudgetPricingUseCase,
			generateProfessionalBudgetUseCase,
			calculationBudgetRepository,
			budgetLineItemRepository,
			professionalCostRepository,
			calculationBudgetService,
			budgetPricingService
		  );
		
		  budgetTemplateController = new BudgetTemplateController(
			budgetTemplateRepository,
			budgetTemplateService,
			applyBudgetTemplateUseCase
		  );

		  calculationScheduleController = new CalculationScheduleController(
			generateScheduleFromBudgetUseCase,
			optimizeProjectScheduleUseCase,
			trackDailyProgressUseCase,
			predictProjectDelaysScheduleUseCase,
			budgetScheduleIntegrationService,
			calculationScheduleService,
			calculationScheduleRepository,
			scheduleActivityRepository,
			scheduleTemplateRepository
		);
		
		scheduleAnalyticsController = new ScheduleAnalyticsController(
			generateScheduleReportsUseCase,
			calculationScheduleRepository,
			scheduleActivityRepository,
			progressTrackingRepository
		);
		
		resourceManagementController = new ResourceManagementController(
			scheduleActivityRepository,
			resourceAssignmentRepository,
			workforceRepository,
			equipmentRepository,
			resourceOptimizationService
		);

		// ============= INICIALIZAR JOBS =============
		enhancedRankingJob = initializeRankingJobs();
		console.log("Enhanced ranking calculation jobs initialized");

		scheduleUpdateJob = new ScheduleUpdateJob(
			calculationScheduleRepository,
			scheduleActivityRepository,
			progressTrackingRepository,
			notificationService,
			budgetScheduleIntegrationService
		);
		
		performanceAnalysisJob = new PerformanceAnalysisJob(
			calculationScheduleRepository,
			scheduleActivityRepository,
			progressTrackingRepository,
			notificationService
		);
		
		weatherUpdateJob = new WeatherUpdateJob(
			weatherFactorRepository,
			calculationScheduleRepository,
			scheduleActivityRepository,
			notificationService

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

export function getAdminPromotionController() {
	if (!adminPromotionController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return adminPromotionController;
}

export function getTemplateAnalyticsController() {
	if (!templateAnalyticsController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return templateAnalyticsController;
}

export function getGlobalStatsController() {
	if (!globalStatsController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return globalStatsController;
}

export function getTemplateTrackingController() {
	if (!templateTrackingController)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return templateTrackingController;
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

export function getTrackTemplateUsageUseCase() {
	if (!trackTemplateUsageUseCase)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return trackTemplateUsageUseCase;
}

export function getCalculateTemplateRankingsUseCase() {
	if (!calculateTemplateRankingsUseCase)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return calculateTemplateRankingsUseCase;
}

export function getCreatePromotionRequestUseCase() {
	if (!createPromotionRequestUseCase)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return createPromotionRequestUseCase;
}

export function getReviewPromotionRequestUseCase() {
	if (!reviewPromotionRequestUseCase)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return reviewPromotionRequestUseCase;
}

export function getPromoteTemplateToVerifiedUseCase() {
	if (!promoteTemplateToVerifiedUseCase)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return promoteTemplateToVerifiedUseCase;
}

export function getGetTemplateAnalyticsUseCase() {
	if (!getTemplateAnalyticsUseCase)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return getTemplateAnalyticsUseCase;
}

export function getUserTemplateUsageLogRepository() {
	if (!userTemplateUsageLogRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return userTemplateUsageLogRepository;
}

export function getTemplateRankingRepository() {
	if (!templateRankingRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return templateRankingRepository;
}

export function getPromotionRequestRepository() {
	if (!promotionRequestRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return promotionRequestRepository;
}

export function getAuthorCreditRepository() {
	if (!authorCreditRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return authorCreditRepository;
}

export const getMaterialCalculationTemplateRepository =
	(): MaterialCalculationTemplateRepository => {
		if (!materialCalculationTemplateRepository) {
			materialCalculationTemplateRepository =
				new TypeOrmMaterialCalculationTemplateRepository();
		}
		return materialCalculationTemplateRepository;
	};

export const getUserMaterialCalculationTemplateRepository =
	(): UserMaterialCalculationTemplateRepository => {
		if (!userMaterialCalculationTemplateRepository) {
			userMaterialCalculationTemplateRepository =
				new TypeOrmUserMaterialCalculationTemplateRepository();
		}
		return userMaterialCalculationTemplateRepository;
	};

export const getMaterialCalculationResultRepository =
	(): MaterialCalculationResultRepository => {
		if (!materialCalculationResultRepository) {
			materialCalculationResultRepository =
				new TypeOrmMaterialCalculationResultRepository();
		}
		return materialCalculationResultRepository;
	};

export function getCalculationBudgetRepository(): CalculationBudgetRepository {
	if (!calculationBudgetRepository)
	  throw new Error(
		"Services not initialized. Call initializeServices() first."
	  );
	return calculationBudgetRepository;
}
  
export function getBudgetTemplateRepository(): BudgetTemplateRepository {
	if (!budgetTemplateRepository)
	  throw new Error(
		"Services not initialized. Call initializeServices() first."
	  );
	return budgetTemplateRepository;
 }
  
export function getBudgetLineItemRepository(): BudgetLineItemRepository {
	if (!budgetLineItemRepository)
	  throw new Error(
		"Services not initialized. Call initializeServices() first."
	  );
	return budgetLineItemRepository;
 }
  
export function getProfessionalCostRepository(): ProfessionalCostRepository {
	if (!professionalCostRepository)
	  throw new Error(
		"Services not initialized. Call initializeServices() first."
	  );
	return professionalCostRepository;
}

export function getProjectRepository(): ProjectRepository {
	if (!projectRepository) 
	  throw new Error("Services not initialized. Call initializeServices() first.");
	return projectRepository;
}

export function getUserRepository(): UserRepository {
	if (!userRepository) 
	  throw new Error("Services not initialized. Call initializeServices() first.");
	return userRepository;
  }

  export function getCalculationScheduleRepository() {
	if (!calculationScheduleRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return calculationScheduleRepository;
}

export function getScheduleTemplateRepository() {
	if (!scheduleTemplateRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return scheduleTemplateRepository;
}

export function getScheduleActivityRepository() {
	if (!scheduleActivityRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return scheduleActivityRepository;
}

export function getResourceAssignmentRepository() {
	if (!resourceAssignmentRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return resourceAssignmentRepository;
}

export function getProgressTrackingRepository() {
	if (!progressTrackingRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return progressTrackingRepository;
}


// Getters para services
export const getMaterialCalculationService = (): MaterialCalculationService => {
	if (!materialCalculationService) {
		materialCalculationService = new MaterialCalculationService();
	}
	return materialCalculationService;
};

// Getters para use cases
export const getCreateMaterialCalculationUseCase =
	(): CreateMaterialCalculationUseCase => {
		if (!createMaterialCalculationUseCase) {
			createMaterialCalculationUseCase = new CreateMaterialCalculationUseCase(
				getMaterialCalculationTemplateRepository(),
				getUserMaterialCalculationTemplateRepository(),
				getMaterialCalculationResultRepository(),
				getMaterialCalculationService()
			);
		}
		return createMaterialCalculationUseCase;
	};

export const getCreateUserMaterialTemplateUseCase =
	(): CreateUserMaterialTemplateUseCase => {
		if (!createUserMaterialTemplateUseCase) {
			createUserMaterialTemplateUseCase = new CreateUserMaterialTemplateUseCase(
				getUserMaterialCalculationTemplateRepository(),
				getMaterialTemplateValidationService()
			);
		}
		return createUserMaterialTemplateUseCase;
	};

export const getSearchMaterialTemplatesUseCase =
	(): SearchMaterialTemplatesUseCase => {
		if (!searchMaterialTemplatesUseCase) {
			searchMaterialTemplatesUseCase = new SearchMaterialTemplatesUseCase(
				getMaterialCalculationTemplateRepository()
			);
		}
		return searchMaterialTemplatesUseCase;
	};

// Getters para controllers
export const getMaterialCalculationTemplateController = (): MaterialCalculationTemplateController => {
  if (!materialCalculationTemplateController) {
    materialCalculationTemplateController = new MaterialCalculationTemplateController(
      getMaterialCalculationTemplateRepository(),
      getGetMaterialTemplatesByTypeUseCase(),
      getSearchMaterialTemplatesUseCase()
    );
  }
  return materialCalculationTemplateController;
};

export const getMaterialCalculationController = (): MaterialCalculationController => {
  if (!materialCalculationController) {
    materialCalculationController = new MaterialCalculationController(
      getCreateMaterialCalculationUseCase(),
      getTrackMaterialTemplateUsageUseCase(),
      getMaterialCalculationResultRepository()
    );
  }
  return materialCalculationController;
};

export function getCalculationBudgetController(): CalculationBudgetController {
	if (!calculationBudgetController) {
	  throw new Error("Budget services not initialized. Call initializeBudgetServices() first.");
	}
	return calculationBudgetController;
  }
  
  export function getBudgetTemplateController(): BudgetTemplateController {
	if (!budgetTemplateController) {
	  throw new Error("Budget services not initialized. Call initializeBudgetServices() first.");
	}
	return budgetTemplateController;
  }

export const getGetMaterialAnalyticsUseCase =
	(): GetMaterialAnalyticsUseCase => {
		if (!getMaterialAnalyticsUseCase) {
			getMaterialAnalyticsUseCase = new GetMaterialAnalyticsUseCase(
				getMaterialCalculationTemplateRepository(),
				getMaterialTemplateUsageLogRepository()
			);
		}
		return getMaterialAnalyticsUseCase;
	};

export const getUserMaterialTemplateController =
	(): UserMaterialTemplateController => {
		if (!userMaterialTemplateController) {
			userMaterialTemplateController = new UserMaterialTemplateController(
				getCreateUserMaterialTemplateUseCase(),
				getUserMaterialCalculationTemplateRepository(),
				getMaterialTemplateValidationService()
			);
		}
		return userMaterialTemplateController;
	};


export const getMaterialTrendingController = (): MaterialTrendingController => {
  if (!materialTrendingController) {
    materialTrendingController = new MaterialTrendingController(
      getGetMaterialTrendingTemplatesUseCase(),
      getGetMaterialAnalyticsUseCase()
    );
  }
  return materialTrendingController;
};

// Getters para use cases adicionales
export const getGetMaterialTemplatesByTypeUseCase =
	(): GetMaterialTemplatesByTypeUseCase => {
		if (!getMaterialTemplatesByTypeUseCase) {
			getMaterialTemplatesByTypeUseCase = new GetMaterialTemplatesByTypeUseCase(
				getMaterialCalculationTemplateRepository()
			);
		}
		return getMaterialTemplatesByTypeUseCase;
	};

export const getGetMaterialTrendingTemplatesUseCase =
	(): GetMaterialTrendingTemplatesUseCase => {
		if (!getMaterialTrendingTemplatesUseCase) {
			getMaterialTrendingTemplatesUseCase =
				new GetMaterialTrendingTemplatesUseCase(
					getMaterialTemplateRankingRepository(),
					getMaterialCalculationTemplateRepository(),
					getUserMaterialCalculationTemplateRepository()
				);
		}
		return getMaterialTrendingTemplatesUseCase;
	};

export const getTrackMaterialTemplateUsageUseCase =
	(): TrackMaterialTemplateUsageUseCase => {
		if (!trackMaterialTemplateUsageUseCase) {
			trackMaterialTemplateUsageUseCase = new TrackMaterialTemplateUsageUseCase(
				getMaterialTemplateUsageLogRepository(),
				getMaterialCalculationTemplateRepository(),
				getUserMaterialCalculationTemplateRepository()
			);
		}
		return trackMaterialTemplateUsageUseCase;
	};

export const getCalculateMaterialTemplateRankingsUseCase =
	(): CalculateMaterialTemplateRankingsUseCase => {
		if (!calculateMaterialTemplateRankingsUseCase) {
			calculateMaterialTemplateRankingsUseCase =
				new CalculateMaterialTemplateRankingsUseCase(
					getMaterialTemplateUsageLogRepository(),
					getMaterialTemplateRankingRepository()
				);
		}
		return calculateMaterialTemplateRankingsUseCase;
	};

	export function getCreateCalculationBudgetUseCase(): CreateCalculationBudgetUseCase {
		if (!createCalculationBudgetUseCase) {
		  throw new Error("Budget services not initialized. Call initializeBudgetServices() first.");
		}
		return createCalculationBudgetUseCase;
	  }
	  
	  export function getUpdateBudgetPricingUseCase(): UpdateBudgetPricingUseCase {
		if (!updateBudgetPricingUseCase) {
		  throw new Error("Budget services not initialized. Call initializeBudgetServices() first.");
		}
		return updateBudgetPricingUseCase;
	  }
	  
	  export function getGenerateProfessionalBudgetUseCase(): GenerateProfessionalBudgetUseCase {
		if (!generateProfessionalBudgetUseCase) {
		  throw new Error("Budget services not initialized. Call initializeBudgetServices() first.");
		}
		return generateProfessionalBudgetUseCase;
	  }
	  
	  export function getApplyBudgetTemplateUseCase(): ApplyBudgetTemplateUseCase {
		if (!applyBudgetTemplateUseCase) {
		  throw new Error("Budget services not initialized. Call initializeBudgetServices() first.");
		}
		return applyBudgetTemplateUseCase;
	  }

export function getMaterialTemplateValidationService() {
	if (!materialTemplateValidationService)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return materialTemplateValidationService;
}

export function getMaterialTemplateUsageLogRepository() {
	if (!materialTemplateUsageLogRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return materialTemplateUsageLogRepository;
}

export function getMaterialTemplateRankingRepository() {
	if (!materialTemplateRankingRepository)
		throw new Error(
			"Services not initialized. Call initializeServices() first."
		);
	return materialTemplateRankingRepository;
}

/**
 * Obtener servicio de analytics en tiempo real
 * Nota: Debe ser inicializado externamente con HTTPServer
 */
export function getRealtimeAnalyticsService(): RealtimeAnalyticsService | null {
    return realtimeAnalyticsService || null;
}

/**
 * Establecer servicio de analytics en tiempo real
 * Llamar desde el servidor principal después de crear HTTPServer
 */
export function setRealtimeAnalyticsService(service: RealtimeAnalyticsService): void {
    realtimeAnalyticsService = service;
    console.log("Realtime analytics service registered");
}

export function getCalculationBudgetService(): CalculationBudgetService {
	if (!calculationBudgetService) {
	  throw new Error("Budget services not initialized. Call initializeBudgetServices() first.");
	}
	return calculationBudgetService;
  }
  
  export function getBudgetPricingService(): BudgetPricingService {
	if (!budgetPricingService) {
	  throw new Error("Budget services not initialized. Call initializeBudgetServices() first.");
	}
	return budgetPricingService;
  }
  
  export function getBudgetTemplateService(): BudgetTemplateService {
	if (!budgetTemplateService) {
	  throw new Error("Budget services not initialized. Call initializeBudgetServices() first.");
	}
	return budgetTemplateService;
  }

/**
 * Obtener instancia del job de rankings mejorado
 */
export function getEnhancedRankingJob(): EnhancedRankingCalculationJob {
    if (!enhancedRankingJob) {
        throw new Error("Enhanced ranking job not initialized. Call initializeServices() first.");
    }
    return enhancedRankingJob;
}

// ============= FUNCIONES DE INTEGRACIÓN CON WEBHOOKS =============

/**
 * Notificar uso de plantilla via WebSocket
 * Llamar desde el middleware de tracking
 */
export function notifyTemplateUsageRealtime(
    templateId: string,
    templateType: 'personal' | 'verified',
    usageData: any
): void {
    if (realtimeAnalyticsService) {
        realtimeAnalyticsService.notifyTemplateUsage(templateId, templateType, usageData);
    }
}

/**
 * Notificar actualización de rankings via WebSocket
 * Llamar desde los jobs de cálculo
 */
export function notifyRankingUpdateRealtime(period: string, rankingData: any): void {
    if (realtimeAnalyticsService) {
        realtimeAnalyticsService.notifyRankingUpdate(period, rankingData);
    }
}

/**
 * Notificar cambios en trending via WebSocket
 */
export function notifyTrendingChangeRealtime(trendingData: any): void {
    if (realtimeAnalyticsService) {
        realtimeAnalyticsService.notifyTrendingChange(trendingData);
    }
}

// ============= FUNCIONES HELPER PARA JOBS =============

/**
 * Ejecutar cálculo de rankings manualmente
 */
export async function executeRankingCalculationManual(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
) {
    if (!enhancedRankingJob) {
        throw new Error("Enhanced ranking job not initialized");
    }
    
    return await enhancedRankingJob.executeJobManually(period);
}

/**
 * Obtener estado de todos los jobs
 */
export function getAllJobStatuses() {
    if (!enhancedRankingJob) {
        return new Map();
    }
    
    return enhancedRankingJob.getJobStatuses();
}

/**
 * Obtener métricas del sistema de jobs
 */
export function getJobMetrics() {
    if (!enhancedRankingJob) {
        return null;
    }
    
    return enhancedRankingJob.getMetrics();
}

export function getWeatherFactorRepository() {
    if (!weatherFactorRepository)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return weatherFactorRepository;
}

export function getWorkforceRepository() {
    if (!workforceRepository)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return workforceRepository;
}

export function getEquipmentRepository() {
    if (!equipmentRepository)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return equipmentRepository;
}

// Schedule Services
export function getBudgetScheduleIntegrationService() {
    if (!budgetScheduleIntegrationService)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return budgetScheduleIntegrationService;
}

export function getCalculationScheduleService() {
    if (!calculationScheduleService)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return calculationScheduleService;
}

export function getExternalIntegrationService() {
    if (!externalIntegrationService)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return externalIntegrationService;
}

export function getResourceOptimizationService() {
    if (!resourceOptimizationService)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return resourceOptimizationService;
}

export function getWeatherImpactService() {
    if (!weatherImpactService)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return weatherImpactService;
}

// Schedule Use Cases
export function getGenerateScheduleFromBudgetUseCase() {
    if (!generateScheduleFromBudgetUseCase)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return generateScheduleFromBudgetUseCase;
}

export function getOptimizeProjectScheduleUseCase() {
    if (!optimizeProjectScheduleUseCase)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return optimizeProjectScheduleUseCase;
}

export function getTrackDailyProgressUseCase() {
    if (!trackDailyProgressUseCase)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return trackDailyProgressUseCase;
}

export function getGenerateScheduleReportsUseCase() {
    if (!generateScheduleReportsUseCase)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return generateScheduleReportsUseCase;
}

export function getPredictProjectDelaysScheduleUseCase() {
    if (!predictProjectDelaysScheduleUseCase)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return predictProjectDelaysScheduleUseCase;
}

// Schedule Controllers
export function getCalculationScheduleController() {
    if (!calculationScheduleController)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return calculationScheduleController;
}

export function getScheduleAnalyticsController() {
    if (!scheduleAnalyticsController)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return scheduleAnalyticsController;
}

export function getResourceManagementController() {
    if (!resourceManagementController)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return resourceManagementController;
}

// Schedule Jobs
export function getScheduleUpdateJob() {
    if (!scheduleUpdateJob)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return scheduleUpdateJob;
}

export function getPerformanceAnalysisJob() {
    if (!performanceAnalysisJob)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return performanceAnalysisJob;
}

export function getWeatherUpdateJob() {
    if (!weatherUpdateJob)
        throw new Error("Services not initialized. Call initializeServices() first.");
    return weatherUpdateJob;
}

// ============= INTEGRACIÓN CON TRACKING MIDDLEWARE =============

/**
 * Hook para middleware de tracking automático
 * Integra el tracking con analytics en tiempo real
 */
export function onTemplateUsageTracked(
    templateId: string,
    templateType: 'personal' | 'verified',
    userId: string,
    executionData: any
): void {
    // Notificar via WebSocket
    notifyTemplateUsageRealtime(templateId, templateType, {
        userId,
        timestamp: new Date(),
        ...executionData
    });

    // Log para debugging
    if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Template usage tracked and notified: ${templateType}:${templateId}`);
    }
}

// ============= HEALTH CHECKS PARA MONITORING =============

/**
 * Obtener estado de salud del sistema de analytics
 */
export function getAnalyticsHealthStatus() {
    const jobMetrics = getJobMetrics();
    const realtimeConnections = realtimeAnalyticsService?.getServiceStats() || null;
    
    return {
        jobs: {
            status: jobMetrics ? 'healthy' : 'unavailable',
            metrics: jobMetrics,
        },
        realtime: {
            status: realtimeAnalyticsService ? 'healthy' : 'unavailable',
            connections: realtimeConnections,
        },
        tracking: {
            status: 'healthy', // Basado en middleware funcionando
        },
        timestamp: new Date(),
    };
}

// ============= CLEANUP FUNCTIONS =============

/**
 * Limpiar recursos al cerrar aplicación
 */
export function cleanupAnalyticsServices(): void {
    console.log("🧹 Cleaning up analytics services...");
    
    if (enhancedRankingJob) {
        enhancedRankingJob.stopAllJobs();
    }
    
    // realtimeAnalyticsService se limpia automáticamente con el servidor HTTP
    
    console.log("✅ Analytics services cleanup completed");
}

// ============= CONFIGURACIÓN DINÁMICA =============

/**
 * Recargar configuración de tracking
 */
export function reloadTrackingConfig(): void {
    // Implementar recarga de configuración sin reiniciar
    console.log("🔄 Reloading tracking configuration...");
    // TODO: Implementar lógica de recarga
    console.log("✅ Tracking configuration reloaded");
}

/**
 * Habilitar/deshabilitar jobs dinámicamente
 */
export function toggleJobs(enabled: boolean): void {
    if (!enhancedRankingJob) {
        throw new Error("Enhanced ranking job not initialized");
    }
    
    if (enabled) {
        // Reanudar jobs
        ['daily', 'weekly', 'monthly', 'yearly', 'cleanup'].forEach(jobName => {
            enhancedRankingJob.resumeJob(jobName);
        });
        console.log("✅ All jobs resumed");
    } else {
        // Pausar jobs
        ['daily', 'weekly', 'monthly', 'yearly', 'cleanup'].forEach(jobName => {
            enhancedRankingJob.pauseJob(jobName);
        });
        console.log("⏸️  All jobs paused");
    }
}



// ============= EXPORT DE NUEVAS FUNCIONES =============
export {
    initializeRankingJobs,
    RealtimeAnalyticsService
};