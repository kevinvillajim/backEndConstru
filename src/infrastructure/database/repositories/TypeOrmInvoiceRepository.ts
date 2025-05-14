// src/infrastructure/database/repositories/TypeOrmInvoiceRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {InvoiceRepository} from "../../../domain/repositories/InvoiceRepository";
import {Invoice} from "../../../domain/models/invoice/Invoice";
import {InvoiceEntity, InvoiceStatus} from "../entities/InvoiceEntity";
import {InvoiceItemEntity} from "../entities/InvoiceItemEntity";

export class TypeOrmInvoiceRepository implements InvoiceRepository {
	private repository: Repository<InvoiceEntity>;
	private itemRepository: Repository<InvoiceItemEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(InvoiceEntity);
		this.itemRepository = AppDataSource.getRepository(InvoiceItemEntity);
	}

	async findById(id: string): Promise<Invoice | null> {
		const invoice = await this.repository.findOne({
			where: {id},
			relations: ["items", "client", "seller", "project"],
		});

		return invoice ? this.mapEntityToDomain(invoice) : null;
	}

	async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
		const invoice = await this.repository.findOne({
			where: {invoiceNumber},
			relations: ["items", "client", "seller", "project"],
		});

		return invoice ? this.mapEntityToDomain(invoice) : null;
	}

	async findAll(
		page: number = 1,
		limit: number = 10,
		filters?: any
	): Promise<{invoices: Invoice[]; total: number; pages: number}> {
		const queryBuilder = this.repository
			.createQueryBuilder("invoice")
			.leftJoinAndSelect("invoice.items", "items")
			.leftJoinAndSelect("invoice.client", "client")
			.leftJoinAndSelect("invoice.seller", "seller")
			.leftJoinAndSelect("invoice.project", "project");

		// Aplicar filtros
		if (filters) {
			if (filters.status) {
				queryBuilder.andWhere("invoice.status = :status", {
					status: filters.status,
				});
			}
			if (filters.type) {
				queryBuilder.andWhere("invoice.type = :type", {type: filters.type});
			}
			if (filters.clientId) {
				queryBuilder.andWhere("invoice.clientId = :clientId", {
					clientId: filters.clientId,
				});
			}
			if (filters.issueDateRange) {
				queryBuilder.andWhere(
					"invoice.issueDate BETWEEN :startDate AND :endDate",
					{
						startDate: filters.issueDateRange.start,
						endDate: filters.issueDateRange.end,
					}
				);
			}
		}

		// Calcular paginación
		const skip = (page - 1) * limit;
		queryBuilder.skip(skip).take(limit);

		// Ordenar del más reciente al más antiguo
		queryBuilder.orderBy("invoice.createdAt", "DESC");

		const [result, total] = await queryBuilder.getManyAndCount();
		const totalPages = Math.ceil(total / limit);

		return {
			invoices: result.map(this.mapEntityToDomain),
			total,
			pages: totalPages,
		};
	}

	async create(invoiceData: Partial<Invoice>): Promise<Invoice> {
		const invoice = new InvoiceEntity();
		const items = invoiceData.items || [];
		delete invoiceData.items;

		// Asignar propiedades a la entidad invoice
		Object.assign(invoice, invoiceData);

		// Crear factura en la base de datos
		const savedInvoice = await this.repository.save(invoice);

		// Crear ítems de factura relacionados
		if (items.length > 0) {
			const invoiceItems = items.map((item) => {
				const invoiceItem = new InvoiceItemEntity();
				Object.assign(invoiceItem, {
					...item,
					invoiceId: savedInvoice.id,
				});
				return invoiceItem;
			});

			await this.itemRepository.save(invoiceItems);
		}

		// Obtener la factura completa con sus ítems
		return this.findById(savedInvoice.id) as Promise<Invoice>;
	}

	async update(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
		const invoice = await this.repository.findOne({where: {id}});
		if (!invoice) return null;

		// Manejar actualización de ítems si están incluidos
		const items = data.items;
		delete data.items;

		// Actualizar propiedades de la factura
		Object.assign(invoice, data);
		await this.repository.save(invoice);

		// Actualizar ítems si están incluidos
		if (items) {
			// Eliminar ítems existentes
			await this.itemRepository.delete({invoiceId: id});

			// Crear nuevos ítems
			const invoiceItems = items.map((item) => {
				const invoiceItem = new InvoiceItemEntity();
				Object.assign(invoiceItem, {
					...item,
					invoiceId: id,
				});
				return invoiceItem;
			});

			await this.itemRepository.save(invoiceItems);
		}

		// Retornar factura actualizada
		return this.findById(id);
	}

	async delete(id: string): Promise<boolean> {
		// Usando soft delete para mantener registros históricos
		const result = await this.repository.softDelete(id);
		return result.affected !== undefined && result.affected > 0;
	}

	async generateInvoiceNumber(): Promise<string> {
		// Formato: FAC-YYYYMMDD-XXX
		// donde XXX es un número secuencial que incrementa cada día
		const today = new Date();
		const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

		// Buscar la última factura con el prefijo del día actual
		const prefix = `FAC-${dateStr}-`;

		const lastInvoice = await this.repository
			.createQueryBuilder("invoice")
			.where("invoice.invoiceNumber LIKE :prefix", {prefix: `${prefix}%`})
			.orderBy("invoice.invoiceNumber", "DESC")
			.getOne();

		let sequence = 1;
		if (lastInvoice) {
			const lastSequence = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
			sequence = lastSequence + 1;
		}

		return `${prefix}${sequence.toString().padStart(3, "0")}`;
	}

	// Método auxiliar para mapear entidad a modelo de dominio
	private mapEntityToDomain(entity: InvoiceEntity): Invoice {
		return {
			id: entity.id,
			invoiceNumber: entity.invoiceNumber,
			type: entity.type,
			issueDate: entity.issueDate,
			dueDate: entity.dueDate,
			subtotal: entity.subtotal,
			taxPercentage: entity.taxPercentage,
			tax: entity.tax,
			discountPercentage: entity.discountPercentage,
			discount: entity.discount,
			total: entity.total,
			amountPaid: entity.amountPaid,
			amountDue: entity.amountDue,
			paymentMethod: entity.paymentMethod,
			paymentReference: entity.paymentReference,
			paymentDate: entity.paymentDate,
			sriAuthorization: entity.sriAuthorization,
			sriAccessKey: entity.sriAccessKey,
			electronicInvoiceUrl: entity.electronicInvoiceUrl,
			notes: entity.notes,
			status: entity.status,
			clientId: entity.clientId,
			sellerId: entity.sellerId,
			projectId: entity.projectId,
			items: entity.items
				? entity.items.map((item) => ({
						id: item.id,
						quantity: item.quantity,
						price: item.price,
						subtotal: item.subtotal,
						tax: item.tax,
						total: item.total,
						invoiceId: item.invoiceId,
						materialId: item.materialId,
						description: item.description,
						createdAt: item.createdAt,
						updatedAt: item.updatedAt,
					}))
				: [],
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
		};
	}
}
