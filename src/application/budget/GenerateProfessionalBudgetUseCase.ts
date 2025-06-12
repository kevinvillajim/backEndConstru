// src/application/budget/GenerateProfessionalBudgetUseCase.ts
import { CalculationBudgetRepository } from "../../domain/repositories/CalculationBudgetRepository";
import { BudgetLineItemRepository } from "../../domain/repositories/BudgetLineItemRepository";
import { ProfessionalCostRepository } from "../../domain/repositories/ProfessionalCostRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { PdfGenerationService } from "../../infrastructure/services/PdfGenerationService";
import { EmailService } from "../../domain/services/EmailService";
import { CalculationBudget } from "../../domain/models/calculation/CalculationBudget";
import { BudgetLineItem } from "../../domain/models/calculation/BudgetLineItem";
import { ProfessionalCost } from "../../domain/models/calculation/ProfessionalCost";
import { User } from "../../domain/models/user/User";
import { ProjectBudget } from "../../domain/models/project/ProjectBudget";
import path from "path";
import fs from "fs";

export interface ProfessionalBudgetRequest {
  budgetId: string;
  format: 'PDF' | 'HTML' | 'EXCEL' | 'WORD' | 'ALL';
  
  // Personalización de marca
  branding: {
    companyName?: string;
    companyLogo?: string;
    professionalName?: string;
    professionalTitle?: string;
    professionalRegistration?: string;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
    };
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  };

  // Información del cliente
  clientInfo: {
    name: string;
    company?: string;
    address?: string;
    phone?: string;
    email?: string;
    ruc?: string;
  };

  // Configuración del documento
  documentSettings: {
    includeCalculationDetails?: boolean;
    includeMaterialSpecs?: boolean;
    includeNECReferences?: boolean;
    showPriceBreakdown?: boolean;
    showLaborDetails?: boolean;
    includeTermsAndConditions?: boolean;
    includeValidityPeriod?: boolean;
    validityDays?: number;
    language?: 'es' | 'en';
    currency?: 'USD' | 'EUR';
    showTaxBreakdown?: boolean;
    includePaymentTerms?: boolean;
  };

  // Términos y condiciones personalizados
  customTerms?: {
    paymentTerms?: string;
    warrantyTerms?: string;
    deliveryTerms?: string;
    additionalNotes?: string;
  };

  // Configuración de entrega
  delivery?: {
    sendByEmail?: boolean;
    recipientEmails?: string[];
    emailSubject?: string;
    emailMessage?: string;
    generateDownloadLink?: boolean;
  };
}

export interface ProfessionalBudgetResponse {
  success: boolean;
  documentId: string;
  generatedFiles: Array<{
    format: string;
    filename: string;
    path: string;
    size: number;
    downloadUrl?: string;
  }>;
  emailsSent?: string[];
  validUntil?: Date;
  documentNumber?: string;
  errors?: string[];
  warnings?: string[];
}

export interface DocumentTemplate {
  headerTemplate: string;
  footerTemplate: string;
  coverPageTemplate: string;
  summaryTemplate: string;
  lineItemsTemplate: string;
  termsTemplate: string;
}

export class GenerateProfessionalBudgetUseCase {

  constructor(
    private calculationBudgetRepository: CalculationBudgetRepository,
    private budgetLineItemRepository: BudgetLineItemRepository,
    private professionalCostRepository: ProfessionalCostRepository,
    private userRepository: UserRepository,
    private pdfGenerationService: PdfGenerationService,
    private emailService: EmailService
  ) {}

  async execute(
    request: ProfessionalBudgetRequest,
    userId: string
  ): Promise<ProfessionalBudgetResponse> {

    // 1. Validar datos de entrada
    this.validateRequest(request);

    // 2. Obtener datos del presupuesto
    const budgetData = await this.getBudgetData(request.budgetId, userId);

    // 3. Generar número de documento único
    const documentNumber = await this.generateDocumentNumber(budgetData.budget);

    // 4. Preparar datos para el documento
    const documentData = await this.prepareDocumentData(budgetData, request, documentNumber);

    // 5. Generar archivos según formatos solicitados
    const generatedFiles = await this.generateDocuments(documentData, request.format);

    // 6. Configurar fecha de validez
    const validUntil = request.documentSettings.includeValidityPeriod ? 
      this.calculateValidityDate(request.documentSettings.validityDays || 30) : 
      undefined;

    // 7. Enviar por email si se solicita
    const emailsSent = request.delivery?.sendByEmail ? 
      await this.sendDocumentsByEmail(generatedFiles, request.delivery, documentData) : 
      undefined;

    // 8. Generar enlaces de descarga si se solicita
    if (request.delivery?.generateDownloadLink) {
      this.generateDownloadLinks(generatedFiles);
    }

    // 9. Registrar actividad de generación
    await this.logDocumentGeneration(budgetData.budget, documentNumber, userId);

    return {
      success: true,
      documentId: documentNumber,
      generatedFiles,
      emailsSent,
      validUntil,
      documentNumber,
      errors: [],
      warnings: []
    };
  }

  /**
   * Genera vista previa rápida del documento sin guardarlo
   */
  async generatePreview(
    budgetId: string,
    format: 'PDF' | 'HTML',
    userId: string
  ): Promise<{ previewUrl: string; expiresAt: Date }> {

    const budgetData = await this.getBudgetData(budgetId, userId);
    
    // Usar configuración básica para vista previa
    const basicRequest: ProfessionalBudgetRequest = {
      budgetId,
      format,
      branding: {
        companyName: "Vista Previa",
        professionalName: "Profesional"
      },
      clientInfo: {
        name: "Cliente de Ejemplo"
      },
      documentSettings: {
        includeCalculationDetails: false,
        showPriceBreakdown: true,
        language: 'es'
      }
    };

    const documentData = await this.prepareDocumentData(budgetData, basicRequest, 'PREVIEW');
    
    // Generar archivo temporal para vista previa
    const previewDir = path.join(process.cwd(), 'uploads', 'previews');
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
    }

    const previewFilename = `preview_${budgetId}_${Date.now()}.${format.toLowerCase()}`;
    const previewPath = path.join(previewDir, previewFilename);

    if (format === 'PDF') {
      // Convertir CalculationBudget a ProjectBudget para el servicio PDF
      const projectBudget = this.convertToProjectBudget(budgetData.budget);
      await this.pdfGenerationService.generateBudgetPdf(projectBudget, {
        outputPath: previewPath,
        companyInfo: {
          name: documentData.companyInfo.name,
          address: documentData.companyInfo.contact.address || '',
          phone: documentData.companyInfo.contact.phone || '',
          email: documentData.companyInfo.contact.email || '',
          ruc: ''
        },
        includeDetails: documentData.documentSettings.includeCalculationDetails || false
      });
    } else {
      // Generar HTML para vista previa
      const htmlContent = this.generateHTMLPreview(documentData);
      fs.writeFileSync(previewPath, htmlContent);
    }

    // Programar eliminación del archivo en 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    setTimeout(() => {
      if (fs.existsSync(previewPath)) {
        fs.unlinkSync(previewPath);
      }
    }, 60 * 60 * 1000);

    return {
      previewUrl: `/api/previews/${previewFilename}`,
      expiresAt
    };
  }

  /**
   * Obtiene plantillas de documentos personalizadas del usuario
   */
  async getUserDocumentTemplates(userId: string): Promise<DocumentTemplate[]> {
    const user = await this.userRepository.findById(userId);
    
    // Por ahora retornar plantillas predeterminadas
    // En el futuro, estas podrían ser personalizables por usuario
    return [
      {
        headerTemplate: this.getDefaultHeaderTemplate(),
        footerTemplate: this.getDefaultFooterTemplate(),
        coverPageTemplate: this.getDefaultCoverPageTemplate(),
        summaryTemplate: this.getDefaultSummaryTemplate(),
        lineItemsTemplate: this.getDefaultLineItemsTemplate(),
        termsTemplate: this.getDefaultTermsTemplate()
      }
    ];
  }

  // Métodos privados

  private validateRequest(request: ProfessionalBudgetRequest): void {
    if (!request.budgetId) {
      throw new Error("El ID del presupuesto es obligatorio");
    }

    if (!request.format) {
      throw new Error("El formato de salida es obligatorio");
    }

    if (!request.clientInfo?.name) {
      throw new Error("El nombre del cliente es obligatorio");
    }

    if (request.delivery?.sendByEmail && (!request.delivery.recipientEmails || request.delivery.recipientEmails.length === 0)) {
      throw new Error("Se requieren emails de destino para envío por correo");
    }

    if (request.documentSettings?.validityDays && request.documentSettings.validityDays <= 0) {
      throw new Error("Los días de validez deben ser mayores a 0");
    }
  }

  private async getBudgetData(budgetId: string, userId: string) {
    const budget = await this.calculationBudgetRepository.findById(budgetId);
    if (!budget) {
      throw new Error(`Presupuesto no encontrado: ${budgetId}`);
    }

    if (budget.userId !== userId) {
      throw new Error("No tiene permisos para generar documentos de este presupuesto");
    }

    const lineItems = await this.budgetLineItemRepository.findByBudget(budgetId);
    const professionalCosts = await this.professionalCostRepository.findByBudget(budgetId);
    const user = await this.userRepository.findById(userId);

    return {
      budget,
      lineItems,
      professionalCosts,
      user
    };
  }

  private async generateDocumentNumber(budget: CalculationBudget): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `PRES-${year}${month}-${timestamp}`;
  }

  private async prepareDocumentData(budgetData: any, request: ProfessionalBudgetRequest, documentNumber: string) {
    const { budget, lineItems, professionalCosts, user } = budgetData;

    // Agrupar líneas por categoría
    const groupedLineItems = this.groupLineItemsByCategory(lineItems);

    // Calcular totales por categoría
    const categoryTotals = this.calculateCategoryTotals(groupedLineItems);

    // Preparar información de la empresa/profesional
    const companyInfo = {
      name: request.branding.companyName || user?.companyName || "Sin Especificar",
      logo: request.branding.companyLogo,
      professional: {
        name: request.branding.professionalName || `${user?.firstName} ${user?.lastName}`,
        title: request.branding.professionalTitle || user?.professionalTitle || "Profesional en Construcción",
        registration: request.branding.professionalRegistration || user?.professionalRegistration
      },
      contact: {
        phone: request.branding.contactInfo?.phone || user?.phoneNumber,
        email: request.branding.contactInfo?.email || user?.email,
        address: request.branding.contactInfo?.address || user?.address,
        website: request.branding.contactInfo?.website
      },
      colors: request.branding.colors || {
        primary: "#2563eb",
        secondary: "#64748b",
        accent: "#059669"
      }
    };

    // Preparar resumen ejecutivo
    const executiveSummary = {
      totalItems: lineItems.length,
      materialsCost: budget.materialsSubtotal,
      laborCost: budget.laborSubtotal,
      indirectCosts: budget.indirectCosts,
      professionalFees: budget.professionalCostsTotal,
      subtotal: budget.subtotal,
      contingency: budget.contingencyAmount,
      taxes: budget.taxAmount,
      grandTotal: budget.total,
      projectType: this.inferProjectType(budget, lineItems),
      estimatedDuration: this.estimateProjectDuration(lineItems),
      geographicalZone: budget.geographicalZone
    };

    return {
      documentNumber,
      generatedDate: new Date(),
      budget,
      lineItems: groupedLineItems,
      professionalCosts,
      categoryTotals,
      companyInfo,
      clientInfo: request.clientInfo,
      executiveSummary,
      documentSettings: request.documentSettings,
      customTerms: request.customTerms,
      validUntil: request.documentSettings.includeValidityPeriod ? 
        this.calculateValidityDate(request.documentSettings.validityDays || 30) : null
    };
  }

  private async generateDocuments(documentData: any, format: string) {
    const generatedFiles = [];
    const outputDir = path.join(process.cwd(), 'uploads', 'budgets', documentData.documentNumber);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const formats = format === 'ALL' ? ['PDF', 'EXCEL', 'WORD'] : [format];

    for (const fmt of formats) {
      try {
        const filename = `${documentData.documentNumber}_presupuesto.${fmt.toLowerCase()}`;
        const filePath = path.join(outputDir, filename);

        switch (fmt) {
          case 'PDF':
            await this.generatePDFDocument(documentData, filePath);
            break;
          case 'EXCEL':
            await this.generateExcelDocument(documentData, filePath);
            break;
          case 'WORD':
            await this.generateWordDocument(documentData, filePath);
            break;
        }

        const stats = fs.statSync(filePath);
        generatedFiles.push({
          format: fmt,
          filename,
          path: filePath,
          size: stats.size
        });

      } catch (error) {
        console.error(`Error generando documento ${fmt}:`, error);
      }
    }

    return generatedFiles;
  }

  private async generatePDFDocument(documentData: any, outputPath: string): Promise<void> {
    // Convertir CalculationBudget a ProjectBudget para el servicio PDF
    const projectBudget = this.convertToProjectBudget(documentData.budget);
    
    await this.pdfGenerationService.generateBudgetPdf(projectBudget, {
      outputPath,
      companyInfo: {
        name: documentData.companyInfo.name,
        address: documentData.companyInfo.contact.address || '',
        phone: documentData.companyInfo.contact.phone || '',
        email: documentData.companyInfo.contact.email || '',
        ruc: documentData.clientInfo.ruc || ''
      },
      includeDetails: documentData.documentSettings.includeCalculationDetails || false
    });
  }

  private async generateExcelDocument(documentData: any, outputPath: string): Promise<void> {
    // Placeholder para generación de Excel
    // Aquí se implementaría la lógica usando una librería como xlsx
    fs.writeFileSync(outputPath, 'Excel document placeholder');
  }

  private async generateWordDocument(documentData: any, outputPath: string): Promise<void> {
    // Placeholder para generación de Word
    // Aquí se implementaría la lógica usando una librería como docx
    fs.writeFileSync(outputPath, 'Word document placeholder');
  }

  private calculateValidityDate(days: number): Date {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);
    return validUntil;
  }

  private async sendDocumentsByEmail(
    generatedFiles: any[],
    deliveryConfig: any,
    documentData: any
  ): Promise<string[]> {
    
    const emailsSent: string[] = [];

    for (const email of deliveryConfig.recipientEmails) {
      try {
        // Preparar attachments leyendo el contenido de los archivos
        const attachments = generatedFiles.map(file => ({
          filename: file.filename,
          content: fs.readFileSync(file.path),
          contentType: this.getContentType(file.format)
        }));

        const subject = deliveryConfig.emailSubject || 
          `Presupuesto ${documentData.documentNumber} - ${documentData.clientInfo.name}`;

        const message = deliveryConfig.emailMessage || 
          this.getDefaultEmailMessage(documentData);

        await this.emailService.sendEmail({
          to: email,
          subject,
          html: message,
          attachments
        });

        emailsSent.push(email);

      } catch (error) {
        console.error(`Error enviando email a ${email}:`, error);
      }
    }

    return emailsSent;
  }

  private generateDownloadLinks(generatedFiles: any[]): void {
    // Generar enlaces temporales de descarga
    generatedFiles.forEach(file => {
      const token = this.generateSecureToken();
      file.downloadUrl = `/api/downloads/${token}/${file.filename}`;
      
      // Programar expiración del enlace en 7 días
      setTimeout(() => {
        // Lógica para invalidar el token
      }, 7 * 24 * 60 * 60 * 1000);
    });
  }

  private async logDocumentGeneration(budget: CalculationBudget, documentNumber: string, userId: string): Promise<void> {
    // Registrar la generación del documento para auditoría
    console.log(`Documento ${documentNumber} generado para presupuesto ${budget.id} por usuario ${userId}`);
  }

  private groupLineItemsByCategory(lineItems: BudgetLineItem[]) {
    const grouped = new Map<string, BudgetLineItem[]>();
    
    lineItems.forEach(item => {
      const category = item.category || 'Sin Categoría';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });

    return grouped;
  }

  private calculateCategoryTotals(groupedLineItems: Map<string, BudgetLineItem[]>) {
    const totals = new Map<string, number>();
    
    groupedLineItems.forEach((items, category) => {
      const total = items.reduce((sum, item) => sum + item.subtotal, 0);
      totals.set(category, total);
    });

    return totals;
  }

  private inferProjectType(budget: CalculationBudget, lineItems: BudgetLineItem[]): string {
    // Inferir el tipo de proyecto basado en los materiales y presupuesto
    if (budget.total < 10000) return "Proyecto Pequeño";
    if (budget.total < 50000) return "Proyecto Mediano";
    return "Proyecto Grande";
  }

  private estimateProjectDuration(lineItems: BudgetLineItem[]): string {
    // Estimar duración basada en la cantidad de elementos
    const itemCount = lineItems.length;
    if (itemCount < 20) return "1-2 meses";
    if (itemCount < 50) return "2-4 meses";
    return "4-8 meses";
  }

  private generateHTMLPreview(documentData: any): string {
    // Generar HTML básico para vista previa
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vista Previa - ${documentData.documentNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; }
            .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; }
            .total { font-size: 1.2em; font-weight: bold; color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Presupuesto ${documentData.documentNumber}</h1>
            <p>Cliente: ${documentData.clientInfo.name}</p>
            <p>Fecha: ${documentData.generatedDate.toLocaleDateString()}</p>
          </div>
          <div class="summary">
            <h2>Resumen Ejecutivo</h2>
            <p>Total de Materiales: $${documentData.executiveSummary.materialsCost.toFixed(2)}</p>
            <p>Total de Mano de Obra: $${documentData.executiveSummary.laborCost.toFixed(2)}</p>
            <p class="total">TOTAL GENERAL: $${documentData.executiveSummary.grandTotal.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `;
  }

  private getDefaultEmailMessage(documentData: any): string {
    return `
      <p>Estimado/a ${documentData.clientInfo.name},</p>
      
      <p>Adjunto encontrará el presupuesto solicitado con número de referencia <strong>${documentData.documentNumber}</strong>.</p>
      
      <p><strong>Resumen:</strong></p>
      <ul>
        <li>Total del Proyecto: $${documentData.executiveSummary.grandTotal.toFixed(2)}</li>
        <li>Duración Estimada: ${documentData.executiveSummary.estimatedDuration}</li>
        ${documentData.validUntil ? `<li>Válido hasta: ${documentData.validUntil.toLocaleDateString()}</li>` : ''}
      </ul>
      
      <p>Quedo a su disposición para cualquier consulta o aclaración.</p>
      
      <p>Saludos cordiales,</p>
      <p><strong>${documentData.companyInfo.professional.name}</strong><br>
      ${documentData.companyInfo.professional.title}</p>
    `;
  }

  private generateSecureToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private convertToProjectBudget(calculationBudget: CalculationBudget): ProjectBudget {
    return {
      id: calculationBudget.id,
      name: calculationBudget.name,
      description: calculationBudget.description,
      status: 'DRAFT' as any, // Mapear status apropiadamente
      version: calculationBudget.version,
      subtotal: calculationBudget.subtotal,
      taxPercentage: calculationBudget.taxPercentage,
      tax: calculationBudget.taxAmount, // Mapear taxAmount a tax
      total: calculationBudget.total,
      projectId: calculationBudget.projectId,
      createdAt: calculationBudget.createdAt,
      updatedAt: calculationBudget.updatedAt
    };
  }

  private getContentType(format: string): string {
    const contentTypes: { [key: string]: string } = {
      'PDF': 'application/pdf',
      'EXCEL': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'WORD': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'HTML': 'text/html'
    };
    
    return contentTypes[format] || 'application/octet-stream';
  }

  // Plantillas predeterminadas
  private getDefaultHeaderTemplate(): string {
    return `
      <div class="document-header">
        <div class="company-logo">{{COMPANY_LOGO}}</div>
        <div class="company-info">
          <h1>{{COMPANY_NAME}}</h1>
          <p>{{PROFESSIONAL_NAME}} - {{PROFESSIONAL_TITLE}}</p>
          <p>{{CONTACT_INFO}}</p>
        </div>
      </div>
    `;
  }

  private getDefaultFooterTemplate(): string {
    return `
      <div class="document-footer">
        <p>{{COMPANY_NAME}} | {{CONTACT_EMAIL}} | {{CONTACT_PHONE}}</p>
        <p>Página {{PAGE_NUMBER}} de {{TOTAL_PAGES}}</p>
      </div>
    `;
  }

  private getDefaultCoverPageTemplate(): string {
    return `
      <div class="cover-page">
        <h1>PRESUPUESTO DE CONSTRUCCIÓN</h1>
        <h2>{{DOCUMENT_NUMBER}}</h2>
        <div class="client-info">
          <h3>Preparado para:</h3>
          <p>{{CLIENT_NAME}}</p>
          <p>{{CLIENT_COMPANY}}</p>
        </div>
        <div class="date-info">
          <p>Fecha: {{DOCUMENT_DATE}}</p>
          <p>Válido hasta: {{VALID_UNTIL}}</p>
        </div>
      </div>
    `;
  }

  private getDefaultSummaryTemplate(): string {
    return `
      <div class="executive-summary">
        <h2>Resumen Ejecutivo</h2>
        <table>
          <tr><td>Subtotal Materiales:</td><td>{{MATERIALS_SUBTOTAL}}</td></tr>
          <tr><td>Subtotal Mano de Obra:</td><td>{{LABOR_SUBTOTAL}}</td></tr>
          <tr><td>Costos Indirectos:</td><td>{{INDIRECT_COSTS}}</td></tr>
          <tr><td>Honorarios Profesionales:</td><td>{{PROFESSIONAL_FEES}}</td></tr>
          <tr class="total"><td><strong>TOTAL:</strong></td><td><strong>{{GRAND_TOTAL}}</strong></td></tr>
        </table>
      </div>
    `;
  }

  private getDefaultLineItemsTemplate(): string {
    return `
      <div class="line-items">
        <h2>Detalle de Presupuesto</h2>
        {{#CATEGORIES}}
        <h3>{{CATEGORY_NAME}}</h3>
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {{#ITEMS}}
            <tr>
              <td>{{DESCRIPTION}}</td>
              <td>{{QUANTITY}}</td>
              <td>{{UNIT}}</td>
              <td>{{UNIT_PRICE}}</td>
              <td>{{TOTAL_PRICE}}</td>
            </tr>
            {{/ITEMS}}
          </tbody>
        </table>
        {{/CATEGORIES}}
      </div>
    `;
  }

  private getDefaultTermsTemplate(): string {
    return `
      <div class="terms-and-conditions">
        <h2>Términos y Condiciones</h2>
        <h3>Forma de Pago</h3>
        <p>{{PAYMENT_TERMS}}</p>
        
        <h3>Garantías</h3>
        <p>{{WARRANTY_TERMS}}</p>
        
        <h3>Entrega</h3>
        <p>{{DELIVERY_TERMS}}</p>
        
        <h3>Notas Adicionales</h3>
        <p>{{ADDITIONAL_NOTES}}</p>
      </div>
    `;
  }
}