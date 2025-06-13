// src/infrastructure/webserver/validators/scheduleValidator.ts
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation rules for schedule creation
export const validateScheduleCreation = [
  body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be less than 255 characters'),
  
  body('projectId')
    .isUUID()
    .withMessage('Valid project ID is required'),
  
  body('constructionType')
    .isIn(['RESIDENTIAL_SINGLE', 'RESIDENTIAL_MULTI', 'COMMERCIAL_SMALL', 'COMMERCIAL_LARGE', 'INDUSTRIAL', 'INFRASTRUCTURE', 'RENOVATION', 'SPECIALIZED'])
    .withMessage('Valid construction type is required'),
  
  body('geographicalZone')
    .isIn(['QUITO', 'GUAYAQUIL', 'CUENCA', 'COSTA', 'SIERRA', 'ORIENTE', 'INSULAR'])
    .withMessage('Valid geographical zone is required'),
  
  body('plannedStartDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  body('plannedEndDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.plannedStartDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('workingDaysPerWeek')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Working days per week must be between 1 and 7'),
  
  body('dailyWorkingHours')
    .optional()
    .isFloat({ min: 1, max: 24 })
    .withMessage('Daily working hours must be between 1 and 24'),

  body('totalBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total budget must be a positive number'),

  handleValidationErrors
];

// Validation rules for schedule update
export const validateScheduleUpdate = [
  param('scheduleId')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be less than 255 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('plannedEndDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  
  body('workingDaysPerWeek')
    .optional()
    .isInt({ min: 1, max: 7 })
    .withMessage('Working days per week must be between 1 and 7'),
  
  body('dailyWorkingHours')
    .optional()
    .isFloat({ min: 1, max: 24 })
    .withMessage('Daily working hours must be between 1 and 24'),

  handleValidationErrors
];

// Validation rules for progress report
export const validateProgressReport = [
  param('scheduleId')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  
  body('activityId')
    .isUUID()
    .withMessage('Valid activity ID is required'),
  
  body('reportDate')
    .isISO8601()
    .withMessage('Valid report date is required'),
  
  body('progressPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Progress percentage must be between 0 and 100'),
  
  body('workCompleted')
    .isObject()
    .withMessage('Work completed information is required'),
  
  body('workCompleted.quantity')
    .isFloat({ min: 0 })
    .withMessage('Work completed quantity must be positive'),
  
  body('workCompleted.unit')
    .isLength({ min: 1, max: 20 })
    .withMessage('Work completed unit is required'),
  
  body('actualWorkersOnSite')
    .isInt({ min: 0 })
    .withMessage('Actual workers on site must be a non-negative integer'),
  
  body('actualHoursWorked')
    .isFloat({ min: 0 })
    .withMessage('Actual hours worked must be positive'),
  
  body('weatherConditions')
    .optional()
    .isObject()
    .withMessage('Weather conditions must be an object'),
  
  body('weatherConditions.workability')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor'])
    .withMessage('Weather workability must be one of: excellent, good, fair, poor'),
  
  body('qualityIssues')
    .optional()
    .isArray()
    .withMessage('Quality issues must be an array'),
  
  body('qualityIssues.*.severity')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Quality issue severity must be low, medium, or high'),
  
  body('safetyIncidents')
    .optional()
    .isArray()
    .withMessage('Safety incidents must be an array'),
  
  body('safetyIncidents.*.severity')
    .optional()
    .isIn(['minor', 'major', 'critical'])
    .withMessage('Safety incident severity must be minor, major, or critical'),
  
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  handleValidationErrors
];

// Validation rules for schedule optimization
export const validateOptimization = [
  param('scheduleId')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  
  body('optimizationGoals')
    .isObject()
    .withMessage('Optimization goals are required'),
  
  body('optimizationGoals.minimizeDuration')
    .optional()
    .isBoolean()
    .withMessage('Minimize duration must be boolean'),
  
  body('optimizationGoals.minimizeCost')
    .optional()
    .isBoolean()
    .withMessage('Minimize cost must be boolean'),
  
  body('optimizationGoals.maximizeResourceUtilization')
    .optional()
    .isBoolean()
    .withMessage('Maximize resource utilization must be boolean'),
  
  body('optimizationGoals.minimizeRisk')
    .optional()
    .isBoolean()
    .withMessage('Minimize risk must be boolean'),
  
  body('constraints')
    .optional()
    .isObject()
    .withMessage('Constraints must be an object'),
  
  body('constraints.maxDuration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max duration must be a positive integer'),
  
  body('constraints.maxBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max budget must be positive'),

  handleValidationErrors
];

// Validation rules for budget synchronization
export const validateBudgetSync = [
  param('scheduleId')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  
  body('budgetId')
    .isUUID()
    .withMessage('Valid budget ID is required'),
  
  body('syncOptions')
    .optional()
    .isObject()
    .withMessage('Sync options must be an object'),
  
  body('syncOptions.syncCosts')
    .optional()
    .isBoolean()
    .withMessage('Sync costs must be boolean'),
  
  body('syncOptions.syncQuantities')
    .optional()
    .isBoolean()
    .withMessage('Sync quantities must be boolean'),
  
  body('syncOptions.syncTimelines')
    .optional()
    .isBoolean()
    .withMessage('Sync timelines must be boolean'),
  
  body('syncOptions.syncResources')
    .optional()
    .isBoolean()
    .withMessage('Sync resources must be boolean'),

  handleValidationErrors
];

// Validation rules for resource assignment
export const validateResourceAssignment = [
  body('activityId')
    .isUUID()
    .withMessage('Valid activity ID is required'),
  
  body('resourceType')
    .isIn(['WORKFORCE', 'EQUIPMENT', 'MATERIAL'])
    .withMessage('Resource type must be WORKFORCE, EQUIPMENT, or MATERIAL'),
  
  body('resourceId')
    .isUUID()
    .withMessage('Valid resource ID is required'),
  
  body('quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be positive'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('costPerUnit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost per unit must be positive'),

  handleValidationErrors
];

// Validation rules for delay prediction
export const validateDelayPrediction = [
  param('scheduleId')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  
  query('predictionHorizon')
    .optional()
    .isIn(['short', 'medium', 'long'])
    .withMessage('Prediction horizon must be short, medium, or long'),
  
  query('confidenceLevel')
    .optional()
    .isIn(['0.8', '0.9', '0.95'])
    .withMessage('Confidence level must be 0.8, 0.9, or 0.95'),
  
  query('scenarioAnalysis')
    .optional()
    .isBoolean()
    .withMessage('Scenario analysis must be boolean'),

  handleValidationErrors
];

// Validation rules for report generation
export const validateReportGeneration = [
  param('scheduleId')
    .isUUID()
    .withMessage('Valid schedule ID is required'),
  
  body('reportType')
    .isIn(['executive', 'detailed', 'variance', 'performance', 'resource_utilization', 'custom'])
    .withMessage('Valid report type is required'),
  
  body('periodType')
    .isIn(['daily', 'weekly', 'monthly', 'project_to_date'])
    .withMessage('Valid period type is required'),
  
  body('outputFormat')
    .isIn(['pdf', 'excel', 'json', 'html'])
    .withMessage('Valid output format is required'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date required if provided'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date required if provided'),
  
  body('recipientEmails')
    .optional()
    .isArray()
    .withMessage('Recipient emails must be an array'),
  
  body('recipientEmails.*')
    .optional()
    .isEmail()
    .withMessage('All recipient emails must be valid'),

  handleValidationErrors
];

// Common validation error handler
function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array().map(error => ({
        type: error.msg,
        message: error.msg,
      }))
    });
    return;
  }
  
  next();
}
