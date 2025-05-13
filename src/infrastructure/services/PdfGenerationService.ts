// src/infrastructure/services/PdfGenerationService.ts
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import {ProjectBudget} from "../../domain/models/project/ProjectBudget";
import {BudgetItem} from "../../domain/models/project/BudgetItem";

export class PdfGenerationService {
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
}
