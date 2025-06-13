// src/domain/services/ExternalIntegrationService.ts
import { CalculationScheduleRepository } from '../repositories/CalculationScheduleRepository';
import { ScheduleActivityRepository } from '../repositories/ScheduleActivityRepository';
import { MaterialRepository } from '../repositories/MaterialRepository';
import { NotificationService } from './NotificationService';

export interface SupplierIntegration {
  supplierId: string;
  supplierName: string;
  apiEndpoint: string;
  apiKey: string;
  integrationTypes: ('inventory' | 'pricing' | 'delivery' | 'orders')[];
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  isActive: boolean;
}

export interface ERPIntegration {
  erpSystem: 'SAP' | 'Oracle' | 'QuickBooks' | 'Monica' | 'Custom';
  connectionString: string;
  modules: ('finance' | 'procurement' | 'hr' | 'inventory')[];
  syncDirection: 'unidirectional' | 'bidirectional';
  mappingRules: Record<string, string>;
}

export interface BIMIntegration {
  bimPlatform: 'Revit' | 'ArchiCAD' | 'Tekla' | 'Navisworks';
  projectFileUrl: string;
  sync4D: boolean;
  sync5D: boolean;
  elementMapping: Record<string, string>;
}

export interface FieldPlatformIntegration {
  platform: 'Procore' | 'PlanGrid' | 'Fieldwire' | 'Custom';
  projectId: string;
  syncProgressReports: boolean;
  syncPhotos: boolean;
  syncIssues: boolean;
}

export class ExternalIntegrationService {
  private supplierIntegrations: Map<string, SupplierIntegration> = new Map();
  private erpIntegrations: Map<string, ERPIntegration> = new Map();
  private bimIntegrations: Map<string, BIMIntegration> = new Map();
  private fieldIntegrations: Map<string, FieldPlatformIntegration> = new Map();

  constructor(
    private scheduleRepository: CalculationScheduleRepository,
    private activityRepository: ScheduleActivityRepository,
    private materialRepository: MaterialRepository,
    private notificationService: NotificationService
  ) {}

  // Supplier Integration Methods
  async configureSupplierIntegration(integration: SupplierIntegration): Promise<void> {
    // Validar conexión con proveedor
    const connectionValid = await this.validateSupplierConnection(integration);
    if (!connectionValid) {
      throw new Error(`Cannot connect to supplier: ${integration.supplierName}`);
    }

    this.supplierIntegrations.set(integration.supplierId, integration);
    
    // Configurar webhook para actualizaciones en tiempo real si es necesario
    if (integration.syncFrequency === 'real_time') {
      await this.setupSupplierWebhook(integration);
    }
  }

  async syncSupplierData(supplierId: string): Promise<any> {
    const integration = this.supplierIntegrations.get(supplierId);
    if (!integration) {
      throw new Error('Supplier integration not found');
    }

    const syncResults = {
      inventory: null,
      pricing: null,
      delivery: null,
      orders: null
    };

    try {
      // Sincronizar inventario
      if (integration.integrationTypes.includes('inventory')) {
        syncResults.inventory = await this.syncSupplierInventory(integration);
      }

      // Sincronizar precios
      if (integration.integrationTypes.includes('pricing')) {
        syncResults.pricing = await this.syncSupplierPricing(integration);
      }

      // Sincronizar información de entrega
      if (integration.integrationTypes.includes('delivery')) {
        syncResults.delivery = await this.syncSupplierDelivery(integration);
      }

      // Sincronizar órdenes
      if (integration.integrationTypes.includes('orders')) {
        syncResults.orders = await this.syncSupplierOrders(integration);
      }

      return {
        success: true,
        supplierId,
        syncTimestamp: new Date(),
        results: syncResults
      };

    } catch (error) {
      await this.notificationService.createNotification({
        userId: 'system',
        type: 'ERROR',
        title: 'Error en Sincronización con Proveedor',
        message: `Error al sincronizar con ${integration.supplierName}: ${error.message}`,
        priority: 'HIGH',
        relatedEntityType: 'SUPPLIER_INTEGRATION',
        relatedEntityId: supplierId
      });

      throw error;
    }
  }

  async updateScheduleFromSupplierData(scheduleId: string, supplierData: any): Promise<any> {
    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const activities = await this.activityRepository.findByScheduleId(scheduleId);
    const updateResults = [];

    // Actualizar actividades basadas en disponibilidad de materiales
    for (const activity of activities) {
      const materialUpdates = await this.updateActivityFromSupplierData(activity, supplierData);
      if (materialUpdates.length > 0) {
        updateResults.push({
          activityId: activity.id,
          updates: materialUpdates
        });
      }
    }

    // Recalcular cronograma si hay cambios significativos
    if (updateResults.length > 0) {
      await this.recalculateScheduleFromSupplierChanges(schedule, updateResults);
    }

    return {
      scheduleId,
      updatedActivities: updateResults.length,
      scheduleRecalculated: updateResults.length > 0,
      lastSync: new Date()
    };
  }

  // ERP Integration Methods
  async configureERPIntegration(integration: ERPIntegration): Promise<void> {
    const connectionValid = await this.validateERPConnection(integration);
    if (!connectionValid) {
      throw new Error(`Cannot connect to ERP system: ${integration.erpSystem}`);
    }

    this.erpIntegrations.set(integration.erpSystem, integration);
  }

  async syncWithERP(erpSystem: string, scheduleId: string): Promise<any> {
    const integration = this.erpIntegrations.get(erpSystem);
    if (!integration) {
      throw new Error('ERP integration not found');
    }

    const schedule = await this.scheduleRepository.findById(scheduleId);
    const activities = await this.activityRepository.findByScheduleId(scheduleId);

    const syncResults = {
      financialData: null,
      procurementData: null,
      hrData: null,
      inventoryData: null,
      exportedToERP: false
    };

    // Sincronizar datos financieros
    if (integration.modules.includes('finance')) {
      syncResults.financialData = await this.syncFinancialDataWithERP(integration, schedule, activities);
    }

    // Sincronizar datos de compras
    if (integration.modules.includes('procurement')) {
      syncResults.procurementData = await this.syncProcurementDataWithERP(integration, activities);
    }

    // Sincronizar datos de RRHH
    if (integration.modules.includes('hr')) {
      syncResults.hrData = await this.syncHRDataWithERP(integration, activities);
    }

    // Sincronizar inventario
    if (integration.modules.includes('inventory')) {
      syncResults.inventoryData = await this.syncInventoryDataWithERP(integration, activities);
    }

    // Exportar cronograma al ERP si es bidireccional
    if (integration.syncDirection === 'bidirectional') {
      syncResults.exportedToERP = await this.exportScheduleToERP(integration, schedule, activities);
    }

    return syncResults;
  }

  // BIM Integration Methods
  async configureBIMIntegration(integration: BIMIntegration, scheduleId: string): Promise<void> {
    const connectionValid = await this.validateBIMConnection(integration);
    if (!connectionValid) {
      throw new Error(`Cannot connect to BIM platform: ${integration.bimPlatform}`);
    }

    this.bimIntegrations.set(scheduleId, integration);
  }

  async sync4D(scheduleId: string): Promise<any> {
    const integration = this.bimIntegrations.get(scheduleId);
    if (!integration || !integration.sync4D) {
      throw new Error('4D BIM integration not configured');
    }

    const schedule = await this.scheduleRepository.findById(scheduleId);
    const activities = await this.activityRepository.findByScheduleId(scheduleId);

    // Mapear actividades de cronograma con elementos BIM
    const bimElementMapping = await this.mapActivitiesToBIMElements(activities, integration);

    // Sincronizar cronograma con modelo BIM 4D
    const sync4DResult = await this.synchronize4DModel(integration, bimElementMapping);

    // Actualizar cronograma con información del modelo BIM
    if (sync4DResult.modelUpdates) {
      await this.updateScheduleFromBIMData(schedule, activities, sync4DResult.modelUpdates);
    }

    return {
      scheduleId,
      bimPlatform: integration.bimPlatform,
      elementsMapping: bimElementMapping.length,
      sync4DStatus: sync4DResult.success,
      modelUpdated: !!sync4DResult.modelUpdates,
      syncTimestamp: new Date()
    };
  }

  async sync5D(scheduleId: string): Promise<any> {
    const integration = this.bimIntegrations.get(scheduleId);
    if (!integration || !integration.sync5D) {
      throw new Error('5D BIM integration not configured');
    }

    const schedule = await this.scheduleRepository.findById(scheduleId);
    const activities = await this.activityRepository.findByScheduleId(scheduleId);

    // Sincronizar datos de costos con modelo BIM 5D
    const costMapping = await this.mapCostsToBIMElements(activities, integration);
    const sync5DResult = await this.synchronize5DModel(integration, costMapping);

    return {
      scheduleId,
      bimPlatform: integration.bimPlatform,
      costElementsMapping: costMapping.length,
      sync5DStatus: sync5DResult.success,
      budgetSynchronized: sync5DResult.budgetSync,
      syncTimestamp: new Date()
    };
  }

  // Field Platform Integration Methods
  async configureFieldPlatformIntegration(integration: FieldPlatformIntegration, scheduleId: string): Promise<void> {
    const connectionValid = await this.validateFieldPlatformConnection(integration);
    if (!connectionValid) {
      throw new Error(`Cannot connect to field platform: ${integration.platform}`);
    }

    this.fieldIntegrations.set(scheduleId, integration);
  }

  async syncFieldData(scheduleId: string): Promise<any> {
    const integration = this.fieldIntegrations.get(scheduleId);
    if (!integration) {
      throw new Error('Field platform integration not configured');
    }

    const syncResults = {
      progressReports: null,
      photos: null,
      issues: null
    };

    // Sincronizar reportes de progreso
    if (integration.syncProgressReports) {
      syncResults.progressReports = await this.syncFieldProgressReports(integration, scheduleId);
    }

    // Sincronizar fotos
    if (integration.syncPhotos) {
      syncResults.photos = await this.syncFieldPhotos(integration, scheduleId);
    }

    // Sincronizar issues/problemas
    if (integration.syncIssues) {
      syncResults.issues = await this.syncFieldIssues(integration, scheduleId);
    }

    return {
      scheduleId,
      platform: integration.platform,
      syncResults,
      syncTimestamp: new Date()
    };
  }

  // Private helper methods
  private async validateSupplierConnection(integration: SupplierIntegration): Promise<boolean> {
    try {
      // Simulación de validación de conexión
      const response = await fetch(`${integration.apiEndpoint}/health`, {
        headers: { 'Authorization': `Bearer ${integration.apiKey}` }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async setupSupplierWebhook(integration: SupplierIntegration): Promise<void> {
    // Configurar webhook para recibir actualizaciones en tiempo real
    const webhookUrl = `${process.env.BASE_URL}/api/webhooks/supplier/${integration.supplierId}`;
    
    await fetch(`${integration.apiEndpoint}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: integration.integrationTypes
      })
    });
  }

  private async syncSupplierInventory(integration: SupplierIntegration): Promise<any> {
    const response = await fetch(`${integration.apiEndpoint}/inventory`, {
      headers: { 'Authorization': `Bearer ${integration.apiKey}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync supplier inventory');
    }
    
    const inventoryData = await response.json();
    
    // Actualizar inventario local
    for (const item of inventoryData.items) {
      await this.updateMaterialInventory(item);
    }
    
    return {
      itemsUpdated: inventoryData.items.length,
      lastUpdate: new Date()
    };
  }

  private async syncSupplierPricing(integration: SupplierIntegration): Promise<any> {
    const response = await fetch(`${integration.apiEndpoint}/pricing`, {
      headers: { 'Authorization': `Bearer ${integration.apiKey}` }
    });
    
    const pricingData = await response.json();
    
    // Actualizar precios en base de datos local
    for (const priceItem of pricingData.prices) {
      await this.updateMaterialPricing(priceItem);
    }
    
    return {
      pricesUpdated: pricingData.prices.length,
      lastUpdate: new Date()
    };
  }

  private async syncSupplierDelivery(integration: SupplierIntegration): Promise<any> {
    const response = await fetch(`${integration.apiEndpoint}/deliveries`, {
      headers: { 'Authorization': `Bearer ${integration.apiKey}` }
    });
    
    const deliveryData = await response.json();
    
    return {
      activeDeliveries: deliveryData.deliveries.length,
      estimatedDeliveries: deliveryData.deliveries.filter(d => d.status === 'in_transit').length
    };
  }

  private async syncSupplierOrders(integration: SupplierIntegration): Promise<any> {
    const response = await fetch(`${integration.apiEndpoint}/orders`, {
      headers: { 'Authorization': `Bearer ${integration.apiKey}` }
    });
    
    const orderData = await response.json();
    
    return {
      pendingOrders: orderData.orders.filter(o => o.status === 'pending').length,
      confirmedOrders: orderData.orders.filter(o => o.status === 'confirmed').length
    };
  }

  private async updateActivityFromSupplierData(activity: any, supplierData: any): Promise<string[]> {
    const updates = [];
    
    // Verificar disponibilidad de materiales
    if (activity.resourceRequirements?.materials) {
      for (const material of activity.resourceRequirements.materials) {
        const supplierItem = supplierData.inventory?.find(i => i.id === material.materialId);
        if (supplierItem) {
          if (supplierItem.quantity < material.quantity) {
            updates.push(`Material shortage detected: ${material.description}`);
            // Ajustar cronograma por falta de material
            activity.plannedStartDate = new Date(activity.plannedStartDate.getTime() + (7 * 24 * 60 * 60 * 1000));
          }
        }
      }
    }
    
    if (updates.length > 0) {
      await this.activityRepository.save(activity);
    }
    
    return updates;
  }

  private async recalculateScheduleFromSupplierChanges(schedule: any, updateResults: any[]): Promise<void> {
    // Recalcular fechas del cronograma basado en cambios de proveedores
    const hasSignificantChanges = updateResults.some(update => 
      update.updates.some(u => u.includes('shortage') || u.includes('delay'))
    );
    
    if (hasSignificantChanges) {
      schedule.status = 'NEEDS_REVIEW';
      schedule.customFields = {
        ...schedule.customFields,
        lastSupplierUpdate: new Date(),
        requiresRecalculation: true
      };
      
      await this.scheduleRepository.save(schedule);
    }
  }

  private async validateERPConnection(integration: ERPIntegration): Promise<boolean> {
    // Simulación de validación de conexión ERP
    return true;
  }

  private async syncFinancialDataWithERP(integration: ERPIntegration, schedule: any, activities: any[]): Promise<any> {
    // Sincronizar datos financieros con ERP
    return { syncedTransactions: 0, syncedBudgets: 1 };
  }

  private async syncProcurementDataWithERP(integration: ERPIntegration, activities: any[]): Promise<any> {
    // Sincronizar datos de compras con ERP
    return { syncedOrders: 0, syncedSuppliers: 0 };
  }

  private async syncHRDataWithERP(integration: ERPIntegration, activities: any[]): Promise<any> {
    // Sincronizar datos de RRHH con ERP
    return { syncedEmployees: 0, syncedTimeSheets: 0 };
  }

  private async syncInventoryDataWithERP(integration: ERPIntegration, activities: any[]): Promise<any> {
    // Sincronizar datos de inventario con ERP
    return { syncedItems: 0, syncedWarehouses: 0 };
  }

  private async exportScheduleToERP(integration: ERPIntegration, schedule: any, activities: any[]): Promise<boolean> {
    // Exportar cronograma al sistema ERP
    return true;
  }

  private async validateBIMConnection(integration: BIMIntegration): Promise<boolean> {
    // Validar conexión con plataforma BIM
    return true;
  }

  private async mapActivitiesToBIMElements(activities: any[], integration: BIMIntegration): Promise<any[]> {
    // Mapear actividades de cronograma con elementos del modelo BIM
    return activities.map(activity => ({
      activityId: activity.id,
      bimElementId: integration.elementMapping[activity.name] || null,
      mappingQuality: 'auto'
    }));
  }

  private async synchronize4DModel(integration: BIMIntegration, mapping: any[]): Promise<any> {
    // Sincronizar modelo BIM 4D
    return { success: true, modelUpdates: null };
  }

  private async updateScheduleFromBIMData(schedule: any, activities: any[], modelUpdates: any): Promise<void> {
    // Actualizar cronograma con datos del modelo BIM
  }

  private async mapCostsToBIMElements(activities: any[], integration: BIMIntegration): Promise<any[]> {
    // Mapear costos de actividades con elementos BIM para 5D
    return activities.map(activity => ({
      activityId: activity.id,
      cost: activity.plannedTotalCost,
      bimElementId: integration.elementMapping[activity.name] || null
    }));
  }

  private async synchronize5DModel(integration: BIMIntegration, costMapping: any[]): Promise<any> {
    // Sincronizar modelo BIM 5D con costos
    return { success: true, budgetSync: true };
  }

  private async validateFieldPlatformConnection(integration: FieldPlatformIntegration): Promise<boolean> {
    // Validar conexión con plataforma de campo
    return true;
  }

  private async syncFieldProgressReports(integration: FieldPlatformIntegration, scheduleId: string): Promise<any> {
    // Sincronizar reportes de progreso desde campo
    return { reportsImported: 0 };
  }

  private async syncFieldPhotos(integration: FieldPlatformIntegration, scheduleId: string): Promise<any> {
    // Sincronizar fotos desde campo
    return { photosImported: 0 };
  }

  private async syncFieldIssues(integration: FieldPlatformIntegration, scheduleId: string): Promise<any> {
    // Sincronizar issues/problemas desde campo
    return { issuesImported: 0 };
  }

  private async updateMaterialInventory(item: any): Promise<void> {
    // Actualizar inventario de material
    const material = await this.materialRepository.findByExternalId(item.id);
    if (material) {
      material.availableQuantity = item.quantity;
      material.lastInventoryUpdate = new Date();
      await this.materialRepository.save(material);
    }
  }

  private async updateMaterialPricing(priceItem: any): Promise<void> {
    // Actualizar precios de material
    const material = await this.materialRepository.findByExternalId(priceItem.id);
    if (material) {
      material.currentPrice = priceItem.price;
      material.lastPriceUpdate = new Date();
      await this.materialRepository.save(material);
    }
  }
}