// src/infrastructure/services/PdfGenerationService.ts
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import {ProjectBudget} from "../../domain/models/project/ProjectBudget";
import {BudgetItem} from "../../domain/models/project/BudgetItem";
import { InvoiceRepository } from "../../domain/repositories/InvoiceRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import { TypeOrmInvoiceRepository } from "../../infrastructure/database/repositories/TypeOrmInvoiceRepository";
import {TypeOrmUserRepository} from "../../infrastructure/database/repositories/TypeOrmUserRepository";

export class PdfGenerationService {
	constructor(
		private invoiceRepository?: InvoiceRepository,
		private userRepository?: UserRepository
	) {}

	/**
	 * Genera un PDF para un presupuesto
	 * @param budget Datos del presupuesto
	 * @param options Opciones de generación
	 * @returns Buffer con el contenido del PDF
	 */
	async generateBudgetPdf(
		budget: ProjectBudget,
		options: {
			companyInfo?: {
				name: string;
				address: string;
				phone: string;
				email: string;
				ruc: string;
			};
			includeDetails: boolean;
			outputPath?: string;
		}
	): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			try {
				// Crear un nuevo documento PDF
				const doc = new PDFDocument({
					size: "A4",
					margin: 50,
					info: {
						Title: `Presupuesto - ${budget.name}`,
						Author: "CONSTRU App",
						Subject: "Presupuesto de construcción",
					},
				});

				// Buffers para almacenar el PDF
				const chunks: Buffer[] = [];
				doc.on("data", (chunk) => chunks.push(chunk));
				doc.on("end", () => {
					const pdfBuffer = Buffer.concat(chunks);

					// Si se especificó una ruta de salida, guardar el archivo
					if (options.outputPath) {
						fs.writeFileSync(options.outputPath, pdfBuffer);
					}

					resolve(pdfBuffer);
				});

				// Encabezado del documento
				this.addHeader(doc, budget, options);

				// Información del presupuesto
				this.addBudgetInfo(doc, budget);

				// Tabla de ítems
				if (options.includeDetails && budget.items && budget.items.length > 0) {
					this.addItemsTable(doc, budget.items);
				}

				// Resumen y totales
				this.addSummary(doc, budget);

				// Pie de página
				this.addFooter(doc);

				// Finalizar el documento
				doc.end();
			} catch (error) {
				reject(error);
			}
		});
	}

	private addHeader(
		doc: PDFKit.PDFDocument,
		budget: ProjectBudget,
		options: {
			companyInfo?: {
				name: string;
				address: string;
				phone: string;
				email: string;
				ruc: string;
			};
		}
	): void {
		// Título de la empresa
		doc.fontSize(25).text("CONSTRU App", {align: "left"});
		doc.moveDown(1);

		// Información de la empresa
		doc.fontSize(10);

		if (options.companyInfo) {
			doc.text(`${options.companyInfo.name}`, {align: "right"});
			doc.text(`RUC: ${options.companyInfo.ruc}`, {align: "right"});
			doc.text(`${options.companyInfo.address}`, {align: "right"});
			doc.text(`Tel: ${options.companyInfo.phone}`, {align: "right"});
			doc.text(`Email: ${options.companyInfo.email}`, {align: "right"});
		}

		// Título del documento
		doc.moveDown(2);
		doc
			.fontSize(16)
			.text(`PRESUPUESTO ${budget.name.toUpperCase()}`, {align: "center"});
		doc.fontSize(12).text(`Versión: ${budget.version}`, {align: "center"});
		doc.moveDown(1);
	}

	private addBudgetInfo(doc: PDFKit.PDFDocument, budget: ProjectBudget): void {
		// Crear tabla informativa
		doc.fontSize(10);
		doc.text("INFORMACIÓN DEL PRESUPUESTO", {underline: true});
		doc.moveDown(0.5);

		const startY = doc.y;
		const leftColumnX = 50;
		const rightColumnX = 300;

		// Columna izquierda
		doc.text("ID Presupuesto:", leftColumnX);
		doc.text("Fecha Creación:", leftColumnX);
		doc.text("Última Actualización:", leftColumnX);
		doc.text("Estado:", leftColumnX);

		// Columna derecha (valores)
		doc.text(budget.id, rightColumnX, startY);
		doc.text(this.formatDate(budget.createdAt), rightColumnX, startY + 14);
		doc.text(this.formatDate(budget.updatedAt), rightColumnX, startY + 28);
		doc.text(this.getStatusText(budget.status), rightColumnX, startY + 42);

		doc.moveDown(3);
	}

	private addItemsTable(doc: PDFKit.PDFDocument, items: BudgetItem[]): void {
		doc.fontSize(12).text("DETALLE DE ÍTEMS", {underline: true});
		doc.moveDown(0.5);

		// Agrupar ítems por categoría
		const itemsByCategory: {[key: string]: BudgetItem[]} = {};
		items.forEach((item) => {
			const category = item.category || "Sin categoría";
			if (!itemsByCategory[category]) {
				itemsByCategory[category] = [];
			}
			itemsByCategory[category].push(item);
		});

		// Iterar por categorías
		Object.entries(itemsByCategory).forEach(
			([category, categoryItems], categoryIndex) => {
				// Si no es la primera categoría, añadir espacio
				if (categoryIndex > 0) {
					doc.moveDown(1);
				}

				// Título de categoría
				doc.fontSize(10).fillColor("#444").text(category, {underline: true});
				doc.moveDown(0.5);

				// Cabecera de la tabla para esta categoría
				this.drawTableRow(
					doc,
					["Descripción", "Cantidad", "Unidad", "Precio Unit.", "Subtotal"],
					[50, 250, 310, 370, 450],
					true
				);

				// Filas de datos
				let currentY = doc.y;
				categoryItems.forEach((item) => {
					// Verificar si necesitamos una nueva página
					if (currentY > 700) {
						doc.addPage();
						currentY = 50;
						// Volver a dibujar el encabezado en la nueva página
						this.drawTableRow(
							doc,
							["Descripción", "Cantidad", "Unidad", "Precio Unit.", "Subtotal"],
							[50, 250, 310, 370, 450],
							true
						);
						currentY = doc.y;
					}

					this.drawTableRow(
						doc,
						[
							item.description,
							item.quantity.toString(),
							item.unitOfMeasure,
							this.formatCurrency(item.unitPrice),
							this.formatCurrency(item.subtotal),
						],
						[50, 250, 310, 370, 450],
						false
					);

					currentY = doc.y;
				});

				// Subtotal de categoría
				const categoryTotal = categoryItems.reduce(
					(sum, item) => sum + item.subtotal,
					0
				);
				this.drawTableRow(
					doc,
					[`Total ${category}`, "", "", "", this.formatCurrency(categoryTotal)],
					[50, 250, 310, 370, 450],
					true
				);
			}
		);

		doc.moveDown(2);
	}

	private drawTableRow(
		doc: PDFKit.PDFDocument,
		texts: string[],
		xPositions: number[],
		isHeader: boolean
	): void {
		const y = doc.y;

		if (isHeader) {
			doc.font("Helvetica-Bold");
		} else {
			doc.font("Helvetica");
		}

		// Dibujar textos
		texts.forEach((text, i) => {
			const x = xPositions[i];
			const align = i === 0 ? "left" : "right";
			const width =
				i < xPositions.length - 1 ? xPositions[i + 1] - x - 10 : 100;

			doc.text(text, x, y, {width, align});
		});

		// Línea horizontal
		doc
			.moveTo(50, doc.y + 5)
			.lineTo(550, doc.y + 5)
			.stroke();

		doc.moveDown(0.5);
	}

	private addSummary(doc: PDFKit.PDFDocument, budget: ProjectBudget): void {
		if (doc.y > 650) {
			doc.addPage();
		}

		doc.moveDown(1);
		doc.fontSize(12).text("RESUMEN", {underline: true});
		doc.moveDown(0.5);

		// Tabla de resumen
		const startY = doc.y;
		const leftColX = 350;
		const rightColX = 500;

		doc.fontSize(10).font("Helvetica-Bold");
		doc.text("Subtotal:", leftColX);
		doc.text("IVA:", leftColX);
		doc.text("TOTAL:", leftColX);

		doc.font("Helvetica");
		doc.text(this.formatCurrency(budget.subtotal), rightColX, startY, {
			align: "right",
		});
		doc.text(
			`${budget.taxPercentage}% - ${this.formatCurrency(budget.tax)}`,
			rightColX,
			startY + 14,
			{align: "right"}
		);

		doc.font("Helvetica-Bold");
		doc.text(this.formatCurrency(budget.total), rightColX, startY + 28, {
			align: "right",
		});

		// Línea de total
		doc.rect(leftColX, startY + 42, 150, 0.5).fill();

		doc.moveDown(4);

		// Notas y términos
		doc.fontSize(10).font("Helvetica");
		doc.text("Notas:");
		doc.text(
			"- Este presupuesto tiene una validez de 15 días a partir de la fecha de emisión."
		);
		doc.text("- No incluye gastos no especificados en el detalle.");

		doc.moveDown(1);

		// Firmas
		const signatureY = doc.y + 30;
		doc.moveTo(100, signatureY).lineTo(250, signatureY).stroke();
		doc.moveTo(350, signatureY).lineTo(500, signatureY).stroke();

		doc.text("Firma Cliente", 100, signatureY + 5, {
			width: 150,
			align: "center",
		});
		doc.text("Firma Empresa", 350, signatureY + 5, {
			width: 150,
			align: "center",
		});
	}

	private addFooter(doc: PDFKit.PDFDocument): void {
		const pageCount = doc.bufferedPageRange().count;
		for (let i = 0; i < pageCount; i++) {
			doc.switchToPage(i);

			// Ir al pie de página
			doc
				.fontSize(8)
				.text(
					`CONSTRU App - Generado el ${new Date().toLocaleDateString("es-EC")} - Página ${i + 1} de ${pageCount}`,
					50,
					doc.page.height - 50,
					{align: "center", width: doc.page.width - 100}
				);
		}
	}

	private formatDate(date: Date): string {
		return date.toLocaleDateString("es-EC", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	}

	private formatCurrency(amount: number): string {
		return `$${amount.toFixed(2)}`;
	}

	private getStatusText(status: string): string {
		const statusMap: {[key: string]: string} = {
			draft: "Borrador",
			approved: "Aprobado",
			revised: "Revisado",
			executed: "Ejecutado",
		};

		return statusMap[status] || status;
	}

	/**
	 * Genera un PDF para una factura
	 */
	async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
		// Obtener datos de la factura
		if (!this.invoiceRepository) {
			throw new Error(
				"Invoice repository not initialized in PdfGenerationService"
			);
		}

		if (!this.userRepository) {
			throw new Error(
				"User repository not initialized in PdfGenerationService"
			);
		}

		// Obtener datos de la factura
		const invoice = await this.invoiceRepository.findById(invoiceId);

		if (!invoice) {
			throw new Error(`Factura no encontrada: ${invoiceId}`);
		}

		// Obtener datos de cliente y vendedor
		const client = await this.userRepository.findById(invoice.clientId);
		const seller = await this.userRepository.findById(invoice.sellerId);

		if (!client || !seller) {
			throw new Error("No se pudo obtener información de cliente o vendedor");
		}

		// Crear el contenido HTML para el PDF
		const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factura ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #333;
        }
        h1 {
          font-size: 18px;
          text-align: center;
          margin-bottom: 20px;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .invoice-header div {
          flex: 1;
        }
        .invoice-details {
          margin-bottom: 20px;
        }
        .invoice-details .row {
          display: flex;
          margin-bottom: 5px;
        }
        .invoice-details .label {
          font-weight: bold;
          width: 150px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .table th, .table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .table th {
          background-color: #f2f2f2;
        }
        .total-row {
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <h1>FACTURA ${invoice.invoiceNumber}</h1>
      
      <div class="invoice-header">
        <div>
          <h3>EMISOR</h3>
          <p><strong>${seller.firstName} ${seller.lastName}</strong><br>
          ${seller.addresses && seller.addresses.length > 0 ? seller.addresses[0].street + ", " + seller.addresses[0].city : ""}<br>
          ${seller.email || ""}<br>
          ${seller.phone || ""}</p>
        </div>
        <div>
          <h3>CLIENTE</h3>
          <p><strong>${client.firstName} ${client.lastName}</strong><br>
          ${client.addresses && client.addresses.length > 0 ? client.addresses[0].street + ", " + client.addresses[0].city : ""}<br>
          ${client.email || ""}<br>
          ${client.phone || ""}</p>
        </div>
      </div>
      
      <div class="invoice-details">
        <div class="row">
          <div class="label">Número de Factura:</div>
          <div>${invoice.invoiceNumber}</div>
        </div>
        <div class="row">
          <div class="label">Fecha de Emisión:</div>
          <div>${new Date(invoice.issueDate).toLocaleDateString()}</div>
        </div>
        <div class="row">
          <div class="label">Fecha de Vencimiento:</div>
          <div>${new Date(invoice.dueDate).toLocaleDateString()}</div>
        </div>
        ${
					invoice.sriAuthorization
						? `
        <div class="row">
          <div class="label">Autorización SRI:</div>
          <div>${invoice.sriAuthorization}</div>
        </div>
        `
						: ""
				}
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Precio Unitario</th>
            <th>Subtotal</th>
            <th>IVA</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items
						.map(
							(item) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>$${item.price.toFixed(2)}</td>
              <td>$${item.subtotal.toFixed(2)}</td>
              <td>$${item.tax.toFixed(2)}</td>
              <td>$${item.total.toFixed(2)}</td>
            </tr>
          `
						)
						.join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" rowspan="4"></td>
            <td colspan="2"><strong>Subtotal</strong></td>
            <td>$${invoice.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Descuento (${invoice.discountPercentage}%)</strong></td>
            <td>$${invoice.discount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>IVA (${invoice.taxPercentage}%)</strong></td>
            <td>$${invoice.tax.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2"><strong>TOTAL</strong></td>
            <td>$${invoice.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      ${
				invoice.notes
					? `
      <div>
        <h3>Notas</h3>
        <p>${invoice.notes}</p>
      </div>
      `
					: ""
			}
      
      <div class="footer">
        <p>Esta factura es válida como comprobante fiscal de acuerdo con las leyes ecuatorianas.</p>
        <p>Generada por CONSTRU App © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;

		try {
			// Usar la biblioteca PDF para generar el PDF
			const pdfOptions = {
				format: "A4",
				printBackground: true,
				margin: {
					top: "1cm",
					right: "1cm",
					bottom: "1cm",
					left: "1cm",
				},
			};

			// Esta es una implementación simplificada
			// En producción, usarías una biblioteca como puppeteer, PDF-lib, etc.
			// Para este ejemplo, asumiremos que existe un método para convertir HTML a PDF
			return await this.htmlToPdf(html, pdfOptions);
		} catch (error) {
			console.error("Error al generar PDF de factura:", error);
			throw error;
		}
	}

	/**
	 * Genera un PDF a partir de un documento XML del SRI
	 */
	async generatePdfFromXml(xmlDocument: string): Promise<Buffer> {
		// Implementación simplificada para convertir XML a HTML y luego a PDF
		// En una implementación real, deberías procesar el XML correctamente
		const xmlParser = require("fast-xml-parser");
		const parser = new xmlParser.XMLParser();
		const parsedXml = parser.parse(xmlDocument);

		// Crear un HTML basado en los datos del XML
		// Esta parte dependerá de la estructura exacta del XML del SRI
		const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Factura Electrónica SRI</title>
      <style>
        /* Estilos CSS similares al de generateInvoicePdf */
      </style>
    </head>
    <body>
      <h1>FACTURA ELECTRÓNICA</h1>
      
      <!-- Datos del XML procesados -->
      <!-- ... -->
      
      <div class="footer">
        <p>Este es un documento electrónico emitido por el SRI.</p>
      </div>
    </body>
    </html>
  `;

		// Generar PDF del HTML
		const pdfOptions = {
			format: "A4",
			printBackground: true,
			margin: {
				top: "1cm",
				right: "1cm",
				bottom: "1cm",
				left: "1cm",
			},
		};

		return await this.htmlToPdf(html, pdfOptions);
	}

	/**
	 * Convierte HTML a PDF
	 */
	private async htmlToPdf(html: string, options: any): Promise<Buffer> {
		// In a real implementation, you would use a library like puppeteer or html-pdf
		// This is a simplified implementation for demonstration
		try {
			// Mock implementation - in production, replace with actual PDF generation
			console.log("Converting HTML to PDF with options:", options);

			// Return a mock PDF buffer
			return Buffer.from(`Mock PDF content for: ${html.substring(0, 50)}...`);

			// Example with puppeteer (would need to be installed):
			/*
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf(options);
    await browser.close();
    return pdfBuffer;
    */
		} catch (error) {
			console.error("Error converting HTML to PDF:", error);
			throw error;
		}
	}
}
